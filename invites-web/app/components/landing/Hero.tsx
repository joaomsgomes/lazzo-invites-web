'use client';

import { trackEvent } from '@/lib/analytics';

const APPSTORE_URL = process.env.NEXT_PUBLIC_APPSTORE_URL || '#';

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
    trackEvent('landing_cta_clicked', { location: 'hero', store: 'app_store' });
  };

  return (
    // `isolate` creates a stacking context so the absolute bg layers below
    // (moodboard, overlay, glow) stay within this section and don't fall
    // behind <main>'s background.
    <section
      aria-labelledby="hero-heading"
      className="relative isolate flex min-h-[100svh] flex-col items-center overflow-hidden px-6 pt-24 pb-10 text-center"
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

      {/* Cluster lives in the upper half of the section, anchored at the
          bottom of its half so the CTA below sits a little closer. */}
      <div className="relative z-10 flex flex-1 flex-col items-center justify-end">
        <h1
          id="hero-heading"
          className="font-bold tracking-[-0.03em] leading-[0.98] text-4xl sm:text-6xl md:text-7xl text-white"
        >
          <span className="block">Plan fast.</span>
          <span className="block mt-1">Live loud.</span>
          <span className="block mt-1">Remember forever.</span>
        </h1>

        <p className="mt-8 max-w-xl text-lg text-text2 leading-snug">
          One app for the whole life of your event.
        </p>

        {/* Social proof — replace the X placeholders with real numbers */}
        <div className="mt-10 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-text2">
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
      <div className="relative z-10 flex flex-1 items-center justify-center">
        <a
          href={APPSTORE_URL}
          onClick={handleDownloadClick}
          aria-label="Download Lazzo on the App Store"
          className="cta-gradient-hover group inline-flex items-center justify-center font-bold whitespace-nowrap rounded-pill transition-all duration-200 hover:-translate-y-1 hover:scale-[1.03] shadow-[0_12px_40px_rgba(255,255,255,0.25)] hover:shadow-[0_20px_60px_rgba(255,255,255,0.4)] ring-[5px] ring-white hover:ring-white px-[clamp(2.5rem,13vw,22rem)] py-[clamp(1.35rem,4.2vw,5.5rem)] text-[clamp(1rem,2.1vw,1.875rem)]"
        >
          Get the App
        </a>
      </div>

      {/* Scroll indicator — pinned at the bottom of the hero */}
      <a
        href="#phase-planning-heading"
        aria-label="Scroll to features"
        className="relative z-10 mt-0 flex flex-col items-center gap-2 text-text2 hover:text-text1 transition-colors"
      >
        <span className="text-[10px] font-semibold tracking-[0.25em] uppercase">Scroll</span>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </a>
    </section>
  );
}
