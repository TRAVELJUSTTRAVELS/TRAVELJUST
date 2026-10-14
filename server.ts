import fs from "node:fs";
import path from "node:path";

/**
 * Root full-stack server entry point for TRAVEL JUST.
 * 
 * - Development: Runs with tsx and mounts Vite middleware for local development on port 3000.
 * - Production: When built, delegates to the bundled server at dist/server.cjs which serves
 *   static assets from dist/ and handles all /api routes on process.env.PORT.
 */
async function main() {
  const distServerPath = path.join(process.cwd(), "dist", "server.cjs");

  if (process.env.NODE_ENV === "production" || (!process.env.NODE_ENV && fs.existsSync(distServerPath))) {
    if (fs.existsSync(distServerPath)) {
      // @ts-ignore generated in dist during build
      await import("./dist/server.cjs");
      return;
    }
  }

  // Fallback to dev server
  await import("./src/server/devServer.ts");
}

main().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
