// Vercel Serverless Function for OpenAI Vision API
// Girl Math Scanner - Identifies product and returns structured candidates with price ranges
// This is a STANDALONE scanner - NOT connected to the Girl Math Calculator

import { kv } from '@vercel/kv';
import { createHash } from 'crypto';
import { createClient } from '@supabase/supabase-js';

// Cache TTL in seconds (24 hours)
const CACHE_TTL = 86400;

/**
 * Log scanner result to Supabase
 * @param {Object} result - The scan result with candidates
 */
async function logScanResult(result) {
    try {
        const supabaseUrl = process.env.SUPABASE_URL;
        const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

        if (!supabaseUrl || !supabaseKey) {
            // Supabase not configured - SUPABASE_SERVICE_ROLE_KEY is required to bypass RLS
            return;
        }

        const supabase = createClient(supabaseUrl, supabaseKey);

        // Get the top candidate
        const topCandidate = result.candidates?.[0];
        if (!topCandidate) return;

        const { data, error } = await supabase.from('scanner_logs').insert([{
            product_name: topCandidate.name || 'Unknown',
            brand: topCandidate.brand || null,
            category: topCandidate.category || 'other',
            price_low: topCandidate.priceRange?.low || 0,
            price_high: topCandidate.priceRange?.high || 0,
            confidence: topCandidate.confidence || 0
        }]);

        if (error) {
            console.error('Scanner log INSERT failed:', {
                code: error.code,
                message: error.message,
                details: error.details,
                hint: error.hint
            });
        } else {
            console.log('Scanner log INSERT successful');
        }
    } catch (error) {
        console.error('Scanner log error (non-critical):', error.message, error.stack);
    }
}

/**
 * Generate a hash key for the image data
 * Uses SHA-256 hash of the base64 image data
 * @param {string} imageDataUrl 
 * @returns {string}
 */
function generateImageHash(imageDataUrl) {
    // Remove the data URL prefix to get just the base64 data
    const base64Data = imageDataUrl.replace(/^data:image\/\w+;base64,/, '');
    // Create SHA-256 hash (shorter than MD5, more collision resistant)
    const hash = createHash('sha256').update(base64Data).digest('hex');
    return `scan:${hash.substring(0, 32)}`; // Use first 32 chars for key
}

/**
 * Try to get cached result
 * @param {string} cacheKey 
 * @returns {Object|null}
 */
async function getCachedResult(cacheKey) {
    try {
        // Check if Vercel KV is configured
        if (!process.env.KV_REST_API_URL || !process.env.KV_REST_API_TOKEN) {
            return null; // KV not configured, skip cache
        }
        const cached = await kv.get(cacheKey);
        return cached || null;
    } catch (error) {
        console.warn('Cache read error (continuing without cache):', error.message);
        return null;
    }
}

/**
 * Store result in cache
 * @param {string} cacheKey 
 * @param {Object} result 
 */
async function setCachedResult(cacheKey, result) {
    try {
        // Check if Vercel KV is configured
        if (!process.env.KV_REST_API_URL || !process.env.KV_REST_API_TOKEN) {
            return; // KV not configured, skip cache
        }
        await kv.set(cacheKey, result, { ex: CACHE_TTL });
    } catch (error) {
        console.warn('Cache write error (continuing without cache):', error.message);
    }
}

// Maximum image size: 10MB base64 encoded (approximately 7.5MB raw)
const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB

