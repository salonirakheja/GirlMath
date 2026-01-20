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
        const supabaseKey = process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

        if (!supabaseUrl || !supabaseKey) {
            return; // Supabase not configured, skip logging
        }

        const supabase = createClient(supabaseUrl, supabaseKey);

        // Get the top candidate
        const topCandidate = result.candidates?.[0];
        if (!topCandidate) return;

        await supabase.from('scanner_logs').insert([{
            product_name: topCandidate.name || 'Unknown',
            brand: topCandidate.brand || null,
            category: topCandidate.category || 'other',
            price_low: topCandidate.priceRange?.low || 0,
            price_high: topCandidate.priceRange?.high || 0,
            confidence: topCandidate.confidence || 0
        }]);
    } catch (error) {
        console.warn('Scanner log error (non-critical):', error.message);
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
        // Enhanced prompt that emphasizes brand detection and luxury identification
        const prompt = `You are a luxury product identification expert. Analyze this image and identify what product it shows.

YOUR TASK:
1. **LOOK FOR BRAND MARKINGS FIRST** - Check for logos, engravings, stamps, hardware style, and design signatures
2. Identify the product - even from partial, blurry, or imperfect photos
3. If you recognize a LUXURY BRAND, use its name prominently and adjust price range accordingly
4. ALWAYS provide a realistic price range in USD - NEVER output $0

**BRAND DETECTION IS CRITICAL:**
- Look for engravings, stamps, logos, distinctive hardware, or signature designs
- Common LUXURY brands to recognize:
  * Jewelry: Cartier, Tiffany & Co, Van Cleef & Arpels, Bvlgari, Harry Winston, Chopard
  * Watches: Rolex, Patek Philippe, Audemars Piguet, Omega, Cartier, TAG Heuer
  * Bags: Hermès, Louis Vuitton, Chanel, Gucci, Prada, Dior, Celine, Bottega Veneta
  * Clothes: Chanel, Dior, Gucci, Prada, Burberry, Valentino
  * Shoes: Louboutin, Jimmy Choo, Manolo Blahnik, Gucci, Prada
- If you see Cartier-style screws (Love bracelet), Van Cleef clover motifs, Tiffany blue, etc. - IDENTIFY THE BRAND
- Luxury brand items are typically $500-$50,000+ depending on the item

**CRITICAL RULES:**
- NEVER return prices of 0 or empty prices
- If you recognize a luxury brand, price range should reflect THAT BRAND's pricing
- Cartier Love Bracelet → $4,000-$12,000 (not $50-$500)
- Hermès Birkin → $8,000-$50,000 (not $200-$2000)
- If uncertain between luxury and non-luxury, provide BOTH as candidates with appropriate price ranges

Return ONLY valid JSON in this EXACT format (no markdown, no extra text):
{
    "imageSummary": "Brief description including any brand indicators you see",
    "candidates": [
        {
            "name": "Product name (include brand if recognized, e.g., 'Cartier Love Bracelet')",
            "brand": "Brand name or null if unknown",
            "category": "phone|jewellery|shoes|bag|clothes|skincare|electronics|watch|cosmetics|accessory|home|other",
            "confidence": 0.0 to 1.0,
            "priceRange": {
                "low": minimum_realistic_price_as_number,
                "high": maximum_realistic_price_as_number,
                "currency": "USD"
            },
            "assumptions": "What affects the price (e.g., 'gold vs rose gold, size, with/without diamonds')"
        },
        {
            "name": "Second possibility (could be non-luxury alternative if uncertain)",
            "brand": "Brand or null",
            "category": "category",
            "confidence": slightly_lower_confidence,
            "priceRange": { "low": number, "high": number, "currency": "USD" },
            "assumptions": "price variability note"
        }
    ]
}

CONFIDENCE GUIDE:
- 0.85-1.0: Luxury brand clearly identifiable (logo visible, signature design confirmed)
- 0.7-0.84: Likely luxury brand based on style/design cues
- 0.5-0.69: Could be luxury OR non-luxury, uncertain
- 0.3-0.49: Probably non-luxury but has some premium features

LUXURY PRICE EXAMPLES:
- Cartier Love Bracelet → $4,000-$12,000
- Cartier Juste Un Clou → $3,500-$10,000
- Tiffany T Bracelet → $1,000-$5,000
- Rolex Submariner → $8,000-$15,000
- Hermès Birkin → $10,000-$50,000
- Louis Vuitton Neverfull → $1,500-$2,500
- Chanel Classic Flap → $8,000-$12,000

NON-LUXURY ALTERNATIVES:
- Generic gold bangle → $50-$500
- Fashion jewelry → $20-$200
- Designer-inspired bag → $100-$500

Remember: Brand detection is your TOP PRIORITY. A Cartier bracelet should NEVER be priced at $50-$500.`;

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
        
        // Log to Supabase (non-blocking)
        logScanResult(normalizedResponse).catch(() => {});
        
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
    
    // Phone detection
    if (lowerContent.includes('phone') || lowerContent.includes('iphone') || 
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
        electronics: ['Electronic Device', 'Tech Gadget', 'Digital Device'],
        watch: ['Wristwatch', 'Timepiece', 'Watch'],
        cosmetics: ['Cosmetic Product', 'Beauty Item', 'Makeup Product'],
        accessory: ['Fashion Accessory', 'Personal Accessory', 'Style Accessory'],
        other: ['Lifestyle Product', 'Personal Item', 'Everyday Item']
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
        other: { low: 25, high: 200, currency: 'USD' }
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
                            'skincare', 'electronics', 'watch', 'cosmetics', 'accessory', 'other'];
    const lowerCategory = (category || 'other').toLowerCase().trim();
    
    if (lowerCategory === 'jewelry') return 'jewellery';
    if (lowerCategory === 'clothing') return 'clothes';
    if (lowerCategory === 'handbag' || lowerCategory === 'purse') return 'bag';
    if (lowerCategory === 'smartphone' || lowerCategory === 'mobile') return 'phone';
    
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
