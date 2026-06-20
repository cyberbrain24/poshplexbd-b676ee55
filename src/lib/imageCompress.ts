import { toWebpUnder250 } from "./imageToWebp";

/**
 * Compress a profile image to a 400x400 WebP under 250KB (center-crop).
 * Signature kept for backward compatibility; size/maxBytes args are honored.
 */
export async function compressProfileImage(
  file: File,
  size = 400,
  maxBytes = 250 * 1024
): Promise<File> {
  const allowed = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
  if (!allowed.includes(file.type.toLowerCase())) {
    throw new Error("Only JPG, JPEG, PNG, or WebP files are allowed");
  }
  return toWebpUnder250(file, { squareCrop: true, squareSize: size, maxBytes });
}

/**
 * Compress a product image to WebP under 250KB, preserving aspect ratio.
 * GIFs and SVGs are returned untouched.
 */
export async function compressProductImage(
  file: File,
  maxEdge = 2000,
  maxBytes = 250 * 1024
): Promise<File> {
  return toWebpUnder250(file, { startEdge: maxEdge, maxBytes });
}