export default async function handler(req, res) {
    // Get origin for CORS - restrict to allowed origins
    const origin = req.headers.origin;
    const allowedOrigins = [
        process.env.ALLOWED_ORIGINS?.split(',') || [],
        req.headers.host ? `https://${req.headers.host}` : null
    ].flat().filter(Boolean);
    
    // Set CORS headers - restrict to allowed origins
    if (origin && allowedOrigins.some(allowed => origin === allowed || origin.endsWith(allowed))) {
        res.setHeader('Access-Control-Allow-Origin', origin);
    } else if (!origin && req.headers.host) {
        res.setHeader('Access-Control-Allow-Origin', `https://${req.headers.host}`);
    }
    
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Access-Control-Max-Age', '86400');

    // Handle OPTIONS request for CORS preflight
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    // Only allow POST requests
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    // Check content type
    const contentType = req.headers['content-type'];
    if (!contentType || !contentType.includes('application/json')) {
        return res.status(400).json({ error: 'Content-Type must be application/json' });
    }

    // Check request body size limit
    if (!req.body || typeof req.body !== 'object') {
        return res.status(400).json({ error: 'Invalid request body' });
    }

    const bodySize = JSON.stringify(req.body).length;
    if (bodySize > MAX_IMAGE_SIZE) {
        return res.status(413).json({ error: 'Image too large. Maximum size is 10MB' });
    }

    const { imageDataUrl } = req.body;

    if (!imageDataUrl || typeof imageDataUrl !== 'string') {
        return res.status(400).json({ error: 'Image data URL is required' });
    }

    // Validate data URL format
    if (!imageDataUrl.match(/^data:image\/(jpeg|jpg|png|webp);base64,/i)) {
        return res.status(400).json({ error: 'Invalid image format. Only JPEG, PNG, and WebP are supported' });
    }

    // Check image size
    const base64Data = imageDataUrl.split(',')[1] || '';
    const imageSize = base64Data.length;
    if (imageSize > MAX_IMAGE_SIZE) {
        return res.status(413).json({ error: 'Image too large. Maximum size is 10MB' });
    }

    // Generate cache key from image hash
    const cacheKey = generateImageHash(imageDataUrl);
    
    // Check cache first
    const cachedResult = await getCachedResult(cacheKey);
    if (cachedResult) {
        console.log('Cache HIT for key:', cacheKey);
        // Add cache indicator to response
        return res.status(200).json({
            ...cachedResult,
            _cached: true
        });
    }
    console.log('Cache MISS for key:', cacheKey);

    // Get API key from environment
    const apiKey = process.env.OPENAI_API_KEY || process.env.AI_API_KEY;

    if (!apiKey) {
        return res.status(500).json({ 
            error: 'OpenAI API key not configured',
            message: 'Please set OPENAI_API_KEY environment variable'
        });
    }

    try {
        // Universal product identification prompt - handles luxury, everyday items, barcodes, ISBNs
        const prompt = `You are a UNIVERSAL product identification expert. Your job is to identify ANY product from an image - luxury goods, everyday items, tools, books, electronics, beauty devices, and more.

**STEP 1: READ ALL VISIBLE TEXT FIRST**
Before anything else, carefully examine the image for:
- Product names, model numbers, brand names printed on the item
- Barcodes (UPC, EAN) - note the numbers if visible
- ISBN numbers on books - use this to identify the exact book title and author
- Serial numbers, SKU codes, packaging text
- Labels, stickers, engravings, embossed text
- App screens or digital displays showing product info

**STEP 2: IDENTIFY THE PRODUCT**
Use the text you found PLUS visual features to identify:
- What is the product? (Be specific: "Nail Clipper" not "Tool", "Red Light Therapy Cap" not "Device")
- What brand is it? (Read the label! Look for logos)
- What model/variant if identifiable?

**STEP 3: DETERMINE IF LUXURY OR EVERYDAY**
Check for luxury brand indicators:
- Jewelry: Cartier, Tiffany & Co, Van Cleef & Arpels, Bvlgari
- Watches: Rolex, Patek Philippe, Omega, Cartier
- Bags: Hermès, Louis Vuitton, Chanel, Gucci, Prada
- Shoes: Louboutin, Jimmy Choo, Gucci
If luxury → use luxury pricing. If everyday → use realistic everyday pricing.

**PRODUCT CATEGORIES TO RECOGNIZE:**
- TOOLS: Nail clippers, scissors, screwdrivers, pliers, multitools, grooming tools
- BOOKS: Identify by ISBN, title, author, cover design
- BEAUTY DEVICES: Red light therapy, LED masks, facial massagers, hair removal devices
- PERSONAL CARE: Hair dryers, straighteners, electric shavers, toothbrushes
- ELECTRONICS: Phones, tablets, laptops, headphones, chargers, cables
- HOME: Kitchen gadgets, cleaning tools, organizers, appliances
- HEALTH: Blood pressure monitors, thermometers, TENS units, massage guns
- Plus: jewelry, watches, bags, shoes, clothes, skincare, cosmetics

**CRITICAL RULES:**
- NEVER say "unable to identify" - always make your best educated guess
- NEVER return prices of 0 - every product has value
- If you see text/ISBN/barcode, USE IT to identify the product
- Be SPECIFIC: "Revlon One-Step Hair Dryer" not "Hair Tool"
- Include brand in name when visible: "OXO Good Grips Nail Clipper"

Return ONLY valid JSON in this EXACT format (no markdown, no extra text):
{
    "imageSummary": "Brief description including any text/labels/ISBN you can read",
    "candidates": [
        {
            "name": "Specific product name with brand (e.g., 'Tweezerman Nail Clipper', 'Atomic Habits by James Clear')",
            "brand": "Brand name or null if truly unknown",
            "category": "phone|jewellery|shoes|bag|clothes|skincare|electronics|watch|cosmetics|accessory|home|other",
            "confidence": 0.0 to 1.0,
            "priceRange": {
                "low": minimum_realistic_price_as_number,
                "high": maximum_realistic_price_as_number,
                "currency": "USD"
            },
            "assumptions": "What affects the price (e.g., 'stainless steel vs titanium, professional vs home use')"
        },
        {
            "name": "Second possibility or alternative identification",
            "brand": "Brand or null",
            "category": "category",
            "confidence": slightly_lower_confidence,
            "priceRange": { "low": number, "high": number, "currency": "USD" },
            "assumptions": "price variability note"
        }
    ]
}

**CONFIDENCE GUIDE:**
- 0.85-1.0: Text/ISBN clearly readable, product unmistakably identified
- 0.7-0.84: Strong visual match, brand likely but not 100% confirmed
- 0.5-0.69: Good guess based on shape/features, some uncertainty
- 0.3-0.49: Reasonable guess, limited visual information

**EVERYDAY PRODUCT PRICE EXAMPLES:**
- Nail clipper (basic) → $3-$15
- Nail clipper (premium: Tweezerman, Victorinox) → $15-$40
- Red light therapy cap/device → $100-$600
- LED face mask → $50-$500
- Book (paperback) → $10-$20
- Book (hardcover) → $20-$40
- Hair dryer (Dyson) → $300-$500
- Hair dryer (Revlon, Conair) → $25-$80
- Electric toothbrush (Oral-B, Sonicare) → $50-$300
- Massage gun (Theragun) → $200-$600

**LUXURY PRODUCT PRICE EXAMPLES:**
- Cartier Love Bracelet → $4,000-$12,000
- Rolex Submariner → $8,000-$15,000
- Hermès Birkin → $10,000-$50,000
- Louis Vuitton Neverfull → $1,500-$2,500
- Chanel Classic Flap → $8,000-$12,000

**REMEMBER:**
- READ THE LABEL/TEXT/ISBN FIRST - this is your most reliable identification method
- Be specific and confident - make your best educated guess
- Every product has a realistic price range - never return $0`;

        // Call OpenAI Vision API
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: 'gpt-4o-mini',
                messages: [
                    {
                        role: 'user',
                        content: [
                            {
                                type: 'text',
                                text: prompt
                            },
                            {
                                type: 'image_url',
                                image_url: {
                                    url: imageDataUrl
                                }
                            }
                        ]
                    }
                ],
                max_tokens: 1000,
                temperature: 0.4 // Slightly higher for more creative guesses
            })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            // Don't expose internal API error details
            console.error('OpenAI API error:', response.status);
            return res.status(500).json({ 
                error: 'Failed to process image',
                message: 'Please try again with a clearer image'
            });
        }

        const result = await response.json();
        const content = result.choices?.[0]?.message?.content;

        if (!content) {
            return res.status(500).json({ error: 'No response from OpenAI' });
        }

        // Parse and validate the response
        const scanData = parseScanResult(content);
        
        // Normalize and ensure valid data
        const normalizedResponse = normalizeResponse(scanData);
        
        // Cache the successful result
        await setCachedResult(cacheKey, normalizedResponse);
        
        // Log to Supabase (awaited to ensure completion before function terminates)
        await logScanResult(normalizedResponse).catch(() => {});
        
        return res.status(200).json(normalizedResponse);

    } catch (error) {
        // Don't expose internal error details
        console.error('Error processing vision request:', error.message);
        return res.status(500).json({ 
            error: 'Internal server error',
            message: 'Failed to process image. Please try again.'
        });
    }
}

