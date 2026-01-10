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
          background: BrandColors.bg2,
          borderRadius: Spacing.radiusMd,
          margin: '0 auto',
          marginBottom: Spacing.xl,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: `2px solid ${BrandColors.border}`,
        }}>
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke={BrandColors.text2} strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
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
          Página não encontrada
        </h2>

        <p style={{
          fontSize: '16px',
          color: BrandColors.text2,
          marginBottom: Spacing.xl,
          lineHeight: 1.6,
        }}>
          A página que procuras não existe ou foi movida. Verifica o link ou volta à página inicial.
        </p>

        {/* Action Buttons */}
        <div style={{
          display: 'flex',
          gap: Spacing.md,
          justifyContent: 'center',
          flexWrap: 'wrap',
        }}>
          <Link 
            href="/"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: Spacing.xs,
              padding: `${Spacing.md} ${Spacing.lg}`,
              background: BrandColors.planning,
              color: BrandColors.text1,
              borderRadius: Spacing.radiusSmAlt,
              fontWeight: 600,
              fontSize: '16px',
              transition: 'transform 0.2s, box-shadow 0.2s',
              cursor: 'pointer',
              border: 'none',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 8px 24px rgba(22, 156, 62, 0.3)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            Voltar ao Início
          </Link>

          <a 
            href={process.env.NEXT_PUBLIC_APPSTORE_URL || '#'}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: Spacing.xs,
              padding: `${Spacing.md} ${Spacing.lg}`,
              background: BrandColors.bg2,
              color: BrandColors.text1,
              borderRadius: Spacing.radiusSmAlt,
              fontWeight: 600,
              fontSize: '16px',
              transition: 'transform 0.2s, box-shadow 0.2s',
              cursor: 'pointer',
              border: `1px solid ${BrandColors.border}`,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 8px 24px rgba(31, 31, 31, 0.3)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M18.71 19.5C17.88 20.74 17 21.95 15.66 21.97C14.32 22 13.89 21.18 12.37 21.18C10.84 21.18 10.37 21.95 9.1 22C7.79 22.05 6.8 20.68 5.96 19.47C4.25 17 2.94 12.45 4.7 9.39C5.57 7.87 7.13 6.91 8.82 6.88C10.1 6.86 11.32 7.75 12.11 7.75C12.89 7.75 14.37 6.68 15.92 6.84C16.57 6.87 18.39 7.1 19.56 8.82C19.47 8.88 17.39 10.1 17.41 12.63C17.44 15.65 20.06 16.66 20.09 16.67C20.06 16.74 19.67 18.11 18.71 19.5ZM13 3.5C13.73 2.67 14.94 2.04 15.94 2C16.07 3.17 15.6 4.35 14.9 5.19C14.21 6.04 13.07 6.7 11.95 6.61C11.8 5.46 12.36 4.26 13 3.5Z"/>
            </svg>
            Download App
          </a>
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
            <strong style={{ color: BrandColors.text1 }}>Recebeste um convite?</strong><br />
            Verifica se o link está correto. Links de convite têm o formato: <code style={{ 
              color: BrandColors.planning,
              background: BrandColors.bg3,
              padding: '2px 8px',
              borderRadius: '4px',
              fontFamily: 'monospace',
            }}>/i/[token]</code>
          </p>
        </div>
      </div>
    </main>
  );
}
