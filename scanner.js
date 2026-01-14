// Girl Math Scanner Module
// Standalone product scanner with price estimation - NOT wired into Girl Math Calculator

/**
 * @typedef {Object} PriceRange
 * @property {number} low - Lower bound of price range
 * @property {number} high - Upper bound of price range
 * @property {string} currency - Currency code (default: USD)
 */

/**
 * @typedef {Object} Candidate
 * @property {string} name - Product name (family-level if uncertain)
 * @property {string} [brand] - Brand name if identifiable
 * @property {string} [category] - Category: phone, jewellery, shoes, bag, clothes, skincare, other
 * @property {number} confidence - Confidence score 0-1
 * @property {PriceRange} priceRange - Estimated price range
 * @property {string} assumptions - Explains price variability
 */

/**
 * @typedef {Object} Followup
 * @property {'pick_one'|'single_question'|'retake_hint'} type
 * @property {string} prompt
 * @property {string[]} [options]
 * @property {string} [hint]
 */

/**
 * @typedef {Object} ScanResult
 * @property {'ok'|'needs_disambiguation'|'needs_more_info'} status
 * @property {string} imageSummary - Description of what's visible in the image
 * @property {Candidate[]} candidates - Always 2-3 candidates
 * @property {Followup} [followup] - Next step if disambiguation needed
 */

// Confidence thresholds
const CONFIDENCE_THRESHOLDS = {
    EXACT_NAMING: 0.75,      // Can use exact model name
    DISAMBIGUATION: 0.6,     // Below this, needs user disambiguation
    NEEDS_MORE_INFO: 0.3     // Below this, needs retake or manual category
};

// Phone detection patterns
const PHONE_BACK_PATTERNS = [
    'back of phone',
    'camera bump',
    'camera module',
    'rear camera',
    'back side',
    'no screen visible',
    'phone back',
    'smartphone back',
    'camera array',
    'triple camera',
    'dual camera'
];

// Category-specific price ranges (fallback) - ALL PRICES ARE NON-ZERO
const CATEGORY_PRICE_RANGES = {
    phone: { low: 299, high: 1599, currency: 'USD' },
    jewellery: { low: 30, high: 800, currency: 'USD' },
    shoes: { low: 50, high: 400, currency: 'USD' },
    bag: { low: 50, high: 1500, currency: 'USD' },
    clothes: { low: 25, high: 350, currency: 'USD' },
    skincare: { low: 15, high: 150, currency: 'USD' },
    electronics: { low: 80, high: 1200, currency: 'USD' },
    watch: { low: 80, high: 600, currency: 'USD' },
    cosmetics: { low: 15, high: 100, currency: 'USD' },
    accessory: { low: 20, high: 200, currency: 'USD' },
    other: { low: 25, high: 250, currency: 'USD' }
};

// Better product names by category (never "Consumer Product")
const CATEGORY_PRODUCT_NAMES = {
    phone: ['Smartphone', 'Mobile Device', 'Cellular Phone'],
    jewellery: ['Fashion Jewelry', 'Jewelry Piece', 'Fine Jewelry'],
    shoes: ['Fashion Footwear', 'Casual Shoes', 'Athletic Shoes'],
    bag: ['Handbag', 'Fashion Bag', 'Designer Bag'],
    clothes: ['Fashion Apparel', 'Clothing Item', 'Garment'],
    skincare: ['Beauty Product', 'Skincare Item', 'Personal Care'],
    electronics: ['Electronic Device', 'Tech Gadget', 'Digital Device'],
    watch: ['Wristwatch', 'Timepiece', 'Smart Watch'],
    cosmetics: ['Cosmetic Product', 'Beauty Item', 'Makeup'],
    accessory: ['Fashion Accessory', 'Personal Accessory', 'Style Item'],
    other: ['Lifestyle Product', 'Personal Item', 'Everyday Essential']
};

/**
 * Detects if the image appears to be the back of a phone
 * @param {string} imageSummary - Description of the image
 * @returns {boolean}
 */
function isPhoneBackImage(imageSummary) {
    const lowerSummary = imageSummary.toLowerCase();
    return PHONE_BACK_PATTERNS.some(pattern => lowerSummary.includes(pattern));
}

