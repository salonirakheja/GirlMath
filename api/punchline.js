// Vercel Serverless Function for AI-enhanced punchlines
// Falls back to template-based generation if AI_API_KEY is not set

export default async function handler(req, res) {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Handle OPTIONS request for CORS preflight
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    // Only allow POST requests
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { price, category, mode, uses, originalPrice, costPerUse, savings } = req.body;

    // Calculate full metrics including verdict
    const data = {
        price: parseFloat(price) || 0,
        category: category || 'other',
        mode: mode || 'softlife',
        uses: parseInt(uses) || 1,
        originalPrice: parseFloat(originalPrice) || 0,
        costPerUse: parseFloat(costPerUse) || 0,
        savings: parseFloat(savings) || 0
    };
    
    // Calculate costPerDay for skincare
    if (data.category === 'skincare') {
        data.costPerDay = data.price / 30;
    }
    
    // Calculate verdict using same logic as client
    const metrics = calculateVerdict(data);

    // Template-based punchline generator (fallback)
    const templatePunchlines = generateTemplatePunchlines(metrics);

    // If AI_API_KEY is set, try to use AI (optional enhancement)
    const aiApiKey = process.env.AI_API_KEY || process.env.OPENAI_API_KEY;
    
    if (aiApiKey) {
        try {
            const aiPunchlines = await generateAIPunchlines(req.body, aiApiKey);
            if (aiPunchlines && aiPunchlines.length > 0) {
                // Mix AI and template punchlines for variety
                const allPunchlines = [...aiPunchlines, ...templatePunchlines];
                return res.status(200).json({ 
                    punchlines: shuffleArray(allPunchlines).slice(0, 3),
                    source: 'ai-enhanced'
                });
            }
        } catch (error) {
            console.error('AI generation error:', error);
            // Fall through to template punchlines
        }
    }

    // Return template punchlines (default behavior)
    return res.status(200).json({ 
        punchlines: shuffleArray(templatePunchlines).slice(0, 3),
        source: 'template'
    });
}

// Calculate verdict using same logic as client-side
function calculateVerdict(data) {
    const metrics = { ...data };
    
    // Determine verdict
    let score = 0;
    
    // Universal scoring
    if (metrics.costPerUse < 3) score += 2;
    if (metrics.savings > 0) score += 2;
    if (metrics.price < 50) score += 1;
    if (metrics.uses > 30) score += 2;
    if (metrics.originalPrice > 0 && metrics.price < metrics.originalPrice * 0.8) score += 1;
    
    // Category-specific scoring
    if (metrics.category === 'skincare' && metrics.costPerDay && metrics.costPerDay < 2) {
        score += 2; // Skincare with low daily cost is a good investment
    }
    if (metrics.category === 'clothes' && metrics.costPerUse < 5) {
        score += 1; // Clothes with decent cost-per-wear get bonus
    }
    if (metrics.category === 'travel' && metrics.price > 500) {
        score += 1; // Travel experiences are valuable
    }
    if (metrics.category === 'food' && metrics.price < 30) {
        score += 1; // Reasonable food prices are fine
    }
    if (metrics.category === 'subscription' && metrics.price < 20) {
        score += 1; // Affordable subscriptions are reasonable
    }
    if (metrics.category === 'gift') {
        score += 1; // Gifts always get a point (they're for others!)
    }

    if (score >= 5) {
        metrics.verdict = 'approved';
    } else if (score >= 3) {
        metrics.verdict = 'questionable';
    } else {
        metrics.verdict = 'denied';
    }
    
    return metrics;
}

