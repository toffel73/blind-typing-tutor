import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Force server-side timezone to Europe/Berlin so SQLite's 'localtime' modifier and
// JavaScript Date methods both produce German calendar dates (handles DST automatically).
process.env.TZ = 'Europe/Berlin';

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable React strict mode
  reactStrictMode: true,

  // Ensure trailing slashes are handled consistently
  trailingSlash: false,

  // Output directory
  distDir: '.next',

  // Keep native Node.js modules out of the webpack bundle
  serverExternalPackages: ['better-sqlite3'],
  allowedDevOrigins: ['192.168.100.86'],
};

export default nextConfig;
