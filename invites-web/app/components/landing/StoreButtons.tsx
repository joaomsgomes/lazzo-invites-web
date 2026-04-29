'use client';

import { trackEvent } from '@/lib/analytics';

type Location = 'hero' | 'nav' | 'final';

type Props = {
  location: Location;
  size?: 'md' | 'lg';
};

const APPSTORE_URL = process.env.NEXT_PUBLIC_APPSTORE_URL || '#';

export default function StoreButtons({ location, size = 'lg' }: Props) {
  const handleClick = () => {
    trackEvent('landing_cta_clicked', { location, store: 'app_store' });
  };

  const padding = size === 'lg' ? 'px-6 py-3' : 'px-5 py-2.5';
  const topLabel = size === 'lg' ? 'text-[11px]' : 'text-[10px]';
  const mainLabel = size === 'lg' ? 'text-xl' : 'text-lg';
  const iconSize = size === 'lg' ? 28 : 24;

  return (
    <a
      href={APPSTORE_URL}
      onClick={handleClick}
      aria-label="Download Lazzo on the App Store"
      className={`group inline-flex items-center gap-3 ${padding} bg-black text-white rounded-[12px] border border-white/15 shadow-[0_8px_24px_rgba(0,0,0,0.4)] transition-all duration-200 hover:-translate-y-0.5 hover:border-white/25 hover:shadow-[0_14px_40px_rgba(138,56,245,0.22)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-bg1 focus-visible:ring-[#8A38F5]`}
    >
      <svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M18.71 19.5C17.88 20.74 17 21.95 15.66 21.97C14.32 22 13.89 21.18 12.37 21.18C10.84 21.18 10.37 21.95 9.1 22C7.79 22.05 6.8 20.68 5.96 19.47C4.25 17 2.94 12.45 4.7 9.39C5.57 7.87 7.13 6.91 8.82 6.88C10.1 6.86 11.32 7.75 12.11 7.75C12.89 7.75 14.37 6.68 15.92 6.84C16.57 6.87 18.39 7.1 19.56 8.82C19.47 8.88 17.39 10.1 17.41 12.63C17.44 15.65 20.06 16.66 20.09 16.67C20.06 16.74 19.67 18.11 18.71 19.5ZM13 3.5C13.73 2.67 14.94 2.04 15.94 2C16.07 3.17 15.6 4.35 14.9 5.19C14.21 6.04 13.07 6.7 11.95 6.61C11.8 5.46 12.36 4.26 13 3.5Z" />
      </svg>
      <span className="flex flex-col items-start leading-none">
        <span className={`${topLabel} font-normal tracking-wide opacity-80`}>Download on the</span>
        <span className={`${mainLabel} font-semibold mt-1 tracking-tight`}>App Store</span>
      </span>
    </a>
  );
}
