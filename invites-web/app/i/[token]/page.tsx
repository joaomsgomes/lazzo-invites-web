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
    <main className="min-h-screen flex items-center justify-center p-6" style={{ 
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
    }}>
      <div className="w-full max-w-md">
        <div className="bg-white rounded-3xl shadow-2xl p-8 md:p-10">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl mx-auto mb-6 flex items-center justify-center shadow-lg">
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Bem-vindo ao Lazzo
            </h1>
            <p className="text-gray-600 text-lg">
              Foste convidado para <span className="font-semibold text-purple-600">{groupName}</span>
            </p>
          </div>

          {/* Expiration notice */}
          <div className="bg-purple-50 rounded-xl p-4 mb-8">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-purple-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm text-purple-800">
                Expira em: <span className="font-medium">{new Date(expiresAt).toLocaleString("pt-PT")}</span>
              </p>
            </div>
          </div>

          {/* Download section */}
          <div className="space-y-3">
            <p className="text-center text-gray-700 font-medium mb-4">
              Descarrega a app para aceitares o convite
            </p>
            
            {/* App Store Button */}
            <a 
              href={process.env.NEXT_PUBLIC_APPSTORE_URL!} 
              className="block w-full bg-black hover:bg-gray-900 text-white rounded-xl py-4 px-6 transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
            >
              <div className="flex items-center justify-center">
                <svg className="w-8 h-8 mr-3" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.71 19.5C17.88 20.74 17 21.95 15.66 21.97C14.32 22 13.89 21.18 12.37 21.18C10.84 21.18 10.37 21.95 9.1 22C7.79 22.05 6.8 20.68 5.96 19.47C4.25 17 2.94 12.45 4.7 9.39C5.57 7.87 7.13 6.91 8.82 6.88C10.1 6.86 11.32 7.75 12.11 7.75C12.89 7.75 14.37 6.68 15.92 6.84C16.57 6.87 18.39 7.1 19.56 8.82C19.47 8.88 17.39 10.1 17.41 12.63C17.44 15.65 20.06 16.66 20.09 16.67C20.06 16.74 19.67 18.11 18.71 19.5ZM13 3.5C13.73 2.67 14.94 2.04 15.94 2C16.07 3.17 15.6 4.35 14.9 5.19C14.21 6.04 13.07 6.7 11.95 6.61C11.8 5.46 12.36 4.26 13 3.5Z"/>
                </svg>
                <div className="text-left">
                  <div className="text-xs opacity-90">Download na</div>
                  <div className="text-lg font-semibold -mt-1">App Store</div>
                </div>
              </div>
            </a>

            {/* Google Play Button */}
            <a 
              href={process.env.NEXT_PUBLIC_PLAYSTORE_URL!}
              className="block w-full bg-black hover:bg-gray-900 text-white rounded-xl py-4 px-6 transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
            >
              <div className="flex items-center justify-center">
                <svg className="w-8 h-8 mr-3" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M3,20.5V3.5C3,2.91 3.34,2.39 3.84,2.15L13.69,12L3.84,21.85C3.34,21.6 3,21.09 3,20.5M16.81,15.12L6.05,21.34L14.54,12.85L16.81,15.12M20.16,10.81C20.5,11.08 20.75,11.5 20.75,12C20.75,12.5 20.53,12.9 20.18,13.18L17.89,14.5L15.39,12L17.89,9.5L20.16,10.81M6.05,2.66L16.81,8.88L14.54,11.15L6.05,2.66Z"/>
                </svg>
                <div className="text-left">
                  <div className="text-xs opacity-90">Disponível no</div>
                  <div className="text-lg font-semibold -mt-1">Google Play</div>
                </div>
              </div>
            </a>
          </div>

          {/* Footer note */}
          <p className="text-center text-sm text-gray-500 mt-6">
            Após instalar, volta a abrir este link
          </p>
        </div>
      </div>
    </main>
  );
}
