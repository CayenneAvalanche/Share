/** Client-side compress for photos (pilot — stored as data URLs; keep small for localStorage). */

export type PhotoKind = "selfie" | "vehicle" | "document" | "item";

const PRESETS: Record<
  PhotoKind,
  { maxEdge: number; quality: number; maxBytes: number }
> = {
  // Face on You / apps — must stay tiny (many devices ~5MB total localStorage)
  selfie: { maxEdge: 400, quality: 0.55, maxBytes: 70_000 },
  vehicle: { maxEdge: 900, quality: 0.68, maxBytes: 220_000 },
  item: { maxEdge: 900, quality: 0.68, maxBytes: 220_000 },
  document: { maxEdge: 1100, quality: 0.7, maxBytes: 320_000 },
};

function looksLikeImage(file: File): boolean {
  if (file.type.startsWith("image/")) return true;
  // Drag-drop from desktop sometimes has empty MIME
  if (!file.type && /\.(jpe?g|png|gif|webp|heic|heif|bmp|avif)$/i.test(file.name)) {
    return true;
  }
  return false;
}

async function loadBitmap(file: File): Promise<ImageBitmap> {
  try {
    return await createImageBitmap(file);
  } catch {
    // Fallback: decode via <img> (helps some drag-dropped / odd MIME files)
    const url = URL.createObjectURL(file);
    try {
      const img = await new Promise<HTMLImageElement>((resolve, reject) => {
        const el = new Image();
        el.onload = () => resolve(el);
        el.onerror = () =>
          reject(new Error("Could not read that photo — try JPG or PNG"));
        el.src = url;
      });
      return await createImageBitmap(img);
    } finally {
      URL.revokeObjectURL(url);
    }
  }
}

export async function fileToCompressedDataUrl(
  file: File,
  kind: PhotoKind = "document",
): Promise<string> {
  if (!looksLikeImage(file)) {
    throw new Error("Please choose a photo (JPG or PNG)");
  }
  // HEIC often fails in browsers — clear message
  if (/heic|heif/i.test(file.type) || /\.heic$/i.test(file.name)) {
    throw new Error(
      "This iPhone format (HEIC) isn’t supported here — choose “Most Compatible” or export as JPG",
    );
  }

  const preset = PRESETS[kind] ?? PRESETS.document;
  const bitmap = await loadBitmap(file);
  try {
    let { width, height } = bitmap;
    if (!width || !height) {
      throw new Error("Could not read photo dimensions");
    }
    const scale = Math.min(1, preset.maxEdge / Math.max(width, height));
    width = Math.max(1, Math.round(width * scale));
    height = Math.max(1, Math.round(height * scale));

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Could not process image");
    ctx.drawImage(bitmap, 0, 0, width, height);

    let q = preset.quality;
    let dataUrl = canvas.toDataURL("image/jpeg", q);
    while (dataUrl.length > preset.maxBytes && q > 0.35) {
      q -= 0.07;
      dataUrl = canvas.toDataURL("image/jpeg", q);
    }
    if (dataUrl.length > preset.maxBytes && Math.max(width, height) > 320) {
      const s2 = 0.75;
      canvas.width = Math.max(1, Math.round(width * s2));
      canvas.height = Math.max(1, Math.round(height * s2));
      ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
      q = 0.55;
      dataUrl = canvas.toDataURL("image/jpeg", q);
      while (dataUrl.length > preset.maxBytes && q > 0.3) {
        q -= 0.05;
        dataUrl = canvas.toDataURL("image/jpeg", q);
      }
    }
    if (dataUrl.length > preset.maxBytes * 1.5) {
      throw new Error("Photo is still too large — try a clearer close-up photo");
    }
    return dataUrl;
  } finally {
    bitmap.close();
  }
}
