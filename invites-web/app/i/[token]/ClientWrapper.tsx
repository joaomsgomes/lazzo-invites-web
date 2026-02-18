'use client';

import { ReactNode, useState, useEffect, useCallback } from 'react';
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
  const [showReAuth, setShowReAuth] = useState(false);
  const [expiredEmail, setExpiredEmail] = useState('');

  useEffect(() => {
    // Check for expired session on mount
    try {
      const sessionKey = `lazzo_session_${token}`;
      const raw = localStorage.getItem(sessionKey);
      if (!raw) return; // No session — first visit

      const session = JSON.parse(raw);

      // Check if valid session exists (handled by SessionManager)
      const validSession = getValidSession(token);
      if (validSession) {
        // Session is still valid — user will see their vote automatically
        // (RsvpSection reads from lazzo_rsvp_{token} localStorage)
        return;
      }

      // Session expired — show re-auth popup
      if (session.email) {
        setExpiredEmail(session.email);
        setShowReAuth(true);
      }
    } catch {
      // Silent — don't block page render
    }
  }, [token]);

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