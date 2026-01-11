// Girl Math Rules Engine - Short punchlines (<=120 chars, screenshot-friendly)
const girlMathRules = {
    softlife: {
        clothes: [
            (data) => data.costPerUse < 3 ? `$${data.costPerUse.toFixed(2)} per wear? That's self-care, not spending.` : null,
            (data) => data.savings > 0 ? `You saved $${data.savings.toFixed(0)}. That's money you earned, not spent.` : null,
            (data) => "Quality pieces are investments in yourself. You deserve joy."
        ],
        skincare: [
            (data) => data.costPerDay ? `$${data.costPerDay.toFixed(2)}/day for glowing skin? That's self-care, not spending.` : null,
            (data) => data.savings > 0 ? "Self-care isn't luxury, it's necessity. And you got it on sale! ✨" : "You can't put a price on good skin."
        ],
        travel: [
            (data) => "Memories are priceless. This trip is an investment in your happiness.",
            (data) => data.price > 500 ? "Experiences > things. You're building your story." : "A change of scenery is essential for mental health."
        ],
        food: [
            (data) => "Nourishing your body is always worth it. You deserve good food. 💅",
            (data) => "Food is fuel and joy. This purchase supports both."
        ],
        subscription: [
            (data) => "Investing in yourself and growth is never a waste.",
            (data) => "This subscription pays for itself in productivity gains."
        ],
        gift: [
            (data) => "Giving joy to others brings joy to you. That's pure ROI.",
            (data) => "Thoughtful gifts strengthen relationships — priceless."
        ],
        jewellery: [
            (data) => "Diamonds (and gold) are forever. This isn't a purchase, it's an heirloom.",
            (data) => data.costPerUse < 1 ? `Wear it daily and it's basically $${data.costPerUse.toFixed(2)}/day sparkle.` : "Quality jewellery never goes out of style."
        ],
        other: [
            (data) => "You work hard. You deserve to treat yourself.",
            (data) => "Life's too short to not buy things that make you happy."
        ]
    },
    bestie: {
        clothes: [
            (data) => data.costPerUse < 3 ? `$${data.costPerUse.toFixed(2)}/wear? I've wasted more on iced coffee and regret.` : `You paid HOW much? Your wallet's crying. 😂`,
            (data) => data.price > 100 ? "You said you were 'saving money' last week. So... what happened?" : "At least it's under $100 this time."
        ],
        skincare: [
            (data) => data.costPerDay ? `$${data.costPerDay.toFixed(2)}/day? I've wasted more on iced coffee and regret.` : null,
            (data) => data.price > 50 ? "Another serum? Your bathroom shelf called — it's tired." : "At least your skin will thank you (unlike your bank account)."
        ],
        travel: [
            (data) => "Another vacation? Your credit card is crying but your Instagram is thriving.",
            (data) => data.price > 1000 ? "You could've bought a car. But photos > logic, I guess? ✈️" : "At least this one's relatively reasonable (for you)."
        ],
        food: [
            (data) => "You ordered delivery again? Remember when you said you'd 'cook more'? Yeah, me neither.",
            (data) => data.price > 30 ? "$30 for lunch? You're living your best life and your wallet's worst nightmare." : "Fine, food is a need. Approved with side-eye."
        ],
        subscription: [
            (data) => "Another subscription? You have like 12. How many streaming services does one person need?",
            (data) => "You'll use this for a week and forget it exists. But hey, at least you tried."
        ],
        gift: [
            (data) => "Buying gifts for others when you 'can't afford' groceries? Classic you. But sweet, so approved.",
            (data) => "You're too generous for your own good. But that's why I love you. 💕"
        ],
        jewellery: [
            (data) => "Another shiny thing? You're like a magpie with a credit card. 🕊️",
            (data) => data.price > 200 ? "This better be real gold for that price. Is it? Thought so." : "At least it's not another fast fashion ring that turns your finger green."
        ],
        other: [
            (data) => "Girl... what even is this? But I support your chaos.",
            (data) => data.price > 50 ? "You said 'one more purchase and I'm done' three purchases ago. But go off." : "At least it's not another fast fashion haul."
        ]
    },
    mba: {
        clothes: [
            (data) => `$${data.costPerUse.toFixed(2)}/wear. Annualized glow ROI exceeds emotional depreciation.`,
            (data) => `Cost-per-wear: $${data.costPerUse.toFixed(2)}. ROI positive if worn >${Math.ceil(data.price / 5)}x. Calculated risk: LOW.`
        ],
        skincare: [
            (data) => data.costPerDay ? `$${data.costPerDay.toFixed(2)}/day. Annualized glow ROI exceeds emotional depreciation.` : null,
            (data) => data.costPerDay ? `Annualized cost: $${(data.costPerDay * 365).toFixed(0)}/yr. NPV positive vs. dermatologist visits.` : "Compound value: skin health investment = future procedure savings. Strong IRR."
        ],
        travel: [
            (data) => `Content ROI: $${data.price} / 50 photos = $${(data.price / 50).toFixed(2)} per engagement asset.`,
            (data) => `Experience arbitrage: $${data.price} premium justified by network expansion + mental health ROI.`
        ],
        food: [
            (data) => `Nutritional ROI: $${data.price} / caloric efficiency = cost-per-calorie optimization achieved.`,
            (data) => `Opportunity cost: Restaurant $${data.price} vs. home-cooked $${(data.price * 0.3).toFixed(0)}. Convenience premium justified.`
        ],
        subscription: [
            (data) => `MRR: $${(data.price / 12).toFixed(2)}/mo < productivity gain value. Positive cash flow.`,
            (data) => `SaaS LTV: $${(data.price * 3).toFixed(0)} if retained 3yr. Churn risk: LOW if ROI visible.`
        ],
        gift: [
            (data) => `Relationship capital ROI: $${data.price} = immeasurable but positive NPV.`,
            (data) => `Gift economy analysis: $${data.price} / recipient happiness quotient = strong emotional dividend.`
        ],
        jewellery: [
            (data) => `Hard asset allocation: $${data.price} in precious metals/stones. Store of value achieved.`,
            (data) => `Amortization schedule: Infinite utility life. Cost-per-use approaches zero over holding period.`
        ],
        other: [
            (data) => `Tangible asset: $${data.price} = ${(data.price / 100).toFixed(1)}x multiple on baseline utility.`,
            (data) => `CAPEX: $${data.price} one-time vs. recurring. Amortized value acceptable if usage > 20x.`
        ]
    }
};

// Category default uses if not provided
const categoryDefaultUses = {
    skincare: 180,
    clothes: 30,
    travel: 1,
    food: 1,
    subscription: 30,
    gift: 1,
    jewellery: 60,
    other: 1
};

// Helper to normalize and cap uses
function normalizeUses(uses) {
    const parsed = parseInt(uses);
    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/7e890f55-d8f9-472f-9f88-eff2b6294469',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app.js:normalizeUses',message:'normalizeUses called',data:{inputUses:uses,parsed:parsed,willReturnNull:isNaN(parsed)||parsed<=0},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H1,H5'})}).catch(()=>{});
    // #endregion
    if (isNaN(parsed) || parsed <= 0) return null;
    return Math.min(Math.round(parsed), 120);
}

// Monthly income midpoints for budget calculation
const incomeMidpoints = {
    'under30': 2000,
    '30to60': 3750,
    '60to100': 6500,
    '100to200': 12500,
    'over200': 20000
};

// Vibe labels for budget percentages
const vibeLabels = {
    5: 'Very disciplined',
    10: 'Balanced',
    15: 'Soft life',
    20: 'Main character',
    25: 'Lavish'
};

// Category bonuses for Girl Math scoring (additive, not multiplicative)
const categoryBonuses = {
    skincare: 15,     // Skincare/Wellness
    clothes: 12,      // Work/Investment
    travel: 10,       // Experiences/Travel
    subscription: 8,  // Electronics
    jewellery: 8,     // Jewellery
    food: 0,          // Food/Gifts
    gift: 0,
    other: 0
};

