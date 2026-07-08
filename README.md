# AXON — Pharmacy Study Assistant

A standalone, deployable version of the AXON app: chat modes (Normal, GPAT,
Viva, Professional) plus a full Quiz Mode with negative marking (+4 correct /
-1 wrong / 0 unanswered).

Your API key is **never** exposed to the browser. The frontend calls a small
serverless function at `/api/anthropic`, and that function attaches your key
before forwarding the request to Anthropic.

## 1. Get an Anthropic API key

1. Go to https://console.anthropic.com
2. Create an account / sign in, set up billing
3. Create an API key under **API Keys**
4. Keep it secret — treat it like a password

## 2. Run it locally (optional, to test before deploying)

```bash
npm install
npm install -g vercel   # lets you run the /api function locally too
vercel dev
```

Create a `.env` file (copy `.env.example`) with your real key:

```
ANTHROPIC_API_KEY=sk-ant-...
```

Visit the local URL `vercel dev` prints (usually http://localhost:3000).

> If you just run `npm run dev` (plain Vite) the `/api` function won't run,
> since that only serves the frontend. Use `vercel dev` to test both together.

## 3. Deploy to get a public link

**Easiest path — Vercel (free tier):**

1. Push this folder to a GitHub repo
2. Go to https://vercel.com → **Add New Project** → import the repo
3. Vercel auto-detects Vite + the `/api` folder — no config needed
4. Before deploying, add an environment variable:
   - Name: `ANTHROPIC_API_KEY`
   - Value: your real key
5. Click **Deploy**

You'll get a live link like `https://axon-yourname.vercel.app` within a
couple of minutes. Push new commits to redeploy automatically.

**Custom domain:** Project Settings → Domains → add your own domain and
point its DNS at Vercel (they give exact records to add).

**Alternatives:** Netlify and Cloudflare Pages both work the same way
(serverless function in a special folder, env var for the key). Vercel is
the path of least resistance for a Vite + API-route project like this one.

## 4. Cost & abuse protection

Every chat message and every quiz question batch is a real API call billed
to your account. Before sharing the link widely:

- The proxy includes basic per-IP rate limiting (20 requests/minute) as a
  starting safety net — for real public traffic, swap this for a persistent
  store like Vercel KV or Upstash Redis (in-memory limits reset on cold start).
- Consider setting a spend limit / usage alert in the Anthropic Console.
- Consider adding a simple login or invite-code gate if you want to control
  who can use it, rather than leaving it fully open.

## 5. Before publishing publicly

- Add a privacy policy (you're sending user questions to a third-party AI API)
- Add a disclaimer that Nova is a study aid, not professional/medical advice
- Keep the `[AXON AI Generated]` tags visible on quiz questions — they're
  already built in, don't remove them, since some questions are AI-written
  rather than genuine recalled exam questions

## 6. Wrapping it for Google Play later

Once the website is live, you can package it as an installable Android app
without rewriting anything:

- Turn it into a PWA (add a manifest + service worker), then use Google's
  **Bubblewrap** or **PWABuilder** to generate a Play-Store-ready Android
  package (a "Trusted Web Activity") that just points at your live URL
- You'll need a Google Play Developer account (one-time $25 fee), a privacy
  policy URL, content rating questionnaire, and store listing assets
