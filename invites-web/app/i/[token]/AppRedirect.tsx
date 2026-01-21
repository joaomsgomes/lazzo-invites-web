'use client';

import { useEffect } from 'react';

interface AppRedirectProps {
  token: string;
}

export default function AppRedirect({ token }: AppRedirectProps) {
  useEffect(() => {
    // Tenta abrir a app via deep link
    const appScheme = `lazzo://invite/${token}`;
    const universalLink = window.location.href;
    
    // Detecta se é mobile
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    
    if (!isMobile) {
      // Desktop - não faz nada, mostra a página
      return;
    }

    // Tenta abrir na app usando custom scheme
    // Isto funciona se a app estiver instalada
    const now = Date.now();
    
    // Cria um iframe invisível para tentar abrir a app
    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    iframe.src = appScheme;
    document.body.appendChild(iframe);
    
    // Se após 2 segundos ainda estiver na página, significa que a app não está instalada
    // ou não conseguiu abrir - nesse caso mantém a página web visível
    const timeout = setTimeout(() => {
      document.body.removeChild(iframe);
      
      // Se a página ainda está visível após 2s, mostra o conteúdo web
      // (usuário não tem a app ou não conseguiu abrir)
    }, 2000);
    
    // Se a página for escondida (app abriu), cancela o timeout
    const handleVisibilityChange = () => {
      if (document.hidden) {
        clearTimeout(timeout);
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Cleanup
    return () => {
      clearTimeout(timeout);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (document.body.contains(iframe)) {
        document.body.removeChild(iframe);
      }
    };
  }, [token]);

  return null; // Este componente não renderiza nada
}
