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
      className="relative px-6 py-32 md:py-48"
      style={{ backgroundColor: 'rgba(31, 31, 31, 0.35)' }}
    >
      <div className="flex flex-col items-center">
        <SectionHeading
          id="how-heading"
          eyebrow="HOW IT WORKS"
          title="Three steps. One weekend to remember."
        />

        <div className="mt-16 md:mt-20 w-full max-w-5xl grid gap-12 md:gap-10 md:grid-cols-3">
          {STEPS.map((s, i) => (
            <RevealOnScroll key={s.n} delay={i * 110}>
              <div className="text-center flex flex-col items-center">
                <div className="text-7xl md:text-8xl font-bold leading-none mb-5 tracking-tight text-text1">
                  {s.n}
                </div>
                <h3 className="text-xl font-semibold text-text1 mb-2">{s.title}</h3>
                <p className="text-text2 leading-relaxed">{s.description}</p>
              </div>
            </RevealOnScroll>
          ))}
        </div>
      </div>
    </section>
  );
}
