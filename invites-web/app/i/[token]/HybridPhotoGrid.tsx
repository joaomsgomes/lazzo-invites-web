'use client';

import { useState, useEffect, useRef } from 'react';
import { BrandColors } from '../../design/constants';
import type { EventPhoto } from '../../../lib/supabase';

// ═══════════════════════════════════════════════════════════════════
// HybridPhotoGrid — Greedy template-based photo grid
// Matches Flutter HybridPhotoGrid algorithm exactly.
//
// Template priority (descending):
//   0) VSCO Column — 1P + 2L (portrait + 2 landscapes stacked)
//   1) L full + P  (or P + L full)
//   2) L½ + L½     (two landscapes side by side)
//   3) P + P + P   (three portraits)
//   4) P + P        (two portraits)
//   5) L full alone (single landscape, end of buffer)
//   6) Fallbacks    (single P centered, single L left-aligned)
//
// Sub-grid: 6 units (3 visual columns = 2 units each), 8px gap.
// ═══════════════════════════════════════════════════════════════════

const GAP = 8;
const SUB_COLS = 6;
const RADIUS = '6px';

interface HybridPhotoGridProps {
  photos: EventPhoto[];
  onPhotoTap: (photoId: string) => void;
}

// ── Photo Tile ─────────────────────────────────────────────────

function Tile({ photo, width, height, onClick }: {
  photo: EventPhoto;
  width: number;
  height: number;
  onClick: () => void;
}) {
  return (
    <div onClick={onClick} style={{
      width, height,
      overflow: 'hidden',
      borderRadius: RADIUS,
      cursor: 'pointer',
      background: BrandColors.bg3,
      flexShrink: 0,
    }}>
      <img
        src={photo.url}
        alt=""
        loading="lazy"
        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
      />
    </div>
  );
}

// ── Row data ───────────────────────────────────────────────────

interface RowItem { photo: EventPhoto; w: number; h: number }

interface Row {
  type: 'flex' | 'vsco';
  items?: RowItem[];
  rowH: number;
  vscoSide?: 'left' | 'right';
  p?: RowItem;
  l1?: RowItem;
  l2?: RowItem;
  justify?: 'flex-start' | 'center';
}

// ── Greedy row builder (matches Flutter _selectBestTemplate) ───

