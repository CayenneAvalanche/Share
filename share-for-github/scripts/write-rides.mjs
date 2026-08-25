/** Writes rides.index.tsx from split gzip payload. */
import { gunzipSync } from "node:zlib";
import { writeFileSync, mkdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const dir = dirname(fileURLToPath(import.meta.url));
const b64 = (
  readFileSync(join(dir, "rides-ui.b64.part0"), "utf8") +
  readFileSync(join(dir, "rides-ui.b64.part1"), "utf8")
).replace(/\s+/g, "");
const buf = gunzipSync(Buffer.from(b64, "base64"));
const root = join(dir, "..");
const out = join(root, "src/routes/rides.index.tsx");
mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, buf);
console.log("[write-rides] wrote", out, buf.length, "bytes");
