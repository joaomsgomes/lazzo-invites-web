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

/** Inline infinity symbol SVG with Lazzo brand gradient (green → purple → orange)
 *  Thick filled shape matching the brand logo exactly. */
function LazzoLogo({ size = 28 }: { size?: number }) {
  const id = 'lazzo-grad';
  // Aspect ratio of the infinity icon is roughly 2:1
  const w = size * 2;
  const h = size;
  return (
    <svg
      width={w}
      height={h}
      viewBox="0 0 200 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Lazzo logo"
    >
      <defs>
        <linearGradient id={id} x1="0" y1="50" x2="200" y2="50" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#00E85F" />
          <stop offset="25%" stopColor="#00C7FF" />
          <stop offset="50%" stopColor="#A855F7" />
          <stop offset="75%" stopColor="#F97316" />
          <stop offset="100%" stopColor="#FF6B2B" />
        </linearGradient>
      </defs>
      {/* Thick infinity symbol (∞) — two overlapping loops crossing at center */}
      <path
        d={[
          // Outer left loop
          'M100,50',
          'C100,23 78,3 53,3',
          'C28,3 5,23 5,50',
          'C5,77 28,97 53,97',
          'C78,97 100,77 100,50',
          'Z',
        ].join(' ')}
        fill={`url(#${id})`}
      />
      <path
        d={[
          // Outer right loop
          'M100,50',
          'C100,77 122,97 147,97',
          'C172,97 195,77 195,50',
          'C195,23 172,3 147,3',
          'C122,3 100,23 100,50',
          'Z',
        ].join(' ')}
        fill={`url(#${id})`}
      />
      {/* Inner cutouts to create the hollow infinity shape */}
      <path
        d={[
          'M100,50',
          'C100,33 82,17 53,17',
          'C32,17 19,33 19,50',
          'C19,67 32,83 53,83',
          'C82,83 100,67 100,50',
          'Z',
        ].join(' ')}
        fill={BrandColors.bg1}
      />
      <path
        d={[
          'M100,50',
          'C100,67 118,83 147,83',
          'C168,83 181,67 181,50',
          'C181,33 168,17 147,17',
          'C118,17 100,33 100,50',
          'Z',
        ].join(' ')}
        fill={BrandColors.bg1}
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
