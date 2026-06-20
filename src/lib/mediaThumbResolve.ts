import type { MediaFile } from "@/services/media.service";

const SUFFIX_RE = /-(thumb|medium)(\.[a-z0-9]+)$/i;

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
  const m = file.name.match(SUFFIX_RE);
  if (!m) return file;

  const baseStem = file.name.slice(0, m.index!); // path without "-thumb.ext"
  const folder = baseStem.includes("/") ? baseStem.slice(0, baseStem.lastIndexOf("/")) : "";
  const stemName = baseStem.includes("/") ? baseStem.slice(baseStem.lastIndexOf("/") + 1) : baseStem;

  const candidate = allFiles.find((f) => {
    if (f.bucket_id !== file.bucket_id) return false;
    const fFolder = f.name.includes("/") ? f.name.slice(0, f.name.lastIndexOf("/")) : "";
    if (fFolder !== folder) return false;
    const fName = f.name.includes("/") ? f.name.slice(f.name.lastIndexOf("/") + 1) : f.name;
    const fStem = fName.replace(/\.[^.]+$/, "");
    // Skip other thumb/medium variants
    if (/-thumb$|-medium$/i.test(fStem)) return false;
    return fStem === stemName;
  });

  return candidate ?? file;
}

export function isDerivedThumbnail(file: MediaFile): boolean {
  return SUFFIX_RE.test(file.name);
}
