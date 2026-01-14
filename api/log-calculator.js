// Vercel Serverless Function to log calculator usage to Supabase
import { createClient } from '@supabase/supabase-js';

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

    // Check if Supabase is configured
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
        // Supabase not configured - silently succeed (don't block the app)
        console.log('Supabase not configured, skipping log');
        return res.status(200).json({ logged: false, reason: 'not_configured' });
    }

    try {
        const { price_low, price_high, category } = req.body;

        // Validate input
        if (price_low === undefined || price_low === null) {
            return res.status(400).json({ error: 'price_low is required' });
        }

        // Create Supabase client
        const supabase = createClient(supabaseUrl, supabaseKey);

        // Insert log entry
        const { data, error } = await supabase
            .from('calculator_logs')
            .insert([
                {
                    price_low: parseFloat(price_low) || 0,
                    price_high: parseFloat(price_high) || parseFloat(price_low) || 0,
                    category: category || 'other'
                }
            ]);

        if (error) {
            console.error('Supabase insert error:', error);
            // Don't fail the request - logging is non-critical
            return res.status(200).json({ logged: false, reason: 'insert_error' });
        }

        return res.status(200).json({ logged: true });

    } catch (error) {
        console.error('Error logging calculator usage:', error);
        // Don't fail the request - logging is non-critical
        return res.status(200).json({ logged: false, reason: 'error' });
    }
}
