/** Writes rides.index.tsx from embedded gzip payload (ship large UI via small commit). */
import { gunzipSync } from "node:zlib";
import { writeFileSync, mkdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const b64 = readFileSync(join(dirname(fileURLToPath(import.meta.url)), "rides-ui.b64"), "utf8").trim();
const buf = gunzipSync(Buffer.from(b64, "base64"));
const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const out = join(root, "src/routes/rides.index.tsx");
mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, buf);
console.log("[write-rides] wrote", out, buf.length, "bytes");
