'use client';

import { useCallback } from 'react';
import { BrandColors, Spacing } from '../../design/constants';

// ── CalendarButton: Generates and downloads an .ics file ──
// Works on all platforms including iPhone Safari

interface CalendarButtonProps {
  eventName: string;
  startDatetime: string;
  endDatetime: string | null;
  locationName: string | null;
  locationAddress: string | null;
  description: string | null;
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

export default function CalendarButton({
  eventName,
  startDatetime,
  endDatetime,
  locationName,
  locationAddress,
  description,
}: CalendarButtonProps) {
  const handleAddToCalendar = useCallback(() => {
    const start = formatICSDate(startDatetime);
    // Default to 2 hours after start if no end time
    const end = endDatetime
      ? formatICSDate(endDatetime)
      : formatICSDate(
          new Date(new Date(startDatetime).getTime() + 2 * 60 * 60 * 1000).toISOString()
        );

    const location = [locationName, locationAddress].filter(Boolean).join(', ');
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
      `SUMMARY:${escapeICS(eventName)}`,
      ...(location ? [`LOCATION:${escapeICS(location)}`] : []),
      ...(description ? [`DESCRIPTION:${escapeICS(description)}`] : []),
      `DTSTAMP:${formatICSDate(new Date().toISOString())}`,
      'STATUS:CONFIRMED',
      'BEGIN:VALARM',
      'TRIGGER:-PT30M',
      'ACTION:DISPLAY',
      `DESCRIPTION:${escapeICS(eventName)} starts in 30 minutes`,
      'END:VALARM',
      'END:VEVENT',
      'END:VCALENDAR',
    ];

    const icsContent = lines.join('\r\n');
    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = `${eventName.replace(/[^a-zA-Z0-9]/g, '_')}.ics`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [eventName, startDatetime, endDatetime, locationName, locationAddress, description]);

  return (
    <button
      onClick={handleAddToCalendar}
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
      onMouseEnter={(e) => {
        (e.target as HTMLButtonElement).style.background = BrandColors.bg3;
      }}
      onMouseLeave={(e) => {
        (e.target as HTMLButtonElement).style.background = 'transparent';
      }}
    >
      📅 Add to calendar
    </button>
  );
}
