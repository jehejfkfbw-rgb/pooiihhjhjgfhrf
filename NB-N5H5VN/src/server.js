// NEBRAS AI — generated server (Node http, zero external deps)
// Run: node src/server.js  (PORT env optional, default 3000)
const http = require("http");
const fs = require("fs");
const path = require("path");

const PORT = Number(process.env.PORT) || 3000;
const PUBLIC_DIR = path.join(__dirname, "..", "public");
const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
};

function sendJson(res, code, obj) {
  const body = JSON.stringify(obj);
  res.writeHead(code, { "Content-Type": "application/json; charset=utf-8" });
  res.end(body);
}

function safeJoin(base, target) {
  const p = path.normalize(path.join(base, target));
  return p.startsWith(base) ? p : null;
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, "http://localhost");
  const route = url.pathname;

  if (route === "/api/health") {
    return sendJson(res, 200, { status: "ok", service: "nebras-ai", time: new Date().toISOString() });
  }
  if (route === "/api/echo") {
    const msg = (url.searchParams.get("msg") || "").slice(0, 500);
    if (!msg) return sendJson(res, 400, { error: "msg is required (max 500 chars)" });
    return sendJson(res, 200, { echo: msg, receivedAt: new Date().toISOString() });
  }
  if (route.startsWith("/api/")) {
    return sendJson(res, 404, { error: "API endpoint not found" });
  }

  let rel = route === "/" ? "index.html" : route.replace(/^\//, "");
  const filePath = safeJoin(PUBLIC_DIR, rel);
  if (!filePath) return sendJson(res, 403, { error: "forbidden path" });
  fs.readFile(filePath, (err, data) => {
    if (err) {
      return sendJson(res, 404, { error: "not found" });
    }
    const type = MIME[path.extname(filePath).toLowerCase()] || "application/octet-stream";
    res.writeHead(200, { "Content-Type": type });
    res.end(data);
  });
});

server.listen(PORT, () => {
  console.log("NEBRAS AI server listening on port " + PORT);
});
