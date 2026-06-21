import type { MediaFile } from "@/services/media.service";

// Same-folder suffix style: <stem>-thumb.webp / -small.webp / -medium.webp / -large.webp
const SAME_FOLDER_SUFFIX_RE = /-(thumb|small|medium|large)(\.[a-z0-9]+)$/i;
// Folder style: <prefix>/(thumbs|medium|large)/<stem>-(150|300|400|450|800|small|medium|large|thumb).<ext>
const VARIANT_FOLDER_RE = /^(.*\/)?(thumbs|medium|large)\/([^/]+?)-(150|300|400|450|800|thumb|small|medium|large)(\.[a-z0-9]+)$/i;

function stemOf(path: string): string {
  return path.replace(/\.[^/.]+$/, "");
}

function derivedMainStem(path: string): string | null {
  const folderMatch = path.match(VARIANT_FOLDER_RE);
  if (folderMatch) {
    const parent = (folderMatch[1] || "").replace(/\/$/, "");
    return parent ? `${parent}/${folderMatch[3]}` : folderMatch[3];
  }

  const suffixMatch = path.match(SAME_FOLDER_SUFFIX_RE);
  if (!suffixMatch) return null;
  return path.slice(0, suffixMatch.index!);
}

/**
 * Resolve a media file to its "main image" — the canonical original.
 * Used so SEO/metadata edits made on a derived thumbnail are stored against
 * the original image's record, keeping alt text / titles in sync.
 *
 * Rules:
 *  1. Files inside a `thumbs/`, `medium/`, or `large/` subfolder, OR ending
 *     in `-thumb / -small / -medium / -large`, are derived. Their main is
 *     the same-stem file in the parent folder.
 *  2. Otherwise the file itself is treated as the main image.
 */
export function resolveMainImage(
  file: MediaFile,
  allFiles: MediaFile[],
): MediaFile {
  const mainStem = derivedMainStem(file.name);
  if (!mainStem) return file;

  const candidate = allFiles.find((f) => (
    f.bucket_id === file.bucket_id
    && f.name !== file.name
    && !derivedMainStem(f.name)
    && stemOf(f.name) === mainStem
  ));

  return candidate ?? file;
}

export function isDerivedThumbnail(file: MediaFile): boolean {
  return Boolean(derivedMainStem(file.name));
}

export function getDerivativeImagesForMain(file: MediaFile, allFiles: MediaFile[]): MediaFile[] {
  const mainStem = stemOf(file.name);
  return allFiles.filter((f) => (
    f.bucket_id === file.bucket_id
    && f.name !== file.name
    && derivedMainStem(f.name) === mainStem
  ));
}

/**
 * Detect which of the three required thumbnail sizes (150/300/450 px) are
 * present for a given main image. Used to render the "thumbs ready" badge.
 */
export function thumbnailStatusFor(
  file: MediaFile,
  allFiles: MediaFile[],
): { has150: boolean; has300: boolean; has450: boolean; count: 0 | 1 | 2 | 3 } {
  if (isDerivedThumbnail(file)) {
    return { has150: false, has300: false, has450: false, count: 0 };
  }
  const derivatives = getDerivativeImagesForMain(file, allFiles);
  const widthRe = /-(150|300|450)\.[a-z0-9]+$/i;
  const found = new Set<string>();
  for (const d of derivatives) {
    const m = d.name.match(widthRe);
    if (m) found.add(m[1]);
  }
  const has150 = found.has("150");
  const has300 = found.has("300");
  const has450 = found.has("450");
  const count = ((has150 ? 1 : 0) + (has300 ? 1 : 0) + (has450 ? 1 : 0)) as 0 | 1 | 2 | 3;
  return { has150, has300, has450, count };
}

