# Girl Math ✨

A playful calculator that turns purchases into "emotionally acceptable" logic (cost-per-wear, "it was basically free," etc.) and spits out a shareable verdict card.

## Features

- **Interactive Form**: Input price, category, and justification mode
- **Three Modes**: Soft Life (supportive), Bestie Roast (funny savage), Delulu MBA (finance-y)
- **Smart Verdicts**: Calculates cost-per-use, savings, emotional ROI
- **Shareable Cards**: Copy link, copy caption (coming soon)
- **AI-Enhanced Punchlines**: Optional AI-powered punchline generation via API
- **Product Scanner**: Scan products with camera to get price estimates
- **Real Product Search**: SerpAPI integration for accurate shopping results (optional)

## Setup

### Local Development

1. **Install Vercel CLI** (optional):
   ```bash
   npm i -g vercel
   ```

2. **Run locally**:
   ```bash
   vercel dev
   ```

3. **Or use a simple HTTP server** (for static testing):
   ```bash
   python -m http.server 8000
   # or
   npx serve .
   ```

### Deploy to Vercel

#### Option 1: Vercel CLI
```bash
vercel
# Follow prompts, then:
vercel --prod
```

#### Option 2: Vercel Dashboard
1. Push code to GitHub/GitLab/Bitbucket
2. Go to [vercel.com](https://vercel.com)
3. Import your repository
4. Vercel will auto-detect the setup
5. Click Deploy!

#### Option 3: Vercel Button
Add this to your repo's README (if public):
```markdown
[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=YOUR_REPO_URL)
```

## Environment Variables (Optional)

Add in Vercel dashboard (Settings → Environment Variables):

### For Product Scanner
- `OPENAI_API_KEY` or `AI_API_KEY`: Your OpenAI API key for vision/image recognition

### For Real Product Search (Shop Page)
- `SERPAPI_API_KEY`: Your SerpAPI key for accurate shopping results
  - Get your key at: https://serpapi.com/
  - Without this, the shop page uses mock offers (still functional)

**Note**: If API keys are not set, the app gracefully falls back to template-based features (works perfectly fine without APIs!).

## Testing Locally

1. Open `index.html` in a browser (or use a local server)
2. Fill out the form and submit
3. The verdict page should load with calculated metrics
4. API calls will fail locally unless you have `vercel dev` running, but template punchlines work fine

## Project Structure

```
GirlMath/
├── index.html          # Homepage form
├── verdict.html        # Verdict card page
├── calculator.html     # Calculator page
├── camera.html         # Product scanner page
├── shop.html           # Shop page with product offers
├── styles.css          # Pastel, bubbly styling
├── app.js              # Client-side rules engine & logic
├── camera.js           # Camera and scanner logic
├── scanner.js          # Scanner result processing
├── shop.js             # Shop page with real/mock offers
├── api/
│   ├── punchline.js    # Vercel serverless function for AI punchlines
│   ├── vision.js       # Product image recognition via OpenAI
│   └── search.js        # Product search via SerpAPI
├── vercel.json         # Vercel configuration
└── package.json        # Project metadata
```

## How It Works

1. User fills out form with purchase details
2. Client-side calculates metrics (cost-per-use, savings, etc.)
3. Determines verdict (APPROVED ✅ / SIDE-EYE 👀 / ABSOLUTELY NOT 🚫)
4. Generates punchline based on mode and category
5. Optional: Calls API for AI-enhanced alternate punchlines
6. User can share link or copy caption.

## License

MIT
