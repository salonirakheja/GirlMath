# Girl Math ✨

A playful calculator that turns purchases into "emotionally acceptable" logic (cost-per-wear, "it was basically free," etc.) and spits out a shareable verdict card.

## Features

- **Interactive Form**: Input price, category, and justification mode
- **Three Modes**: Soft Life (supportive), Bestie Roast (funny savage), Delulu MBA (finance-y)
- **Smart Verdicts**: Calculates cost-per-use, savings, emotional ROI
- **Shareable Cards**: Copy link, copy caption (coming soon)
- **AI-Enhanced Punchlines**: Optional AI-powered punchline generation via API

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

For AI-enhanced punchlines, add in Vercel dashboard (Settings → Environment Variables):
- `AI_API_KEY` or `OPENAI_API_KEY`: Your OpenAI API key

**Note**: If not set, the app falls back to template-based punchlines (works perfectly fine without AI!).

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
├── styles.css          # Pastel, bubbly styling
├── app.js              # Client-side rules engine & logic
├── api/
│   └── punchline.js    # Vercel serverless function for AI punchlines
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
