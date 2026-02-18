'use client';

import { BrandColors, Spacing, Typography } from '../../design/constants';
import PhotoGrid from './PhotoGrid';
import type { EventPhoto } from '../../../lib/supabase';

// ═══════════════════════════════════════════════════════════════════
// RecapSection — Shows event memories/photos after the event ends
// Orange-themed, matching the recap color palette
// ═══════════════════════════════════════════════════════════════════

interface RecapSectionProps {
  photos: EventPhoto[];
}

export default function RecapSection({ photos }: RecapSectionProps) {
  return (
    <div style={{
      width: '100%',
      padding: Spacing.md,
      background: BrandColors.bg2,
      borderRadius: Spacing.radiusMd,
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: Spacing.md,
      }}>
        <div>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: Spacing.xs,
          }}>
            <span style={{ fontSize: '20px' }}>📸</span>
            <p style={{ ...Typography.labelLarge, color: BrandColors.text1 }}>
              Memories
            </p>
          </div>
          {photos.length > 0 && (
            <p style={{
              fontSize: '12px',
              color: BrandColors.text2,
              marginTop: '2px',
            }}>
              {photos.length} photo{photos.length !== 1 ? 's' : ''} from this event
            </p>
          )}
        </div>
      </div>

      {/* Photo Grid */}
      <PhotoGrid photos={photos} accentColor={BrandColors.recap} />

      {/* Download app prompt */}
      {photos.length > 0 && (
        <div style={{
          marginTop: Spacing.md,
          padding: Spacing.sm,
          background: BrandColors.bg3,
          borderRadius: Spacing.radiusSm,
          textAlign: 'center',
        }}>
          <p style={{
            fontSize: '13px',
            color: BrandColors.text2,
          }}>
            Download the app to save and share these memories
          </p>
        </div>
      )}
    </div>
  );
}
