'use client';

import { useCallback, useState, useRef, useEffect } from 'react';
import { BrandColors, Spacing } from '../../design/constants';

// ═══════════════════════════════════════════════════════════════════
// CalendarButton — Adds event directly to phone Calendar app
//
// iOS:     Opens .ics blob → native "Add to Calendar" prompt
// Android: Opens Google Calendar create-event URL → Calendar intent
// Desktop: Shows dropdown with Apple Calendar + Google Calendar
// ═══════════════════════════════════════════════════════════════════

interface CalendarButtonProps {
  eventName: string;
  startDatetime: string;
  endDatetime: string | null;
  locationName: string | null;
  locationAddress: string | null;
  description: string | null;
}

// ── Helpers ──────────────────────────────────────────────────────

function detectPlatform(): 'ios' | 'android' | 'desktop' {
  if (typeof navigator === 'undefined') return 'desktop';
  const ua = navigator.userAgent.toLowerCase();
  if (/iphone|ipad|ipod/.test(ua)) return 'ios';
  if (/android/.test(ua)) return 'android';
  return 'desktop';
}

function formatICSDate(isoDate: string): string {
  const d = new Date(isoDate);
  const pad = (n: number) => n.toString().padStart(2, '0');
  return (
    d.getUTCFullYear().toString() +
    pad(d.getUTCMonth() + 1) +
    pad(d.getUTCDate()) +
    'T' +
    pad(d.getUTCHours()) +
    pad(d.getUTCMinutes()) +
    pad(d.getUTCSeconds()) +
    'Z'
  );
}

function escapeICS(text: string): string {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n');
}

function getDefaultEnd(start: string): string {
  return formatICSDate(
    new Date(new Date(start).getTime() + 2 * 60 * 60 * 1000).toISOString()
  );
}

function generateICSContent(props: CalendarButtonProps): string {
  const start = formatICSDate(props.startDatetime);
  const end = props.endDatetime ? formatICSDate(props.endDatetime) : getDefaultEnd(props.startDatetime);
  const location = [props.locationName, props.locationAddress].filter(Boolean).join(', ');
  const uid = `${Date.now()}-${Math.random().toString(36).slice(2)}@getlazzo.com`;

  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Lazzo//Event Invite//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTART:${start}`,
    `DTEND:${end}`,
    `SUMMARY:${escapeICS(props.eventName)}`,
    ...(location ? [`LOCATION:${escapeICS(location)}`] : []),
    ...(props.description ? [`DESCRIPTION:${escapeICS(props.description)}`] : []),
    `DTSTAMP:${formatICSDate(new Date().toISOString())}`,
    'STATUS:CONFIRMED',
    'BEGIN:VALARM',
    'TRIGGER:-PT30M',
    'ACTION:DISPLAY',
    `DESCRIPTION:${escapeICS(props.eventName)} starts in 30 minutes`,
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
  ];

  return lines.join('\r\n');
}

function generateGoogleCalendarUrl(props: CalendarButtonProps): string {
  const start = formatICSDate(props.startDatetime);
  const end = props.endDatetime ? formatICSDate(props.endDatetime) : getDefaultEnd(props.startDatetime);
  const location = [props.locationName, props.locationAddress].filter(Boolean).join(', ');

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: props.eventName,
    dates: `${start}/${end}`,
    ...(location ? { location } : {}),
    ...(props.description ? { details: props.description } : {}),
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

// ── Component ────────────────────────────────────────────────────

export default function CalendarButton(props: CalendarButtonProps) {
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    if (!showMenu) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showMenu]);

  /** iOS: opens .ics blob → native Calendar prompt */
  const handleAppleCalendar = useCallback(() => {
    const icsContent = generateICSContent(props);
    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const blobUrl = URL.createObjectURL(blob);
    // window.open triggers the native calendar dialog on iOS Safari
    window.open(blobUrl, '_blank');
    setTimeout(() => URL.revokeObjectURL(blobUrl), 10_000);
    setShowMenu(false);
  }, [props]);

  /** Android: opens Google Calendar create event URL → Calendar intent */
  const handleGoogleCalendar = useCallback(() => {
    window.open(generateGoogleCalendarUrl(props), '_blank');
    setShowMenu(false);
  }, [props]);

  /** Main button click — platform-aware */
  const handleClick = useCallback(() => {
    const platform = detectPlatform();
    if (platform === 'ios') {
      handleAppleCalendar();
    } else if (platform === 'android') {
      handleGoogleCalendar();
    } else {
      // Desktop: show dropdown with both options
      setShowMenu((prev) => !prev);
    }
  }, [handleAppleCalendar, handleGoogleCalendar]);

  return (
    <div style={{ position: 'relative' }} ref={menuRef}>
      <button
        onClick={handleClick}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: Spacing.xs,
          padding: `${Spacing.sm} ${Spacing.md}`,
          background: 'transparent',
          border: `1px solid ${BrandColors.border}`,
          borderRadius: Spacing.radiusSm,
          color: BrandColors.text1,
          fontSize: '14px',
          fontWeight: 500,
          cursor: 'pointer',
          transition: 'background 0.15s',
        }}
        onMouseEnter={(e) => { (e.currentTarget).style.background = BrandColors.bg3; }}
        onMouseLeave={(e) => { (e.currentTarget).style.background = 'transparent'; }}
      >
        📅 Add to calendar
      </button>

      {/* Desktop dropdown: Apple versus Google */}
      {showMenu && (
        <div style={{
          position: 'absolute',
          top: 'calc(100% + 4px)',
          left: 0,
          right: 0,
          background: BrandColors.bg3,
          border: `1px solid ${BrandColors.border}`,
          borderRadius: Spacing.radiusSm,
          overflow: 'hidden',
          zIndex: 10,
          boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
        }}>
          <button
            onClick={handleAppleCalendar}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              gap: Spacing.xs,
              padding: `${Spacing.sm} ${Spacing.md}`,
              background: 'transparent',
              border: 'none',
              color: BrandColors.text1,
              fontSize: '14px',
              cursor: 'pointer',
              textAlign: 'left',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = BrandColors.bg2; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
          >
            🍎 Apple Calendar
          </button>
          <div style={{ height: '1px', background: BrandColors.border }} />
          <button
            onClick={handleGoogleCalendar}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              gap: Spacing.xs,
              padding: `${Spacing.sm} ${Spacing.md}`,
              background: 'transparent',
              border: 'none',
              color: BrandColors.text1,
              fontSize: '14px',
              cursor: 'pointer',
              textAlign: 'left',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = BrandColors.bg2; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
          >
            📆 Google Calendar
          </button>
        </div>
      )}
    </div>
  );
}
