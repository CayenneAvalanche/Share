/** Build a deep link that opens Apple Maps (iOS) or Google Maps (else). */
export function openInMapsUrl(address: string): string {
  const q = encodeURIComponent(address.trim());
  if (!q) return "https://maps.google.com";
  if (typeof navigator !== "undefined") {
    const ua = navigator.userAgent || "";
    // iPhone / iPad — Apple Maps app
    if (/iPhone|iPad|iPod/i.test(ua)) {
      return `https://maps.apple.com/?q=${q}`;
    }
  }
  // Android + desktop browsers — Google Maps
  return `https://www.google.com/maps/search/?api=1&query=${q}`;
}

export function openInMaps(address: string) {
  const url = openInMapsUrl(address);
  if (typeof window !== "undefined") {
    window.open(url, "_blank", "noopener,noreferrer");
  }
}