// Verdict tiers (More Lenient - Justification-Friendly)
const verdictTiers = {
    approved: { min: 70, max: 100, stamp: 'APPROVED ✨', message: 'Basically free! This is certified Girl Math.' },
    justified: { min: 50, max: 69, stamp: 'JUSTIFIED 👍', message: 'The math is mathing. We\'ll allow it.' },
    questionable: { min: 30, max: 49, stamp: 'QUESTIONABLE 🤔', message: 'Questionable, but we see the vision.' },
    denied: { min: 0, max: 29, stamp: 'DENIED 🚫', message: 'Let’s sleep on it' }
};

// Category-based objective justification lines (verdict-aware)
const categoryJustifications = {
    approved: {
        skincare: "An investment in your future self.",
        clothes: "Quality pieces pay for themselves over time.",
        food: "Daily habits add up, but so does the joy.",
        travel: "Memories last longer than things.",
        electronics: "Technology that boosts productivity is an investment.",
        subscription: "Recurring value justifies recurring costs.",
        gift: "A calculated decision that brings joy.",
        jewellery: "Rewear all year (weekly average).",
        other: "A smart, calculated decision."
    },
    justified: {
        skincare: "Self-care is important, and you got a good deal.",
        clothes: "A reasonable purchase for your wardrobe.",
        food: "You deserve good food, and the price works.",
        travel: "Experiences are worth investing in.",
        electronics: "A practical upgrade that makes sense.",
        subscription: "The value seems worth the cost.",
        gift: "A thoughtful choice for someone special.",
        jewellery: "Rewear all year (weekly average).",
        other: "The math checks out on this one."
    },
    questionable: {
        skincare: "On the pricier side, but self-care matters.",
        clothes: "It's a stretch, but you might make it work.",
        food: "A bit expensive, but sometimes you need the treat.",
        travel: "It's pricey, but experiences can be priceless.",
        electronics: "Higher than ideal, but could be worth it.",
        subscription: "Costly, but might pay off if you use it.",
        gift: "A generous choice - maybe a bit too generous?",
        jewellery: "High cost for sparkle, but maybe for a special occasion?",
        other: "The math is... questionable, but not impossible."
    },
    denied: {
        skincare: "This price doesn't add up for what you're getting.",
        clothes: "Hard to justify at this cost-per-wear ratio.",
        food: "Too expensive for what it is - consider alternatives.",
        travel: "The numbers don't support this purchase right now.",
        electronics: "The cost-benefit analysis doesn't work out here.",
        subscription: "The monthly cost outweighs the value you'll get.",
        gift: "As much as you want to give, this one's too much.",
        jewellery: "The cost-per-sparkle doesn't math out today.",
        other: "The math doesn't work out on this purchase."
    }
};

// Get category-based justification line that aligns with verdict
function getCategoryJustification(category, verdict) {
    // Default to 'approved' if verdict is not provided or invalid
    const verdictKey = verdict && categoryJustifications[verdict] ? verdict : 'approved';
    const verdictJustifications = categoryJustifications[verdictKey] || categoryJustifications.approved;
    
    // Return category-specific justification, or fallback to 'other', or ultimate fallback
    return verdictJustifications[category] || verdictJustifications.other || "A calculated decision.";
}

