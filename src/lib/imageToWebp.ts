/**
 * WebP auto re-encoding removed by user request.
 * This function is now a passthrough: uploaded images are stored in their
 * original format. Responsive WebP variants (see `imageThumbs.ts`) are
 * unaffected and still generated for grid/detail rendering.
 */
export async function toWebpUnder250(
  file: File,
  _opts: { maxBytes?: number; startEdge?: number; squareCrop?: boolean; squareSize?: number } = {}
): Promise<File> {
  return file;
}
