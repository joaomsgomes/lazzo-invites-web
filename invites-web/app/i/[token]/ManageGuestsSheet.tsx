'use client';

import { useState, useMemo } from 'react';
import { BrandColors, Spacing, Typography } from '../../design/constants';
import type { GuestRecord } from '../../../lib/supabase';

// ── Types ──

type RsvpFilter = 'going' | 'maybe' | 'not_going' | null;

interface ManageGuestsSheetProps {
  guests: GuestRecord[];
  eventStatus: string;
  onClose: () => void;
}

// ── Helpers ──

function formatRelativeDate(dateStr: string | null): string {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'numeric' });
}

function getRsvpLabel(rsvp: GuestRecord['rsvp']): string {
  switch (rsvp) {
    case 'going': return 'Can';
    case 'maybe': return 'Maybe';
    case 'not_going': return "Can't";
    case 'pending': return 'Pending';
  }
}

function getRsvpColor(rsvp: GuestRecord['rsvp']): string {
  switch (rsvp) {
    case 'going': return BrandColors.planning;
    case 'maybe': return BrandColors.warning;
    case 'not_going': return BrandColors.cantVote;
    case 'pending': return BrandColors.text2;
  }
}

// ── ManageGuestsSheet ──

export default function ManageGuestsSheet({ guests, eventStatus, onClose }: ManageGuestsSheetProps) {
  const [filter, setFilter] = useState<RsvpFilter>(null);

  const isLivingOrRecap = eventStatus === 'living' || eventStatus === 'recap';
  const accentColor = eventStatus === 'living' ? BrandColors.living
    : eventStatus === 'recap' ? BrandColors.recap
      : BrandColors.planning;

  // Counts
  const counts = useMemo(() => {
    const c = { going: 0, maybe: 0, not_going: 0, pending: 0, photos: 0 };
    for (const g of guests) c[g.rsvp]++;
    return c;
  }, [guests]);

  // Filtered guest list
  const filteredGuests = useMemo(() => {
    if (filter) return guests.filter((g) => g.rsvp === filter);
    // No filter → exclude pending (matches Flutter behaviour)
    return guests.filter((g) => g.rsvp !== 'pending');
  }, [guests, filter]);

  const handleFilterTap = (f: RsvpFilter) => {
    setFilter((prev) => (prev === f ? null : f));
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: BrandColors.bg1,
        display: 'flex',
        flexDirection: 'column',
        fontFamily: Typography.fontFamily,
      }}
    >
      {/* ── AppBar ── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: `${Spacing.sm} ${Spacing.md}`,
          paddingTop: `max(env(safe-area-inset-top, 12px), ${Spacing.sm})`,
          minHeight: '56px',
        }}
      >
        <button
          onClick={onClose}
          aria-label="Back"
          style={{
            background: 'none',
            border: 'none',
            padding: Spacing.xs,
            cursor: 'pointer',
            color: BrandColors.text1,
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>

        <h1 style={{
          ...Typography.titleLargeEmph,
          color: BrandColors.text1,
          margin: 0,
        }}>
          {isLivingOrRecap ? 'Guests' : 'Manage Guests'}
        </h1>

        {/* Spacer to balance the back button */}
        <div style={{ width: '40px' }} />
      </div>

      {/* ── Filter / Summary Cards ── */}
      <div style={{
        display: 'flex',
        gap: Spacing.xs,
        padding: `${Spacing.md} ${Spacing.md}`,
      }}>
        {isLivingOrRecap ? (
          <>
            {/* Living/Recap: Participants + Photos summary cards */}
            <SummaryCard
              label="Participants"
              count={guests.length}
              color={accentColor}
            />
            <SummaryCard
              label="Votes"
              count={counts.going + counts.maybe + counts.not_going}
              color={accentColor}
            />
          </>
        ) : (
          <>
            {/* Planning: Can / Maybe / Can't filter cards */}
            <FilterCard
              label="Can"
              count={counts.going}
              color={BrandColors.planning}
              selected={filter === 'going'}
              onClick={() => handleFilterTap('going')}
            />
            <FilterCard
              label="Maybe"
              count={counts.maybe}
              color={BrandColors.warning}
              selected={filter === 'maybe'}
              onClick={() => handleFilterTap('maybe')}
            />
            <FilterCard
              label="Can't"
              count={counts.not_going}
              color={BrandColors.cantVote}
              selected={filter === 'not_going'}
              onClick={() => handleFilterTap('not_going')}
            />
          </>
        )}
      </div>

      {/* ── Guest List ── */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: `0 ${Spacing.md}`,
        paddingBottom: Spacing.lg,
      }}>
        <div style={{
          background: BrandColors.bg2,
          borderRadius: Spacing.radiusMd,
          padding: `${Spacing.sm} 0`,
        }}>
          {filteredGuests.length === 0 ? (
            <div style={{
              padding: Spacing.xl,
              textAlign: 'center',
              ...Typography.bodyLarge,
              color: BrandColors.text2,
            }}>
              {filter
                ? `No ${getRsvpLabel(filter).toLowerCase()} votes yet`
                : 'No guests yet'}
            </div>
          ) : (
            filteredGuests.map((guest, i) => (
              <div key={guest.id}>
                <GuestListTile
                  guest={guest}
                  isLivingOrRecap={isLivingOrRecap}
                />
                {i < filteredGuests.length - 1 && (
                  <div style={{
                    height: '1px',
                    background: `${BrandColors.border}4D`, // 30% opacity
                    marginLeft: '76px', // avatar(48) + gap(12) + padding(16)
                    marginRight: Spacing.md,
                  }} />
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

// ── Sub-components ──

function FilterCard({
  label,
  count,
  color,
  selected,
  onClick,
}: {
  label: string;
  count: number;
  color: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        flex: 1,
        background: BrandColors.bg3,
        border: selected ? `1.5px solid ${color}99` : '1.5px solid transparent',
        borderRadius: Spacing.radiusSmAlt,
        padding: `${Spacing.sm} ${Spacing.xs}`,
        cursor: 'pointer',
        textAlign: 'center',
        transition: 'border-color 0.2s',
      }}
    >
      <p style={{
        ...Typography.bodyMedium,
        color: BrandColors.text1,
        margin: 0,
      }}>
        {label}
      </p>
      <p style={{
        fontWeight: 700,
        fontSize: '28px',
        lineHeight: 1.29,
        color,
        margin: 0,
        marginTop: Spacing.xxs,
      }}>
        {count}
      </p>
    </button>
  );
}

function SummaryCard({
  label,
  count,
  color,
}: {
  label: string;
  count: number;
  color: string;
}) {
  return (
    <div
      style={{
        flex: 1,
        background: BrandColors.bg3,
        border: '1.5px solid transparent',
        borderRadius: Spacing.radiusSmAlt,
        padding: `${Spacing.sm} ${Spacing.xs}`,
        textAlign: 'center',
      }}
    >
      <p style={{
        ...Typography.bodyMedium,
        color: BrandColors.text1,
        margin: 0,
      }}>
        {label}
      </p>
      <p style={{
        fontWeight: 700,
        fontSize: '28px',
        lineHeight: 1.29,
        color,
        margin: 0,
        marginTop: Spacing.xxs,
      }}>
        {count}
      </p>
    </div>
  );
}

function GuestListTile({
  guest,
  isLivingOrRecap,
}: {
  guest: GuestRecord;
  isLivingOrRecap: boolean;
}) {
  const initial = (guest.name || '?').charAt(0).toUpperCase();
  const displayName = guest.source === 'web' ? `${guest.name} (web)` : guest.name;

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      padding: `${Spacing.xs} ${Spacing.md}`,
      gap: Spacing.sm,
    }}>
      {/* Avatar */}
      <div style={{
        width: '48px',
        height: '48px',
        borderRadius: '50%',
        background: BrandColors.bg3,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        overflow: 'hidden',
      }}>
        {guest.avatar_url ? (
          <img
            src={guest.avatar_url}
            alt={guest.name}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : (
          <span style={{
            fontSize: '18px',
            fontWeight: 500,
            color: BrandColors.text2,
          }}>
            {initial}
          </span>
        )}
      </div>

      {/* Name + date */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{
          ...Typography.titleMediumEmph,
          color: BrandColors.text1,
          margin: 0,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}>
          {displayName}
        </p>
        {!isLivingOrRecap && guest.voted_at && (
          <p style={{
            ...Typography.bodyMedium,
            color: BrandColors.text2,
            margin: 0,
            marginTop: '2px',
          }}>
            {formatRelativeDate(guest.voted_at)}
          </p>
        )}
      </div>

      {/* RSVP badge */}
      {!isLivingOrRecap && (
        <span style={{
          ...Typography.titleMediumEmph,
          color: getRsvpColor(guest.rsvp),
          flexShrink: 0,
        }}>
          {getRsvpLabel(guest.rsvp)}
        </span>
      )}
    </div>
  );
}