// Calculate all metrics
function calculateMetrics(data) {
    const metrics = {
        price: parseFloat(data.price) || 0,
        category: data.category,
        mode: data.mode || 'softlife',
        originalPrice: parseFloat(data.originalPrice) || 0,
        usesProvided: !!data.uses && parseInt(data.uses) > 0 // Track if user provided uses
    };

    // Normalize uses (user provided or default)
    // The 120 cap applies to BOTH default and user-entered uses via normalizeUses
    let rawUses = metrics.usesProvided ? data.uses : categoryDefaultUses[metrics.category];
    let normalizedUsesValue = normalizeUses(rawUses);
    
    metrics.uses = normalizedUsesValue || 1; 
    metrics.usesEstimated = !metrics.usesProvided;

    // Validate inputs - prevent NaNs
    if (isNaN(metrics.price) || metrics.price < 0) metrics.price = 0;
    if (isNaN(metrics.originalPrice) || metrics.originalPrice < 0) metrics.originalPrice = 0;

    // Cost per use (for display) - only calculate if uses are provided
    if (metrics.usesProvided && normalizedUsesValue !== null) {
        metrics.costPerUse = metrics.price / normalizedUsesValue;
    } else {
        metrics.costPerUse = null; // N/A when uses not provided
    }
    
    // Cost per day (for skincare - assumes 30 days)
    if (metrics.category === 'skincare') {
        metrics.costPerDay = metrics.price / 30;
    } else {
        metrics.costPerDay = null;
    }

    // Savings and Discount calculation
    if (data.discountPercent && parseFloat(data.discountPercent) > 0) {
        // Option B: Percentage input
        metrics.discountPercent = parseFloat(data.discountPercent);
        metrics.savings = metrics.price * (metrics.discountPercent / 100);
    } else if (metrics.originalPrice > 0 && metrics.originalPrice > metrics.price) {
        // Option A: Original price input
        metrics.savings = metrics.originalPrice - metrics.price;
        metrics.discountPercent = (metrics.savings / metrics.originalPrice) * 100;
    } else {
        metrics.savings = 0;
        metrics.discountPercent = 0;
    }

    // Adjusted price (compatibility)
    metrics.adjustedPrice = metrics.price;

    // Get baseline values (optional - can be empty)
    metrics.income = data.income || null;
    metrics.budgetPercent = (data.skipVibe || !data.budgetPercent) ? null : parseInt(data.budgetPercent);
    
    // Calculate monthly budget in dollars based on income midpoint and percentage
    // Only calculate if both income and budgetPercent are provided
    if (metrics.income && metrics.budgetPercent !== null) {
        const monthlyIncome = incomeMidpoints[metrics.income] || 3750;
        metrics.budget = monthlyIncome * (metrics.budgetPercent / 100);
        // Calculate price as percentage of vibe budget
        metrics.budgetPercentOfVibe = metrics.budget > 0 ? (metrics.price / metrics.budget) * 100 : 0;
    } else {
        // No baseline provided - skip budget calculations
        metrics.budget = null;
        metrics.budgetPercentOfVibe = null;
    }

    // TRANSPARENT RULE-BASED SCORING SYSTEM
    const breakdown = {
        priceThreshold: { points: 0, max: 12, rationale: '' },
        costPerUse: { points: 0, max: 35, rationale: '' },
        budgetImpact: { points: 0, max: 25, rationale: '' },
        discountSale: { points: 0, max: 15, rationale: '' },
        categoryBonus: { points: 0, rationale: '' }
    };
    
    // 1. Price Threshold Scoring (up to 12 points)
    if (metrics.price < 25) {
        breakdown.priceThreshold.points = 12;
        breakdown.priceThreshold.rationale = 'Under $25 is very reasonable.';
    } else if (metrics.price >= 25 && metrics.price < 75) {
        breakdown.priceThreshold.points = 10;
        breakdown.priceThreshold.rationale = 'Moderate price range.';
    } else if (metrics.price >= 25 && metrics.price < 150) {
        breakdown.priceThreshold.points = 8;
        breakdown.priceThreshold.rationale = 'Higher price, but still manageable.';
    } else if (metrics.price >= 150 && metrics.price < 300) {
        breakdown.priceThreshold.points = 6;
        breakdown.priceThreshold.rationale = 'Premium purchase, but we\'ll work with it.';
    } else {
        breakdown.priceThreshold.points = 4;
        breakdown.priceThreshold.rationale = 'Expensive, but not impossible to justify.';
    }
    
    // 2. Cost Per Use Scoring (up to 35 points)
    // Check usesProvided instead of normalizedUsesValue to catch when user didn't provide uses
    if (!metrics.usesProvided || normalizedUsesValue === null) {
        breakdown.costPerUse.points = 0;
        breakdown.costPerUse.rationale = 'Cost per use cannot be calculated without usage information.';
        // #region agent log
        fetch('http://127.0.0.1:7243/ingest/7e890f55-d8f9-472f-9f88-eff2b6294469',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app.js:costPerUse:null',message:'CPU scoring - null branch',data:{normalizedUsesValue:normalizedUsesValue,usesProvided:metrics.usesProvided,points:0},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H1,H4'})}).catch(()=>{});
        // #endregion
    } else {
        const cpuValue = metrics.price / normalizedUsesValue;
        // #region agent log
        fetch('http://127.0.0.1:7243/ingest/7e890f55-d8f9-472f-9f88-eff2b6294469',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app.js:costPerUse:calc',message:'CPU scoring - calculated',data:{normalizedUsesValue:normalizedUsesValue,price:metrics.price,cpuValue:cpuValue},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H4'})}).catch(()=>{});
        // #endregion
        if (cpuValue < 1) {
            breakdown.costPerUse.points = 35;
            breakdown.costPerUse.rationale = 'Excellent cost-per-use - under $1 per use!';
        } else if (cpuValue >= 1 && cpuValue < 3) {
            breakdown.costPerUse.points = 30;
            breakdown.costPerUse.rationale = 'Great cost-per-use ratio.';
        } else if (cpuValue >= 3 && cpuValue < 5) {
            breakdown.costPerUse.points = 25;
            breakdown.costPerUse.rationale = 'Good cost-per-use ratio.';
        } else if (cpuValue >= 5 && cpuValue < 10) {
            breakdown.costPerUse.points = 20;
            breakdown.costPerUse.rationale = 'Decent cost-per-use ratio.';
        } else if (cpuValue >= 10 && cpuValue < 20) {
            breakdown.costPerUse.points = 15;
            breakdown.costPerUse.rationale = 'Moderate cost-per-use.';
        } else {
            breakdown.costPerUse.points = 10;
            breakdown.costPerUse.rationale = 'Higher cost-per-use, but still some credit.';
        }
    }

    // 3. Budget Impact Scoring (up to 25 points - BASED ON PERSONAL BASELINE)
    // Only calculate if baseline values are provided
    if (metrics.budget && metrics.budget > 0 && metrics.income) {
        const incomeMultipliers = {
            'under30': 0.8,
            '30to60': 1.0,
            '60to100': 1.2,
            '100to200': 1.5,
            'over200': 2.0
        };
        const incomeMult = incomeMultipliers[metrics.income] || 1.0;
        
        // Adjust budget ratio by income multiplier (higher income makes the impact feel smaller)
        const adjustedBudgetRatio = (metrics.price / metrics.budget) / incomeMult;
        
        if (adjustedBudgetRatio <= 0.05) {
            breakdown.budgetImpact.points = 25;
            breakdown.budgetImpact.rationale = 'Tiny impact on your monthly budget - basically free!';
        } else if (adjustedBudgetRatio <= 0.15) {
            breakdown.budgetImpact.points = 20;
            breakdown.budgetImpact.rationale = 'Small impact on your monthly budget.';
        } else if (adjustedBudgetRatio <= 0.3) {
            breakdown.budgetImpact.points = 15;
            breakdown.budgetImpact.rationale = 'Moderate impact on your budget.';
        } else if (adjustedBudgetRatio <= 0.6) {
            breakdown.budgetImpact.points = 10;
            breakdown.budgetImpact.rationale = 'Significant chunk of your monthly budget.';
        } else if (adjustedBudgetRatio <= 1) {
            breakdown.budgetImpact.points = 5;
            breakdown.budgetImpact.rationale = 'Almost your entire monthly budget!';
        } else {
            breakdown.budgetImpact.points = 0;
            breakdown.budgetImpact.rationale = 'Exceeds your monthly discretionary budget.';
        }
    } else {
        // No baseline provided - give neutral score (middle of range)
        breakdown.budgetImpact.points = 12;
        breakdown.budgetImpact.rationale = 'Budget impact not calculated (baseline not provided).';
    }
    
    // 4. Discount / Sale Scoring (up to 15 points)
    const discountPercent = metrics.discountPercent || 0;
    
    if (discountPercent >= 50) {
        breakdown.discountSale.points = 15;
        breakdown.discountSale.rationale = '50%+ off - you\'re basically making money!';
    } else if (discountPercent >= 30 && discountPercent < 50) {
        breakdown.discountSale.points = 12;
        breakdown.discountSale.rationale = 'Great sale - 30-50% off.';
    } else if (discountPercent >= 10 && discountPercent < 30) {
        breakdown.discountSale.points = 8;
        breakdown.discountSale.rationale = 'Good discount - 10-30% off.';
    } else if (discountPercent >= 1 && discountPercent < 10) {
        breakdown.discountSale.points = 4;
        breakdown.discountSale.rationale = 'Small discount, but every bit helps.';
    } else {
        breakdown.discountSale.points = 0;
        breakdown.discountSale.rationale = 'No discount, but that\'s okay.';
    }
    
    // Calculate base score from the four factors (max 12+35+25+15 = 87)
    let baseScore = breakdown.priceThreshold.points + 
                    breakdown.costPerUse.points + 
                    breakdown.budgetImpact.points +
                    breakdown.discountSale.points;
    
    // 5. Add Category Bonus (with Precise Tier Protection)
    const categoryBonus = categoryBonuses[metrics.category] || 0;
    
    // Helper to find tier level (0: denied, 1: questionable, 2: justified, 3: approved)
    const getTierIndex = (score) => {
        if (score >= 70) return 3;
        if (score >= 50) return 2;
        if (score >= 30) return 1;
        return 0;
    };
    
    const baseTierIndex = getTierIndex(baseScore);
    const rawFinal = baseScore + categoryBonus;
    let finalScore = Math.min(rawFinal, 100);
    const preliminaryTierIndex = getTierIndex(finalScore);
    
    // Tier Protection: Category bonus can move the final verdict up by AT MOST ONE tier level
    if (preliminaryTierIndex > baseTierIndex + 1) {
        // Cap the score at the TOP of the next tier level
        if (baseTierIndex === 0) finalScore = 49; // Denied (0-29) -> cap to Questionable (49)
        else if (baseTierIndex === 1) finalScore = 69; // Questionable (30-49) -> cap to Justified (69)
        else if (baseTierIndex === 2) finalScore = 100; // Justified (50-69) -> cap to Approved (100)
    }
    
    finalScore = Math.round(finalScore);
    breakdown.categoryBonus.points = finalScore - baseScore;
    
    const categoryNamesForRationale = {
        skincare: 'Skincare/Wellness',
        clothes: 'Clothing',
        travel: 'Experiences/Travel',
        subscription: 'Electronics / Productivity',
        jewellery: 'Jewellery'
    };
    breakdown.categoryBonus.rationale = breakdown.categoryBonus.points > 0 ? 
        `${categoryNamesForRationale[metrics.category] || metrics.category} category bonus.` : 
        'No category bonus.';
    
    // Store results
    metrics.breakdown = breakdown;
    metrics.baseScore = baseScore;
    metrics.categoryBonus = breakdown.categoryBonus.points;
    metrics.score = finalScore;
    
    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/7e890f55-d8f9-472f-9f88-eff2b6294469',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app.js:calculateMetrics:final',message:'Final score breakdown',data:{finalScore:finalScore,baseScore:baseScore,cpuPoints:breakdown.costPerUse.points,pricePoints:breakdown.priceThreshold.points,budgetPoints:breakdown.budgetImpact.points,discountPoints:breakdown.discountSale.points,categoryBonus:breakdown.categoryBonus.points,usesProvided:metrics.usesProvided,normalizedUses:metrics.uses},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H1,H2,H3,H4'})}).catch(()=>{});
    // #endregion
    
    // Determine final verdict
    if (finalScore >= 70) {
        metrics.verdict = 'approved';
        metrics.verdictInfo = verdictTiers.approved;
    } else if (finalScore >= 50) {
        metrics.verdict = 'justified';
        metrics.verdictInfo = verdictTiers.justified;
    } else if (finalScore >= 30) {
        metrics.verdict = 'questionable';
        metrics.verdictInfo = verdictTiers.questionable;
    } else {
        metrics.verdict = 'denied';
        metrics.verdictInfo = verdictTiers.denied;
    }
    
    metrics.stamp = metrics.verdictInfo.stamp;
    metrics.confidence = finalScore;

    return metrics;
}

