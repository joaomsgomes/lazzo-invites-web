import RevealOnScroll from './RevealOnScroll';
import SectionHeading from './SectionHeading';

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
      className="landing-shell relative py-64 md:py-80"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -inset-y-[25%] inset-x-0 -z-10"
        style={{
          backgroundImage:
            'radial-gradient(ellipse 70% 55% at 50% 50%, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.02) 40%, transparent 75%)',
        }}
      />

      <div className="flex flex-col items-center gap-12">
        <SectionHeading
          id="how-heading"
          eyebrow="HOW IT WORKS"
          title="Three steps. One weekend to remember."
        />

        <div className="mt-20 md:mt-24 w-full max-w-5xl grid gap-16 md:gap-20 md:grid-cols-3">
          {STEPS.map((s, i) => (
            <RevealOnScroll key={s.n} delay={i * 110}>
              <div className="text-center flex flex-col items-center gap-5">
                <div className="text-7xl md:text-8xl font-bold leading-none tracking-tight text-text1">
                  {s.n}
                </div>
                <h3 className="text-xl font-semibold text-text1">{s.title}</h3>
                <p className="text-text2 leading-relaxed">{s.description}</p>
              </div>
            </RevealOnScroll>
          ))}
        </div>
      </div>
    </section>
  );
}
