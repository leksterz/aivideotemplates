/**
 * Tiny HTTP server that serves the composition state file and uploaded assets.
 * The Vite dev server proxies /api/* to this.
 */

import { randomUUID } from "node:crypto";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { createServer } from "node:http";
import { join, extname } from "node:path";

const PORT = 3002;
const STATE_DIR = process.env.AVT_STATE_DIR || join(process.cwd(), ".avt");
const STATE_FILE = join(STATE_DIR, "composition.json");
const UPLOADS_DIR = join(process.cwd(), "ui", "public", "uploads");

await mkdir(STATE_DIR, { recursive: true });
await mkdir(UPLOADS_DIR, { recursive: true });

const server = createServer(async (req, res) => {
  // CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, PUT, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, X-Filename");

  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  // ── Composition state ──────────────────────────────────────────────────

  if (req.url === "/api/composition" && req.method === "GET") {
    try {
      const data = await readFile(STATE_FILE, "utf-8");
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(data);
    } catch {
      res.writeHead(404, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "No composition found" }));
    }
    return;
  }

  if (req.url === "/api/composition" && req.method === "PUT") {
    let body = "";
    req.on("data", (chunk) => (body += chunk));
    req.on("end", async () => {
      try {
        const comp = JSON.parse(body);
        comp.metadata = comp.metadata || {};
        comp.metadata.updatedAt = new Date().toISOString();
        await writeFile(STATE_FILE, JSON.stringify(comp, null, 2), "utf-8");
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ ok: true }));
      } catch (err) {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: String(err) }));
      }
    });
    return;
  }

  // ── File upload ────────────────────────────────────────────────────────
  // POST /api/upload — receives raw file body, returns persistent URL.
  // Client sends X-Filename header with the original filename.

  if (req.url === "/api/upload" && req.method === "POST") {
    const originalName = req.headers["x-filename"] || "file";
    const ext = extname(String(originalName)).toLowerCase() || ".bin";
    const id = randomUUID();
    const filename = `${id}${ext}`;
    const filePath = join(UPLOADS_DIR, filename);

    const chunks = [];
    req.on("data", (chunk) => chunks.push(chunk));
    req.on("end", async () => {
      try {
        const buffer = Buffer.concat(chunks);
        await writeFile(filePath, buffer);
        // Return a URL relative to public/ so Vite serves it
        const url = `/uploads/${filename}`;
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ ok: true, url, filename, size: buffer.length }));
      } catch (err) {
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: String(err) }));
      }
    });
    return;
  }

  if (req.url === "/health") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ status: "ok" }));
    return;
  }

  res.writeHead(404);
  res.end("Not found");
});

server.listen(PORT, () => {
  console.log(`📁 Composition API server running on http://localhost:${PORT}`);
  console.log(`📂 Uploads directory: ${UPLOADS_DIR}`);
});
