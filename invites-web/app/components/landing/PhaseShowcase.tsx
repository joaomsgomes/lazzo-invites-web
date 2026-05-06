import RevealOnScroll from './RevealOnScroll';
import PhoneFrame from './mockups/PhoneFrame';

type Phase = 'planning' | 'living' | 'recap';

type Props = {
  number: '01' | '02' | '03';
  phase: Phase;
  eyebrow: string;
  title: string;
  description: string;
  bullets: string[];
  // Path to an app screenshot (e.g. "/screenshots/planning.png").
  // Rendered inside a PhoneFrame — iPhone-ish 280×580 viewport, object-cover.
  imageSrc: string;
  imageAlt: string;
  reverse?: boolean;
  edgeBleed?: 'right' | 'left';
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
  imageSrc,
  imageAlt,
  reverse = false,
  edgeBleed,
}: Props) {
  const color = PHASE_COLOR[phase];
  const bleedRight = edgeBleed === 'right';
  const bleedLeft = edgeBleed === 'left';

  return (
    <section
      id={`phase-${phase}`}
      aria-labelledby={`phase-${phase}-heading`}
      className="landing-shell relative landing-section-y"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -inset-y-[30%] inset-x-0 -z-10"
        style={{
          backgroundImage: `radial-gradient(ellipse 60% 50% at ${reverse ? '25%' : '75%'} 50%, ${color}24 0%, ${color}10 35%, transparent 70%)`,
        }}
      />

      <div
        className={`mx-auto grid w-full max-w-6xl grid-cols-1 justify-items-center gap-12 md:grid-cols-2 md:gap-20 md:justify-items-stretch ${
          reverse ? 'md:[&>*:first-child]:order-2' : ''
        }`}
        style={
          bleedRight
            ? { maxWidth: '72rem' }
            : bleedLeft
              ? { maxWidth: '72rem' }
              : undefined
        }
      >
        {/* Text block */}
        <RevealOnScroll
          delay={reverse ? 120 : 0}
          className={`w-full flex justify-center ${reverse ? 'md:justify-start' : 'md:justify-end'}`}
        >
          <div className="flex w-full max-w-[520px] flex-col items-start gap-5 text-left">
            <div
              className="chip-landing-phase"
              style={{ backgroundColor: `${color}1F`, color }}
            >
              <span>{number}</span>
              <span style={{ opacity: 0.55 }}>•</span>
              <span>{eyebrow}</span>
            </div>

            <h2
              id={`phase-${phase}-heading`}
              className="text-4xl sm:text-5xl md:text-6xl tracking-tight leading-[1.02] mb-2 text-text1"
              style={{ fontFamily: 'var(--font-serif)', fontWeight: 400 }}
            >
              {title}
            </h2>

            <p className="text-lg text-text2 leading-relaxed">
              {description}
            </p>

            <ul className="mt-3 flex flex-col gap-y-2.5">
              {bullets.map((b, i) => (
                <li key={i} className="flex items-center gap-2.5 text-base text-text1">
                  <span
                    aria-hidden="true"
                    className="h-1.5 w-1.5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: color }}
                  />
                  <span>{b}</span>
                </li>
              ))}
            </ul>
          </div>
        </RevealOnScroll>

        {/* App screenshot — rendered inside a phone frame with a phase-tinted glow */}
        <RevealOnScroll
          delay={reverse ? 0 : 120}
          className={`w-full flex justify-center ${
            bleedRight ? 'md:justify-end' : bleedLeft ? 'md:justify-start' : reverse ? 'md:justify-start' : 'md:justify-end'
          }`}
        >
          <div className="mx-auto w-fit">
            <PhoneFrame glowColor={color}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imageSrc}
              alt={imageAlt}
              loading="lazy"
              className="h-full w-full object-cover"
            />
            </PhoneFrame>
          </div>
        </RevealOnScroll>
      </div>
    </section>
  );
}
