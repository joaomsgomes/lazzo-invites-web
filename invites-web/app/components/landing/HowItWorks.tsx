import RevealOnScroll from './RevealOnScroll';
import SectionHeading from './SectionHeading';
import { BrandColors } from '../../design/constants';

/** One horizontal ribbon: planning → living → recap; each step shows a third via background-position. */
const HOW_IT_WORKS_NUMBER_GRADIENT = `linear-gradient(90deg, ${BrandColors.planning} 0%, ${BrandColors.planning} 14%, ${BrandColors.living} 42%, ${BrandColors.living} 58%, ${BrandColors.recap} 86%, ${BrandColors.recap} 100%)`;

const STEP_NUMBER_GRADIENT_POSITIONS = ['0% 50%', '50% 50%', '100% 50%'] as const;

const STEPS = [
  {
    n: '01',
    title: 'Create an event',
    description: 'Pick a vibe, invite the group. Takes 20 seconds.',
  },
  {
    n: '02',
    title: 'Everyone joins',
    description: 'Friends vote on details, RSVP, and actually show up.',
  },
  {
    n: '03',
    title: 'Lazzo builds the recap',
    description: 'You just share it. The memory lives forever.',
  },
];

export default function HowItWorks() {
  return (
    <section
      aria-labelledby="how-heading"
      className="landing-band-how-it-works"
    >
      <div className="landing-shell relative">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -inset-y-[25%] inset-x-0 -z-10"
          style={{
            backgroundImage:
              'radial-gradient(ellipse 70% 55% at 50% 50%, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.02) 40%, transparent 75%)',
          }}
        />

        <div className="flex flex-col items-center gap-10 md:gap-12">
          <SectionHeading
            id="how-heading"
            eyebrow="HOW IT WORKS"
            title="Three steps. One weekend to remember."
          />

          <div className="mt-12 md:mt-16 w-full max-w-5xl grid gap-12 md:gap-16 md:grid-cols-3">
            {STEPS.map((s, i) => (
              <RevealOnScroll key={s.n} delay={i * 110}>
                <div className="text-center flex flex-col items-center gap-5">
                  <div
                    className="text-7xl md:text-8xl font-semibold leading-none tracking-tight bg-clip-text text-transparent"
                    style={{
                      backgroundImage: HOW_IT_WORKS_NUMBER_GRADIENT,
                      backgroundSize: '300% 100%',
                      backgroundPosition: STEP_NUMBER_GRADIENT_POSITIONS[i],
                      backgroundRepeat: 'no-repeat',
                    }}
                  >
                    {s.n}
                  </div>
                  <h3 className="text-xl font-semibold text-text1">{s.title}</h3>
                  <p className="text-text2 leading-relaxed">{s.description}</p>
                </div>
              </RevealOnScroll>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
