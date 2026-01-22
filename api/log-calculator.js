// Vercel Serverless Function to log calculator usage to Supabase
import { createClient } from '@supabase/supabase-js';

// Input validation constants
const MAX_PRICE = 1000000;
const ALLOWED_CATEGORIES = ['clothes', 'skincare', 'food', 'subscription', 'gift', 'jewellery', 'other'];

function validateLogInput(data) {
    const price_low = parseFloat(data.price_low);
    const price_high = parseFloat(data.price_high);
    
    if (isNaN(price_low) || price_low < 0 || price_low > MAX_PRICE) {
        return { isValid: false, error: 'price_low must be between 0 and 1,000,000' };
    }
    
    if (data.price_high !== undefined && data.price_high !== null) {
        if (isNaN(price_high) || price_high < 0 || price_high > MAX_PRICE || price_high < price_low) {
            return { isValid: false, error: 'price_high must be between price_low and 1,000,000' };
        }
    }
    
    if (data.category && !ALLOWED_CATEGORIES.includes(data.category)) {
        return { isValid: false, error: 'Invalid category' };
    }
    
    return { isValid: true };
}

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

    // Check request body size (5KB limit for logs)
    if (!req.body || typeof req.body !== 'object') {
        return res.status(400).json({ error: 'Invalid request body' });
    }

    const bodySize = JSON.stringify(req.body).length;
    if (bodySize > 5120) { // 5KB limit
        return res.status(413).json({ error: 'Request body too large' });
    }

    // Check if Supabase is configured - require service role key for RLS bypass
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
        // Supabase not configured - silently succeed (don't block the app)
        // Note: SUPABASE_SERVICE_ROLE_KEY is required (not anon key) to bypass RLS
        console.log('Supabase not configured (missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY), skipping log');
        return res.status(200).json({ logged: false, reason: 'not_configured' });
    }

    try {
        const { price_low, price_high, category } = req.body;

        // Validate input
        const validation = validateLogInput({ price_low, price_high, category });
        if (!validation.isValid) {
            return res.status(400).json({ error: validation.error });
        }

        // Create Supabase client
        const supabase = createClient(supabaseUrl, supabaseKey);

        // Insert log entry with sanitized values
        const { data, error } = await supabase
            .from('calculator_logs')
            .insert([
                {
                    price_low: Math.min(MAX_PRICE, Math.max(0, parseFloat(price_low) || 0)),
                    price_high: Math.min(MAX_PRICE, Math.max(0, parseFloat(price_high) || parseFloat(price_low) || 0)),
                    category: ALLOWED_CATEGORIES.includes(category) ? category : 'other'
                }
            ]);

        if (error) {
            // Don't expose internal error details
            console.error('Supabase insert error:', error.message);
            // Don't fail the request - logging is non-critical
            return res.status(200).json({ logged: false, reason: 'insert_error' });
        }

        return res.status(200).json({ logged: true });

    } catch (error) {
        // Don't expose internal error details
        console.error('Error logging calculator usage:', error.message);
        // Don't fail the request - logging is non-critical
        return res.status(200).json({ logged: false, reason: 'error' });
    }
}
