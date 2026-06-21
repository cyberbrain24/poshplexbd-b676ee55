/**
 * Generate three resized WebP variants of a product image, client-side via canvas.
 * - small:  150 px wide (height auto), q≈0.70  (tiny grids / mobile)
 * - medium: 300 px wide (height auto), q≈0.74  (category grids)
 * - large:  450 px wide (height auto), q≈0.80  (product detail / zoom preview)
 *
 * Every derived variant is generated FROM the same main image, so deletion
 * cascading + SEO metadata sync stay anchored to that main file.
 *
 * GIFs / SVGs are skipped (animation / vector preserved as the original).
 * If anything fails (canvas tainted, decode error, no WebP support), returns
 * `{ small: null, medium: null, large: null }` and the caller falls back
 * to the original.
 */
export interface ImageVariants {
  small: File | null;
  medium: File | null;
  large: File | null;
  /** @deprecated alias for `small`, kept for legacy callers. */
  thumb: File | null;
}

const VARIANT_SPECS = [
  { label: "small" as const, width: 150, quality: 0.7 },
  { label: "medium" as const, width: 300, quality: 0.74 },
  { label: "large" as const, width: 450, quality: 0.8 },
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
    setTimeout(() => URL.revokeObjectURL(url), 0);
  }
}

async function resizeToWebp(
  img: HTMLImageElement,
  spec: { width: number },
  quality: number,
  baseName: string,
  label: string,
): Promise<File | null> {
  // Width-locked, height follows the original aspect ratio.
  const scale = spec.width / img.width;
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
  const empty: ImageVariants = { small: null, medium: null, large: null, thumb: null };
  if (!file.type.startsWith("image/") || file.type === "image/gif" || file.type === "image/svg+xml") {
    return empty;
  }

  let img: HTMLImageElement;
  try {
    img = await fileToImage(file);
  } catch {
    return empty;
  }

  const baseName = file.name.replace(/\.[^.]+$/, "") || "image";

  try {
    const [small, medium, large] = await Promise.all(
      VARIANT_SPECS.map((spec) => resizeToWebp(img, spec, spec.quality, baseName, spec.label)),
    );
    return { small, medium, large, thumb: small };
  } catch {
    return empty;
  }
}
