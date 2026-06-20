/**
 * Generate two resized WebP variants of a product image, client-side via canvas.
 * - thumb:  300 px wide (height auto), q≈0.72  (used in grids)
 * - medium: ~800 px on the long edge, q≈0.78  (used on product detail)
 *
 * GIFs / SVGs are skipped (animation / vector preserved as the original).
 * If anything fails (canvas tainted, decode error, no WebP support), returns
 * `{ thumb: null, medium: null }` and the caller falls back to the original.
 */
export interface ImageVariants {
  thumb: File | null;
  medium: File | null;
}

const VARIANT_SPECS = [
  { label: "thumb" as const, width: 400, quality: 0.72 },
  { label: "medium" as const, edge: 800, quality: 0.78 },
];

async function fileToImage(file: File): Promise<HTMLImageElement> {
  const url = URL.createObjectURL(file);
  try {
    return await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error("decode failed"));
      img.src = url;
    });
  } finally {
    // Revoke after image has fully decoded
    setTimeout(() => URL.revokeObjectURL(url), 0);
  }
}

async function resizeToWebp(
  img: HTMLImageElement,
  spec: { width?: number; edge?: number },
  quality: number,
  baseName: string,
  label: string,
): Promise<File | null> {
  // Thumbnail width is fixed at 400px; height follows the original image ratio.
  const longest = Math.max(img.width, img.height);
  const scale = spec.width ? spec.width / img.width : longest > spec.edge! ? spec.edge! / longest : 1;
  const w = Math.max(1, Math.round(img.width * scale));
  const h = Math.max(1, Math.round(img.height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  ctx.drawImage(img, 0, 0, w, h);

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob((b) => resolve(b), "image/webp", quality),
  );
  if (!blob) return null;
  return new File([blob], `${baseName}-${label}.webp`, { type: "image/webp" });
}

export async function generateImageVariants(file: File): Promise<ImageVariants> {
  if (!file.type.startsWith("image/") || file.type === "image/gif" || file.type === "image/svg+xml") {
    return { thumb: null, medium: null };
  }

  let img: HTMLImageElement;
  try {
    img = await fileToImage(file);
  } catch {
    return { thumb: null, medium: null };
  }

  const baseName = file.name.replace(/\.[^.]+$/, "") || "image";

  try {
    const [thumb, medium] = await Promise.all(
      VARIANT_SPECS.map((spec) => resizeToWebp(img, spec, spec.quality, baseName, spec.label)),
    );
    return { thumb, medium };
  } catch {
    return { thumb: null, medium: null };
  }
}