// Validation Checks (Development Only)
function runSelfChecks() {
    console.log("--- Girl Math Logic Self-Checks ---");
    
    // A) Jewellery weekly-year example: price=600, uses blank
    const testA = calculateMetrics({ price: "600", category: "jewellery" });
    console.log("Test A (Jewellery default):", {
        price: testA.price,
        uses: testA.uses,
        score: testA.score,
        cpuPoints: testA.breakdown.costPerUse.points,
        bonus: testA.categoryBonus
    });
    // Expected: uses=52 (or 60), cpuPoints=15 ($600/52 = 11.53), bonus=8
    
    // B) Cap applies to defaults: Skincare default is 180
    const testB = calculateMetrics({ price: "100", category: "skincare" });
    console.log("Test B (Skincare cap):", {
        uses: testB.uses,
        isCapped: testB.uses === 120
    });
    // Expected: uses=120
    
    // C) Tier protection: baseScore 40 (Questionable) + bonus 35 must cap at 69 (Justified)
    // To get baseScore 40, we need to carefully pick inputs.
    // Price < 25 (12pts), CPU 20 (20pts), Budget Impact Small (20pts) = 52. 
    // Let's try to get a base score in Questionable range (30-49).
    // Price 200 (6pts), CPU Default (20pts), Budget Impact Moderate (15pts), No Sale (0pts) = 41.
    // Skincare bonus is 15. 41 + 15 = 56. This only moves 1 tier (Questionable -> Justified).
    // Let's find a way to jump 2 tiers.
    // baseScore 20 (Denied) + bonus 15 -> should cap at 49 (Questionable)
    const testC = calculateMetrics({ price: "500", category: "skincare", income: "under30", budgetPercent: "5" });
    console.log("Test C (Tier Protection - Denied to max Questionable):", {
        baseScore: testC.baseScore,
        finalScore: testC.score,
        verdict: testC.verdict
    });

    console.log("--- End Self-Checks ---");
}

// Run checks in console for verification if needed
// runSelfChecks();

// Generate category-specific justification (using mode from metrics)
function generatePunchline(metrics) {
    const mode = metrics.mode || 'softlife';
    const rules = girlMathRules[mode]?.[metrics.category] || girlMathRules[mode]?.other || girlMathRules.softlife.other;
    const applicableRules = rules.map(rule => rule(metrics)).filter(p => p !== null);
    
    if (applicableRules.length === 0) {
        return rules[rules.length - 1] ? rules[rules.length - 1](metrics) : "The math is mathing ✨"; // Fallback
    }
    
    // Pick a random applicable punchline
    return applicableRules[Math.floor(Math.random() * applicableRules.length)];
}

// Generate alternate punchline (for alternate button)
async function generateAlternatePunchline(metrics) {
    // Try to fetch from API first, fallback to template
    try {
        const response = await fetch('/api/punchline', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                price: metrics.price,
                category: metrics.category,
                mode: 'softlife', // Default to softlife
                uses: metrics.uses,
                originalPrice: metrics.originalPrice,
                costPerUse: metrics.costPerUse,
                savings: metrics.savings
            })
        });
        
        if (response.ok) {
            const data = await response.json();
            if (data.punchlines && data.punchlines.length > 0) {
                return data.punchlines[Math.floor(Math.random() * data.punchlines.length)];
            }
        }
    } catch (error) {
        console.log('API not available, using template:', error);
    }
    
    // Fallback to template
    const rules = girlMathRules.softlife[metrics.category] || girlMathRules.softlife.other;
    const applicableRules = rules.map(rule => rule(metrics)).filter(p => p !== null);
    const allPunchlines = applicableRules.length > 0 ? applicableRules : rules.map(r => r(metrics));
    
    // Return a different random one (shuffle to ensure different)
    const shuffled = allPunchlines.sort(() => Math.random() - 0.5);
    return shuffled[0];
}


// Generate community insight with random comparison metrics
function generateCommunityInsight(metrics) {
    // Helper to get display names
    const categoryNames = {
        clothes: 'Clothing',
        skincare: 'skincare',
        travel: 'travel',
        food: 'food',
        subscription: 'subscription',
        gift: 'gift',
        jewellery: 'Jewellery',
        other: 'other'
    };
    
    const modeNames = {
        softlife: 'Soft Life',
        bestie: 'Bestie Roast',
        mba: 'Delulu MBA'
    };
    
    const categoryDisplay = categoryNames[metrics.category] || metrics.category;
    const modeDisplay = modeNames[metrics.mode] || metrics.mode;
    
    const templates = [
        `Your Girl Math score is higher than {randomNumber}% of other ${categoryDisplay} purchases.`,
        `You're more financially responsible than {randomNumber}% of users in '${modeDisplay}' mode.`,
        `Only {randomNumber}% of purchases over $${Math.round(metrics.price)} get a '${metrics.verdictInfo.stamp}' verdict or higher.`,
        `This purchase scored higher than {randomNumber}% of all Girl Math calculations today.`,
        `Only {randomNumber}% of users justify purchases this well in the ${categoryDisplay} category.`,
        `Your cost-per-use calculation beats {randomNumber}% of similar purchases.`,
        `This verdict is rarer than {randomNumber}% of all Girl Math results.`,
        `${Math.floor(Math.random() * 30) + 70}% of people would pay more for this item — you got a deal!`
    ];
    
    // Select a random template
    const selectedTemplate = templates[Math.floor(Math.random() * templates.length)];
    
    // Generate random number based on context
    let randomNumber;
    if (selectedTemplate.includes('higher than') || selectedTemplate.includes('beats')) {
        // For "higher than" comparisons, use 60-95 range (makes user feel good)
        randomNumber = Math.floor(Math.random() * 36) + 60;
    } else if (selectedTemplate.includes('Only')) {
        // For "Only X%" (rare/elite), use 5-30 range
        randomNumber = Math.floor(Math.random() * 26) + 5;
    } else if (selectedTemplate.includes('more responsible')) {
        // For responsibility comparisons, use 55-85 range
        randomNumber = Math.floor(Math.random() * 31) + 55;
    } else {
        // Default range: 40-80
        randomNumber = Math.floor(Math.random() * 41) + 40;
    }
    
    // Replace placeholder with random number
    return selectedTemplate.replace('{randomNumber}', randomNumber);
}

