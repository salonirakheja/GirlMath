// Vercel Serverless Function for SerpAPI Search
// Girl Math Shop - Fetches real product offers from Google Shopping via SerpAPI

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

    // Validate request body
    if (!req.body || typeof req.body !== 'object') {
        return res.status(400).json({ error: 'Invalid request body' });
    }

    const { productName, brand, category } = req.body;

    // Validate required fields
    if (!productName || typeof productName !== 'string' || productName.trim().length === 0) {
        return res.status(400).json({ error: 'productName is required' });
    }

    // Get API key from environment
    const apiKey = process.env.SERPAPI_API_KEY;

    if (!apiKey) {
        // Return empty results instead of error - frontend will use fallback
        console.warn('SerpAPI key not configured, returning empty results');
        return res.status(200).json({ offers: [] });
    }

    try {
        // Build search query
        const searchQuery = brand 
            ? `${brand} ${productName}`.trim()
            : productName.trim();

        // Call SerpAPI Google Shopping endpoint
        const serpApiUrl = 'https://serpapi.com/search.json';
        const params = new URLSearchParams({
            engine: 'google_shopping',
            q: searchQuery,
            api_key: apiKey,
            num: '10', // Get up to 10 results
            gl: 'us', // Country: United States
            hl: 'en'  // Language: English
        });

        const response = await fetch(`${serpApiUrl}?${params.toString()}`, {
            method: 'GET',
            headers: {
                'Accept': 'application/json'
            }
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('SerpAPI error:', response.status, errorText);
            // Return empty results on API error - frontend will use fallback
            return res.status(200).json({ offers: [] });
        }

        const data = await response.json();

        // Normalize SerpAPI results to our offer format
        const offers = normalizeSerpApiResults(data);

        return res.status(200).json({ offers });

    } catch (error) {
        // Don't expose internal error details
        console.error('Error processing search request:', error.message);
        // Return empty results on error - frontend will use fallback
        return res.status(200).json({ offers: [] });
    }
}

/**
 * Normalizes SerpAPI Google Shopping results to our offer format
 * @param {Object} serpApiData - Raw response from SerpAPI
 * @returns {Array} Array of normalized offer objects
 */
function normalizeSerpApiResults(serpApiData) {
    const offers = [];

    // SerpAPI Google Shopping returns results in shopping_results array
    const shoppingResults = serpApiData.shopping_results || [];

    for (const result of shoppingResults) {
        try {
            // Extract price
            let price = null;
            if (result.price) {
                // Price might be a string like "$29.99" or number
                const priceStr = String(result.price).replace(/[^0-9.]/g, '');
                price = parseFloat(priceStr);
            }

            // Skip if no valid price
            if (!price || !Number.isFinite(price) || price <= 0) {
                continue;
            }

            // Extract retailer name
            const retailerName = result.source || 'Online Store';

            // Extract rating
            let rating = null;
            let ratingCount = null;
            if (result.rating !== undefined) {
                rating = parseFloat(result.rating);
                if (!Number.isFinite(rating) || rating < 0 || rating > 5) {
                    rating = null;
                }
            }
            if (result.reviews !== undefined) {
                // Reviews might be a number or string like "1,234 reviews"
                const reviewsStr = String(result.reviews).replace(/[^0-9]/g, '');
                ratingCount = parseInt(reviewsStr, 10);
                if (!Number.isFinite(ratingCount) || ratingCount < 0) {
                    ratingCount = null;
                }
            }

            // Extract shipping info
            let shippingLabel = 'Standard shipping';
            let shippingMinutes = null;
            if (result.delivery) {
                const delivery = String(result.delivery).toLowerCase();
                if (delivery.includes('free') || delivery.includes('free shipping')) {
                    shippingLabel = 'Free shipping';
                } else if (delivery.includes('fast') || delivery.includes('express')) {
                    shippingLabel = 'Fast shipping';
                    shippingMinutes = 60 * 24; // 1 day
                } else if (delivery.includes('2-3') || delivery.includes('2 to 3')) {
                    shippingLabel = '2–3 day shipping';
                    shippingMinutes = 60 * 48; // 2 days
                } else if (delivery.match(/\d+\s*(day|days)/)) {
                    const daysMatch = delivery.match(/(\d+)\s*(?:to|-)?\s*(\d+)?\s*(?:day|days)/);
                    if (daysMatch) {
                        const days = parseInt(daysMatch[1] || daysMatch[2] || '3', 10);
                        shippingMinutes = 60 * 24 * days;
                        shippingLabel = `${days} day shipping`;
                    }
                }
            }

            // Default shipping estimate if not found
            if (!shippingMinutes) {
                shippingMinutes = 60 * 72; // Default to 3 days
            }

            // Extract URL
            const url = result.link || result.product_link || '#';

            // Extract condition (if available)
            const condition = result.condition || 'New';

            // Map retailer name to our retailer IDs
            const retailerId = mapRetailerNameToId(retailerName);

            offers.push({
                retailerId,
                retailerName,
                price: Math.round(price),
                currency: 'USD',
                rating: rating ? Math.round(rating * 10) / 10 : null,
                ratingCount: ratingCount || null,
                shippingMinutes,
                shippingLabel,
                condition,
                url
            });

        } catch (error) {
            // Skip this result if normalization fails
            console.warn('Error normalizing SerpAPI result:', error.message);
            continue;
        }
    }

    // Limit to 10 offers and sort by price (lowest first)
    return offers
        .slice(0, 10)
        .sort((a, b) => a.price - b.price);
}

/**
 * Maps retailer name from SerpAPI to our retailer ID
 * @param {string} retailerName - Retailer name from SerpAPI
 * @returns {string} Retailer ID
 */
function mapRetailerNameToId(retailerName) {
    const name = String(retailerName || '').toLowerCase();
    
    if (name.includes('amazon')) return 'amazon';
    if (name.includes('ebay')) return 'ebay';
    if (name.includes('walmart')) return 'walmart';
    if (name.includes('target')) return 'target';
    if (name.includes('sephora')) return 'sephora';
    if (name.includes('best buy') || name.includes('bestbuy')) return 'bestbuy';
    
    // Default to generic retailer
    return 'other';
}
