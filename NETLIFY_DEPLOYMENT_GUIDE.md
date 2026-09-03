# Netlify Deployment Guide for TRAVEL JUST

This application is configured for Netlify deployment with support for the Single Page Application (SPA), Serverless API Functions, and custom routing.

---

## 🚀 Quick Deployment Options

### Option 1: Deploy via GitHub / GitLab / Bitbucket (Recommended)
1. Push this repository to your GitHub account (via **Export to GitHub** in settings menu or git push).
2. Log in to [Netlify](https://app.netlify.com/).
3. Click **Add new site** ➔ **Import an existing project**.
4. Select your repository.
5. The build settings are auto-detected from `netlify.toml`:
   - **Base directory:** *(Leave blank / root)*
   - **Build command:** `npm run build`
   - **Publish directory:** `dist`
   - **Functions directory:** `netlify/functions`
6. Click **Deploy TRAVEL JUST**.

---

### Option 2: Deploy via Netlify CLI
Run the following in your terminal:
```bash
# 1. Install Netlify CLI
npm install -g netlify-cli

# 2. Build the project
npm run build

# 3. Deploy to production
netlify deploy --prod --dir=dist --functions=netlify/functions
```

---

## 🔑 Environment Variables Configuration in Netlify

In your Netlify Site Dashboard:
Go to **Site configuration** ➔ **Environment variables** ➔ **Add a variable**:

| Variable Key | Description | Default / Example Value |
|---|---|---|
| `VITE_SUPABASE_URL` | Supabase project API URL | `https://pvxtyhhgfkvftlzbixqm.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | Supabase Anon public key | `sb_publishable_KxnQpzyAQ-xgPlUMBalI2Q_lYkxvcnn` |
| `SUPABASE_URL` | Supabase URL (for serverless function) | `https://pvxtyhhgfkvftlzbixqm.supabase.co` |
| `SUPABASE_ANON_KEY` | Supabase Anon Key (for serverless function) | `sb_publishable_KxnQpzyAQ-xgPlUMBalI2Q_lYkxvcnn` |
| `GEMINI_API_KEY` | Google Gemini AI Key (for AI Concierge & Fare engine) | *Your Gemini API Key* |
| `GOOGLE_MAPS_API_KEY` | Google Maps Platform Key (Routes & Places) | *Your Google Maps API Key* |
| `VITE_GOOGLE_MAPS_API_KEY` | Google Maps Key (Client Map View) | *Your Google Maps API Key* |
| `VITE_GOOGLE_MAPS_MAP_ID` | Google Maps Map ID | `DEMO_MAP_ID` |

---

## 🛠️ Files Configured for Netlify

1. `netlify.toml` – Root Netlify build, redirect, and header configuration.
2. `public/_redirects` – SPA routing fallback (`/* /index.html 200`) and API proxy.
3. `public/_headers` – Security headers (X-Frame-Options, Content-Type-Options) and immutable asset caching.
4. `netlify/functions/api.ts` – Serverless function handling all `/api/*` endpoints (AI quotes, Gemini chat, bookings, Maps proxies).
