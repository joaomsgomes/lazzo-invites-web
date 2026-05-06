'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { trackEvent } from '@/lib/analytics';

const APPSTORE_URL = process.env.NEXT_PUBLIC_APPSTORE_URL || '#';

type NavTarget = 'features' | 'how' | 'usecases' | 'contact';

const NAV_LINKS: { label: string; href: string; target: NavTarget }[] = [
  { label: 'Features', href: '#phase-planning-heading', target: 'features' },
  { label: 'How it works', href: '#how-heading', target: 'how' },
  { label: 'Use cases', href: '#usecases-heading', target: 'usecases' },
  { label: 'Contact', href: 'mailto:hi@getlazzo.com', target: 'contact' },
];

function scrollToHashWithOffset(hash: string) {
  const el = document.querySelector(hash);
  if (!el) return false;

  const NAV_OFFSET = 96;
  const targetTop = el.getBoundingClientRect().top + window.scrollY - NAV_OFFSET;
  window.scrollTo({ top: Math.max(targetTop, 0), behavior: 'smooth' });
  return true;
}

export default function NavBar() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 80);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleNavClick = (
    e: React.MouseEvent<HTMLAnchorElement>,
    link: { href: string; target: NavTarget },
  ) => {
    trackEvent('landing_nav_clicked', { target: link.target });

    if (link.href.startsWith('#')) {
      const scrolledToTarget = scrollToHashWithOffset(link.href);
      if (scrolledToTarget) {
        e.preventDefault();
        if (typeof history !== 'undefined') {
          history.replaceState(null, '', link.href);
        }
      }
    }
  };

  const handleLogoClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    window.scrollTo({ top: 0, behavior: 'smooth' });
    if (typeof history !== 'undefined') {
      history.replaceState(null, '', '#top');
    }
  };

  const handleDownloadClick = () => {
    trackEvent('landing_cta_clicked', { location: 'nav', store: 'app_store' });
  };

  return (
    <nav
      aria-label="Primary"
      className={`fixed top-0 inset-x-0 z-50 transition-colors duration-300 ${
        scrolled ? 'bg-bg1/75 backdrop-blur-md' : 'bg-transparent'
      }`}
    >
      <div className="landing-shell h-20 w-full flex items-center justify-between gap-4 sm:gap-6">
        <a
          href="#top"
          onClick={handleLogoClick}
          className="flex items-center gap-3"
          aria-label="Lazzo home"
        >
          <Image
            src="/app-icon.png"
            alt=""
            width={36}
            height={36}
            className="rounded-[10px]"
          />
          <span className="text-text1 font-semibold text-xl sm:text-2xl tracking-tight">Lazzo</span>
        </a>

        <div className="flex items-center gap-6 sm:gap-10 md:gap-14">
          <ul className="hidden md:flex items-center gap-12">
            {NAV_LINKS.map((link) => (
              <li key={link.target} className="flex items-center justify-center">
                <a
                  href={link.href}
                  onClick={(e) => handleNavClick(e, link)}
                  className="inline-flex h-12 items-center justify-center text-center text-base leading-none text-text2 hover:text-text1 transition-colors"
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>

          <a
            href={APPSTORE_URL}
            onClick={handleDownloadClick}
            aria-label="Download Lazzo on the App Store"
            className="cta-gradient-hover btn-landing-nav group relative transition-all duration-200 hover:-translate-y-0.5 ring-2 ring-white shadow-[0_8px_24px_rgba(255,255,255,0.18)] hover:shadow-[0_12px_34px_rgba(255,255,255,0.30)]"
          >
            <span className="hidden sm:inline">Get the App</span>
            <span className="sm:hidden">Get App</span>
          </a>
        </div>
      </div>

      <div
        aria-hidden="true"
        className={`absolute bottom-0 left-0 right-0 h-px pointer-events-none transition-opacity duration-300 ${
          scrolled ? 'opacity-100' : 'opacity-0'
        }`}
        style={{
          background:
            'linear-gradient(90deg, transparent 0%, #169C3E 25%, #8A38F5 50%, #FF751A 75%, transparent 100%)',
        }}
      />
    </nav>
  );
}