// Generate template-based punchlines (same logic as client-side but returns multiple)
// Now verdict-aware
function generateTemplatePunchlines(metrics) {
    const rules = {
        softlife: {
            clothes: [
                (d) => d.uses > 30 ? "This is basically a necessity for your wardrobe ✨" : null,
                (d) => d.costPerUse < 3 ? `At $${d.costPerUse.toFixed(2)} per wear, you're being financially responsible.` : null,
                (d) => d.savings > 0 ? `You saved $${d.savings.toFixed(2)} - that's money you earned!` : null,
                (d) => d.price < 50 ? "You deserve nice things, and this was practically free." : "Quality pieces are an investment in yourself."
            ],
            skincare: [
                (d) => d.costPerDay < 2 ? `$${d.costPerDay.toFixed(2)} per day for glowing skin? That's a health investment.` : null,
                (d) => d.savings > 0 ? "Self-care isn't a luxury, it's a necessity. And you got it on sale! ✨" : "You can't put a price on good skin."
            ],
            travel: [
                (d) => `Memories are priceless. This trip is an investment in your happiness.`,
                (d) => d.price > 500 ? "Experiences > things. You're building your story." : "A change of scenery is essential for mental health."
            ],
            food: [
                (d) => "Nourishing your body is always worth it. You deserve good food. 💅",
                (d) => "Food is fuel and joy. This purchase supports both."
            ],
            subscription: [
                (d) => "Investing in yourself and your growth is never a waste.",
                (d) => "This subscription pays for itself in productivity gains."
            ],
            gift: [
                (d) => "Giving joy to others brings joy to you. That's pure ROI.",
                (d) => "Thoughtful gifts strengthen relationships - priceless."
            ],
            other: [
                (d) => "You work hard. You deserve to treat yourself.",
                (d) => "Life's too short to not buy things that make you happy."
            ]
        },
        bestie: {
            clothes: [
                (d) => d.uses > 30 ? "Okay fine, you'll actually wear this one... maybe." : "30 wears? More like 3 times before it disappears into your closet void.",
                (d) => d.costPerUse < 3 ? `$${d.costPerUse.toFixed(2)} per wear? I mean, it's better than your last purchase.` : `You paid HOW much for this?`,
                (d) => d.price > 100 ? "You said you were 'saving money' last week. So... what happened? 😂" : "At least it's under $100 this time."
            ],
            skincare: [
                (d) => d.price > 50 ? "Another serum? Your bathroom shelf called - it's tired." : "At least your skin will thank you (unlike your bank account).",
                (d) => d.costPerDay < 2 ? "If you actually use this every day, I'll eat my hat. But fine, approved." : "Skincare addiction is real and you're living proof."
            ],
            travel: [
                (d) => "Another vacation? Your credit card is crying but your Instagram is thriving.",
                (d) => d.price > 1000 ? "You could've bought a car. But photos > logic, I guess? ✈️" : "At least this one's relatively reasonable (for you)."
            ],
            food: [
                (d) => "You ordered delivery again? Remember when you said you'd 'cook more'? Yeah, me neither.",
                (d) => d.price > 30 ? "$30 for lunch? You're living your best life and your wallet's worst nightmare." : "Fine, food is a need. Approved with side-eye."
            ],
            subscription: [
                (d) => "Another subscription? You have like 12. How many streaming services does one person need?",
                (d) => "You'll use this for a week and forget it exists. But hey, at least you tried."
            ],
            gift: [
                (d) => "Buying gifts for others when you 'can't afford' groceries? Classic you. But sweet, so approved.",
                (d) => "You're too generous for your own good. But that's why I love you. 💕"
            ],
            other: [
                (d) => "Girl... what even is this? But I support your chaos.",
                (d) => d.price > 50 ? "You said 'one more purchase and I'm done' three purchases ago. But go off." : "At least it's not another fast fashion haul."
            ]
        },
        mba: {
            clothes: [
                (d) => `Cost-per-wear analysis: $${d.costPerUse.toFixed(2)}/wear. ROI positive if worn >${Math.ceil(d.price / 5)} times.`,
                (d) => `Depreciation schedule: 100% value retention if garment becomes 'vintage' in 10 years. Calculated risk: LOW.`,
                (d) => `Break-even analysis: $${d.price} / $${(d.uses * 5).toFixed(2)} projected outfit value = ${(d.price / (d.uses * 5) * 100).toFixed(0)}% margin. ACCEPTABLE.`
            ],
            skincare: [
                (d) => `Annualized cost: $${((d.costPerDay || d.price / 30) * 365).toFixed(2)}/year. Compared to dermatologist visits ($500/session), NPV is positive.`,
                (d) => `Compound value: $${d.price} investment in skin health = potential savings on future corrective procedures ($5000+). Strong IRR.`
            ],
            travel: [
                (d) => `Content ROI: $${d.price} / estimated photo output (50 units) = $${(d.price / 50).toFixed(2)} per engagement-driving asset.`,
                (d) => `Experience arbitrage: Travel premium ($${d.price}) vs. local alternatives = justified by network expansion + mental health ROI.`
            ],
            food: [
                (d) => `Nutritional ROI: $${d.price} / caloric efficiency = cost-per-calorie optimization achieved.`,
                (d) => `Opportunity cost: Restaurant ($${d.price}) vs. home-cooked ($${(d.price * 0.3).toFixed(2)}) = convenience premium justified by time-value analysis.`
            ],
            subscription: [
                (d) => `Monthly recurring revenue (MRR) analysis: $${(d.price / 12).toFixed(2)}/month < productivity gain value. Positive cash flow.`,
                (d) => `SaaS valuation model: Lifetime value (LTV) = $${(d.price * 3).toFixed(2)} if retained 3 years. Churn risk: LOW if ROI visible.`
            ],
            gift: [
                (d) => `Relationship capital ROI: $${d.price} investment in social currency = immeasurable but positive NPV.`,
                (d) => `Gift economy analysis: $${d.price} / recipient happiness quotient = strong emotional dividend yield.`
            ],
            other: [
                (d) => `Tangible asset acquisition: $${d.price} = ${(d.price / 100).toFixed(1)}x multiple on baseline utility.`,
                (d) => `CAPEX justification: $${d.price} one-time vs. recurring costs = amortized value acceptable if usage > 20 instances.`
            ]
        }
    };

    const categoryRules = rules[metrics.mode]?.[metrics.category] || rules[metrics.mode]?.other || rules.softlife.other;
    
    // Filter out nulls and process
    let punchlines = categoryRules
        .map(rule => {
            if (typeof rule === 'function') {
                const result = rule(metrics);
                return result;
            }
            return rule;
        })
        .filter(p => p !== null && p !== undefined && p !== '');
    
    // Filter based on verdict to avoid contradictions
    if (metrics.verdict === 'denied' && metrics.mode === 'softlife') {
        // For denied verdicts in softlife mode, filter out overly enthusiastic punchlines
        punchlines = punchlines.filter(p => {
            const lowerP = p.toLowerCase();
            // Filter out unconditional "investment" claims when verdict is denied
            if (lowerP.includes('investment') && !lowerP.includes('?') && !lowerP.includes('if')) {
                return false;
            }
            return true;
        });
        
        if (punchlines.length === 0) {
            punchlines = ["Okay, this might be a stretch, but you work hard and life's too short. 🤷‍♀️"];
        }
    } else if (metrics.verdict === 'denied' && metrics.mode === 'mba') {
        // For denied in MBA mode, prefer risk-acknowledging punchlines
        const riskAware = punchlines.filter(p => 
            p.includes('risk') || p.includes('LOW') || p.includes('negative') ||
            p.includes('margin') || p.includes('CAPEX') || p.includes('calculated')
        );
        if (riskAware.length > 0) {
            punchlines = riskAware;
        }
    }
    
    return punchlines.length > 0 ? punchlines : ["You work hard. You deserve to treat yourself."];
}