/**
 * Checks if the category is inherently ambiguous from visual inspection
 * @param {string} category 
 * @param {string} imageSummary 
 * @returns {boolean}
 */
function isInherentlyAmbiguous(category, imageSummary) {
    // Phones from the back are inherently ambiguous
    if (category === 'phone' && isPhoneBackImage(imageSummary)) {
        return true;
    }
    // Similar-looking items in categories
    const ambiguousKeywords = ['partial view', 'unclear', 'obscured', 'blurry', 'similar', 'generic'];
    return ambiguousKeywords.some(kw => imageSummary.toLowerCase().includes(kw));
}

/**
 * Creates a family-level name for uncertain products
 * @param {string} fullName - The specific product name
 * @param {string} category - Product category
 * @param {number} confidence - Confidence score
 * @returns {string}
 */
function getFamilyLevelName(fullName, category, confidence) {
    // If confidence is high enough, return exact name
    if (confidence >= CONFIDENCE_THRESHOLDS.EXACT_NAMING) {
        return fullName;
    }
    
    // Otherwise, generalize the name
    // iPhone specific handling
    if (fullName.toLowerCase().includes('iphone')) {
        if (fullName.toLowerCase().includes('pro max')) {
            return 'iPhone Pro Max (recent)';
        } else if (fullName.toLowerCase().includes('pro')) {
            return 'iPhone Pro (recent)';
        } else {
            return 'iPhone (recent model)';
        }
    }
    
    // Samsung Galaxy
    if (fullName.toLowerCase().includes('galaxy')) {
        if (fullName.toLowerCase().includes('ultra')) {
            return 'Samsung Galaxy Ultra';
        } else if (fullName.toLowerCase().includes('plus')) {
            return 'Samsung Galaxy Plus';
        } else {
            return 'Samsung Galaxy';
        }
    }
    
    // Generic handling for other products
    if (category === 'phone') {
        return 'Smartphone';
    }
    
    return fullName;
}

/**
 * Gets the phone disambiguation followup
 * @returns {Followup}
 */
function getPhoneDisambiguationFollowup() {
    return {
        type: 'pick_one',
        prompt: 'Phones look similar from the back — pick the closest match',
        options: ['iPhone (standard)', 'iPhone Pro', 'iPhone Pro Max', 'Android / Other'],
        hint: 'If you can, capture the front screen or the box label for a precise model.'
    };
}

/**
 * Widens a price range for uncertain items - NEVER returns $0
 * @param {PriceRange} range 
 * @param {number} confidence 
 * @returns {PriceRange}
 */
function adjustPriceRangeForConfidence(range, confidence) {
    // Ensure we have valid input
    if (!range || !range.low || !range.high) {
        return { low: 25, high: 200, currency: 'USD' };
    }
    
    // Ensure non-zero input values
    let low = range.low > 0 ? range.low : 25;
    let high = range.high > 0 ? range.high : 200;
    
    // Lower confidence = wider range
    if (confidence >= CONFIDENCE_THRESHOLDS.EXACT_NAMING) {
        return { low, high, currency: range.currency || 'USD' };
    }
    
    const factor = confidence < CONFIDENCE_THRESHOLDS.DISAMBIGUATION ? 1.5 : 1.25;
    const midpoint = (low + high) / 2;
    const spread = (high - low) / 2;
    
    // Calculate adjusted range
    let adjustedLow = Math.round(Math.max(low * 0.7, midpoint - spread * factor));
    let adjustedHigh = Math.round(high * factor);
    
    // Ensure minimum values (never $0)
    if (adjustedLow < 5) adjustedLow = 5;
    if (adjustedHigh < adjustedLow + 10) adjustedHigh = adjustedLow + 50;
    
    return {
        low: adjustedLow,
        high: adjustedHigh,
        currency: range.currency || 'USD'
    };
}

/**
 * Generates assumptions text based on product and confidence
 * @param {string} category 
 * @param {number} confidence 
 * @param {string} name 
 * @returns {string}
 */
