import { BrandColors, Spacing } from './design/constants';

export default function Home() {
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
      {/* Hero Section */}
      <div style={{
        maxWidth: '800px',
        width: '100%',
        textAlign: 'center',
        marginBottom: Spacing.xl,
      }}>
        {/* Logo/Brand */}
        <div style={{
          width: '120px',
          height: '120px',
          background: `linear-gradient(135deg, ${BrandColors.living} 0%, ${BrandColors.planning} 100%)`,
          borderRadius: Spacing.radiusMd,
          margin: '0 auto',
          marginBottom: Spacing.xl,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 8px 32px rgba(138, 56, 245, 0.3)',
        }}>
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
        </div>

        <h1 style={{
          fontSize: '48px',
          fontWeight: 700,
          color: BrandColors.text1,
          marginBottom: Spacing.md,
          letterSpacing: '-0.02em',
        }}>
          Lazzo
        </h1>

        <p style={{
          fontSize: '22px',
          fontWeight: 500,
          color: BrandColors.text2,
          marginBottom: Spacing.xl,
          lineHeight: 1.5,
        }}>
          Connect with your tribe. Plan events, create memories, and stay together.
        </p>

        {/* CTA Buttons */}
        <div style={{
          display: 'flex',
          gap: Spacing.md,
          justifyContent: 'center',
          flexWrap: 'wrap',
          marginBottom: Spacing.xl,
        }}>
          <a 
            href={process.env.NEXT_PUBLIC_APPSTORE_URL || '#'}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: Spacing.sm,
              padding: `${Spacing.md} ${Spacing.lg}`,
              background: BrandColors.text1,
              color: BrandColors.bg1,
              borderRadius: Spacing.radiusSmAlt,
              fontWeight: 600,
              fontSize: '16px',
              transition: 'transform 0.2s, box-shadow 0.2s',
              cursor: 'pointer',
              border: 'none',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 8px 24px rgba(242, 242, 242, 0.2)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <path d="M18.71 19.5C17.88 20.74 17 21.95 15.66 21.97C14.32 22 13.89 21.18 12.37 21.18C10.84 21.18 10.37 21.95 9.1 22C7.79 22.05 6.8 20.68 5.96 19.47C4.25 17 2.94 12.45 4.7 9.39C5.57 7.87 7.13 6.91 8.82 6.88C10.1 6.86 11.32 7.75 12.11 7.75C12.89 7.75 14.37 6.68 15.92 6.84C16.57 6.87 18.39 7.1 19.56 8.82C19.47 8.88 17.39 10.1 17.41 12.63C17.44 15.65 20.06 16.66 20.09 16.67C20.06 16.74 19.67 18.11 18.71 19.5ZM13 3.5C13.73 2.67 14.94 2.04 15.94 2C16.07 3.17 15.6 4.35 14.9 5.19C14.21 6.04 13.07 6.7 11.95 6.61C11.8 5.46 12.36 4.26 13 3.5Z"/>
            </svg>
            App Store
          </a>

          <a 
            href={process.env.NEXT_PUBLIC_PLAYSTORE_URL || '#'}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: Spacing.sm,
              padding: `${Spacing.md} ${Spacing.lg}`,
              background: BrandColors.text1,
              color: BrandColors.bg1,
              borderRadius: Spacing.radiusSmAlt,
              fontWeight: 600,
              fontSize: '16px',
              transition: 'transform 0.2s, box-shadow 0.2s',
              cursor: 'pointer',
              border: 'none',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 8px 24px rgba(242, 242, 242, 0.2)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <path d="M3,20.5V3.5C3,2.91 3.34,2.39 3.84,2.15L13.69,12L3.84,21.85C3.34,21.6 3,21.09 3,20.5M16.81,15.12L6.05,21.34L14.54,12.85L16.81,15.12M20.16,10.81C20.5,11.08 20.75,11.5 20.75,12C20.75,12.5 20.53,12.9 20.18,13.18L17.89,14.5L15.39,12L17.89,9.5L20.16,10.81M6.05,2.66L16.81,8.88L14.54,11.15L6.05,2.66Z"/>
            </svg>
            Google Play
          </a>
        </div>
      </div>

      {/* Features Grid */}
      <div style={{
        maxWidth: '1000px',
        width: '100%',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: Spacing.lg,
        marginBottom: Spacing.xl,
      }}>
        {/* Feature Card 1 */}
        <div style={{
          background: BrandColors.bg2,
          padding: Spacing.lg,
          borderRadius: Spacing.radiusMd,
          border: `1px solid ${BrandColors.border}`,
        }}>
          <div style={{
            width: '48px',
            height: '48px',
            background: BrandColors.planning,
            borderRadius: Spacing.radiusSm,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: Spacing.md,
          }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <h3 style={{
            fontSize: '18px',
            fontWeight: 600,
            color: BrandColors.text1,
            marginBottom: Spacing.xs,
          }}>
            Plan Events
          </h3>
          <p style={{
            fontSize: '14px',
            color: BrandColors.text2,
            lineHeight: 1.6,
          }}>
            Create and manage events with your groups. Vote on options and finalize plans together.
          </p>
        </div>

        {/* Feature Card 2 */}
        <div style={{
          background: BrandColors.bg2,
          padding: Spacing.lg,
          borderRadius: Spacing.radiusMd,
          border: `1px solid ${BrandColors.border}`,
        }}>
          <div style={{
            width: '48px',
            height: '48px',
            background: BrandColors.living,
            borderRadius: Spacing.radiusSm,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: Spacing.md,
          }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <h3 style={{
            fontSize: '18px',
            fontWeight: 600,
            color: BrandColors.text1,
            marginBottom: Spacing.xs,
          }}>
            Create Memories
          </h3>
          <p style={{
            fontSize: '14px',
            color: BrandColors.text2,
            lineHeight: 1.6,
          }}>
            Capture moments during events and share them with your group in real-time.
          </p>
        </div>

        {/* Feature Card 3 */}
        <div style={{
          background: BrandColors.bg2,
          padding: Spacing.lg,
          borderRadius: Spacing.radiusMd,
          border: `1px solid ${BrandColors.border}`,
        }}>
          <div style={{
            width: '48px',
            height: '48px',
            background: BrandColors.recap,
            borderRadius: Spacing.radiusSm,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: Spacing.md,
          }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <h3 style={{
            fontSize: '18px',
            fontWeight: 600,
            color: BrandColors.text1,
            marginBottom: Spacing.xs,
          }}>
            Stay Connected
          </h3>
          <p style={{
            fontSize: '14px',
            color: BrandColors.text2,
            lineHeight: 1.6,
          }}>
            Chat with your groups, share updates, and keep everyone in the loop.
          </p>
        </div>
      </div>

      {/* Footer */}
      <footer style={{
        marginTop: Spacing.xl,
        paddingTop: Spacing.lg,
        borderTop: `1px solid ${BrandColors.border}`,
        width: '100%',
        maxWidth: '800px',
        textAlign: 'center',
      }}>
        <p style={{
          fontSize: '14px',
          color: BrandColors.text2,
        }}>
          © 2026 Lazzo. All rights reserved.
        </p>
      </footer>
    </main>
  );
}