// Generate AI punchlines using OpenAI (optional)
async function generateAIPunchlines(data, apiKey) {
    try {
        const prompt = `Generate 2-3 playful, witty "girl math" punchlines for a ${data.category} purchase of $${data.price} in a ${data.mode} tone. 
Cost per use: $${data.costPerUse?.toFixed(2) || 'N/A'}, Savings: $${data.savings || 0}. 
Keep it funny, relatable, and under 100 characters each. Return ONLY the punchlines, one per line, no numbering.`;

        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: 'gpt-3.5-turbo',
                messages: [
                    { role: 'system', content: 'You are a witty social media content creator specializing in "girl math" - playful justifications for purchases.' },
                    { role: 'user', content: prompt }
                ],
                max_tokens: 150,
                temperature: 0.9
            })
        });

        if (!response.ok) {
            throw new Error(`OpenAI API error: ${response.status}`);
        }

        const result = await response.json();
        const content = result.choices?.[0]?.message?.content;
        
        if (content) {
            // Split by newlines and clean up
            return content.split('\n')
                .map(line => line.trim())
                .filter(line => line.length > 0 && !line.match(/^\d+[\.\)]/))
                .slice(0, 3);
        }
    } catch (error) {
        console.error('AI generation failed:', error);
        throw error;
    }
    
    return [];
}

// Shuffle array utility
function shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}
