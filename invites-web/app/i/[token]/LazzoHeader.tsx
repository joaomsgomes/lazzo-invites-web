'use client';

import { BrandColors, Spacing } from '../../design/constants';

// ═══════════════════════════════════════════════════════════════════
// LazzoHeader — Persistent brand header shown for ALL event states
//
// Layout: [Logo (infinity gradient + "LAZZO")] — [Get the app CTA]
// Sticky top bar encouraging app installs, matching web standards.
// ═══════════════════════════════════════════════════════════════════

const APP_STORE_URL = process.env.NEXT_PUBLIC_APPSTORE_URL || '#';
const PLAY_STORE_URL = process.env.NEXT_PUBLIC_PLAYSTORE_URL || '#';

/** Inline infinity symbol SVG with Lazzo brand gradient (green → purple → orange) */
function LazzoLogo({ size = 28 }: { size?: number }) {
  const id = 'lazzo-grad';
  return (
    <svg
      width={size * 1.8}
      height={size}
      viewBox="0 0 36 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Lazzo logo"
    >
      <defs>
        <linearGradient id={id} x1="0" y1="10" x2="36" y2="10" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor={BrandColors.planning} />
          <stop offset="50%" stopColor={BrandColors.living} />
          <stop offset="100%" stopColor={BrandColors.recap} />
        </linearGradient>
      </defs>
      <path
        d="M18,10 C18,5.5 13.5,1.5 9,1.5 C4.5,1.5 0.5,5.5 0.5,10 C0.5,14.5 4.5,18.5 9,18.5 C13.5,18.5 18,14.5 18,10 C18,5.5 22.5,1.5 27,1.5 C31.5,1.5 35.5,5.5 35.5,10 C35.5,14.5 31.5,18.5 27,18.5 C22.5,18.5 18,14.5 18,10 Z"
        stroke={`url(#${id})`}
        strokeWidth="2.2"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

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
        {/* ── Logo lockup: Infinity gradient + "LAZZO" wordmark ── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <LazzoLogo size={24} />
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
