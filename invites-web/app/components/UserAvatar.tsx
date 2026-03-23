'use client';

import { useCallback, useState, type SyntheticEvent } from 'react';
import { BrandColors } from '@/app/design/constants';
import { resolveAvatarUrl } from '@/lib/avatar';

export type UserAvatarProps = {
  name: string;
  avatarUrl: string | null;
  /** Circle diameter in px */
  size?: number;
  fontSize?: string;
  fontWeight?: number | string;
};

/**
 * Rounded avatar: photo when URL loads, otherwise first letter of name.
 * Supports signed HTTPS URLs and relative storage paths (via resolveAvatarUrl + legacy fallback).
 */
export default function UserAvatar({
  name,
  avatarUrl,
  size = 48,
  fontSize,
  fontWeight = 600,
}: UserAvatarProps) {
  const [broken, setBroken] = useState(false);
  const resolved = avatarUrl ? resolveAvatarUrl(avatarUrl) : null;
  const initial = (name || '?').charAt(0).toUpperCase();
  const fs = fontSize ?? `${Math.max(10, Math.round(size * 0.36))}px`;

  const handleImgError = useCallback(
    (e: SyntheticEvent<HTMLImageElement>) => {
      const el = e.currentTarget;
      if (el.dataset.fallbackTried === '1') {
        setBroken(true);
        return;
      }
      if (avatarUrl && !avatarUrl.startsWith('http')) {
        const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
        if (base) {
          el.dataset.fallbackTried = '1';
          el.src = `${base}/storage/v1/object/public/avatars/${avatarUrl}`;
          return;
        }
      }
      setBroken(true);
    },
    [avatarUrl]
  );

  const showImg = Boolean(resolved && !broken);

  return (
    <div
      style={{
        width: `${size}px`,
        height: `${size}px`,
        borderRadius: '50%',
        background: BrandColors.bg3,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: fs,
        fontWeight,
        color: BrandColors.text2,
        overflow: 'hidden',
        flexShrink: 0,
      }}
    >
      {showImg ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={resolved!}
          alt={name || 'User'}
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          onError={handleImgError}
        />
      ) : (
        initial
      )}
    </div>
  );
}
