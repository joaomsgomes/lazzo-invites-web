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

export default function NavBar() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 80);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleNavClick = (target: NavTarget) => {
    trackEvent('landing_nav_clicked', { target });
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
      <div className="h-20 w-full px-4 sm:px-6 md:px-10 flex items-center justify-between gap-4 sm:gap-6">
        <a href="#top" className="flex items-center gap-3" aria-label="Lazzo home">
          <Image
            src="/app-icon.png"
            alt=""
            width={36}
            height={36}
            className="rounded-[10px]"
          />
          <span className="text-text1 font-semibold text-xl sm:text-2xl tracking-tight">Lazzo</span>
        </a>

        <div className="flex items-center gap-3 sm:gap-5 md:gap-8">
          <ul className="hidden md:flex items-center gap-8">
            {NAV_LINKS.map((link) => (
              <li key={link.target}>
                <a
                  href={link.href}
                  onClick={() => handleNavClick(link.target)}
                  className="text-base text-text2 hover:text-text1 transition-colors"
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
            className="group relative inline-flex items-center px-6 py-3 sm:px-7 sm:py-3.5 text-sm sm:text-base font-semibold rounded-pill transition-all duration-200 whitespace-nowrap hover:-translate-y-0.5 hover:shadow-[0_12px_34px_rgba(255,255,255,0.25)]"
            style={{ backgroundColor: '#FFFFFF', color: '#000000' }}
          >
            <span className="hidden sm:inline">Get the App</span>
            <span className="sm:hidden">Get App</span>
          </a>
        </div>
      </div>

      <div
        aria-hidden="true"
        className="absolute bottom-0 left-0 right-0 h-px pointer-events-none"
        style={{
          background:
            'linear-gradient(90deg, transparent 0%, #169C3E 25%, #8A38F5 50%, #FF751A 75%, transparent 100%)',
        }}
      />
    </nav>
  );
}
