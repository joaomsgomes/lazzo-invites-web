'use client';

import { ReactNode, useMemo, useState, useCallback } from 'react';
import AppRedirect from './AppRedirect';
import { getValidSession, ReAuthPopup } from './SessionManager';

// ═══════════════════════════════════════════════════════════════════
// ClientWrapper — Handles deep link redirect + session persistence
//
// On mount:
// 1. Attempt mobile deep link (via AppRedirect)
// 2. Check localStorage for existing session
//    - Valid session → auto skip (user sees their vote)
//    - Expired session → show re-auth popup
//    - No session → normal flow (first visit)
// ═══════════════════════════════════════════════════════════════════

interface ClientWrapperProps {
  token: string;
  children: ReactNode;
}

export default function ClientWrapper({ token, children }: ClientWrapperProps) {
  const expiredEmail = useMemo(() => {
    try {
      const sessionKey = `lazzo_session_${token}`;
      const raw = localStorage.getItem(sessionKey);
      if (!raw) return '';

      const session = JSON.parse(raw);
      const validSession = getValidSession(token);
      if (validSession) return '';

      return session.email || '';
    } catch {
      return '';
    }
  }, [token]);
  const [showReAuth, setShowReAuth] = useState(Boolean(expiredEmail));

  const handleReAuthDone = useCallback(() => {
    setShowReAuth(false);
    // Session is now saved by ReAuthPopup
  }, []);

  return (
    <>
      <AppRedirect token={token} />
      {children}
      {showReAuth && (
        <ReAuthPopup
          token={token}
          expiredEmail={expiredEmail}
          onAuthenticated={handleReAuthDone}
          onDismiss={() => setShowReAuth(false)}
        />
      )}
    </>
  );
}