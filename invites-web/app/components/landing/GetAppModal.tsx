'use client';

import { FormEvent, useCallback, useEffect, useId, useRef, useState } from 'react';
import { trackEvent } from '@/lib/analytics';
import { LAZZO_TESTFLIGHT_URL } from '@/lib/lazzo-download';
import styles from './GetAppModal.module.css';

type Props = {
  isOpen: boolean;
  onClose: () => void;
};

type View = 'choices' | 'form' | 'success';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function GetAppModal({ isOpen, onClose }: Props) {
  const titleId = useId();
  const [view, setView] = useState<View>('choices');
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const closeBtnRef = useRef<HTMLButtonElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  // Reset internal view + state every time the modal re-opens.
  useEffect(() => {
    if (isOpen) {
      setView('choices');
      setEmail('');
      setError(null);
      setSubmitting(false);
    }
  }, [isOpen]);

  // Move focus to the relevant element when the view changes.
  useEffect(() => {
    if (!isOpen) return;
    if (view === 'form') {
      inputRef.current?.focus();
    } else {
      closeBtnRef.current?.focus();
    }
  }, [isOpen, view]);

  const handleBackdropClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (e.target === e.currentTarget) onClose();
    },
    [onClose],
  );

  const handleTestFlight = useCallback(() => {
    trackEvent('landing_cta_clicked', { location: 'modal', store: 'testflight' });
  }, []);

  const handleSubmit = useCallback(
    async (e: FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      const normalized = email.trim().toLowerCase();

      if (!normalized || !EMAIL_REGEX.test(normalized)) {
        setError('Please enter a valid email.');
        return;
      }

      setError(null);
      setSubmitting(true);

      try {
        const res = await fetch('/api/waitlist', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ email: normalized }),
        });

        if (!res.ok) {
          const data = (await res.json().catch(() => null)) as { error?: string } | null;
          setError(data?.error ?? 'Something went wrong. Please try again.');
          setSubmitting(false);
          return;
        }

        trackEvent('landing_waitlist_submitted', { location: 'modal' });
        setView('success');
      } catch {
        setError("Couldn't reach the server — try again.");
      } finally {
        setSubmitting(false);
      }
    },
    [email],
  );

  if (!isOpen) return null;

  return (
    <div
      className={styles.backdrop}
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      onClick={handleBackdropClick}
    >
      <div className={styles.panel}>
        <button
          ref={closeBtnRef}
          type="button"
          className={styles.closeBtn}
          onClick={onClose}
          aria-label="Close"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        <h2 id={titleId} className={styles.title}>Get Lazzo</h2>
        <p className={styles.subtitle}>
          Try the beta today, or get a heads-up when we launch.
        </p>

        {view === 'choices' && (
          <div className={styles.actions}>
            <a
              href={LAZZO_TESTFLIGHT_URL}
              target="_blank"
              rel="noopener noreferrer"
              onClick={handleTestFlight}
              className={styles.primaryCta}
            >
              Test Right Away
            </a>
            <button
              type="button"
              onClick={() => setView('form')}
              className={styles.secondaryCta}
            >
              Remind me on Launch
            </button>
          </div>
        )}

        {view === 'form' && (
          <form className={styles.form} onSubmit={handleSubmit} noValidate>
            <p className={styles.formHint}>
              We&apos;ll email you once when Lazzo launches publicly. No spam.
            </p>
            <input
              ref={inputRef}
              type="email"
              inputMode="email"
              autoComplete="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (error) setError(null);
              }}
              className={`${styles.input}${error ? ' ' + styles.inputError : ''}`}
              aria-invalid={error ? 'true' : 'false'}
              aria-describedby={error ? `${titleId}-error` : undefined}
              disabled={submitting}
            />
            {error && (
              <p id={`${titleId}-error`} className={styles.error} role="alert">
                {error}
              </p>
            )}
            <div className={styles.formActions}>
              <button
                type="button"
                onClick={() => {
                  setView('choices');
                  setError(null);
                }}
                className={styles.backBtn}
                disabled={submitting}
              >
                Back
              </button>
              <button type="submit" className={styles.submitBtn} disabled={submitting}>
                {submitting ? 'Sending…' : 'Remind me on Launch'}
              </button>
            </div>
          </form>
        )}

        {view === 'success' && (
          <div className={styles.success} role="status">
            <p className={styles.successTitle}>You&apos;re on the list.</p>
            <p className={styles.successBody}>
              We&apos;ll send you one email the moment Lazzo launches.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
