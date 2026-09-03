// GoDaddy cPanel Node.js Application Entry Point (Phusion Passenger / PM2)
// This file serves as the launcher for GoDaddy cPanel "Setup Node.js App".

import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const bundledServerPath = path.join(__dirname, 'dist', 'server.cjs');

if (fs.existsSync(bundledServerPath)) {
  // Import the compiled bundled server
  import('./dist/server.cjs');
} else {
  // Direct fallback to server.ts in TS development mode
  import('./server.ts');
}
