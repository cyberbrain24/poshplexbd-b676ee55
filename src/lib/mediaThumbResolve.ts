import type { MediaFile } from "@/services/media.service";

const SAME_FOLDER_SUFFIX_RE = /-(thumb|medium)(\.[a-z0-9]+)$/i;
const VARIANT_FOLDER_RE = /^(.*\/)?(thumbs|medium)\/([^/]+?)-(300|400|800|thumb|medium)(\.[a-z0-9]+)$/i;

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
 *  1. If the file name ends in `-thumb.<ext>` or `-medium.<ext>`, strip the
 *     suffix and look up a file in the same folder + bucket whose stem matches.
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
