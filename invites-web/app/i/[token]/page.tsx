// app/i/[token]/page.tsx
import { BrandColors, Spacing } from '../../design/constants';

async function resolveInvite(token: string) {
  const base = process.env.NEXT_PUBLIC_SUPABASE_FUNCTIONS_URL!;
  const url = `${base}/invite-resolve?token=${encodeURIComponent(token)}`;
  
  console.log("========== DEBUG INVITE ==========");
  console.log("Token recebido:", token);
  console.log("Base URL:", base);
  console.log("URL completa:", url);
  console.log("Token encoded:", encodeURIComponent(token));
  
  const res = await fetch(url, {
    cache: "no-store",
  });
  
  console.log("Status da resposta:", res.status);
  console.log("Response OK?", res.ok);
  
  const data = await res.json().catch((err) => {
    console.log("Erro ao fazer parse do JSON:", err);
    return null;
  });
  
  console.log("Dados retornados:", JSON.stringify(data, null, 2));
  console.log("==================================");
  
  return { ok: res.ok, status: res.status, data };
}

export default async function InvitePage({ params }: { params: Promise<{ token: string }> }) {
  // No Next.js 15+, params é uma Promise e precisa de await
  const resolvedParams = await params;
  const token = resolvedParams.token;
  
  console.log("========== INICIO InvitePage ==========");
  console.log("Params recebidos:", resolvedParams);
  console.log("Token extraído:", token);
  console.log("Tipo do token:", typeof token);
  console.log("Tamanho do token:", token?.length);
  
  const { ok, data } = await resolveInvite(token);
  
  console.log("Resultado final - OK:", ok);
  console.log("Resultado final - Data:", data);
  console.log("Data.valid:", data?.valid);
  console.log("Data.reason:", data?.reason);

  if (!ok || !data?.valid) {
    const reason = data?.reason ?? "unknown";
    
    console.log("========== CONVITE INVÁLIDO ==========");
    console.log("OK:", ok);
    console.log("Data.valid:", data?.valid);
    console.log("Reason:", reason);
    console.log("Data completo:", JSON.stringify(data, null, 2));
    console.log("======================================");
    
    return (
      <main style={{ 
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: Spacing.lg,
        background: BrandColors.bg1,
      }}>
        <div style={{ 
          maxWidth: '520px',
          width: '100%',
        }}>
          <div style={{
            background: BrandColors.bg2,
            borderRadius: Spacing.radiusMd,
            padding: Spacing.xl,
            border: `1px solid ${BrandColors.border}`,
          }}>
            {/* Error Icon */}
            <div style={{
              width: '80px',
              height: '80px',
              background: BrandColors.bg3,
              borderRadius: Spacing.radiusSmAlt,
              margin: '0 auto',
              marginBottom: Spacing.lg,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke={BrandColors.cantVote} strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>

            <h1 style={{
              fontSize: '28px',
              fontWeight: 600,
              color: BrandColors.text1,
              textAlign: 'center',
              marginBottom: Spacing.md,
            }}>
              Convite inválido
            </h1>

            <p style={{
              fontSize: '16px',
              color: BrandColors.text2,
              textAlign: 'center',
              lineHeight: 1.6,
              marginBottom: Spacing.lg,
            }}>
              Este convite não é válido ({reason}).<br />
              Se achares que é um erro, pede um novo QR ao admin do grupo.
            </p>

            <a 
              href="/"
              style={{
                display: 'block',
                width: '100%',
                padding: `${Spacing.md} ${Spacing.lg}`,
                background: BrandColors.planning,
                color: BrandColors.text1,
                borderRadius: Spacing.radiusSmAlt,
                fontWeight: 600,
                fontSize: '16px',
                textAlign: 'center',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              Voltar ao Início
            </a>
          </div>
        </div>
      </main>
    );
  }

  const groupName = data.group?.name ?? "grupo";
  const expiresAt = data.expires_at;

  return (
    <main style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: Spacing.lg,
      background: `linear-gradient(135deg, ${BrandColors.living} 0%, ${BrandColors.planning} 100%)`,
    }}>
      <div style={{ 
        maxWidth: '520px',
        width: '100%',
      }}>
        <div style={{
          background: BrandColors.bg1,
          borderRadius: Spacing.radiusMd,
          padding: Spacing.xl,
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.4)',
        }}>
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: Spacing.xl }}>
            <div style={{
              width: '100px',
              height: '100px',
              background: `linear-gradient(135deg, ${BrandColors.living} 0%, ${BrandColors.planning} 100%)`,
              borderRadius: Spacing.radiusMd,
              margin: '0 auto',
              marginBottom: Spacing.lg,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: `0 8px 32px ${BrandColors.living}40`,
            }}>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h1 style={{
              fontSize: '32px',
              fontWeight: 700,
              color: BrandColors.text1,
              marginBottom: Spacing.xs,
            }}>
              Bem-vindo ao Lazzo
            </h1>
            <p style={{
              fontSize: '18px',
              color: BrandColors.text2,
            }}>
              Foste convidado para <span style={{ color: BrandColors.planning, fontWeight: 600 }}>{groupName}</span>
            </p>
          </div>

          {/* Expiration notice */}
          <div style={{
            background: BrandColors.bg2,
            borderRadius: Spacing.radiusSmAlt,
            padding: Spacing.md,
            marginBottom: Spacing.xl,
            border: `1px solid ${BrandColors.border}`,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: Spacing.xs }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={BrandColors.text2} strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p style={{
                fontSize: '14px',
                color: BrandColors.text2,
              }}>
                Expira em: <span style={{ color: BrandColors.text1, fontWeight: 500 }}>{new Date(expiresAt).toLocaleString("pt-PT")}</span>
              </p>
            </div>
          </div>

          {/* Download section */}
          <div>
            <p style={{
              textAlign: 'center',
              color: BrandColors.text1,
              fontWeight: 500,
              fontSize: '16px',
              marginBottom: Spacing.lg,
            }}>
              Descarrega a app para aceitares o convite
            </p>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: Spacing.sm }}>
              {/* App Store Button */}
              <a 
                href={process.env.NEXT_PUBLIC_APPSTORE_URL!} 
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: Spacing.sm,
                  padding: `${Spacing.md} ${Spacing.lg}`,
                  background: BrandColors.text1,
                  color: BrandColors.bg1,
                  borderRadius: Spacing.radiusSmAlt,
                  fontWeight: 600,
                  fontSize: '16px',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'transform 0.2s',
                }}
                onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.71 19.5C17.88 20.74 17 21.95 15.66 21.97C14.32 22 13.89 21.18 12.37 21.18C10.84 21.18 10.37 21.95 9.1 22C7.79 22.05 6.8 20.68 5.96 19.47C4.25 17 2.94 12.45 4.7 9.39C5.57 7.87 7.13 6.91 8.82 6.88C10.1 6.86 11.32 7.75 12.11 7.75C12.89 7.75 14.37 6.68 15.92 6.84C16.57 6.87 18.39 7.1 19.56 8.82C19.47 8.88 17.39 10.1 17.41 12.63C17.44 15.65 20.06 16.66 20.09 16.67C20.06 16.74 19.67 18.11 18.71 19.5ZM13 3.5C13.73 2.67 14.94 2.04 15.94 2C16.07 3.17 15.6 4.35 14.9 5.19C14.21 6.04 13.07 6.7 11.95 6.61C11.8 5.46 12.36 4.26 13 3.5Z"/>
                </svg>
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontSize: '12px', opacity: 0.9 }}>Download na</div>
                  <div style={{ fontSize: '18px', marginTop: '-2px' }}>App Store</div>
                </div>
              </a>

              {/* Google Play Button */}
              <a 
                href={process.env.NEXT_PUBLIC_PLAYSTORE_URL!}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: Spacing.sm,
                  padding: `${Spacing.md} ${Spacing.lg}`,
                  background: BrandColors.text1,
                  color: BrandColors.bg1,
                  borderRadius: Spacing.radiusSmAlt,
                  fontWeight: 600,
                  fontSize: '16px',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'transform 0.2s',
                }}
                onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M3,20.5V3.5C3,2.91 3.34,2.39 3.84,2.15L13.69,12L3.84,21.85C3.34,21.6 3,21.09 3,20.5M16.81,15.12L6.05,21.34L14.54,12.85L16.81,15.12M20.16,10.81C20.5,11.08 20.75,11.5 20.75,12C20.75,12.5 20.53,12.9 20.18,13.18L17.89,14.5L15.39,12L17.89,9.5L20.16,10.81M6.05,2.66L16.81,8.88L14.54,11.15L6.05,2.66Z"/>
                </svg>
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontSize: '12px', opacity: 0.9 }}>Disponível no</div>
                  <div style={{ fontSize: '18px', marginTop: '-2px' }}>Google Play</div>
                </div>
              </a>
            </div>
          </div>

          {/* Footer note */}
          <p style={{
            textAlign: 'center',
            fontSize: '14px',
            color: BrandColors.text2,
            marginTop: Spacing.lg,
          }}>
            Após instalar, volta a abrir este link
          </p>
        </div>
      </div>
    </main>
  );
}