function generateAssumptions(category, confidence, name) {
    const baseAssumptions = [];
    
    if (category === 'phone') {
        baseAssumptions.push('varies by storage capacity');
        baseAssumptions.push('model year');
        baseAssumptions.push('region');
    } else if (category === 'jewellery') {
        baseAssumptions.push('varies by material');
        baseAssumptions.push('brand');
        baseAssumptions.push('craftsmanship');
    } else if (category === 'bag') {
        baseAssumptions.push('varies by size');
        baseAssumptions.push('material');
        baseAssumptions.push('brand authenticity');
    } else if (category === 'clothes') {
        baseAssumptions.push('varies by size');
        baseAssumptions.push('retailer');
        baseAssumptions.push('season');
    } else if (category === 'skincare') {
        baseAssumptions.push('varies by size');
        baseAssumptions.push('retailer');
        baseAssumptions.push('formulation');
    } else {
        baseAssumptions.push('typical retail range');
    }
    
    if (confidence < CONFIDENCE_THRESHOLDS.DISAMBIGUATION) {
        baseAssumptions.unshift('estimated based on similar items');
    }
    
    return baseAssumptions.join('; ');
}

/**
 * Processes the raw API response into a ScanResult
 * @param {Object} apiResponse - Raw response from vision API
 * @returns {ScanResult}
 */
function processScanResult(apiResponse) {
    const { imageSummary, candidates: rawCandidates } = apiResponse;
    
    // Ensure we have 2-3 candidates
    let candidates = rawCandidates || [];
    if (candidates.length < 2) {
        // Add fallback candidates if needed
        candidates = ensureMinimumCandidates(candidates, apiResponse.category || 'other');
    }
    if (candidates.length > 3) {
        candidates = candidates.slice(0, 3);
    }
    
    // Process each candidate
    candidates = candidates.map(candidate => {
        const adjustedName = getFamilyLevelName(
            candidate.name,
            candidate.category,
            candidate.confidence
        );
        
        const adjustedPriceRange = adjustPriceRangeForConfidence(
            candidate.priceRange,
            candidate.confidence
        );
        
        return {
            ...candidate,
            name: adjustedName,
            priceRange: adjustedPriceRange,
            assumptions: candidate.assumptions || generateAssumptions(
                candidate.category,
                candidate.confidence,
                candidate.name
            )
        };
    });
    
    // Sort by confidence descending
    candidates.sort((a, b) => b.confidence - a.confidence);
    
    // Determine status
    const topConfidence = candidates[0]?.confidence || 0;
    const category = candidates[0]?.category || 'other';
    
    let status = 'ok';
    let followup = undefined;
    
    // Check if it's a phone back image (inherently ambiguous)
    if (isPhoneBackImage(imageSummary) && category === 'phone') {
        status = 'needs_disambiguation';
        followup = getPhoneDisambiguationFollowup();
    } else if (topConfidence < CONFIDENCE_THRESHOLDS.NEEDS_MORE_INFO) {
        status = 'needs_more_info';
        followup = {
            type: 'retake_hint',
            prompt: 'Not enough signal from this photo',
            hint: 'Try capturing the product label, brand name, or full item view.'
        };
    } else if (topConfidence < CONFIDENCE_THRESHOLDS.DISAMBIGUATION || isInherentlyAmbiguous(category, imageSummary)) {
        status = 'needs_disambiguation';
        followup = {
            type: 'pick_one',
            prompt: 'Pick the closest match',
            options: candidates.slice(0, 3).map(c => c.name)
        };
    }
    
    return {
        status,
        imageSummary: imageSummary || 'Product image analyzed',
        candidates,
        followup
    };
}

/**
 * Gets a good product name for a category (never "Consumer Product" or generic)
 * @param {string} category 
 * @param {number} index 
 * @returns {string}
 */
function getCategoryProductName(category, index) {
    const names = CATEGORY_PRODUCT_NAMES[category] || CATEGORY_PRODUCT_NAMES.other;
    return names[Math.min(index, names.length - 1)];
}

