import express from "express";
import http from "http";
import path from "path";
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
  const PORT = 3000;

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
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  server.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
