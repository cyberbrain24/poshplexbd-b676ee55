import { supabase } from "@/integrations/supabase/client";

export interface MediaMetadata {
  id: string;
  bucket_id: string;
  file_path: string;
  display_name: string | null;
  seo_slug: string | null;
  alt_text: string | null;
  title_attribute: string | null;
  meta_description: string | null;
  keywords: string[] | null;
  created_at: string;
  updated_at: string;
}

export interface MediaMetadataUpsert {
  bucket_id: string;
  file_path: string;
  display_name?: string | null;
  seo_slug?: string | null;
  alt_text?: string | null;
  title_attribute?: string | null;
  meta_description?: string | null;
  keywords?: string[] | null;
}

/**
 * Generate a URL-safe slug from a string
 */
export const generateSlug = (text: string): string => {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
};

/**
 * Fetch metadata for a specific file
 */
export const fetchMediaMetadata = async (
  bucketId: string,
  filePath: string
): Promise<MediaMetadata | null> => {
  const { data, error } = await supabase
    .from("media_metadata")
    .select("*")
    .eq("bucket_id", bucketId)
    .eq("file_path", filePath)
    .maybeSingle();

  if (error) throw error;
  return data as MediaMetadata | null;
};

/**
 * Fetch all metadata records (for merging with storage listing)
 */
export const fetchAllMediaMetadata = async (): Promise<MediaMetadata[]> => {
  const { data, error } = await supabase
    .from("media_metadata")
    .select("*");

  if (error) throw error;
  return (data || []) as MediaMetadata[];
};

/**
 * Upsert metadata for a media file
 */
export const upsertMediaMetadata = async (
  payload: MediaMetadataUpsert
): Promise<MediaMetadata> => {
  // Check slug uniqueness if provided
  if (payload.seo_slug) {
    const { data: existing } = await supabase
      .from("media_metadata")
      .select("id")
      .eq("seo_slug", payload.seo_slug)
      .neq("bucket_id", payload.bucket_id)
      .neq("file_path", payload.file_path)
      .maybeSingle();

    // Also check same bucket different path
    if (!existing) {
      const { data: existing2 } = await supabase
        .from("media_metadata")
        .select("id")
        .eq("seo_slug", payload.seo_slug)
        .not("bucket_id", "eq", payload.bucket_id)
        .maybeSingle();

      if (existing2) {
        throw new Error("This SEO slug is already in use by another file.");
      }
    }
    if (existing) {
      throw new Error("This SEO slug is already in use by another file.");
    }
  }

  const { data, error } = await supabase
    .from("media_metadata")
    .upsert(
      {
        bucket_id: payload.bucket_id,
        file_path: payload.file_path,
        display_name: payload.display_name,
        seo_slug: payload.seo_slug || null,
        alt_text: payload.alt_text,
        title_attribute: payload.title_attribute,
        meta_description: payload.meta_description,
        keywords: payload.keywords || [],
      },
      { onConflict: "bucket_id,file_path" }
    )
    .select()
    .single();

  if (error) throw error;
  return data as MediaMetadata;
};

/**
 * Delete metadata when a file is deleted
 */
export const deleteMediaMetadata = async (
  bucketId: string,
  filePath: string
): Promise<void> => {
  const { error } = await supabase
    .from("media_metadata")
    .delete()
    .eq("bucket_id", bucketId)
    .eq("file_path", filePath);

  if (error) throw error;
};
