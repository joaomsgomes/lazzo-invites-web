import Link from 'next/link';
import { BrandColors, Spacing } from './design/constants';

export default function NotFound() {
  return (
    <main style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: Spacing.lg,
      background: BrandColors.bg1,
    }}>
      <div style={{
        maxWidth: '600px',
        width: '100%',
        textAlign: 'center',
      }}>
        {/* Error Icon */}
        <div style={{
          width: '100px',
          height: '100px',
          background: BrandColors.bg1,
          borderRadius: Spacing.radiusMd,
          margin: '0 auto',
          marginBottom: Spacing.xl,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
          border: `2px solid ${BrandColors.bg3}`,
        }}>
          <img 
            src="/app-icon.png" 
            alt="Lazzo"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
            }}
          />
        </div>

        {/* Error Code */}
        <h1 style={{
          fontSize: '72px',
          fontWeight: 700,
          color: BrandColors.text1,
          marginBottom: Spacing.md,
          letterSpacing: '-0.02em',
        }}>
          404
        </h1>

        {/* Error Message */}
        <h2 style={{
          fontSize: '28px',
          fontWeight: 600,
          color: BrandColors.text1,
          marginBottom: Spacing.md,
        }}>
          Page not found
        </h2>

        <p style={{
          fontSize: '16px',
          color: BrandColors.text2,
          marginBottom: Spacing.xl,
          lineHeight: 1.6,
        }}>
          The page you&apos;re looking for doesn&apos;t exist or has been moved. Check the link or go back home.
        </p>

        {/* Action Buttons */}
        <div style={{
          display: 'flex',
          gap: Spacing.md,
          justifyContent: 'center',
          flexWrap: 'wrap',
        }}>
          <Link href="/" className="btn-primary">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            Back to Home
          </Link>
        </div>

        {/* Help Text */}
        <div style={{
          marginTop: Spacing.xl,
          padding: Spacing.lg,
          background: BrandColors.bg2,
          borderRadius: Spacing.radiusMd,
          border: `1px solid ${BrandColors.border}`,
        }}>
          <p style={{
            fontSize: '14px',
            color: BrandColors.text2,
            lineHeight: 1.6,
          }}>
            <strong style={{ color: BrandColors.text1 }}>Got an invite?</strong><br />
            Check if the link is correct. Invite links have the format: <code style={{ 
              color: BrandColors.planning,
              background: BrandColors.bg3,
              padding: '2px 8px',
              borderRadius: '4px',
              fontFamily: 'monospace',
            }}>/i/[token]</code>
          </p>
        </div>

        {/* Footer */}
        <div style={{
          marginTop: Spacing.xl,
          paddingTop: Spacing.lg,
          borderTop: `1px solid ${BrandColors.border}`,
          textAlign: 'center',
        }}>
          <Link 
            href="/privacy"
            style={{
              fontSize: '14px',
              color: BrandColors.text2,
              textDecoration: 'none',
            }}
          >
            Privacy Policy
          </Link>
        </div>
      </div>
    </main>
  );
}
