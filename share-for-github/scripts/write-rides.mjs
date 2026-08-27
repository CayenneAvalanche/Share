/** Restore rides.index.tsx from payload parts if valid; never fail the build. */
import { gunzipSync } from "node:zlib";
import { writeFileSync, mkdirSync, readFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const dir = dirname(fileURLToPath(import.meta.url));
const out = join(dir, "..", "src/routes/rides.index.tsx");

function looksReal(src) {
  return src.includes("function RidesPage") && src.includes("Local ride");
}

function tryParts() {
  const b64 = [0, 1, 2, 3, 4]
    .map((i) => readFileSync(join(dir, `rides-ui.b64.part${i}`), "utf8"))
    .join("")
    .replace(/\s+/g, "");
  const buf = gunzipSync(Buffer.from(b64, "base64"));
  const src = buf.toString("utf8");
  if (!looksReal(src)) throw new Error("payload did not contain RidesPage");
  return src;
}

try {
  mkdirSync(dirname(out), { recursive: true });
  try {
    const src = tryParts();
    writeFileSync(out, src);
    console.log("[write-rides] wrote from parts", src.length, "bytes");
  } catch (err) {
    console.warn("[write-rides] parts skipped:", err && err.message ? err.message : err);
    if (existsSync(out) && looksReal(readFileSync(out, "utf8"))) {
      console.log("[write-rides] keeping committed rides.index.tsx");
    } else {
      console.warn("[write-rides] no valid source — build will use whatever is in git");
    }
  }
} catch (err) {
  console.warn("[write-rides] non-fatal:", err && err.message ? err.message : err);
}
