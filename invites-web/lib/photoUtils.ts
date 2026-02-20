/**
 * Photo utilities for web — compression + upload to Supabase storage.
 * Matches Flutter's image_compression_service.dart pipeline:
 * - Max edge: 1280px
 * - WebP format with quality 80%, stepped down to 55% min if >1MB
 * - EXIF orientation handled by browser Canvas automatically
 */

import type { SupabaseClient } from '@supabase/supabase-js';

const MAX_DIMENSION = 1280;
const INITIAL_QUALITY = 0.80;
const MIN_QUALITY = 0.55;
const QUALITY_STEP = 0.10;
const MAX_SIZE_BYTES = 1024 * 1024; // 1 MB

// ── Image Compression ────────────────────────────────────────────

export interface CompressedImage {
  blob: Blob;
  isPortrait: boolean;
  width: number;
  height: number;
}

/**
 * Compresses an image file using Canvas API.
 * Resizes to max 1280px edge, outputs WebP at 80% quality.
 * Automatically reduces quality until under 1MB.
 */
export async function compressImage(file: File): Promise<CompressedImage> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);

      let { width, height } = img;
      const isPortrait = height > width;

      // Scale down if either dimension exceeds MAX_DIMENSION
      if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
        if (width > height) {
          height = Math.round((height / width) * MAX_DIMENSION);
          width = MAX_DIMENSION;
        } else {
          width = Math.round((width / height) * MAX_DIMENSION);
          height = MAX_DIMENSION;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Canvas 2D not supported'));
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);

      // Try WebP, use JPEG as fallback for older browsers
      const supportsWebP = canvas.toDataURL('image/webp').startsWith('data:image/webp');
      const mimeType = supportsWebP ? 'image/webp' : 'image/jpeg';

      const tryCompress = (quality: number) => {
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Image compression failed'));
              return;
            }

            if (blob.size > MAX_SIZE_BYTES && quality > MIN_QUALITY) {
              // Retry with lower quality
              tryCompress(quality - QUALITY_STEP);
            } else {
              resolve({ blob, isPortrait, width, height });
            }
          },
          mimeType,
          quality
        );
      };

      tryCompress(INITIAL_QUALITY);
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Failed to load image'));
    };

    img.src = objectUrl;
  });
}

// ── Photo Upload ─────────────────────────────────────────────────

export interface UploadResult {
  success: true;
  storagePath: string;
  signedUrl: string;
  isPortrait: boolean;
  photoId?: string;
}

export interface UploadError {
  success: false;
  error: string;
}

/**
 * Uploads a compressed photo to Supabase storage + creates event_photos record.
 *
 * Requires:
 * 1. Authenticated user session (OTP)
 * 2. User is an event participant (call accept_event_invite_by_token first)
 *
 * Storage path: {eventId}/{eventId}/{userId}/{uuid}.ext
 * (matches Flutter's StorageService convention)
 */
export async function uploadPhoto(
  supabase: SupabaseClient,
  eventId: string,
  userId: string,
  compressed: CompressedImage
): Promise<UploadResult | UploadError> {
  const uuid = crypto.randomUUID();
  const ext = compressed.blob.type === 'image/webp' ? 'webp' : 'jpg';
  const storagePath = `${eventId}/${eventId}/${userId}/${uuid}.${ext}`;

  // 1. Upload to Supabase Storage
  const { error: uploadError } = await supabase.storage
    .from('memory_groups')
    .upload(storagePath, compressed.blob, {
      contentType: compressed.blob.type,
      upsert: false,
    });

  if (uploadError) {
    return { success: false, error: `Upload failed: ${uploadError.message}` };
  }

  // 2. Create event_photos record
  const { data: photoData, error: dbError } = await supabase
    .from('event_photos')
    .insert({
      event_id: eventId,
      url: storagePath,
      storage_path: storagePath,
      uploader_id: userId,
      is_portrait: compressed.isPortrait,
      captured_at: new Date().toISOString(),
    })
    .select('id')
    .single();

  if (dbError) {
    // Cleanup: remove uploaded file since DB insert failed
    await supabase.storage.from('memory_groups').remove([storagePath]);
    return { success: false, error: `Database error: ${dbError.message}` };
  }

  // 3. Generate signed URL for immediate display
  const { data: signedData } = await supabase.storage
    .from('memory_groups')
    .createSignedUrl(storagePath, 7200); // 2 hours

  return {
    success: true,
    storagePath,
    signedUrl: signedData?.signedUrl || '',
    isPortrait: compressed.isPortrait,
    photoId: photoData?.id,
  };
}

/**
 * Ensures the authenticated user is an event participant.
 * Returns the event_id on success, or null on failure.
 * Idempotent — calling multiple times is safe.
 */
export async function ensureEventParticipant(
  supabase: SupabaseClient,
  token: string
): Promise<{ eventId: string; eventName: string } | null> {
  try {
    const { data, error } = await supabase.rpc('accept_event_invite_by_token', {
      p_token: token,
    });

    if (error || !data || data.length === 0) return null;

    const row = Array.isArray(data) ? data[0] : data;
    return {
      eventId: row.event_id,
      eventName: row.event_name,
    };
  } catch {
    return null;
  }
}