/**
 * Robust JSON parsing with fallback extraction
 * @param {string} rawText - Raw response from API
 * @returns {Object}
 */
function parseScanResult(rawText) {
    // Try to extract JSON from the response
    let jsonText = rawText.trim();
    
    // Remove markdown code blocks if present
    const jsonMatch = rawText.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (jsonMatch) {
        jsonText = jsonMatch[1].trim();
    }
    
    // Try to find JSON object boundaries
    const firstBrace = jsonText.indexOf('{');
    const lastBrace = jsonText.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
        jsonText = jsonText.substring(firstBrace, lastBrace + 1);
    }
    
    try {
        const parsed = JSON.parse(jsonText);
        return parsed;
    } catch (parseError) {
        console.warn('JSON parse failed, extracting from text:', parseError.message);
        return extractFromText(rawText);
    }
}

/**
 * Extract product info from non-JSON text response
 * @param {string} content - Raw text content
 * @returns {Object}
 */
function extractFromText(content) {
    const lowerContent = content.toLowerCase();
    
    // Try to detect category from keywords
    let category = 'other';
    let bestGuessName = 'Lifestyle Product';
    let priceRange = { low: 25, high: 200, currency: 'USD' };
    
    // Book detection (check first since ISBN is a strong identifier)
    if (lowerContent.includes('book') || lowerContent.includes('isbn') || 
        lowerContent.includes('hardcover') || lowerContent.includes('paperback') ||
        lowerContent.includes('novel') || lowerContent.includes('author')) {
        category = 'other';
        bestGuessName = lowerContent.includes('hardcover') ? 'Hardcover Book' : 
                        lowerContent.includes('paperback') ? 'Paperback Book' : 'Book';
        priceRange = { low: 10, high: 35, currency: 'USD' };
    }
    // Tools/grooming tools detection
    else if (lowerContent.includes('nail clipper') || lowerContent.includes('nail cutter') ||
             lowerContent.includes('clipper') || lowerContent.includes('scissors') ||
             lowerContent.includes('tweezer') || lowerContent.includes('grooming') ||
             lowerContent.includes('tool') || lowerContent.includes('plier') ||
             lowerContent.includes('screwdriver')) {
        category = 'home';
        bestGuessName = lowerContent.includes('nail') ? 'Nail Clipper' : 
                        lowerContent.includes('tweezer') ? 'Tweezers' :
                        lowerContent.includes('scissor') ? 'Scissors' : 'Grooming Tool';
        priceRange = { low: 5, high: 40, currency: 'USD' };
    }
    // Beauty/therapy devices detection
    else if (lowerContent.includes('red light') || lowerContent.includes('led mask') ||
             lowerContent.includes('therapy') || lowerContent.includes('light therapy') ||
             lowerContent.includes('facial device') || lowerContent.includes('beauty device') ||
             lowerContent.includes('massager') || lowerContent.includes('massage gun')) {
        category = 'electronics';
        bestGuessName = lowerContent.includes('red light') ? 'Red Light Therapy Device' : 
                        lowerContent.includes('led mask') ? 'LED Face Mask' :
                        lowerContent.includes('massage gun') ? 'Massage Gun' : 'Beauty Device';
        priceRange = { low: 80, high: 400, currency: 'USD' };
    }
    // Phone detection
    else if (lowerContent.includes('phone') || lowerContent.includes('iphone') || 
        lowerContent.includes('samsung') || lowerContent.includes('smartphone') ||
        lowerContent.includes('android')) {
        category = 'phone';
        bestGuessName = lowerContent.includes('iphone') ? 'iPhone (recent model)' : 
                        lowerContent.includes('samsung') ? 'Samsung Galaxy' : 'Smartphone';
        priceRange = { low: 299, high: 1299, currency: 'USD' };
    }
    // Bag detection
    else if (lowerContent.includes('bag') || lowerContent.includes('purse') || 
             lowerContent.includes('handbag') || lowerContent.includes('tote')) {
        category = 'bag';
        bestGuessName = lowerContent.includes('designer') || lowerContent.includes('luxury') ? 
                        'Designer Handbag' : 'Fashion Handbag';
        priceRange = { low: 50, high: 800, currency: 'USD' };
    }
    // Shoes detection
    else if (lowerContent.includes('shoe') || lowerContent.includes('sneaker') || 
             lowerContent.includes('boot') || lowerContent.includes('heel')) {
        category = 'shoes';
        bestGuessName = lowerContent.includes('sneaker') ? 'Athletic Sneakers' : 
                        lowerContent.includes('heel') ? 'Fashion Heels' : 'Footwear';
        priceRange = { low: 60, high: 300, currency: 'USD' };
    }
    // Jewelry detection
    else if (lowerContent.includes('jewel') || lowerContent.includes('ring') || 
             lowerContent.includes('necklace') || lowerContent.includes('bracelet') ||
             lowerContent.includes('earring')) {
        category = 'jewellery';
        bestGuessName = lowerContent.includes('gold') ? 'Gold Jewelry' : 
                        lowerContent.includes('silver') ? 'Silver Jewelry' : 'Fashion Jewelry';
        priceRange = { low: 30, high: 500, currency: 'USD' };
    }
    // Watch detection
    else if (lowerContent.includes('watch')) {
        category = 'watch';
        bestGuessName = lowerContent.includes('apple') ? 'Apple Watch' : 
                        lowerContent.includes('smart') ? 'Smart Watch' : 'Wristwatch';
        priceRange = { low: 100, high: 800, currency: 'USD' };
    }
    // Skincare/cosmetics detection
    else if (lowerContent.includes('skincare') || lowerContent.includes('serum') || 
             lowerContent.includes('cream') || lowerContent.includes('lotion') ||
             lowerContent.includes('cosmetic') || lowerContent.includes('makeup')) {
        category = 'skincare';
        bestGuessName = 'Beauty Product';
        priceRange = { low: 15, high: 120, currency: 'USD' };
    }
    // Clothes detection
    else if (lowerContent.includes('shirt') || lowerContent.includes('dress') || 
             lowerContent.includes('jacket') || lowerContent.includes('pants') ||
             lowerContent.includes('clothing') || lowerContent.includes('sweater')) {
        category = 'clothes';
        bestGuessName = 'Clothing Item';
        priceRange = { low: 30, high: 250, currency: 'USD' };
    }
    // Electronics detection
    else if (lowerContent.includes('laptop') || lowerContent.includes('computer') || 
             lowerContent.includes('tablet') || lowerContent.includes('electronic') ||
             lowerContent.includes('headphone') || lowerContent.includes('airpod')) {
        category = 'electronics';
        bestGuessName = lowerContent.includes('laptop') ? 'Laptop Computer' : 
                        lowerContent.includes('tablet') ? 'Tablet Device' :
                        lowerContent.includes('headphone') || lowerContent.includes('airpod') ? 
                        'Wireless Earbuds/Headphones' : 'Electronic Device';
        priceRange = { low: 100, high: 1200, currency: 'USD' };
    }
    
    // Try to extract any price mentions
    const priceMatches = content.match(/\$\s*(\d+(?:,\d{3})*(?:\.\d{2})?)/g);
    if (priceMatches && priceMatches.length >= 2) {
        const prices = priceMatches.map(p => parseFloat(p.replace(/[$,]/g, ''))).filter(p => p > 0);
        if (prices.length >= 2) {
            priceRange.low = Math.min(...prices);
            priceRange.high = Math.max(...prices);
        }
    } else if (priceMatches && priceMatches.length === 1) {
        const price = parseFloat(priceMatches[0].replace(/[$,]/g, ''));
        if (price > 0) {
            priceRange.low = Math.round(price * 0.7);
            priceRange.high = Math.round(price * 1.4);
        }
    }
    
    // Try to extract a product name
    const namePatterns = [
        /(?:looks like|appears to be|this is|identified as|product[:\s]+)[\s"']*([^"'\n,.]+)/i,
        /([A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+)+)/  // Capitalized words
    ];
    
    for (const pattern of namePatterns) {
        const match = content.match(pattern);
        if (match && match[1] && match[1].length > 3 && match[1].length < 50) {
            const extracted = match[1].trim();
            if (!extracted.toLowerCase().includes('unknown') && 
                !extracted.toLowerCase().includes('cannot') &&
                !extracted.toLowerCase().includes('unable')) {
                bestGuessName = extracted;
                break;
            }
        }
    }
    
    return {
        imageSummary: 'Product analyzed from image',
        candidates: [
            {
                name: bestGuessName,
                brand: null,
                category: category,
                confidence: 0.45,
                priceRange: priceRange,
                assumptions: 'Estimated range based on visual analysis; actual price varies by brand, condition, and retailer'
            },
            {
                name: `Similar ${getCategoryDisplayName(category)}`,
                brand: null,
                category: category,
                confidence: 0.35,
                priceRange: {
                    low: Math.round(priceRange.low * 0.7),
                    high: Math.round(priceRange.high * 1.3),
                    currency: 'USD'
                },
                assumptions: 'Alternative estimate with wider range for uncertainty'
            }
        ]
    };
}

/**
 * Get display name for category
 * @param {string} category 
 * @returns {string}
 */
function getCategoryDisplayName(category) {
    const names = {
        phone: 'Smartphone',
        jewellery: 'Jewelry',
        shoes: 'Footwear',
        bag: 'Handbag',
        clothes: 'Clothing',
        skincare: 'Beauty Product',
        electronics: 'Electronics',
        watch: 'Watch',
        cosmetics: 'Cosmetics',
        accessory: 'Accessory',
        other: 'Product'
    };
    return names[category] || 'Product';
}

/**
 * Normalizes and validates the response structure
 * Ensures NO zero prices and NO generic "Consumer Product" names
 * @param {Object} data - Parsed response data
 * @returns {Object}
 */
function normalizeResponse(data) {
    const imageSummary = data.imageSummary || 'Product image analyzed';
    
    let candidates = Array.isArray(data.candidates) ? data.candidates : [];
    
    // Validate and fix each candidate
    candidates = candidates.map((candidate, index) => {
        // Get a good name - never use "Consumer Product"
        let name = candidate.name || candidate.best_guess_name || '';
        if (!name || name.toLowerCase().includes('consumer product') || 
            name.toLowerCase() === 'unknown' || name.toLowerCase() === 'product') {
            name = getBetterProductName(candidate.category, index);
        }
        
        const normalized = {
            name: name,
            brand: candidate.brand || null,
            category: normalizeCategory(candidate.category),
            confidence: normalizeConfidence(candidate.confidence),
            priceRange: normalizePriceRange(candidate.priceRange || candidate.price_range, candidate.category),
            assumptions: candidate.assumptions || candidate.reasoning_short || 
                         'Price varies by specific model, condition, and retailer'
        };
        return normalized;
    });
    
    // Ensure we have at least 2 candidates with good names
    while (candidates.length < 2) {
        const existingCategory = candidates[0]?.category || 'other';
        const existingPriceRange = candidates[0]?.priceRange || getDefaultPriceRange(existingCategory);
        
        candidates.push({
            name: getBetterProductName(existingCategory, candidates.length),
            brand: null,
            category: existingCategory,
            confidence: 0.35 - (candidates.length * 0.05),
            priceRange: {
                low: Math.max(10, Math.round(existingPriceRange.low * 0.8)),
                high: Math.round(existingPriceRange.high * 1.2),
                currency: 'USD'
            },
            assumptions: 'Alternative estimate based on similar products'
        });
    }
    
    // Limit to 3 and sort by confidence
    candidates = candidates
        .slice(0, 3)
        .sort((a, b) => b.confidence - a.confidence);
    
    return {
        imageSummary,
        candidates
    };
}

/**
 * Get a better product name based on category (never "Consumer Product")
 * @param {string} category 
 * @param {number} index 
 * @returns {string}
 */
function getBetterProductName(category, index) {
    const categoryNames = {
        phone: ['Smartphone', 'Mobile Device', 'Cellular Phone'],
        jewellery: ['Fashion Jewelry', 'Jewelry Piece', 'Accessory Jewelry'],
        shoes: ['Footwear', 'Fashion Shoes', 'Casual Shoes'],
        bag: ['Handbag', 'Fashion Bag', 'Tote Bag'],
        clothes: ['Clothing Item', 'Fashion Apparel', 'Garment'],
        skincare: ['Beauty Product', 'Skincare Item', 'Personal Care Product'],
        electronics: ['Electronic Device', 'Tech Gadget', 'Beauty Device'],
        watch: ['Wristwatch', 'Timepiece', 'Watch'],
        cosmetics: ['Cosmetic Product', 'Beauty Item', 'Makeup Product'],
        accessory: ['Fashion Accessory', 'Personal Accessory', 'Style Accessory'],
        home: ['Home Tool', 'Household Item', 'Grooming Tool'],
        other: ['Personal Item', 'Book', 'Everyday Item']
    };
    
    const names = categoryNames[category] || categoryNames.other;
    return names[Math.min(index, names.length - 1)];
}

/**
 * Get default price range for category (always non-zero)
 * @param {string} category 
 * @returns {Object}
 */
function getDefaultPriceRange(category) {
    const ranges = {
        phone: { low: 299, high: 1299, currency: 'USD' },
        jewellery: { low: 30, high: 500, currency: 'USD' },
        shoes: { low: 50, high: 300, currency: 'USD' },
        bag: { low: 50, high: 800, currency: 'USD' },
        clothes: { low: 30, high: 250, currency: 'USD' },
        skincare: { low: 15, high: 120, currency: 'USD' },
        electronics: { low: 80, high: 1000, currency: 'USD' },
        watch: { low: 80, high: 600, currency: 'USD' },
        cosmetics: { low: 15, high: 100, currency: 'USD' },
        accessory: { low: 20, high: 200, currency: 'USD' },
        home: { low: 10, high: 150, currency: 'USD' },
        other: { low: 15, high: 200, currency: 'USD' }
    };
    return ranges[category] || ranges.other;
}

/**
 * Normalizes category to expected values
 * @param {string} category 
 * @returns {string}
 */
function normalizeCategory(category) {
    const validCategories = ['phone', 'jewellery', 'jewelry', 'shoes', 'bag', 'clothes', 
                            'skincare', 'electronics', 'watch', 'cosmetics', 'accessory', 'home', 'other'];
    const lowerCategory = (category || 'other').toLowerCase().trim();
    
    if (lowerCategory === 'jewelry') return 'jewellery';
    if (lowerCategory === 'clothing') return 'clothes';
    if (lowerCategory === 'handbag' || lowerCategory === 'purse') return 'bag';
    if (lowerCategory === 'smartphone' || lowerCategory === 'mobile') return 'phone';
    if (lowerCategory === 'tool' || lowerCategory === 'tools' || lowerCategory === 'grooming') return 'home';
    if (lowerCategory === 'book' || lowerCategory === 'books') return 'other';
    if (lowerCategory === 'health' || lowerCategory === 'medical' || lowerCategory === 'beauty device') return 'electronics';
    
    if (validCategories.includes(lowerCategory)) {
        return lowerCategory;
    }
    
    return 'other';
}

/**
 * Normalizes confidence to 0-1 range
 * @param {number} confidence 
 * @returns {number}
 */
function normalizeConfidence(confidence) {
    if (typeof confidence !== 'number' || isNaN(confidence)) {
        return 0.5;
    }
    return Math.max(0.1, Math.min(1, confidence));
}

/**
 * Normalizes price range - NEVER returns 0
 * @param {Object} priceRange 
 * @param {string} category 
 * @returns {Object}
 */
function normalizePriceRange(priceRange, category) {
    const defaultRange = getDefaultPriceRange(category || 'other');
    
    if (!priceRange || typeof priceRange !== 'object') {
        return defaultRange;
    }
    
    let low = parseFloat(priceRange.low);
    let high = parseFloat(priceRange.high);
    
    // CRITICAL: Never allow $0 prices
    if (isNaN(low) || low <= 0) low = defaultRange.low;
    if (isNaN(high) || high <= 0) high = defaultRange.high;
    
    // Ensure minimum reasonable prices
    low = Math.max(low, 5);
    high = Math.max(high, low + 10);
    
    // Ensure low <= high
    if (low > high) {
        [low, high] = [high, low];
    }
    
    // Cap unreasonably high prices
    if (high > 50000) high = 50000;
    
    return {
        low: Math.round(low),
        high: Math.round(high),
        currency: priceRange.currency || 'USD'
    };
}
