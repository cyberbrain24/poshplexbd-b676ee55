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
