import Link from 'next/link';
import Image from 'next/image';
import { ReactNode } from 'react';
import { LAZZO_TESTFLIGHT_URL } from '@/lib/lazzo-download';

export default function Footer() {
  return (
    <footer className="landing-shell bg-bg1 landing-section-y-footer text-center">
      <div className="flex flex-col items-center gap-10">
        <div className="flex flex-col items-center gap-4">
          <div className="flex items-center gap-3">
            <Image
              src="/app-icon.png"
              alt=""
              width={36}
              height={36}
              className="rounded-[9px]"
            />
            <span className="text-text1 font-semibold text-xl tracking-tight">Lazzo</span>
          </div>
          <p className="text-sm text-text2 leading-relaxed max-w-md">
            Made for people who actually show up.
          </p>
        </div>

        <div className="flex flex-col items-center gap-10 sm:flex-row sm:items-start sm:gap-16">
          <FooterCol title="Product">
            <FooterLink href={LAZZO_TESTFLIGHT_URL}>Download</FooterLink>
          </FooterCol>

          <FooterCol title="Company">
            <FooterLink href="mailto:realeventapp@gmail.com">Contact</FooterLink>
          </FooterCol>

          <FooterCol title="Legal">
            <FooterLink href="/privacy">Privacy</FooterLink>
          </FooterCol>
        </div>

        <div className="pt-8 w-full max-w-3xl border-t border-divider/40 flex flex-col items-center gap-2">
          <p className="text-sm text-text2">© 2026 Lazzo</p>
          <p className="text-sm text-text2 leading-relaxed max-w-md">
            Built by{' '}
            <a
              href="https://www.linkedin.com/in/guilhermedmonteiro/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-text2 underline underline-offset-2 decoration-text2/50 hover:text-text1 hover:decoration-text1 transition-colors"
            >
              Guilherme Monteiro
            </a>
            {' '}&amp;{' '}
            <a
              href="https://www.linkedin.com/in/joaomsgomes/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-text2 underline underline-offset-2 decoration-text2/50 hover:text-text1 hover:decoration-text1 transition-colors"
            >
              João Gomes
            </a>
            .
          </p>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="flex flex-col items-center text-center min-w-[120px]">
      <h4 className="text-sm font-semibold text-text1 mb-4">{title}</h4>
      <ul className="flex flex-col items-center space-y-2.5">{children}</ul>
    </div>
  );
}

function FooterLink({ href, children }: { href: string; children: ReactNode }) {
  const isMailto = href.startsWith('mailto:');
  const isHttp = href.startsWith('http');
  const isExternal = isMailto || isHttp;
  const Component = isExternal ? 'a' : Link;
  return (
    <li>
      <Component
        href={href}
        className="text-sm text-text2 hover:text-text1 transition-colors"
        {...(isHttp ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
      >
        {children}
      </Component>
    </li>
  );
}