// Generate "What If?" scenarios based on current inputs
function generateWhatIfScenarios(data, currentMetrics) {
    const scenarios = [];
    const price = parseFloat(data.price) || 0;
    
    // Scenario 1: Increase uses (if uses are reasonable to increase)
    if (data.uses && parseInt(data.uses) > 0) {
        const currentUses = parseInt(data.uses);
        let newUses;
        if (currentUses < 10) {
            newUses = currentUses * 3; // Triple small numbers
        } else if (currentUses < 50) {
            newUses = Math.round(currentUses * 2.5); // 2.5x for medium
        } else {
            newUses = Math.round(currentUses * 2); // Double for large numbers
        }
        
        const scenarioData = { ...data, uses: newUses.toString() };
        const scenarioMetrics = calculateMetrics(scenarioData);
        
        scenarios.push({
            description: `What if you use it ${newUses} times?`,
            newScore: scenarioMetrics.score,
            newVerdict: scenarioMetrics.verdictInfo.stamp,
            updates: { uses: newUses.toString() }
        });
    } else if (data.category) {
        // If no uses provided, suggest adding uses
        const suggestedUses = categoryDefaultUses[data.category] || 30;
        const scenarioData = { ...data, uses: (suggestedUses * 2).toString() };
        const scenarioMetrics = calculateMetrics(scenarioData);
        
        scenarios.push({
            description: `What if you use it ${suggestedUses * 2} times?`,
            newScore: scenarioMetrics.score,
            newVerdict: scenarioMetrics.verdictInfo.stamp,
            updates: { uses: (suggestedUses * 2).toString() }
        });
    }
    
    // Scenario 2: Add original price (on sale) - if not already set
    if (price > 30 && (!data.originalPrice || parseFloat(data.originalPrice) <= price)) {
        const originalPrice = Math.round(price * 1.5); // 33% off sale
        
        const scenarioData = { ...data, originalPrice: originalPrice.toString() };
        const scenarioMetrics = calculateMetrics(scenarioData);
        
        scenarios.push({
            description: `What if it was on sale from $${originalPrice}?`,
            newScore: scenarioMetrics.score,
            newVerdict: scenarioMetrics.verdictInfo.stamp,
            updates: { originalPrice: originalPrice.toString() }
        });
    }
    
    // If we don't have 2-3 scenarios, add a price reduction scenario
    if (scenarios.length < 2 && price > 50) {
        const reducedPrice = Math.round(price * 0.7); // 30% cheaper
        
        const scenarioData = { ...data, price: reducedPrice.toString() };
        const scenarioMetrics = calculateMetrics(scenarioData);
        
        scenarios.push({
            description: `What if it cost $${reducedPrice} instead?`,
            newScore: scenarioMetrics.score,
            newVerdict: scenarioMetrics.verdictInfo.stamp,
            updates: { price: reducedPrice.toString() }
        });
    }
    
    // Return top 3 scenarios
    return scenarios.slice(0, 3);
}

