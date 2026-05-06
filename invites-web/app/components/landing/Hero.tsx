'use client';

import { trackEvent } from '@/lib/analytics';
import { LAZZO_TESTFLIGHT_URL } from '@/lib/lazzo-download';

const MOOD = (id: string) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=500&q=70`;

// Low-opacity party/event moodboard — atmosphere only, never the focal point
const MOODBOARD = [
  MOOD('photo-1492684223066-81342ee5ff30'), // party crowd
  MOOD('photo-1530103862676-de8c9debad1d'), // birthday candles
  MOOD('photo-1414235077428-338989a2e8c0'), // house party
  MOOD('photo-1533174072545-7a4b6ad7a6c3'), // festival
  MOOD('photo-1543007630-9710e4a00a20'),    // memories
  MOOD('photo-1529156069898-49953e39b3ac'), // friends
  MOOD('photo-1555939594-58d7cb561ad1'),    // dinner
  MOOD('photo-1610890716171-6b1bb98ffd09'), // game night
  MOOD('photo-1501785888041-af3ef285b470'), // weekend trip
  MOOD('photo-1514525253161-7a46d19cd819'), // night crowd
  MOOD('photo-1519671482749-fd09be7ccebf'), // celebration
  MOOD('photo-1496024840928-4c417adf211d'), // confetti
];

export default function Hero() {
  const handleDownloadClick = () => {
    trackEvent('landing_cta_clicked', { location: 'hero', store: 'testflight' });
  };

  const handleScrollClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    const targetHash = '#phase-planning';
    const el = document.querySelector(targetHash);
    if (!el) return;

    e.preventDefault();
    const NAV_OFFSET = 96;
    const targetTop = el.getBoundingClientRect().top + window.scrollY - NAV_OFFSET;
    window.scrollTo({ top: Math.max(targetTop, 0), behavior: 'smooth' });
    if (typeof history !== 'undefined') {
      history.replaceState(null, '', targetHash);
    }
  };

  return (
    // `isolate` creates a stacking context so the absolute bg layers below
    // (moodboard, overlay, glow) stay within this section and don't fall
    // behind <main>'s background.
    <section
      aria-labelledby="hero-heading"
      className="landing-shell relative isolate flex min-h-[100svh] flex-col items-center justify-center gap-12 overflow-hidden pt-32 pb-14 text-center sm:gap-14 sm:pt-36 sm:pb-16 md:gap-16 md:pt-40 md:pb-20"
    >
      {/* Moodboard — low-opacity party photos behind everything */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 overflow-hidden"
      >
        <div
          className="grid h-full w-full grid-cols-3 gap-2 p-2 opacity-[0.14] sm:grid-cols-4 sm:gap-3 sm:p-3 md:opacity-[0.16]"
          style={{ filter: 'blur(2px)' }}
        >
          {MOODBOARD.map((src, i) => (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              key={i}
              src={src}
              alt=""
              loading="lazy"
              className="h-full w-full rounded-lg object-cover"
            />
          ))}
        </div>
      </div>

      {/* Dark overlay — lighter at top so the moodboard can breathe,
          fades to near-solid at the bottom to blend into the next section. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'linear-gradient(to bottom, rgba(18,18,18,0.18) 0%, rgba(18,18,18,0.45) 55%, rgba(18,18,18,0.75) 100%)',
        }}
      />

      {/* Background glow — brand gradient, no animation */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-[0.22] blur-3xl"
        style={{
          backgroundImage:
            'radial-gradient(circle at 30% 30%, #169C3E 0%, transparent 55%), radial-gradient(circle at 70% 40%, #8A38F5 0%, transparent 55%), radial-gradient(circle at 50% 80%, #FF751A 0%, transparent 55%)',
        }}
      />

      <div className="relative z-10 flex flex-col items-center gap-12 sm:gap-14 md:gap-16">
        {/* Cluster lives in the upper half of the section, anchored at the
            bottom of its half so the CTA below sits a little closer. */}
        <div className="flex h-fit flex-col items-center gap-7 md:gap-8">
          <h1
            id="hero-heading"
            className="text-4xl font-semibold leading-[1.05] tracking-tight text-text1 sm:text-5xl md:text-6xl lg:text-7xl"
          >
            <span className="block">Plan fast</span>
            <span className="block mt-1">Live loud</span>
            <span className="block mt-1">Remember forever</span>
          </h1>

          <p className="max-w-xl text-lg text-text2 leading-relaxed tracking-[0.005em]">
            One app for the whole life of your event
          </p>

          {/* Social proof — replace the X placeholders with real numbers */}
          <div className="hidden flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-text2">
            <span className="inline-flex items-center gap-1.5">
            </span>
            <span className="inline-flex items-center gap-1.5">
            </span>
            <span className="inline-flex items-center gap-1.5">
            </span>
          </div>
        </div>

        {/* CTA lives in the lower half of the section, centered vertically
            between the cluster and the scroll indicator. */}
        <div className="flex h-fit items-center justify-center">
          <a
            href={LAZZO_TESTFLIGHT_URL}
            target="_blank"
            rel="noopener noreferrer"
            onClick={handleDownloadClick}
            aria-label="Get Lazzo on TestFlight"
            className="btn-landing-primary group border-[0.5px] border-white/55 bg-bg1 text-text1 transition-[transform,box-shadow] duration-200 hover:-translate-y-1 hover:scale-[1.03] hover:bg-bg2 shadow-[0_10px_32px_rgba(0,0,0,0.55)] hover:shadow-[0_16px_44px_rgba(0,0,0,0.65)]"
          >
            Get Started
          </a>
        </div>
      </div>

      {/* Scroll indicator sits in its own bottom zone of the hero */}
      <a
        href="#phase-planning"
        onClick={handleScrollClick}
        aria-label="Scroll to features"
        className="absolute bottom-6 left-1/2 z-10 flex -translate-x-1/2 flex-col items-center gap-2 text-text2 transition-colors hover:text-text1 sm:bottom-8 md:bottom-10"
      >
        <span className="text-[10px] font-semibold tracking-[0.25em] uppercase">Scroll</span>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </a>
    </section>
  );
}
