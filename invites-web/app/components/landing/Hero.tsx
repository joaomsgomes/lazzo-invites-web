import Image from 'next/image';
import GradientText from './GradientText';

export default function Hero() {
  return (
    <section
      aria-labelledby="hero-heading"
      className="relative flex min-h-[90svh] flex-col items-center justify-center overflow-hidden px-6 pt-24 pb-0 text-center"
    >
      {/* Background glow — brand gradient, no animation */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-1/2 -z-10 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-[0.22] blur-3xl"
        style={{
          backgroundImage:
            'radial-gradient(circle at 30% 30%, #169C3E 0%, transparent 55%), radial-gradient(circle at 70% 40%, #8A38F5 0%, transparent 55%), radial-gradient(circle at 50% 80%, #FF751A 0%, transparent 55%)',
        }}
      />

      <div className="relative z-10 flex flex-col items-center">
        <div className="animate-logo-pulse mb-10">
          <Image
            src="/app-icon.png"
            alt="Lazzo"
            width={112}
            height={112}
            priority
            className="rounded-[22%]"
          />
        </div>

        <h1
          id="hero-heading"
          className="font-bold tracking-[-0.03em] leading-[0.98] text-5xl sm:text-6xl md:text-7xl"
        >
          <span className="block">
            <GradientText variant="planning">Plan fast.</GradientText>
          </span>
          <span className="block mt-1">
            <GradientText variant="living">Live loud.</GradientText>
          </span>
          <span className="block mt-1">
            <GradientText variant="recap">Remember forever.</GradientText>
          </span>
        </h1>

        <p className="mt-8 max-w-xl text-lg text-text2 leading-snug">
          One app for the whole life of your event.
        </p>

        {/* Social proof — replace the X placeholders with real numbers */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-text2">
          <span className="inline-flex items-center gap-1.5">
            <span className="text-text1 font-semibold tabular-nums">X+</span>
            hosts
          </span>
          <span aria-hidden="true" className="opacity-40">•</span>
          <span className="inline-flex items-center gap-1.5">
            <span className="text-text1 font-semibold tabular-nums">X+</span>
            events planned
          </span>
          <span aria-hidden="true" className="opacity-40">•</span>
          <span className="inline-flex items-center gap-1.5">
            <span className="text-text1 font-semibold tabular-nums">X+</span>
            memories shared
          </span>
        </div>
      </div>

      {/* Scroll indicator */}
      <a
        href="#phase-planning-heading"
        aria-label="Scroll to features"
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-text2 hover:text-text1 transition-colors"
      >
        <span className="text-[10px] font-semibold tracking-[0.25em] uppercase">Scroll</span>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </a>
    </section>
  );
}
