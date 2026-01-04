// app/i/[token]/page.tsx
//import React from "react";

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

  // deep link fallback (opcional)
  const appScheme = `lazzo://invite/${token}`; // se tiveres scheme definido na app
  const universalUrl = `https://lazzo.com/i/${token}`; // o próprio link

  if (!ok || !data?.valid) {
    const reason = data?.reason ?? "unknown";
    
    console.log("========== CONVITE INVÁLIDO ==========");
    console.log("OK:", ok);
    console.log("Data.valid:", data?.valid);
    console.log("Reason:", reason);
    console.log("Data completo:", JSON.stringify(data, null, 2));
    console.log("======================================");
    
    return (
      <main style={{ padding: 24, maxWidth: 520, margin: "0 auto", fontFamily: "system-ui" }}>
        <h1>Convite inválido</h1>
        <p>Este convite não é válido ({reason}).</p>
        <p>Se achares que é um erro, pede um novo QR ao admin do grupo.</p>
      </main>
    );
  }

  const groupName = data.group?.name ?? "grupo";
  const expiresAt = data.expires_at;

  return (
    <main style={{ padding: 24, maxWidth: 520, margin: "0 auto", fontFamily: "system-ui" }}>
      <h1>Entrar no {groupName}</h1>
      <p>Abre a app para aceitares o convite.</p>
      <p style={{ opacity: 0.7 }}>Expira em: {new Date(expiresAt).toLocaleString("pt-PT")}</p>

      <div style={{ display: "grid", gap: 12, marginTop: 18 }}>
        {/* Se Universal/App Links estiverem configurados, clicar aqui geralmente abre a app */}
        <a href={universalUrl} style={{ padding: 12, border: "1px solid #ddd", borderRadius: 10, textAlign: "center" }}>
          Abrir na app
        </a>

        {/* Fallback para scheme (se usares custom scheme) */}
        <a href={appScheme} style={{ padding: 12, border: "1px solid #ddd", borderRadius: 10, textAlign: "center" }}>
          Abrir na app (fallback)
        </a>

        {/* Store links */}
        <a href={process.env.NEXT_PUBLIC_APPSTORE_URL!} style={{ padding: 12, border: "1px solid #ddd", borderRadius: 10, textAlign: "center" }}>
          Descarregar na App Store
        </a>
        <a href={process.env.NEXT_PUBLIC_PLAYSTORE_URL!} style={{ padding: 12, border: "1px solid #ddd", borderRadius: 10, textAlign: "center" }}>
          Descarregar na Google Play
        </a>
      </div>

      <p style={{ marginTop: 20, opacity: 0.7 }}>
        Se instalaste agora, volta a abrir este link depois da instalação.
      </p>
    </main>
  );
}
