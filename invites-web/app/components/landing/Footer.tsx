import Link from 'next/link';
import Image from 'next/image';
import { ReactNode } from 'react';

export default function Footer() {
  return (
    <footer className="bg-bg1 border-t border-divider/40 px-6 pt-20 pb-10 text-center">
      <div className="flex flex-col items-center">
        <div className="flex items-center gap-2.5">
          <Image
            src="/app-icon.png"
            alt=""
            width={28}
            height={28}
            className="rounded-[7px]"
          />
          <span className="text-text1 font-semibold text-lg">Lazzo</span>
        </div>
        <p className="mt-4 text-sm text-text2 leading-relaxed max-w-md">
          The app for planning events with your people — from the first poll to the last photo.
        </p>

        <div className="mt-12 flex flex-col items-center gap-10 sm:flex-row sm:items-start sm:gap-16">
          <FooterCol title="Product">
            <FooterLink href="#download">Download</FooterLink>
            <FooterLink href="#how-heading">How it works</FooterLink>
          </FooterCol>

          <FooterCol title="Company">
            <FooterLink href="mailto:hi@getlazzo.com">Contact</FooterLink>
          </FooterCol>

          <FooterCol title="Legal">
            <FooterLink href="/privacy">Privacy</FooterLink>
          </FooterCol>
        </div>

        <div className="mt-16 pt-8 w-full max-w-3xl border-t border-divider/40 flex flex-col items-center gap-2">
          <p className="text-sm text-text2">© 2026 Lazzo</p>
          <p className="text-xs text-text2">Made for people who actually show up.</p>
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
  const isExternal = href.startsWith('mailto:') || href.startsWith('http');
  const Component = isExternal ? 'a' : Link;
  return (
    <li>
      <Component
        href={href}
        className="text-sm text-text2 hover:text-text1 transition-colors"
      >
        {children}
      </Component>
    </li>
  );
}
