'use client';

import { BrandColors, Spacing } from '../../design/constants';

// ═══════════════════════════════════════════════════════════════════
// LazzoHeader — Persistent brand header shown for ALL event states
//
// Layout: [App Icon + "LAZZO"] — [Get the app CTA]
// Sticky top bar encouraging app installs, matching web standards.
// ═══════════════════════════════════════════════════════════════════

const APP_STORE_URL = 'https://testflight.apple.com/join/KtqX99vr';
const PLAY_STORE_URL = process.env.NEXT_PUBLIC_PLAYSTORE_URL || '#';

export default function LazzoHeader() {
  // Detect platform for CTA link
  const storeUrl = typeof navigator !== 'undefined' && /android/i.test(navigator.userAgent)
    ? PLAY_STORE_URL
    : APP_STORE_URL;

  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 900,
        background: BrandColors.bg1,
        borderBottom: `1px solid ${BrandColors.bg3}`,
      }}
    >
      <div
        style={{
          maxWidth: '520px',
          width: '100%',
          margin: '0 auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: `${Spacing.sm} ${Spacing.md}`,
          height: '56px',
          boxSizing: 'border-box',
        }}
      >
        {/* ── Logo lockup: App icon + "LAZZO" wordmark ── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/app-icon.png"
            alt="Lazzo"
            width={32}
            height={32}
            style={{ borderRadius: '8px' }}
          />
          <span
            style={{
              fontSize: '18px',
              fontWeight: 700,
              letterSpacing: '3px',
              color: BrandColors.text1,
              fontFamily: 'inherit',
            }}
          >
            LAZZO
          </span>
        </div>

        {/* ── CTA button ── */}
        <a
          href={storeUrl}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '8px 16px',
            borderRadius: Spacing.radiusPill,
            background: BrandColors.planning,
            color: '#FFFFFF',
            fontSize: '13px',
            fontWeight: 600,
            textDecoration: 'none',
            whiteSpace: 'nowrap',
            transition: 'opacity 0.2s',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.85')}
          onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
        >
          {/* Download icon */}
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          Get the app
        </a>
      </div>
    </header>
  );
}
