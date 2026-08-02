import { createServer } from "node:http";
import { readFileSync, existsSync, statSync } from "node:fs";
import { join, extname } from "node:path";
import { pathToFileURL } from "node:url";

const port = Number(process.env.PORT || 4190);
const staticDir = "/workspace/.vercel/output/static";
const entry = await import(
  pathToFileURL("/workspace/.vercel/output/functions/__server.func/index.mjs")
    .href
);
const app = entry.default;

const mime = {
  ".js": "application/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".woff2": "font/woff2",
  ".json": "application/json",
};

const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url || "/", `http://127.0.0.1:${port}`);
    const filePath = join(staticDir, decodeURIComponent(url.pathname));
    if (
      url.pathname.startsWith("/assets/") &&
      existsSync(filePath) &&
      statSync(filePath).isFile()
    ) {
      const ext = extname(filePath);
      res.writeHead(200, {
        "content-type": mime[ext] || "application/octet-stream",
        "cache-control": "public, max-age=31536000, immutable",
      });
      res.end(readFileSync(filePath));
      return;
    }
    const headers = new Headers();
    for (const [k, v] of Object.entries(req.headers)) {
      if (v === undefined) continue;
      if (Array.isArray(v)) v.forEach((x) => headers.append(k, x));
      else headers.set(k, v);
    }
    const request = new Request(
      `http://127.0.0.1:${port}${url.pathname}${url.search}`,
      { method: req.method, headers },
    );
    const response = await app.fetch(request);
    const outHeaders = {};
    response.headers.forEach((value, key) => {
      outHeaders[key] = value;
    });
    res.writeHead(response.status, outHeaders);
    res.end(Buffer.from(await response.arrayBuffer()));
  } catch (e) {
    res.writeHead(500, { "content-type": "text/plain" });
    res.end(String((e && e.stack) || e));
  }
});

server.listen(port, "127.0.0.1", () => {
  console.log(`prod serve ready on ${port}`);
});
