# Gluebird

React bond-finder tool + 33-page SEO blog, built to deploy on Cloudflare Pages.

## What's in here
- `src/App.jsx` — the interactive tool (material picker, recommendation engine, affiliate product links)
- `content/` — the 33 blog articles (Markdown with SEO front-matter)
- `scripts/build-blog.mjs` — turns `content/*.md` into real static HTML pages at build time (so search engines see full content, no JS required)

No backend, no database — this is a fully static site. Nothing to bind, nothing to provision.

## Deploy steps

### 1. Push to GitHub
```
git init
git add .
git commit -m "Gluebird launch"
git remote add origin <your-repo-url>
git push -u origin main
```

### 2. Connect to Cloudflare Pages
1. Cloudflare dashboard → Workers & Pages → Create → Pages → Connect to Git
2. Select this repo
3. Build settings:
   - **Build command:** `npm run build`
   - **Build output directory:** `dist`
4. Deploy — you'll get a live `*.pages.dev` URL in a couple minutes

### 3. Add your domain
1. In the Pages project → Custom domains → Add `gluebird.com`
2. Since gluebird.com's nameservers already point to this Cloudflare account, this is instant — no extra DNS steps needed

That's it — two steps to live.

### Affiliate links
Edit `AFFILIATE_TAG` at the top of `src/App.jsx` with your real Amazon Associates ID (or swap `productLink()` for another program).

### Local development
```
npm install
npm run dev
```
Note: `/api/tally` won't work in plain `vite dev` (that's a Cloudflare Pages Function, not a Vite dev server route) — it'll silently no-op locally and only work once deployed, or if you run it via `wrangler pages dev`.
