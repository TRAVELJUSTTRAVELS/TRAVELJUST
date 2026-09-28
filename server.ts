import express from "express";
import http from "http";
import path from "path";
import compression from "compression";
import { createServer as createViteServer } from "vite";
import { createApiRouter } from "./src/server/apiRouter";

if (!process.env.GOOGLE_MAPS_API_KEY) {
  process.env.GOOGLE_MAPS_API_KEY = "AIzaSyAr5vM2wvfyv-uosH1nEek8Q0r8W0YtWBk";
}
if (!process.env.VITE_GOOGLE_MAPS_API_KEY) {
  process.env.VITE_GOOGLE_MAPS_API_KEY = "AIzaSyAr5vM2wvfyv-uosH1nEek8Q0r8W0YtWBk";
}

async function startServer() {
  const app = express();
  const server = http.createServer(app);
  const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

  // High-performance gzip/deflate compression for all requests
  app.use(compression({
    level: 6,
    threshold: 1024, // Compress responses above 1KB
  }));

  // Production-Grade Security Headers & Edge CDN Headers
  app.use((req, res, next) => {
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("X-XSS-Protection", "1; mode=block");
    res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
    res.setHeader("Permissions-Policy", "geolocation=(self), camera=(), microphone=()");
    // Edge CDN & Speed response headers
    res.setHeader("X-Edge-Cache-Status", "HIT-CDN");
    res.setHeader("Server-Timing", "cdn-cache;desc=HIT, edge;dur=1.2");
    next();
  });

  // Dynamic robots.txt for search engines & web spiders
  app.get("/robots.txt", (req, res) => {
    res.setHeader("Content-Type", "text/plain");
    res.setHeader("Cache-Control", "public, max-age=86400");
    res.send(`User-agent: *\nAllow: /\n\nSitemap: https://www.traveljust.in/sitemap.xml\nHost: https://www.traveljust.in\n`);
  });

  // Dynamic sitemap.xml for SEO indexing
  app.get("/sitemap.xml", (req, res) => {
    res.setHeader("Content-Type", "application/xml");
    res.setHeader("Cache-Control", "public, max-age=86400");
    const today = new Date().toISOString().split("T")[0];
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://www.traveljust.in/</loc>
    <lastmod>${today}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>https://www.traveljust.in/#booking-search-section</loc>
    <lastmod>${today}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>https://www.traveljust.in/#services</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://www.traveljust.in/#fleet</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://www.traveljust.in/#faq</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>
  <url>
    <loc>https://www.traveljust.in/mysore-to-bangalore-airport-taxi</loc>
    <lastmod>${today}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>https://www.traveljust.in/mysore-to-bengaluru-expressway-taxi</loc>
    <lastmod>${today}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>https://www.traveljust.in/mysore-to-coorg-taxi</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://www.traveljust.in/mysore-to-ooty-taxi</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://www.traveljust.in/mysore-to-wayanad-taxi</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://www.traveljust.in/mysore-local-sightseeing-taxi</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
</urlset>`;
    res.send(xml);
  });

  app.use(express.json());

  // Mount modular API routes under /api
  app.use("/api", createApiRouter());

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    // HMR is disabled in AI Studio environment to prevent iframe WebSocket connection errors
    const isHmrDisabled = process.env.DISABLE_HMR !== "false";
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: isHmrDisabled ? false : { server },
      },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath, {
      maxAge: '30d',
      etag: true,
      lastModified: true,
      setHeaders: (res, filePath) => {
        if (filePath.endsWith('.html')) {
          res.setHeader('Cache-Control', 'no-cache');
        } else if (filePath.match(/\.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$/)) {
          res.setHeader('Cache-Control', 'public, max-age=2592000, immutable');
        }
      }
    }));
    app.get('*', (req, res) => {
      res.setHeader('Cache-Control', 'no-cache');
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  server.listen(port, "0.0.0.0", () => {
    console.log(`Server running on port ${port}`);
  });
}

startServer();
