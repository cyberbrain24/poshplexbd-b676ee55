/**
 * Compress and resize an image to a square (default 400x400) JPEG
 * under a target max size (default 100KB). Uses center-crop ("cover").
 */
export async function compressProfileImage(
  file: File,
  size = 400,
  maxBytes = 100 * 1024
): Promise<File> {
  const allowed = ["image/jpeg", "image/jpg", "image/png"];
  if (!allowed.includes(file.type.toLowerCase())) {
    throw new Error("Only JPG, JPEG, and PNG files are allowed");
  }

  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("Failed to read image"));
    reader.readAsDataURL(file);
  });

  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const im = new Image();
    im.onload = () => resolve(im);
    im.onerror = () => reject(new Error("Invalid image file"));
    im.src = dataUrl;
  });

  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas not supported");

  // Center-crop "cover" scaling
  const scale = Math.max(size / img.width, size / img.height);
  const sw = size / scale;
  const sh = size / scale;
  const sx = (img.width - sw) / 2;
  const sy = (img.height - sh) / 2;
  ctx.drawImage(img, sx, sy, sw, sh, 0, 0, size, size);

  // Try decreasing JPEG quality until under maxBytes
  let quality = 0.9;
  let blob: Blob | null = null;
  for (let i = 0; i < 8; i++) {
    blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob((b) => resolve(b), "image/jpeg", quality)
    );
    if (blob && blob.size <= maxBytes) break;
    quality -= 0.1;
    if (quality < 0.3) break;
  }
  if (!blob) throw new Error("Failed to compress image");

  return new File([blob], "profile.jpg", { type: "image/jpeg" });
}

/**
 * Compress a product image preserving aspect ratio. Resizes so the longest
 * edge is at most `maxEdge` px and re-encodes as JPEG below `maxBytes`.
 * GIFs are returned untouched (animation would be lost).
 */
export async function compressProductImage(
  file: File,
  maxEdge = 1600,
  maxBytes = 800 * 1024
): Promise<File> {
  if (file.type === "image/gif") return file;
  if (!file.type.startsWith("image/")) return file;

  let dataUrl: string;
  try {
    dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error("Failed to read image"));
      reader.readAsDataURL(file);
    });
  } catch {
    return file;
  }

  let img: HTMLImageElement;
  try {
    img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const im = new Image();
      im.onload = () => resolve(im);
      im.onerror = () => reject(new Error("Invalid image file"));
      im.src = dataUrl;
    });
  } catch {
    return file;
  }

  const longest = Math.max(img.width, img.height);
  const scale = longest > maxEdge ? maxEdge / longest : 1;
  const w = Math.round(img.width * scale);
  const h = Math.round(img.height * scale);

  // Skip if no resize needed and file already small
  if (scale === 1 && file.size <= maxBytes) return file;

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) return file;
  ctx.drawImage(img, 0, 0, w, h);

  let quality = 0.88;
  let blob: Blob | null = null;
  for (let i = 0; i < 8; i++) {
    blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob((b) => resolve(b), "image/jpeg", quality)
    );
    if (blob && blob.size <= maxBytes) break;
    quality -= 0.1;
    if (quality < 0.4) break;
  }
  if (!blob) return file;
  // If compression made it bigger, keep original
  if (blob.size >= file.size) return file;

  const baseName = file.name.replace(/\.[^.]+$/, "") || "image";
  return new File([blob], `${baseName}.jpg`, { type: "image/jpeg" });
}
