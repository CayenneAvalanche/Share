/**
 * Parse driver application platformsText into neat rows.
 * Example source:
 * "Uber (NOT ACTIVE): 2 yrs, ~500 trips, 4.95★ · Lyft (ACTIVE): 1 yrs, ~200 trips"
 */
export type ParsedPlatform = {
  name: string;
  active: boolean;
  years?: string;
  trips?: string;
  rating?: number;
};

export function parsePlatformsText(text?: string | null): ParsedPlatform[] {
  if (!text) return [];
  const raw = text.trim();
  if (!raw || /^none listed$/i.test(raw)) return [];

  // Prefer " · " separators; also tolerate newlines / semicolons
  const chunks = raw
    .split(/\s*·\s*|\n+|;+/)
    .map((s) => s.trim())
    .filter(Boolean);

  const out: ParsedPlatform[] = [];
  for (const chunk of chunks) {
    const m = chunk.match(
      /^(.+?)\s*\((ACTIVE|NOT\s*ACTIVE)\)\s*:\s*(.*)$/i,
    );
    if (m) {
      const name = m[1].trim();
      const active = /^active$/i.test(m[2].replace(/\s+/g, " ").trim());
      const rest = m[3] || "";
      const years = rest.match(/([\d.]+)\s*yrs?/i)?.[1];
      const tripsMatch = rest.match(/~\s*([\d,]+)\s*trips/i);
      const trips = tripsMatch?.[1]?.replace(/,/g, "");
      const ratingRaw = rest.match(/([\d.]+)\s*★/)?.[1];
      const rating = ratingRaw ? Number(ratingRaw) : undefined;
      out.push({
        name,
        active,
        years,
        trips: trips && trips !== "" ? trips : undefined,
        rating: Number.isFinite(rating) ? rating : undefined,
      });
      continue;
    }
    // Fallback: bare name
    if (chunk.length < 80) {
      out.push({ name: chunk, active: false });
    }
  }
  return out;
}