/**
 * Ensures we have at least 2 candidates by adding fallbacks
 * NEVER returns "Consumer Product" or $0 prices
 * @param {Candidate[]} candidates 
 * @param {string} category 
 * @returns {Candidate[]}
 */
function ensureMinimumCandidates(candidates, category) {
    const fallbacks = {
        phone: [
            { name: 'iPhone (recent model)', brand: 'Apple', category: 'phone', confidence: 0.45, priceRange: { low: 699, high: 1199, currency: 'USD' } },
            { name: 'Samsung Galaxy', brand: 'Samsung', category: 'phone', confidence: 0.4, priceRange: { low: 599, high: 1099, currency: 'USD' } },
            { name: 'Android Smartphone', brand: null, category: 'phone', confidence: 0.35, priceRange: { low: 299, high: 899, currency: 'USD' } }
        ],
        jewellery: [
            { name: 'Fine Jewelry', category: 'jewellery', confidence: 0.45, priceRange: { low: 100, high: 800, currency: 'USD' } },
            { name: 'Fashion Jewelry', category: 'jewellery', confidence: 0.4, priceRange: { low: 30, high: 300, currency: 'USD' } },
            { name: 'Costume Jewelry', category: 'jewellery', confidence: 0.35, priceRange: { low: 15, high: 100, currency: 'USD' } }
        ],
        bag: [
            { name: 'Designer Handbag', category: 'bag', confidence: 0.45, priceRange: { low: 300, high: 2000, currency: 'USD' } },
            { name: 'Leather Handbag', category: 'bag', confidence: 0.4, priceRange: { low: 80, high: 500, currency: 'USD' } },
            { name: 'Fashion Bag', category: 'bag', confidence: 0.35, priceRange: { low: 30, high: 200, currency: 'USD' } }
        ],
        shoes: [
            { name: 'Designer Footwear', category: 'shoes', confidence: 0.45, priceRange: { low: 150, high: 600, currency: 'USD' } },
            { name: 'Athletic Sneakers', category: 'shoes', confidence: 0.4, priceRange: { low: 80, high: 250, currency: 'USD' } },
            { name: 'Casual Shoes', category: 'shoes', confidence: 0.35, priceRange: { low: 40, high: 150, currency: 'USD' } }
        ],
        clothes: [
            { name: 'Designer Apparel', category: 'clothes', confidence: 0.45, priceRange: { low: 100, high: 400, currency: 'USD' } },
            { name: 'Brand Clothing', category: 'clothes', confidence: 0.4, priceRange: { low: 50, high: 200, currency: 'USD' } },
            { name: 'Fashion Garment', category: 'clothes', confidence: 0.35, priceRange: { low: 25, high: 100, currency: 'USD' } }
        ],
        skincare: [
            { name: 'Premium Skincare', category: 'skincare', confidence: 0.45, priceRange: { low: 50, high: 180, currency: 'USD' } },
            { name: 'Beauty Product', category: 'skincare', confidence: 0.4, priceRange: { low: 25, high: 80, currency: 'USD' } },
            { name: 'Personal Care Item', category: 'skincare', confidence: 0.35, priceRange: { low: 12, high: 45, currency: 'USD' } }
        ],
        electronics: [
            { name: 'Tech Device', category: 'electronics', confidence: 0.45, priceRange: { low: 150, high: 1000, currency: 'USD' } },
            { name: 'Electronic Gadget', category: 'electronics', confidence: 0.4, priceRange: { low: 80, high: 500, currency: 'USD' } },
            { name: 'Digital Accessory', category: 'electronics', confidence: 0.35, priceRange: { low: 30, high: 200, currency: 'USD' } }
        ],
        watch: [
            { name: 'Luxury Watch', category: 'watch', confidence: 0.45, priceRange: { low: 200, high: 1500, currency: 'USD' } },
            { name: 'Smart Watch', category: 'watch', confidence: 0.4, priceRange: { low: 150, high: 500, currency: 'USD' } },
            { name: 'Fashion Watch', category: 'watch', confidence: 0.35, priceRange: { low: 50, high: 200, currency: 'USD' } }
        ],
        other: [
            { name: 'Lifestyle Product', category: 'other', confidence: 0.45, priceRange: { low: 30, high: 200, currency: 'USD' } },
            { name: 'Personal Item', category: 'other', confidence: 0.4, priceRange: { low: 20, high: 150, currency: 'USD' } },
            { name: 'Everyday Essential', category: 'other', confidence: 0.35, priceRange: { low: 15, high: 100, currency: 'USD' } }
        ]
    };
    
    const categoryFallbacks = fallbacks[category] || fallbacks.other;
    const result = [...candidates];
    
    // Filter out any candidates with bad names or zero prices
    const filteredResult = result.filter(c => {
        const badNames = ['consumer product', 'unknown', 'product', 'item'];
        const nameLower = (c.name || '').toLowerCase();
        const hasBadName = badNames.some(bad => nameLower === bad);
        const hasZeroPrice = !c.priceRange || c.priceRange.low <= 0 || c.priceRange.high <= 0;
        return !hasBadName && !hasZeroPrice;
    });
    
    // Add fallbacks until we have at least 2
    let fallbackIndex = 0;
    while (filteredResult.length < 2 && fallbackIndex < categoryFallbacks.length) {
        const fallback = categoryFallbacks[fallbackIndex];
        // Don't add if same name as existing candidate
        if (!filteredResult.some(c => c.name.toLowerCase() === fallback.name.toLowerCase())) {
            filteredResult.push({
                ...fallback,
                assumptions: generateAssumptions(fallback.category, fallback.confidence, fallback.name)
            });
        }
        fallbackIndex++;
    }
    
    return filteredResult;
}

