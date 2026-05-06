import Image from 'next/image';
import RevealOnScroll from './RevealOnScroll';

const TESTFLIGHT_URL = process.env.NEXT_PUBLIC_TESTFLIGHT_URL || 'https://testflight.apple.com/join/lazzo';

export default function DownloadCTA() {
  return (
    <section
      id="download"
      aria-labelledby="download-heading"
      className="relative overflow-visible bg-bg2"
    >
      {/* 3-colour brand glow — green left, purple centre, orange right */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -inset-y-[15%] inset-x-0 -z-10"
        style={{
          backgroundImage: [
            'radial-gradient(ellipse 50% 70% at 10% 60%, rgba(22,156,62,0.11) 0%, transparent 60%)',
            'radial-gradient(ellipse 60% 80% at 50% 50%, rgba(138,56,245,0.09) 0%, transparent 65%)',
            'radial-gradient(ellipse 55% 65% at 88% 40%, rgba(255,117,26,0.10) 0%, transparent 60%)',
          ].join(', '),
        }}
      />


      <div className="landing-shell mx-auto grid grid-cols-1 items-center gap-10 py-28 md:grid-cols-2 md:gap-0 md:py-0">
        {/* Left — text + TestFlight badge */}
        <RevealOnScroll className="flex flex-col items-start gap-10 text-left py-32 md:py-40 lg:py-48">
          {/* Eyebrow + heading + subtitle grouped tightly */}
          <div className="flex flex-col gap-4">
            <p
              className="text-xs font-bold uppercase tracking-[0.22em]"
              style={{
                backgroundImage: 'linear-gradient(90deg, #169C3E 0%, #8A38F5 55%, #FF751A 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              Available now
            </p>

            <h2
              id="download-heading"
              className="text-3xl font-semibold leading-[1.05] tracking-tight text-text1 sm:text-4xl md:text-5xl"
            >
              Start your next event.
            </h2>

            <p className="text-lg leading-relaxed text-text2">
              Free. No ads, ever.
            </p>
          </div>

          <a
            href={TESTFLIGHT_URL}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Download Lazzo on TestFlight"
            className="inline-block transition-all duration-200 hover:-translate-y-1 hover:opacity-90"
          >
            <Image
              src="/available_testflight.png"
              alt="Available on TestFlight"
              width={196}
              height={64}
              className="h-14 w-auto"
            />
          </a>
        </RevealOnScroll>

        {/* Right — phones pushed down, slightly overflowing section bottom */}
        <RevealOnScroll delay={100} className="relative flex items-end justify-center md:justify-end md:overflow-visible">
          {/* Glow behind phones */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute bottom-0 left-1/2 h-[520px] w-[520px] -translate-x-1/2 rounded-full blur-3xl"
            style={{
              backgroundImage: 'radial-gradient(circle, rgba(22,156,62,0.15) 0%, rgba(138,56,245,0.12) 45%, transparent 75%)',
            }}
          />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/screenshots/cta_image.png"
            alt="Lazzo app — calendar and create event screens"
            className="relative w-full max-w-[660px] translate-y-8 drop-shadow-[0_40px_80px_rgba(0,0,0,0.8)] md:max-w-none md:w-[120%] md:translate-y-12 lg:w-[125%] lg:translate-y-16"
          />
        </RevealOnScroll>
      </div>

    </section>
  );
}
