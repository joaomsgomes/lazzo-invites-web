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

/**
 * Infinity icon matching the Lazzo brand logo exactly.
 * Two thick donut-shaped loops overlapping at the center.
 * Left loop is drawn ON TOP → creates the crossover depth effect.
 *
 * Gradient: green → cyan → purple (left loop) | purple → pink → orange (right loop)
 */
function LazzoLogo({ size = 28 }: { size?: number }) {
  const w = size * 2;
  const h = size;
  return (
    <svg
      width={w}
      height={h}
      viewBox="20 4 160 92"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Lazzo logo"
    >
      <defs>
        {/* Right loop gradient: purple → pink → orange */}
        <linearGradient id="lz-r" x1="88" y1="50" x2="176" y2="50" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#9333EA" />
          <stop offset="50%" stopColor="#EC4899" />
          <stop offset="100%" stopColor="#FB923C" />
        </linearGradient>
        {/* Left loop gradient: green → cyan → purple */}
        <linearGradient id="lz-l" x1="24" y1="50" x2="112" y2="50" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#00E85F" />
          <stop offset="50%" stopColor="#06B6D4" />
          <stop offset="100%" stopColor="#9333EA" />
        </linearGradient>
      </defs>

      {/* Right loop donut — drawn FIRST so it sits behind at the crossing */}
      <path
        fillRule="evenodd"
        d="M132,6 A44,44 0 1,1 132,94 A44,44 0 1,1 132,6 Z M132,26 A24,24 0 1,0 132,74 A24,24 0 1,0 132,26 Z"
        fill="url(#lz-r)"
      />

      {/* Left loop donut — drawn SECOND so it sits in front at the crossing */}
      <path
        fillRule="evenodd"
        d="M68,6 A44,44 0 1,1 68,94 A44,44 0 1,1 68,6 Z M68,26 A24,24 0 1,0 68,74 A24,24 0 1,0 68,26 Z"
        fill="url(#lz-l)"
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