// Apply a "What If?" scenario to the form
function applyWhatIfScenario(updates) {
    const form = document.getElementById('girlMathForm');
    if (!form) {
        // If on verdict page, redirect to index with updated data in URL params
        const currentData = window.currentData || getCurrentData();
        const updatedData = { ...currentData, ...updates };
        
        // Store in sessionStorage as backup
        sessionStorage.setItem('girlMathData', JSON.stringify(updatedData));
        
        // Build URL with params for better UX
        const params = new URLSearchParams();
        if (updatedData.price) params.append('price', updatedData.price);
        if (updatedData.category) params.append('category', updatedData.category);
        if (updatedData.uses) params.append('uses', updatedData.uses);
        if (updatedData.originalPrice) params.append('originalPrice', updatedData.originalPrice);
        
        window.location.href = `index.html?${params.toString()}`;
        return;
    }
    
    // Update form fields
    Object.keys(updates).forEach(key => {
        const field = form.querySelector(`[name="${key}"]`);
        if (field) {
            if (field.type === 'radio') {
                const radio = form.querySelector(`[name="${key}"][value="${updates[key]}"]`);
                if (radio) radio.checked = true;
            } else {
                field.value = updates[key];
            }
        }
    });
    
    // Trigger recalculation
    updateVerdictLive();
    
    // Scroll to calculator screen
    setTimeout(() => {
        const screen = document.getElementById('calculatorScreen');
        if (screen) {
            screen.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
    }, 100);
}



// Generate simplified inline results - update calculator screen
function generateResults(data) {
    // Default mode to 'softlife' if not provided
    if (!data.mode) {
        data.mode = 'softlife';
    }
    
    const metrics = calculateMetrics(data);
    const screen = document.getElementById('calculatorScreen');
    
    if (!screen) return;
    
    // Set mode on metrics for punchline generation
    metrics.mode = data.mode;
    
    // Get category-based objective justification that aligns with verdict
    const justification = getCategoryJustification(metrics.category, metrics.verdict);
    
    // Update calculator screen elements
    const verdictEl = document.getElementById('screenVerdict');
    const scoreEl = document.getElementById('screenScore');
    const costPerUseEl = document.getElementById('screenCostPerUse');
    const savingsEl = document.getElementById('screenSavings');
    const justificationEl = document.getElementById('screenJustification');
    
    if (verdictEl) {
        verdictEl.textContent = metrics.stamp || '—';
    }
    
    if (scoreEl) {
        scoreEl.textContent = metrics.score !== undefined && metrics.score !== null ? `${metrics.score}/100` : '—';
    }
    
    if (costPerUseEl) {
        // Show cost per use if available, otherwise show —
        if (metrics.costPerUse !== null && metrics.costPerUse !== undefined) {
            costPerUseEl.textContent = `$${metrics.costPerUse.toFixed(2)}`;
        } else {
            costPerUseEl.textContent = '—';
        }
    }
    
    if (savingsEl) {
        if (metrics.savings > 0) {
            savingsEl.textContent = `$${metrics.savings.toFixed(2)} (${metrics.discountPercent.toFixed(0)}% off)`;
            savingsEl.parentElement.style.display = 'flex';
        } else {
            savingsEl.textContent = '—';
            savingsEl.parentElement.style.display = 'none';
        }
    }
    
    // Update budget percentage display
    const budgetPercentEl = document.getElementById('screenBudgetPercent');
    if (budgetPercentEl) {
        if (metrics.budgetPercentOfVibe !== null && metrics.budgetPercentOfVibe !== undefined) {
            budgetPercentEl.textContent = `${metrics.budgetPercentOfVibe.toFixed(1)}%`;
        } else {
            budgetPercentEl.textContent = '—';
        }
    }
    
    if (justificationEl) {
        justificationEl.textContent = justification || '';
    }
    
    // Show screen with fade-in animation
    requestAnimationFrame(() => {
        screen.classList.add('visible');
    });
    
    // Store metrics for sharing
    window.currentMetrics = metrics;
    window.currentData = data;
}

// Generate verdict card for verdict.html page (without breakdown table)
function generateVerdict(data) {
    const metrics = calculateMetrics(data);
    
    // Generate context pills
    const pillsEl = document.getElementById('contextPills');
    if (pillsEl && data.category) {
        const categoryNamesForPills = {
            clothes: 'Clothing 👗',
            skincare: 'Skincare 💆',
            travel: 'Travel ✈️',
            food: 'Food 🍕',
            subscription: 'Subscription 📱',
            gift: 'Gift 🎁',
            jewellery: 'Jewellery 💍',
            other: 'Other 💫'
        };
        pillsEl.innerHTML = `<span class="context-pill">${categoryNamesForPills[data.category] || data.category}</span>`;
    }
    
    // Update stamp
    const stampEl = document.getElementById('stamp');
    if (stampEl) {
        stampEl.textContent = metrics.stamp;
        stampEl.className = `stamp ${metrics.verdict}`;
    }
    
    // Generate score display
    const confidenceEl = document.getElementById('confidenceMeter');
    if (confidenceEl && metrics.score !== undefined) {
        confidenceEl.innerHTML = `
            <div class="confidence-label">Girl Math Score</div>
            <div class="confidence-value">${metrics.score}/100</div>
            <div class="confidence-bar-container">
                <div class="confidence-bar" style="width: ${metrics.score}%"></div>
            </div>
            <div class="verdict-message">${metrics.verdictInfo.message}</div>
        `;
    }
    
    // Generate community insights section
    const insightsEl = document.getElementById('communityInsights');
    if (insightsEl) {
        const insight = generateCommunityInsight(metrics);
        insightsEl.innerHTML = `
            <h3>Community Insights</h3>
            <div class="insight-text">${insight}</div>
        `;
    }
    
    // Generate key metrics display
    const metricsEl = document.getElementById('metrics');
    if (metricsEl) {
        let metricsHTML = '';
        
        // Show cost per use if available, otherwise show N/A
        if (metrics.costPerUse !== null && metrics.costPerUse !== undefined) {
            metricsHTML += `<div class="metric-line">
                <span class="metric-label">Cost per use:</span>
                <span class="metric-value">$${metrics.costPerUse.toFixed(2)}</span>
            </div>`;
        } else {
            metricsHTML += `<div class="metric-line">
                <span class="metric-label">Cost per use:</span>
                <span class="metric-value">N/A</span>
            </div>`;
        }
        
        if (metrics.savings > 0) {
            metricsHTML += `<div class="metric-line">
                <span class="metric-label">Savings:</span>
                <span class="metric-value">$${metrics.savings.toFixed(2)} (${metrics.discountPercent.toFixed(0)}% off)</span>
            </div>`;
        }
        
        // Show budget percentage (price as % of vibe budget) - only if baseline was provided
        if (metrics.budgetPercentOfVibe !== null && metrics.budgetPercentOfVibe !== undefined) {
            metricsHTML += `<div class="metric-line">
                <span class="metric-label">% of monthly budget:</span>
                <span class="metric-value">${metrics.budgetPercentOfVibe.toFixed(1)}%</span>
            </div>`;
        }
        
        metricsEl.innerHTML = metricsHTML || '<div class="metric-line">Enter purchase details to see metrics</div>';
    }
    
    // Generate category-based objective justification that aligns with verdict
    const punchlineEl = document.getElementById('punchline');
    if (punchlineEl) {
        const justification = getCategoryJustification(metrics.category, metrics.verdict);
        punchlineEl.textContent = justification;
    }
    
    // Generate "What If?" scenarios
    const whatIfEl = document.getElementById('whatIfSection');
    if (whatIfEl && data) {
        const scenarios = generateWhatIfScenarios(data, metrics);
        
        if (scenarios.length > 0) {
            window.whatIfScenarios = scenarios;
            
            const scenariosHTML = scenarios.map((scenario, index) => {
                const verdictClass = scenario.newScore >= 80 ? 'approved' :
                                    scenario.newScore >= 60 ? 'justified' :
                                    scenario.newScore >= 40 ? 'questionable' : 'denied';
                
                return `
                    <div class="what-if-scenario" data-scenario-index="${index}">
                        <div class="what-if-description">${scenario.description}</div>
                        <div class="what-if-result">
                            <span class="what-if-score">Your new score would be: ${scenario.newScore}/100</span>
                            <span class="what-if-verdict ${verdictClass}">${scenario.newVerdict}</span>
                        </div>
                    </div>
                `;
            }).join('');
            
            whatIfEl.innerHTML = `
                <h3>What If? 🤔</h3>
                <div class="what-if-scenarios">
                    ${scenariosHTML}
                </div>
            `;
            whatIfEl.style.display = 'block';
            
            // Attach click handlers
            const scenarioElements = whatIfEl.querySelectorAll('.what-if-scenario');
            scenarioElements.forEach((el, index) => {
                el.addEventListener('click', () => {
                    if (window.whatIfScenarios && window.whatIfScenarios[index] && window.whatIfScenarios[index].updates) {
                        applyWhatIfScenario(window.whatIfScenarios[index].updates);
                    }
                });
            });
        } else {
            whatIfEl.style.display = 'none';
        }
    }
    
    // Store metrics for sharing
    window.currentMetrics = metrics;
    window.currentData = data;
}

// Calculate and update results dynamically (real-time)
function updateVerdictLive() {
    const form = document.getElementById('girlMathForm');
    if (!form) {
        // If on verdict page, use existing logic for that page
        return;
    }
    
    const formData = new FormData(form);
    const data = Object.fromEntries(formData);
    const screen = document.getElementById('calculatorScreen');

    // Update price helper text based on category
    const priceHelper = document.getElementById('priceHelper');
    if (priceHelper) {
        if (data.category === 'subscription') {
            priceHelper.textContent = 'Enter the monthly price.';
        } else {
            priceHelper.textContent = '';
        }
    }

    // Update vibe label display
    const vibeLabel = document.getElementById('vibeLabel');
    const skipVibeCheckbox = document.getElementById('skipVibe');
    const budgetSlider = document.getElementById('budgetPercent');
    
    if (vibeLabel) {
        if (data.skipVibe || !data.budgetPercent) {
            vibeLabel.textContent = 'Not selected';
            if (budgetSlider) budgetSlider.disabled = true;
        } else {
            const percent = parseInt(data.budgetPercent);
            const label = vibeLabels[percent] || 'Balanced';
            vibeLabel.textContent = `${label} (${percent}%)`;
            if (budgetSlider) budgetSlider.disabled = false;
        }
    }
    
    // Only calculate if we have minimum required fields (price is the key requirement)
    if (!data.price || parseFloat(data.price) <= 0 || isNaN(parseFloat(data.price))) {
        // Reset screen to default values if no valid price
        if (screen) {
            screen.classList.remove('visible');
            const verdictEl = document.getElementById('screenVerdict');
            const scoreEl = document.getElementById('screenScore');
            const costPerUseEl = document.getElementById('screenCostPerUse');
            const savingsEl = document.getElementById('screenSavings');
            const justificationEl = document.getElementById('screenJustification');
            
            if (verdictEl) verdictEl.textContent = '—';
            if (scoreEl) scoreEl.textContent = '—';
            if (costPerUseEl) costPerUseEl.textContent = '—';
            if (savingsEl) {
                savingsEl.textContent = '—';
                savingsEl.parentElement.style.display = 'none';
            }
            if (justificationEl) justificationEl.textContent = '';
        }
        return;
    }
    
    try {
        // Validate required fields
        const price = parseFloat(data.price);
        if (isNaN(price) || price <= 0) {
            if (screen) {
                screen.classList.remove('visible');
                const verdictEl = document.getElementById('screenVerdict');
                const scoreEl = document.getElementById('screenScore');
                const costPerUseEl = document.getElementById('screenCostPerUse');
                const savingsEl = document.getElementById('screenSavings');
                const justificationEl = document.getElementById('screenJustification');
                
                if (verdictEl) verdictEl.textContent = '—';
                if (scoreEl) scoreEl.textContent = '—';
                if (costPerUseEl) costPerUseEl.textContent = '—';
                if (savingsEl) savingsEl.textContent = '—';
                if (justificationEl) justificationEl.textContent = '';
            }
            return;
        }
        
        // Category is required for proper calculation, but if not provided, default to 'other'
        if (!data.category || data.category.trim() === '') {
            data.category = 'other';
        }
        
        // Default mode to 'softlife' if not provided
        if (!data.mode) {
            data.mode = 'softlife';
        }
        
        // Generate simplified results inline
        generateResults(data);
    } catch (error) {
        console.error('Error updating results:', error);
        if (screen) {
            screen.classList.remove('visible');
        }
    }
}


// Handle real-time updates (no form submission needed)
document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('girlMathForm');
    
    if (form) {
        // Add real-time update listeners to all form inputs
        const inputs = form.querySelectorAll('input, select');
        inputs.forEach(input => {
            // Use 'input' event for text/number fields (fires on every keystroke)
            // Use 'change' event for selects (fires on selection)
            const eventType = input.tagName === 'SELECT' ? 'change' : 'input';
            
            input.addEventListener(eventType, () => {
                debounceUpdateVerdict();
            });
            
            // Also listen to 'change' for number inputs to catch when user finishes
            if (input.type === 'number') {
                input.addEventListener('change', () => {
                    debounceUpdateVerdict();
                });
            }
        });
        
        // Debounce function for real-time updates
        let updateTimeout;
        function debounceUpdateVerdict() {
            clearTimeout(updateTimeout);
            updateTimeout = setTimeout(() => {
                updateVerdictLive();
            }, 300); // Wait 300ms after user stops typing for smoother UX
        }
        
        // Remove form submission (no longer needed)
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            // Form submission disabled - everything updates in real-time
        });
        
        // Check for URL parameters (from shared links) and pre-fill form
        const urlParams = new URLSearchParams(window.location.search);
        let sharedData = {};
        
        // Support both formats: individual parameters (new) or data parameter (old)
        if (urlParams.has('price') || urlParams.has('data')) {
            // New format: individual parameters
            if (urlParams.has('price')) {
                sharedData.price = urlParams.get('price');
                sharedData.category = urlParams.get('category') || '';
                sharedData.uses = urlParams.get('uses') || '';
                sharedData.originalPrice = urlParams.get('originalPrice') || urlParams.get('listPrice') || '';
                sharedData.income = urlParams.get('income') || '';
                sharedData.budgetPercent = urlParams.get('budgetPercent') || '';
            } 
            // Old format: data parameter (JSON)
            else if (urlParams.has('data')) {
                try {
                    sharedData = JSON.parse(decodeURIComponent(urlParams.get('data')));
                    if (sharedData.listPrice && !sharedData.originalPrice) {
                        sharedData.originalPrice = sharedData.listPrice;
                    }
                } catch (e) {
                    console.error('Error parsing URL data:', e);
                }
            }
            
            // Pre-fill form with shared data
            if (sharedData.price) {
                const priceInput = form.querySelector('#price');
                if (priceInput) priceInput.value = sharedData.price;
            }
            if (sharedData.category) {
                const categorySelect = form.querySelector('#category');
                if (categorySelect) categorySelect.value = sharedData.category;
            }
            if (sharedData.uses) {
                const usesInput = form.querySelector('#uses');
                if (usesInput) usesInput.value = sharedData.uses;
            }
            if (sharedData.originalPrice) {
                const originalPriceInput = form.querySelector('#originalPrice');
                if (originalPriceInput) originalPriceInput.value = sharedData.originalPrice;
            }
            // Handle income - can be empty (no selection)
            const incomeSelect = form.querySelector('#income');
            if (incomeSelect) {
                if (sharedData.income) {
                    incomeSelect.value = sharedData.income;
                } else {
                    incomeSelect.value = ''; // No selection
                }
            }
            if (sharedData.budgetPercent) {
                const budgetSlider = form.querySelector('#budgetPercent');
                if (budgetSlider) budgetSlider.value = sharedData.budgetPercent;
            }
        }
        
        // Set up vibe skip checkbox and slider event listeners
        const skipVibeCheckbox = form.querySelector('#skipVibe');
        const budgetSlider = form.querySelector('#budgetPercent');
        const vibeLabel = document.getElementById('vibeLabel');
        
        if (skipVibeCheckbox && budgetSlider && vibeLabel) {
            // Handle skip checkbox change
            skipVibeCheckbox.addEventListener('change', function() {
                if (this.checked) {
                    budgetSlider.disabled = true;
                    vibeLabel.textContent = 'Not selected';
                } else {
                    budgetSlider.disabled = false;
                    const percent = parseInt(budgetSlider.value);
                    const label = vibeLabels[percent] || 'Balanced';
                    vibeLabel.textContent = `${label} (${percent}%)`;
                }
                debounceUpdateVerdict();
            });
            
            // Handle slider change (only if not skipped)
            budgetSlider.addEventListener('input', function() {
                if (!skipVibeCheckbox.checked) {
                    const percent = parseInt(this.value);
                    const label = vibeLabels[percent] || 'Balanced';
                    vibeLabel.textContent = `${label} (${percent}%)`;
                    debounceUpdateVerdict();
                }
            });
        }
        
        // Set up baseline accordion toggle
        const baselineHeader = document.getElementById('baselineHeader');
        const baselineContent = document.getElementById('baselineContent');
        
        if (baselineHeader && baselineContent) {
            baselineHeader.addEventListener('click', function() {
                const isExpanded = this.getAttribute('aria-expanded') === 'true';
                this.setAttribute('aria-expanded', !isExpanded);
                
                if (isExpanded) {
                    baselineContent.style.display = 'none';
                } else {
                    baselineContent.style.display = 'block';
                }
            });
        }
        
        // Initial calculation if form has pre-filled values
        setTimeout(() => {
            updateVerdictLive();
        }, 200);
    }
});

