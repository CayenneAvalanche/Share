/** Client-side compress for license / insurance uploads (pilot — no S3 yet). */

const MAX_EDGE = 1280;
const QUALITY = 0.72;
const MAX_BYTES = 450_000; // ~450KB data URL budget

export async function fileToCompressedDataUrl(file: File): Promise<string> {
  if (!file.type.startsWith("image/")) {
    throw new Error("Please choose a photo (JPG or PNG)");
  }
  const bitmap = await createImageBitmap(file);
  try {
    let { width, height } = bitmap;
    const scale = Math.min(1, MAX_EDGE / Math.max(width, height));
    width = Math.max(1, Math.round(width * scale));
    height = Math.max(1, Math.round(height * scale));

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Could not process image");
    ctx.drawImage(bitmap, 0, 0, width, height);

    let q = QUALITY;
    let dataUrl = canvas.toDataURL("image/jpeg", q);
    while (dataUrl.length > MAX_BYTES && q > 0.4) {
      q -= 0.08;
      dataUrl = canvas.toDataURL("image/jpeg", q);
    }
    if (dataUrl.length > MAX_BYTES * 1.4) {
      throw new Error("Photo is still too large — try a clearer close-up photo");
    }
    return dataUrl;
  } finally {
    bitmap.close();
  }
}