function buildRows(photos: EventPhoto[], W: number): Row[] {
  if (W <= 0 || photos.length === 0) return [];

  const u = (W - GAP * (SUB_COLS - 1)) / SUB_COLS;

  // Pre-computed widths & natural heights
  const wL = u * 4 + GAP * 3;     // landscape full: 4 units
  const wP = u * 2 + GAP;         // portrait: 2 units
  const wH = u * 3 + GAP * 2;     // half: 3 units
  const hL = wL * 9 / 16;         // landscape 16:9
  const hP = wP * 5 / 4;          // portrait 4:5
  const hH = wH * 9 / 16;         // half landscape 16:9

  const rows: Row[] = [];
  const buf = [...photos];
  const isP = (i: number) => !!(buf[i]?.is_portrait);
  const isL = (i: number) => !(buf[i]?.is_portrait);

  while (buf.length > 0) {
    const la = Math.min(4, buf.length);
    let matched = false;

    // --- P0: VSCO Column (1P + 2L in first 3) ---
    if (buf.length >= 3 && la >= 3) {
      const pIs = [0, 1, 2].filter(i => isP(i));
      const lIs = [0, 1, 2].filter(i => isL(i));
      if (pIs.length === 1 && lIs.length === 2) {
        const pi = pIs[0], l1i = lIs[0], l2i = lIs[1];
        const tH = wH * 5 / 4;
        const eachLH = (tH - GAP) / 2;
        rows.push({
          type: 'vsco',
          rowH: tH,
          vscoSide: pi < l1i ? 'left' : 'right',
          p: { photo: buf[pi], w: wH, h: tH },
          l1: { photo: buf[l1i], w: wH, h: eachLH },
          l2: { photo: buf[l2i], w: wH, h: eachLH },
        });
        [pi, l1i, l2i].sort((a, b) => b - a).forEach(i => buf.splice(i, 1));
        continue;
      }
    }

    // --- P1a: L then P ---
    for (let i = 0; i < la - 1 && !matched; i++) {
      if (isL(i)) {
        for (let j = i + 1; j < la; j++) {
          if (isP(j)) {
            rows.push({
              type: 'flex',
              items: [
                { photo: buf[i], w: wL, h: hL },
                { photo: buf[j], w: wP, h: hP },
              ],
              rowH: Math.max(hL, hP),
            });
            buf.splice(j, 1);
            buf.splice(i, 1);
            matched = true;
            break;
          }
        }
        break;
      }
    }
    if (matched) continue;

    // --- P1b: P then L ---
    for (let i = 0; i < la - 1 && !matched; i++) {
      if (isP(i)) {
        for (let j = i + 1; j < la; j++) {
          if (isL(j)) {
            rows.push({
              type: 'flex',
              items: [
                { photo: buf[i], w: wP, h: hP },
                { photo: buf[j], w: wL, h: hL },
              ],
              rowH: Math.max(hL, hP),
            });
            buf.splice(j, 1);
            buf.splice(i, 1);
            matched = true;
            break;
          }
        }
        break;
      }
    }
    if (matched) continue;

    // --- P2: L½ + L½ (two consecutive landscapes before first portrait) ---
    let fp = buf.slice(0, la).findIndex(p => !!(p.is_portrait));
    if (fp === -1) fp = la;
    for (let i = 0; i < Math.min(fp - 1, la - 1); i++) {
      if (isL(i) && isL(i + 1)) {
        rows.push({
          type: 'flex',
          items: [
            { photo: buf[i], w: wH, h: hH },
            { photo: buf[i + 1], w: wH, h: hH },
          ],
          rowH: hH,
        });
        buf.splice(i + 1, 1);
        buf.splice(i, 1);
        matched = true;
        break;
      }
    }
    if (matched) continue;

    // --- P3: P + P + P ---
    if (buf.length >= 3 && isP(0) && isP(1) && isP(2)) {
      rows.push({
        type: 'flex',
        items: [
          { photo: buf[0], w: wP, h: hP },
          { photo: buf[1], w: wP, h: hP },
          { photo: buf[2], w: wP, h: hP },
        ],
        rowH: hP,
      });
      buf.splice(0, 3);
      continue;
    }

    // --- P4: P + P ---
    if (buf.length >= 2 && isP(0) && isP(1)) {
      rows.push({
        type: 'flex',
        items: [
          { photo: buf[0], w: wP, h: hP },
          { photo: buf[1], w: wP, h: hP },
        ],
        rowH: hP,
      });
      buf.splice(0, 2);
      continue;
    }

    // --- P5: L full alone (end of buffer) ---
    if (buf.length === 1 && isL(0)) {
      rows.push({
        type: 'flex',
        items: [{ photo: buf[0], w: wL, h: hL }],
        rowH: hL,
      });
      buf.splice(0, 1);
      continue;
    }

    // --- Fallbacks ---
    if (isP(0)) {
      rows.push({
        type: 'flex',
        items: [{ photo: buf[0], w: wP, h: hP }],
        rowH: hP,
        justify: 'center',
      });
    } else {
      rows.push({
        type: 'flex',
        items: [{ photo: buf[0], w: wL, h: hL }],
        rowH: hL,
      });
    }
    buf.splice(0, 1);
  }

  return rows;
}

// ── Component ──────────────────────────────────────────────────

export default function HybridPhotoGrid({ photos, onPhotoTap }: HybridPhotoGridProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [w, setW] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(entries => {
      for (const entry of entries) setW(entry.contentRect.width);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const rows = w > 0 ? buildRows(photos, w) : [];

  return (
    <div ref={ref}>
      {rows.map((row, ri) => {
        if (row.type === 'vsco' && row.p && row.l1 && row.l2) {
          const tap = (p: EventPhoto) => () => onPhotoTap(p.photo_id);
          const portrait = (
            <Tile photo={row.p.photo} width={row.p.w} height={row.p.h} onClick={tap(row.p.photo)} />
          );
          const lands = (
            <div style={{
              width: row.l1.w,
              height: row.rowH,
              display: 'flex',
              flexDirection: 'column',
              gap: GAP,
              flexShrink: 0,
            }}>
              <Tile photo={row.l1.photo} width={row.l1.w} height={row.l1.h} onClick={tap(row.l1.photo)} />
              <Tile photo={row.l2.photo} width={row.l2.w} height={row.l2.h} onClick={tap(row.l2.photo)} />
            </div>
          );
          return (
            <div key={ri} style={{ display: 'flex', gap: GAP, marginBottom: GAP }}>
              {row.vscoSide === 'left' ? <>{portrait}{lands}</> : <>{lands}{portrait}</>}
            </div>
          );
        }

        return (
          <div key={ri} style={{
            display: 'flex',
            gap: GAP,
            marginBottom: GAP,
            justifyContent: row.justify || 'flex-start',
          }}>
            {row.items?.map(item => (
              <Tile
                key={item.photo.photo_id}
                photo={item.photo}
                width={item.w}
                height={row.rowH}
                onClick={() => onPhotoTap(item.photo.photo_id)}
              />
            ))}
          </div>
        );
      })}
    </div>
  );
}