// Helper function to get current data (from form or stored)
function getCurrentData() {
    let data = window.currentData;
    
    if (!data) {
        // Try to get from form if on index page
        const form = document.getElementById('girlMathForm');
        if (form) {
            const formData = new FormData(form);
            data = Object.fromEntries(formData);
        } else {
            // Fallback to sessionStorage
            data = JSON.parse(sessionStorage.getItem('girlMathData') || '{}');
        }
    }
    
    return data;
}

// Helper function to generate shareable URL
function generateShareableUrl(data) {
    if (!data) {
        data = getCurrentData();
    }
    
    if (!data || !data.price) {
        return null;
    }
    
    // Create URL with individual parameters for easy sharing
    const params = new URLSearchParams();
    params.append('price', data.price);
    if (data.category) params.append('category', data.category);
    if (data.uses) params.append('uses', data.uses);
    if (data.originalPrice) params.append('originalPrice', data.originalPrice);
    if (data.income) params.append('income', data.income);
    if (data.budgetPercent) params.append('budgetPercent', data.budgetPercent);
    
    // Generate URL - always point to index.html
    const currentPath = window.location.pathname;
    let basePath = '/index.html';
    
    // If we're in a subdirectory, preserve it
    if (currentPath.includes('/') && currentPath !== '/') {
        const pathParts = currentPath.split('/');
        pathParts[pathParts.length - 1] = 'index.html';
        basePath = pathParts.join('/');
    }
    
    const baseUrl = window.location.origin + basePath;
    return `${baseUrl}?${params.toString()}`;
}

// Helper function to generate share caption
function generateShareCaption() {
    const metrics = window.currentMetrics;
    const data = window.currentData || getCurrentData();
    
    if (!data || !data.price) {
        return null;
    }
    
    const verdictEl = document.getElementById('screenVerdict');
    const stamp = verdictEl?.textContent || metrics?.stamp || '';
    const shareUrl = generateShareableUrl(data);
    
    // Category name mapping (human-readable)
    const categoryNameMap = {
        clothes: 'Clothing',
        skincare: 'skincare',
        travel: 'travel',
        food: 'food',
        subscription: 'subscription',
        gift: 'gift',
        jewellery: 'Jewellery',
        other: 'purchase'
    };
    
    const categoryName = categoryNameMap[data.category] || 'purchase';
    const price = parseFloat(data.price).toFixed(2);
    
    // Format: "Justified my ${price} ${categoryName} purchase! The Girl Math verdict is: {verdict} ✨ Calculate your own at [your-url.com] #girlmath"
    let caption = `Justified my $${price} ${categoryName} purchase! The Girl Math verdict is: ${stamp} ✨`;
    
    if (shareUrl) {
        caption += ` Calculate your own at ${shareUrl}`;
    }
    
    caption += ' #girlmath';
    
    return caption;
}

// Copy caption function - matches required format
function copyCaption() {
    const caption = generateShareCaption();
    
    if (!caption) {
        alert('Please fill in the required fields first!');
        return;
    }
    
    navigator.clipboard.writeText(caption).then(() => {
        alert('Caption copied! Paste it on your story ✨');
    }).catch(() => {
        // Fallback for older browsers
        const textarea = document.createElement('textarea');
        textarea.value = caption;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        alert('Caption copied! Paste it on your story ✨');
    });
}

