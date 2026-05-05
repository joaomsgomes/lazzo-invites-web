'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { posthog, trackEvent } from '@/lib/analytics';

const STORAGE_KEY = 'lazzo_cookie_consent';

type Choice = 'accepted' | 'declined';

export default function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored === 'declined') {
        posthog.opt_out_capturing();
        return;
      }
      if (stored === 'accepted') {
        posthog.opt_in_capturing();
        return;
      }
      setVisible(true);
    } catch {
      setVisible(true);
    }
  }, []);

  const handleChoice = (choice: Choice) => {
    try {
      localStorage.setItem(STORAGE_KEY, choice);
    } catch {
      // Ignore storage errors (Safari private mode, etc.)
    }
    if (choice === 'accepted') {
      posthog.opt_in_capturing();
      trackEvent('cookie_consent_accepted');
    } else {
      posthog.opt_out_capturing();
    }
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-live="polite"
      aria-label="Cookie consent"
      className="fixed bottom-4 left-4 right-4 md:left-auto md:right-6 md:bottom-6 md:max-w-md z-[60] rounded-md border border-divider/70 bg-bg2/95 backdrop-blur-md p-5 shadow-[0_20px_60px_rgba(0,0,0,0.45)]"
    >
      <p className="text-sm text-text1 leading-relaxed">
        We use cookies for analytics to improve Lazzo. See our{' '}
        <Link href="/privacy" className="underline hover:text-text2 transition-colors">
          Privacy Policy
        </Link>
        .
      </p>
      <div className="mt-4 flex flex-col-reverse sm:flex-row justify-end gap-2.5">
        <button
          type="button"
          onClick={() => handleChoice('declined')}
          className="btn-landing-secondary text-text2 hover:text-text1 hover:bg-bg3/65 transition-colors"
        >
          Decline
        </button>
        <button
          type="button"
          onClick={() => handleChoice('accepted')}
          className="btn-landing-secondary !font-semibold bg-text1 text-bg1 transition-transform duration-200 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-bg1 focus-visible:ring-[#8A38F5]"
        >
          Accept
        </button>
      </div>
    </div>
  );
}
