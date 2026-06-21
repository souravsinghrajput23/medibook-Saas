import express from "express";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { createReadStream, existsSync } from "fs";
import { createGzip } from "zlib";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
const DIST = join(__dirname, "dist/public");

// Security headers
app.use((_req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "SAMEORIGIN");
  res.setHeader("X-XSS-Protection", "1; mode=block");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  next();
});

// Health check
app.get("/health", (_req, res) => {
  res.json({ status: "ok", app: "MediBook" });
});

// Serve static files
app.use(
  express.static(DIST, {
    maxAge: "1y",
    etag: true,
    index: false,
  })
);

// SPA fallback — all other routes serve index.html
app.get("*", (_req, res) => {
  const indexPath = join(DIST, "index.html");
  if (!existsSync(indexPath)) {
    return res.status(503).send("App not built. Run: npm run build");
  }
  res.sendFile(indexPath);
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`MediBook production server running on port ${PORT}`);
});
