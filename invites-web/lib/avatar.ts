const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

function buildPublicStorageUrl(bucket: string, path: string): string | null {
  if (!supabaseUrl) return null;
  return `${supabaseUrl}/storage/v1/object/public/${bucket}/${path}`;
}

/**
 * Normalize avatar URLs coming from DB.
 * - absolute URL -> return as-is
 * - relative storage path -> resolve against known avatar buckets
 */
export function resolveAvatarUrl(avatarUrl: string | null): string | null {
  if (!avatarUrl) return null;

  if (
    avatarUrl.startsWith('http://') ||
    avatarUrl.startsWith('https://') ||
    avatarUrl.startsWith('data:') ||
    avatarUrl.startsWith('blob:')
  ) {
    return avatarUrl;
  }

  // Prefer current bucket naming used in schema.
  return (
    buildPublicStorageUrl('users-profile-pic', avatarUrl) ||
    buildPublicStorageUrl('avatars', avatarUrl)
  );
}