// Send to group chat - uses Web Share API with fallback
// Handle share - generates image and uses Web Share API
async function handleShare() {
    // Get current metrics and data
    let metrics = window.currentMetrics;
    let data = window.currentData;
    
    // If not available, try to get from form or sessionStorage
    if (!metrics || !data) {
        const form = document.getElementById('girlMathForm');
        if (form) {
            const formData = new FormData(form);
            data = Object.fromEntries(formData);
        } else {
            data = JSON.parse(sessionStorage.getItem('girlMathData') || '{}');
        }
        
        if (data && data.price) {
            if (!data.category) data.category = 'other';
            metrics = calculateMetrics(data);
        } else {
            alert('Please fill in the required fields first!');
            return;
        }
    }
    
    const shareableCard = document.getElementById('shareableCard');
    if (!shareableCard) {
        alert('Error: ShareableCard element not found');
        return;
    }
    
    // Check if html-to-image library is available
    if (typeof htmlToImage === 'undefined') {
        alert('Image library is loading. Please try again in a moment.');
        return;
    }
    
    try {
        // Populate ShareableCard with data
        if (!populateShareableCard(metrics, data)) {
            alert('Error populating shareable card');
            return;
        }
        
        // Temporarily show the ShareableCard (but keep it off-screen)
        shareableCard.style.position = 'fixed';
        shareableCard.style.top = '-9999px';
        shareableCard.style.left = '-9999px';
        shareableCard.style.display = 'block';
        shareableCard.style.zIndex = '10000';
        shareableCard.style.width = '1080px';
        shareableCard.style.height = '1920px';
        
        // Wait a moment for rendering
        await new Promise(resolve => setTimeout(resolve, 200));
        
        // Generate image using html-to-image
        const dataUrl = await htmlToImage.toPng(shareableCard, {
            width: 1080,
            height: 1920,
            pixelRatio: 2, // Higher quality for social media
            quality: 1.0,
            cacheBust: true // Ensure fresh rendering
        });
        
        // Hide ShareableCard again
        shareableCard.style.display = 'none';
        
        // Convert data URL to blob
        const response = await fetch(dataUrl);
        const blob = await response.blob();
        const file = new File([blob], `girl-math-verdict-${Date.now()}.png`, { type: 'image/png' });
        
        // Try Web Share API with image file
        if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
            try {
                await navigator.share({
                    title: 'Girl Math Verdict ✨',
                    text: `My Girl Math verdict: ${metrics.stamp || 'APPROVED ✨'}`,
                    files: [file]
                });
                return; // Successfully shared
            } catch (shareError) {
                // User cancelled or error
                if (shareError.name === 'AbortError') {
                    return; // User cancelled
                }
            }
        }
        
        // Fallback: copy link to clipboard if share fails or not supported
        const shareUrl = generateShareableUrl(data);
        if (shareUrl) {
            copyUrlToClipboard(shareUrl);
        }
        
    } catch (error) {
        console.error('Error generating image:', error);
        alert('Error generating image. Please try again or take a screenshot.');
        // Make sure to hide ShareableCard on error
        const shareableCard = document.getElementById('shareableCard');
        if (shareableCard) {
            shareableCard.style.display = 'none';
        }
    }
}

// Legacy function for backward compatibility
function copyLink() {
    handleShare();
}

// Helper function to copy URL to clipboard
function copyUrlToClipboard(url) {
    navigator.clipboard.writeText(url).then(() => {
        alert('Link copied! Share the girl math ✨');
    }).catch(() => {
        // Fallback for older browsers
        const textarea = document.createElement('textarea');
        textarea.value = url;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        alert('Link copied! Share the girl math ✨');
    });
}

// Populate ShareableCard with verdict data
function populateShareableCard(metrics, data) {
    const shareableCard = document.getElementById('shareableCard');
    const shareableStamp = document.getElementById('shareableStamp');
    const shareableScore = document.getElementById('shareableScore');
    const shareablePrice = document.getElementById('shareablePrice');
    const shareableCostPerUse = document.getElementById('shareableCostPerUse');
    const shareablePunchline = document.getElementById('shareablePunchline');
    const shareableCategory = document.getElementById('shareableCategory');
    
    // Check for required elements
    if (!shareableCard || !shareableStamp || !shareablePunchline) {
        console.error('ShareableCard required elements not found');
        return false;
    }
    
    // Apply verdict-based background class
    if (metrics && metrics.verdict) {
        shareableCard.className = `shareable-card ${metrics.verdict}`;
    } else {
        shareableCard.className = 'shareable-card approved';
    }
    
    // Set category
    if (shareableCategory) {
        const categoryNameMap = {
            clothes: 'CLOTHING',
            skincare: 'SKINCARE',
            travel: 'TRAVEL',
            food: 'FOOD',
            subscription: 'SUBSCRIPTION',
            gift: 'GIFT',
            jewellery: 'JEWELLERY',
            other: 'PURCHASE'
        };
        shareableCategory.textContent = categoryNameMap[metrics.category] || 'PURCHASE';
    }

    // Get justification
    let punchline = '';
    const justificationEl = document.getElementById('screenJustification');
    if (justificationEl && justificationEl.textContent.trim()) {
        punchline = justificationEl.textContent.trim();
    } else {
        const punchlineEl = document.getElementById('punchline');
        if (punchlineEl && punchlineEl.textContent.trim()) {
            punchline = punchlineEl.textContent.trim();
        } else if (metrics) {
            punchline = getCategoryJustification(metrics.category, metrics.verdict);
        }
    }
    
    // Populate stamp
    if (metrics && metrics.verdictInfo) {
        shareableStamp.textContent = metrics.verdictInfo.stamp;
        shareableStamp.className = `shareable-stamp ${metrics.verdict}`;
    }
    
    // Populate score
    if (shareableScore && metrics && metrics.score !== undefined) {
        shareableScore.textContent = `${metrics.score}/100`;
    }
    
    // Populate price
    if (shareablePrice && metrics && metrics.price !== undefined) {
        shareablePrice.textContent = `$${metrics.price.toFixed(2)}`;
    }
    
    // Populate cost per use
    if (shareableCostPerUse) {
        if (metrics && metrics.costPerUse !== null && metrics.costPerUse !== undefined) {
            shareableCostPerUse.textContent = `$${metrics.costPerUse.toFixed(2)}`;
        } else {
            shareableCostPerUse.textContent = '—';
        }
    }
    
    // Populate punchline
    shareablePunchline.textContent = punchline || 'The math is mathing ✨';
    
    return true;
}

// Generate alternate verdict
async function generateAlternate() {
    // Get current form data if on index page, or stored data if on verdict page
    let data = window.currentData;
    
    if (!data) {
        // Try to get from form if on index page
        const form = document.getElementById('girlMathForm');
        if (form) {
            const formData = new FormData(form);
            data = Object.fromEntries(formData);
        } else {
            // Fallback to sessionStorage
            data = JSON.parse(sessionStorage.getItem('girlMathData') || '{}');
        }
    }
    
    if (!data || !data.price) {
        alert('Please fill in the required fields first!');
        return;
    }
    
    if (!data.category) data.category = 'other';
    const metrics = window.currentMetrics || calculateMetrics(data);
    
    // Since we now use category-based objective justifications, 
    // the alternate will be the same as the original (no variation per category)
    const justificationEl = document.getElementById('screenJustification');
    const punchlineEl = document.getElementById('punchline');
    
    const justification = getCategoryJustification(metrics.category, metrics.verdict);
    
    if (justificationEl) {
        justificationEl.textContent = justification;
        justificationEl.style.animation = 'none';
        setTimeout(() => {
            justificationEl.style.animation = 'fadeIn 0.5s ease';
        }, 10);
    }
    
    if (punchlineEl) {
        punchlineEl.textContent = justification;
        punchlineEl.style.animation = 'none';
        setTimeout(() => {
            punchlineEl.style.animation = 'fadeIn 0.5s ease';
        }, 10);
    }
}