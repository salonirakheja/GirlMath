# Local Development Setup

## Quick Start

**Method 1: Python 3 (Recommended)**
```bash
cd /Users/salonirakheja/GirlMath
python3 -m http.server 8000
```
Then open your browser to: **http://localhost:8000**

Press `Ctrl+C` to stop the server.

---

**Method 2: Node.js**
```bash
cd /Users/salonirakheja/GirlMath
npx serve -p 3000
```
Then open: **http://localhost:3000**

---

**Method 3: Use the helper script**
```bash
cd /Users/salonirakheja/GirlMath
./start-server.sh
```

## Troubleshooting

### Problem: "Can't open on localhost"

**Solution:** Make sure you're running an HTTP server, NOT opening the HTML file directly.

❌ **WRONG:** Double-clicking `index.html` or using `file://` protocol  
✅ **RIGHT:** Using `python3 -m http.server` or `npx serve`

### Problem: API calls fail

**This is normal!** The `/api/punchline` endpoint only works when deployed to Vercel. For local testing, the app automatically falls back to template-based punchlines, which work perfectly.

**Note:** The `/api/search` endpoint (for product offers) also requires Vercel deployment. The shop page will automatically fall back to mock offers if the API is unavailable.

### Problem: "Port already in use"

Try a different port:
```bash
python3 -m http.server 8080  # Use port 8080 instead
```

### Problem: Page loads but form doesn't work

1. Open browser Developer Tools (F12 or Cmd+Option+I)
2. Check the Console tab for JavaScript errors
3. Make sure `app.js` is loading correctly

## Testing Checklist

- [ ] Server is running (see terminal output)
- [ ] Can access http://localhost:8000 in browser
- [ ] Homepage loads with form
- [ ] Can fill out form and click "Do the math ✨"
- [ ] Verdict page shows with metrics and punchline
- [ ] Copy Link button works
- [ ] Copy Caption button works

## Environment Variables

For full functionality when deployed to Vercel, you'll need to set these environment variables:

### Required for Product Scanner
- `OPENAI_API_KEY` - Your OpenAI API key for vision/image recognition

### Optional for Enhanced Features
- `SERPAPI_API_KEY` - Your SerpAPI key for real product search results
  - Get your key at: https://serpapi.com/
  - Without this, the shop page will use mock offers (still functional)
  - The key is stored server-side and never exposed to the client

### Optional for Caching/Logging
- `KV_REST_API_URL` and `KV_REST_API_TOKEN` - Vercel KV for caching scan results
- `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` - Supabase for logging scan results (service role key required to bypass RLS)

To set environment variables in Vercel:
```bash
vercel env add SERPAPI_API_KEY
# Then paste your key when prompted
```

## Next Steps

Once local testing works, deploy to Vercel:
```bash
vercel
```

After deployment, add your environment variables in the Vercel dashboard or via CLI.
