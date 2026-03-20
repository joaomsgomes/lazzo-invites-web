'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { BrandColors, Spacing, Typography } from '../../design/constants';
import { trackInviteLinkShared } from '../../../lib/analytics';
import QRCode from 'qrcode';

// ═══════════════════════════════════════════════════════════════════
// ShareSheet — Bottom sheet modal with two sharing modes:
//   1. QR Code — scannable QR that opens the invite link
//   2. Card — Partiful-style visual card with event emoji + link
//
// QR generation uses the `qrcode` npm package (canvas-based).
// ═══════════════════════════════════════════════════════════════════

interface ShareSheetProps {
  inviteUrl: string;
  eventId: string;
  eventName: string;
  eventEmoji: string;
  onClose: () => void;
}

type Tab = 'qr' | 'card';

export default function ShareSheet({ inviteUrl, eventId, eventName, eventEmoji, onClose }: ShareSheetProps) {
  const [tab, setTab] = useState<Tab>('qr');
  const [copied, setCopied] = useState(false);
  const backdropRef = useRef<HTMLDivElement>(null);

  // Close on backdrop click
  const handleBackdrop = useCallback((e: React.MouseEvent) => {
    if (e.target === backdropRef.current) onClose();
  }, [onClose]);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  // Lock body scroll while sheet is open
  useEffect(() => {
    const original = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = original; };
  }, []);

  // Copy link
  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback: textarea copy
      const ta = document.createElement('textarea');
      ta.value = inviteUrl;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
    trackInviteLinkShared(eventId, 'copy_link');
  }, [inviteUrl, eventId]);

  // Native share
  const handleShare = useCallback(async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: eventName,
          text: `Join ${eventName} on Lazzo! 🎉`,
          url: inviteUrl,
        });
        trackInviteLinkShared(eventId, 'share');
      } catch {
        // User cancelled
      }
    } else {
      handleCopy();
    }
  }, [eventName, inviteUrl, handleCopy, eventId]);

  return (
    <div
      ref={backdropRef}
      onClick={handleBackdrop}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 940,
        background: 'rgba(0, 0, 0, 0.7)',
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
        animation: 'shareSheetFadeIn 0.2s ease-out',
      }}
    >
      <div style={{
        width: '100%',
        maxWidth: '500px',
        background: BrandColors.bg2,
        borderRadius: `${Spacing.radiusMd} ${Spacing.radiusMd} 0 0`,
        padding: `${Spacing.md} ${Spacing.md} ${Spacing.xl}`,
        animation: 'shareSheetSlideUp 0.25s ease-out',
      }}>
        {/* Grabber */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: Spacing.md }}>
          <div style={{
            width: '40px',
            height: '4px',
            borderRadius: '2px',
            background: BrandColors.border,
          }} />
        </div>

        {/* Title */}
        <div style={{
          ...Typography.titleMediumEmph,
          color: BrandColors.text1,
          marginBottom: Spacing.md,
        }}>
          Share
        </div>

        {/* Tab switcher */}
        <div style={{
          display: 'flex',
          height: '44px',
          background: BrandColors.bg3,
          borderRadius: Spacing.radiusSm,
          padding: '3px',
          marginBottom: Spacing.lg,
        }}>
          <TabButton
            label="QR Code"
            icon="qr"
            isSelected={tab === 'qr'}
            onClick={() => setTab('qr')}
          />
          <TabButton
            label="Card"
            icon="card"
            isSelected={tab === 'card'}
            onClick={() => setTab('card')}
          />
        </div>

        {/* Content — vertical rhythm aligned with app (breathing room top/bottom) */}
        <div style={{
          minHeight: '360px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'stretch',
          justifyContent: 'center',
          paddingTop: Spacing.lg,
          paddingBottom: Spacing.xl,
        }}>
          {tab === 'qr' ? (
            <QrCodeTab inviteUrl={inviteUrl} />
          ) : (
            <InviteCardTab
              inviteUrl={inviteUrl}
              eventName={eventName}
              eventEmoji={eventEmoji}
            />
          )}
        </div>

        {/* Action buttons */}
        <div style={{ display: 'flex', gap: Spacing.sm, marginTop: Spacing.md }}>
          <button
            onClick={handleCopy}
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              padding: '14px',
              background: BrandColors.bg3,
              borderRadius: Spacing.radiusMd,
              border: 'none',
              cursor: 'pointer',
              color: BrandColors.text1,
              ...Typography.labelLargeEmph,
              transition: 'transform 0.15s',
            }}
            onMouseDown={(e) => { e.currentTarget.style.transform = 'scale(0.97)'; }}
            onMouseUp={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
          >
            <CopyIcon />
            {copied ? 'Copied!' : 'Copy link'}
          </button>
          <button
            onClick={handleShare}
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              padding: '14px',
              background: BrandColors.planning,
              borderRadius: Spacing.radiusMd,
              border: 'none',
              cursor: 'pointer',
              color: BrandColors.text1,
              ...Typography.labelLargeEmph,
              transition: 'transform 0.15s',
            }}
            onMouseDown={(e) => { e.currentTarget.style.transform = 'scale(0.97)'; }}
            onMouseUp={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
          >
            <ShareIcon />
            Share
          </button>
        </div>
      </div>

      {/* Animations */}
      <style>{`
        @keyframes shareSheetFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes shareSheetSlideUp {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}


// ── Tab Button ───────────────────────────────────────────────────

function TabButton({ label, icon, isSelected, onClick }: {
  label: string;
  icon: 'qr' | 'card';
  isSelected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '6px',
        background: isSelected ? BrandColors.bg2 : 'transparent',
        borderRadius: '4px',
        border: 'none',
        cursor: 'pointer',
        color: isSelected ? BrandColors.text1 : BrandColors.text2,
        ...Typography.labelLarge,
        fontWeight: isSelected ? 600 : 500,
        transition: 'all 0.15s',
      }}
    >
      {icon === 'qr' ? (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" />
          <rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="3" height="3" />
          <rect x="18" y="14" width="3" height="3" /><rect x="14" y="18" width="3" height="3" />
          <rect x="18" y="18" width="3" height="3" />
        </svg>
      ) : (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="2" y="3" width="20" height="18" rx="3" />
          <circle cx="12" cy="12" r="3" />
        </svg>
      )}
      {label}
    </button>
  );
}


// ── QR Code Tab ──────────────────────────────────────────────────

function QrCodeTab({ inviteUrl }: { inviteUrl: string }) {
  const [qrSrc, setQrSrc] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    QRCode.toDataURL(inviteUrl, {
      width: 300,
      margin: 0,
      color: { dark: '#000000', light: '#FFFFFF' },
      errorCorrectionLevel: 'M',
    }).then((url) => {
      if (!cancelled) setQrSrc(url);
    });
    return () => { cancelled = true; };
  }, [inviteUrl]);

  return (
    <div style={{
      width: '100%',
      padding: `${Spacing.md} ${Spacing.lg} ${Spacing.lg}`,
      background: BrandColors.bg3,
      borderRadius: Spacing.radiusMd,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: Spacing.md,
    }}>
      <div style={{
        padding: Spacing.md,
        background: '#FFFFFF',
        borderRadius: Spacing.radiusSm,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: 232,
        height: 232,
      }}>
        {qrSrc ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={qrSrc}
            alt="QR Code"
            width={200}
            height={200}
            style={{ display: 'block', imageRendering: 'pixelated' }}
          />
        ) : (
          <div style={{ width: 200, height: 200 }} />
        )}
      </div>
      <span style={{ ...Typography.bodyMedium, color: BrandColors.text2, textAlign: 'center' }}>
        Scan to join the event
      </span>
    </div>
  );
}


// ── Invite Card Tab (Partiful-style) ─────────────────────────────

function InviteCardTab({ inviteUrl, eventName, eventEmoji }: {
  inviteUrl: string;
  eventName: string;
  eventEmoji: string;
}) {
  const handleCardClick = useCallback(() => {
    window.open(inviteUrl, '_blank', 'noopener');
  }, [inviteUrl]);

  return (
    <div
      onClick={handleCardClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter') handleCardClick(); }}
      style={{
        width: '100%',
        padding: `${Spacing.xl} ${Spacing.lg}`,
        background: BrandColors.bg1,
        borderRadius: Spacing.radiusMd,
        border: `0.5px solid ${BrandColors.border}`,
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: Spacing.lg,
      }}
    >
      {/* Big emoji */}
      <div style={{ fontSize: '72px', lineHeight: 1 }}>
        {eventEmoji}
      </div>

      {/* Event name */}
      <div style={{
        ...Typography.titleLargeEmph,
        color: BrandColors.text1,
        textAlign: 'center',
        maxWidth: '100%',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        display: '-webkit-box',
        WebkitLineClamp: 2,
        WebkitBoxOrient: 'vertical',
      }}>
        {eventName}
      </div>

      {/* Subtitle */}
      <div style={{ ...Typography.bodyMedium, color: BrandColors.text2 }}>
        You&apos;re invited!
      </div>

      {/* Lazzo branding — app icon */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/app-icon.png"
          alt="Lazzo"
          width={20}
          height={20}
          style={{ borderRadius: '4px' }}
        />
        <span style={{
          ...Typography.labelLarge,
          color: BrandColors.text2,
          letterSpacing: '2px',
          fontWeight: 600,
        }}>
          LAZZO
        </span>
      </div>
    </div>
  );
}


// ── Icons ────────────────────────────────────────────────────────

function CopyIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  );
}

function ShareIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
      <polyline points="16 6 12 2 8 6" />
      <line x1="12" y1="2" x2="12" y2="15" />
    </svg>
  );
}
