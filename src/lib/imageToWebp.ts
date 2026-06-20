/**
 * Convert any browser-decodable image to a WebP File under a target byte cap.
 * Strategy: progressively shrink longest edge and step quality until under cap.
 * - GIFs pass through (animation would be lost).
 * - SVGs pass through (vector, already tiny).
 * - On decode failure, throws — caller surfaces toast.
 */
export async function toWebpUnder250(
  file: File,
  opts: { maxBytes?: number; startEdge?: number; squareCrop?: boolean; squareSize?: number } = {}
): Promise<File> {
  const maxBytes = opts.maxBytes ?? 250 * 1024;
  const startEdge = opts.startEdge ?? 2000;

  if (!file.type.startsWith("image/")) return file;
  if (file.type === "image/gif") return file;
  if (file.type === "image/svg+xml") return file;
  // Already-WebP and under cap: skip re-encoding
  if (file.type === "image/webp" && file.size <= maxBytes && !opts.squareCrop) return file;

  const dataUrl = await new Promise<string>((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result as string);
    r.onerror = () => reject(new Error("Failed to read image"));
    r.readAsDataURL(file);
  });

  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const im = new Image();
    im.onload = () => resolve(im);
    im.onerror = () => reject(new Error("Invalid image file"));
    im.src = dataUrl;
  });

  const baseName = (file.name.replace(/\.[^.]+$/, "") || "image").replace(/[^a-z0-9-_]/gi, "_");

  // Optional square center-crop (used for avatars)
  if (opts.squareCrop) {
    const size = opts.squareSize ?? 400;
    const blob = await encodeSquare(img, size, maxBytes);
    if (blob) return new File([blob], `${baseName}.webp`, { type: "image/webp" });
  }

  const edges = [startEdge, 1600, 1280, 1024, 800].filter((e, i, a) => a.indexOf(e) === i);
  const qualities = [0.85, 0.78, 0.7, 0.6, 0.5];

  let smallest: Blob | null = null;
  for (const edge of edges) {
    const longest = Math.max(img.width, img.height);
    const scale = longest > edge ? edge / longest : 1;
    const w = Math.max(1, Math.round(img.width * scale));
    const h = Math.max(1, Math.round(img.height * scale));
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) break;
    ctx.drawImage(img, 0, 0, w, h);

    for (const q of qualities) {
      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob((b) => resolve(b), "image/webp", q)
      );
      if (!blob) continue;
      if (!smallest || blob.size < smallest.size) smallest = blob;
      if (blob.size <= maxBytes) {
        return new File([blob], `${baseName}.webp`, { type: "image/webp" });
      }
    }
    // If even at this edge / lowest q we can't hit cap, shrink further next iteration.
  }

  if (smallest) {
    return new File([smallest], `${baseName}.webp`, { type: "image/webp" });
  }
  // Should be unreachable; fall back to original.
  return file;
}

async function encodeSquare(img: HTMLImageElement, size: number, maxBytes: number): Promise<Blob | null> {
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  const scale = Math.max(size / img.width, size / img.height);
  const sw = size / scale;
  const sh = size / scale;
  const sx = (img.width - sw) / 2;
  const sy = (img.height - sh) / 2;
  ctx.drawImage(img, sx, sy, sw, sh, 0, 0, size, size);

  let smallest: Blob | null = null;
  for (const q of [0.9, 0.82, 0.74, 0.66, 0.58, 0.5]) {
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob((b) => resolve(b), "image/webp", q)
    );
    if (!blob) continue;
    if (!smallest || blob.size < smallest.size) smallest = blob;
    if (blob.size <= maxBytes) return blob;
  }
  return smallest;
}
