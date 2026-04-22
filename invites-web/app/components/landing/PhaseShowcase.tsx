import { ReactNode } from 'react';
import RevealOnScroll from './RevealOnScroll';

type Phase = 'planning' | 'living' | 'recap';

type Props = {
  number: '01' | '02' | '03';
  phase: Phase;
  eyebrow: string;
  title: string;
  description: string;
  bullets: string[];
  mockup: ReactNode;
  reverse?: boolean;
};

const PHASE_COLOR: Record<Phase, string> = {
  planning: '#169C3E',
  living: '#8A38F5',
  recap: '#FF751A',
};

export default function PhaseShowcase({
  number,
  phase,
  eyebrow,
  title,
  description,
  bullets,
  mockup,
}: Props) {
  const color = PHASE_COLOR[phase];
  return (
    <section
      aria-labelledby={`phase-${phase}-heading`}
      className="relative px-6 py-32 md:py-44 overflow-hidden"
    >
      {/* Subtle ambient background tint in the phase color */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          backgroundImage: `radial-gradient(circle at 50% 40%, ${color}14 0%, transparent 60%)`,
        }}
      />

      <div className="flex flex-col items-center text-center">
        <RevealOnScroll className="flex items-center justify-center">
          {mockup}
        </RevealOnScroll>

        <RevealOnScroll delay={120} className="mt-16 md:mt-20 flex flex-col items-center">
          <div
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-pill text-[11px] font-bold tracking-[0.18em] uppercase mb-6"
            style={{ backgroundColor: `${color}1F`, color }}
          >
            <span>{number}</span>
            <span style={{ opacity: 0.55 }}>•</span>
            <span>{eyebrow}</span>
          </div>

          <h2
            id={`phase-${phase}-heading`}
            className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight leading-[1.02]"
            style={{ color }}
          >
            {title}
          </h2>

          <p className="mt-6 text-lg text-text2 leading-relaxed max-w-xl">
            {description}
          </p>

          <ul className="mt-8 space-y-3.5 flex flex-col items-center">
            {bullets.map((b, i) => (
              <li key={i} className="flex items-center gap-3 text-base text-text1">
                <span
                  aria-hidden="true"
                  className="h-1.5 w-1.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: color }}
                />
                <span className="leading-relaxed">{b}</span>
              </li>
            ))}
          </ul>
        </RevealOnScroll>
      </div>
    </section>
  );
}
