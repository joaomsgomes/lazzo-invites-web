'use client';

import { useEffect } from 'react';

interface AppRedirectProps {
  token: string;
}

export default function AppRedirect({ token }: AppRedirectProps) {
  useEffect(() => {
    // Detect if user is on a mobile device
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    if (!isMobile) return; // Desktop — show web page

    const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
    const isAndroid = /Android/i.test(navigator.userAgent);

    // ── Strategy: Use Universal Links / App Links ──
    // The web page is already served at lazzo.app/i/{token}.
    // iOS Universal Links and Android App Links are configured via
    // .well-known/apple-app-site-association and .well-known/assetlinks.json.
    //
    // When a user taps a lazzo.app/i/{token} link from another app (WhatsApp,
    // iMessage, etc.), the OS intercepts and opens the native app directly
    // — this component does NOT need to do anything for that case.
    //
    // This component handles the case where the user opens the link in a
    // browser (e.g., copies URL and pastes in Safari/Chrome).
    // We try the custom scheme as a fallback.

    const appScheme = `lazzo://invite/${token}`;

    // Use window.location to attempt app open (more reliable than iframe)
    // Set a short timeout — if the page is still visible, the app didn't open
    const now = Date.now();

    // For iOS, use a link click approach (more reliable than iframe)
    if (isIOS) {
      // Try Universal Link first (same URL but the OS may intercept)
      // Then fall back to custom scheme
      const link = document.createElement('a');
      link.href = appScheme;
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();

      // Cleanup after attempt
      setTimeout(() => {
        document.body.removeChild(link);
      }, 100);
    } else if (isAndroid) {
      // Android: Use intent URL for more reliable app opening
      const intentUrl = `intent://invite/${token}#Intent;scheme=lazzo;package=com.lazzo.app;end`;

      // Try intent URL
      const link = document.createElement('a');
      link.href = intentUrl;
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();

      setTimeout(() => {
        document.body.removeChild(link);
      }, 100);
    }

    // If app doesn't open within 2s, page stays visible (web fallback)
    // No action needed — the web page is already rendering underneath

  }, [token]);

  return null; // This component doesn't render anything
}