/**
 * Formats price range for display - NEVER returns $0
 * @param {PriceRange} range 
 * @returns {string}
 */
function formatPriceRange(range) {
    if (!range) {
        return 'Estimated: $25 - $200';
    }
    
    // Ensure non-zero values
    let low = range.low || 25;
    let high = range.high || 200;
    
    if (low <= 0) low = 25;
    if (high <= 0) high = 200;
    if (low > high) [low, high] = [high, low];
    
    if (low === high) {
        return `Estimated: ~$${low}`;
    }
    return `Estimated: $${low} - $${high}`;
}

/**
 * Gets a user-friendly header for the result
 * Never returns "Unknown"
 * @param {ScanResult} result 
 * @returns {string}
 */
function getResultHeader(result) {
    if (result.status === 'ok') {
        return 'Looks like...';
    } else if (result.status === 'needs_disambiguation') {
        return 'Best guesses...';
    } else {
        return 'We need a bit more info...';
    }
}

/**
 * Creates a manual category selection result
 * NEVER returns "Consumer Product" or $0
 * @param {string} category 
 * @returns {ScanResult}
 */
function createManualCategoryResult(category) {
    const priceRange = CATEGORY_PRICE_RANGES[category] || CATEGORY_PRICE_RANGES.other;
    
    // Use the first name from our category names (never "Consumer Product")
    const primaryName = getCategoryProductName(category, 0);
    const secondaryName = getCategoryProductName(category, 1);
    
    return {
        status: 'ok',
        imageSummary: 'Category selected manually',
        candidates: [
            {
                name: primaryName,
                category: category,
                confidence: 0.5,
                priceRange: priceRange,
                assumptions: 'Wide range based on category; actual price depends on specific product, brand, and condition'
            },
            {
                name: secondaryName,
                category: category,
                confidence: 0.4,
                priceRange: {
                    low: Math.round(priceRange.low * 0.8),
                    high: Math.round(priceRange.high * 1.2),
                    currency: 'USD'
                },
                assumptions: 'Alternative estimate with broader range'
            }
        ]
    };
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        CONFIDENCE_THRESHOLDS,
        processScanResult,
        formatPriceRange,
        getResultHeader,
        createManualCategoryResult,
        isPhoneBackImage,
        generateAssumptions
    };
}

// Export to window for browser use
if (typeof window !== 'undefined') {
    window.ScannerModule = {
        CONFIDENCE_THRESHOLDS,
        processScanResult,
        formatPriceRange,
        getResultHeader,
        createManualCategoryResult,
        isPhoneBackImage,
        generateAssumptions
    };
}
