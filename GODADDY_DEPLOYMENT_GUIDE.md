# 🚀 GoDaddy Deployment Guide for TRAVEL JUST

This guide explains step-by-step how to deploy your TRAVEL JUST application on **GoDaddy Hosting**.

---

## 📌 Choose Your GoDaddy Hosting Setup

| GoDaddy Plan Type | Best Deployment Method | Difficulty |
|---|---|---|
| **cPanel / Linux Web Hosting** *(Standard Shared)* | **Method 1: Static SPA via File Manager** | ⭐ Easy (5 mins) |
| **cPanel with Node.js Support** *(Business / Web Pro)* | **Method 2: cPanel "Setup Node.js App"** | ⭐⭐ Moderate |
| **GoDaddy Domain + Netlify** *(Domain on GoDaddy, App on Netlify)* | **Method 3: GoDaddy DNS Setup** | ⭐ Easy & Free SSL |
| **GoDaddy VPS / Dedicated Server** *(Ubuntu / CentOS)* | **Method 4: PM2 + Nginx** | ⭐⭐⭐ Advanced |

---

## 📁 Method 1: GoDaddy cPanel / Web Hosting (File Manager / FTP)

Use this method if you have GoDaddy Linux Web Hosting / cPanel (the most common GoDaddy plan).

### Step 1: Build the Production Bundle
Run this command in your project terminal:
```bash
npm run build
```
This generates the **`dist/`** folder containing:
- `index.html`
- `assets/` (all optimized JS, CSS, and images)
- `.htaccess` (pre-configured for GoDaddy Apache URL rewriting and caching)

### Step 2: Upload Files to GoDaddy
1. Log in to your **GoDaddy Account** ➔ Go to **My Products** ➔ Click **Manage** on your **Web Hosting (cPanel)**.
2. Open **cPanel Admin** and click on **File Manager**.
3. Navigate into the **`public_html`** folder (or your subdomain folder if deploying to a subdomain).
4. *Optional:* Delete default placeholder files like `default.html` or `index.html` created by GoDaddy.
5. Click **Upload** at the top menu.
6. Upload all files from inside your local **`dist/`** folder into `public_html`.
   > 💡 *Tip: You can zip the contents of `dist/` into `dist.zip`, upload `dist.zip` to `public_html`, and click **Extract** in cPanel File Manager.*
7. Ensure your **`.htaccess`** file is present in `public_html` (in cPanel File Manager, click *Settings* in the top-right and check *"Show Hidden Files (dotfiles)"* to view it).

✅ **Done!** Your site is now live on your GoDaddy domain.

---

## ⚙️ Method 2: GoDaddy cPanel with "Setup Node.js App" (Full-Stack)

If your GoDaddy cPanel includes the **"Setup Node.js App"** feature (Phusion Passenger):

1. In cPanel, search for **"Setup Node.js App"** and click **Create Application**.
2. Fill in the fields:
   - **Node.js version:** Select `Node.js 18.x` or `20.x`
   - **Application mode:** `Production`
   - **Application root:** `traveljust` (or your folder name)
   - **Application URL:** Select your domain
   - **Application startup file:** `app.js`
3. Click **Create**.
4. Upload all project files to the application root folder (excluding `node_modules`).
5. In the cPanel Node.js interface:
   - Click **Run NPM Install**
   - Click **Add Variable** to enter environment variables (`GEMINI_API_KEY`, `VITE_SUPABASE_URL`, etc.)
6. Click **Restart** to launch the application.

---

## 🌐 Method 3: Connect GoDaddy Domain to Netlify (Recommended for Free SSL & Speed)

If you host the application on Netlify and bought your domain on GoDaddy:

1. In Netlify, go to **Site configuration** ➔ **Domain management** ➔ **Add custom domain** (e.g., `traveljust.in` or `yourdomain.com`).
2. Log in to **GoDaddy** ➔ Go to **Domain Control Center** / **DNS Management** for your domain.
3. Add / Edit the following DNS records:

| Type | Name / Host | Value / Points to | TTL |
|---|---|---|---|
| **A** | `@` | `75.2.60.5` | `1/2 Hour` or `Default` |
| **CNAME** | `www` | `your-site-name.netlify.app` | `1/2 Hour` or `Default` |

4. In Netlify, click **Verify DNS** and **Provision Let's Encrypt SSL Certificate** (free automatic HTTPS).

---

## 🖥️ Method 4: GoDaddy VPS (Ubuntu + Nginx + PM2)

If you are using a GoDaddy Linux VPS:

```bash
# 1. Clone your project & install dependencies
git clone <your-repo-url>
cd <project-folder>
npm install

# 2. Build the project
npm run build

# 3. Start with PM2 process manager
npm install -g pm2
pm2 start "node dist/server.cjs" --name "traveljust"
pm2 save
pm2 startup
```

Configure Nginx reverse proxy (`/etc/nginx/sites-available/default`):
```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

---

## 📋 Environment Variables Reference

When configuring GoDaddy or your backend environment, set the following:

| Variable Name | Value | Purpose |
|---|---|---|
| `VITE_SUPABASE_URL` | `https://pvxtyhhgfkvftlzbixqm.supabase.co` | Supabase Cloud Database |
| `VITE_SUPABASE_ANON_KEY` | `sb_publishable_KxnQpzyAQ-xgPlUMBalI2Q_lYkxvcnn` | Supabase Public Key |
| `GEMINI_API_KEY` | *Your Gemini API Key* | Gemini AI Concierge & Fare Engine |
| `GOOGLE_MAPS_API_KEY` | *Your Google Maps Key* | Routes & Places API |
| `VITE_GOOGLE_MAPS_API_KEY` | *Your Google Maps Key* | Interactive Map View |
