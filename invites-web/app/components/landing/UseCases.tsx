import RevealOnScroll from './RevealOnScroll';
import SectionHeading from './SectionHeading';

const USE_CASES = [
  { label: 'Birthdays', emoji: '🎂' },
  { label: 'House parties', emoji: '🎉' },
  { label: 'Weekend trips', emoji: '🧳' },
  { label: 'Dinner nights', emoji: '🍝' },
  { label: 'Festival crews', emoji: '🎪' },
  { label: 'Game nights', emoji: '🎮' },
];

export default function UseCases() {
  return (
    <section aria-labelledby="usecases-heading" className="px-6 py-32 md:py-48">
      <div className="flex flex-col items-center">
        <SectionHeading
          id="usecases-heading"
          eyebrow="PERFECT FOR"
          title="Any time your people are in the same place."
        />

        <div className="mt-16 md:mt-20 w-full max-w-4xl grid grid-cols-2 md:grid-cols-3 gap-4">
          {USE_CASES.map((u, i) => (
            <RevealOnScroll key={u.label} delay={i * 50}>
              <div
                className="bg-bg2 border border-divider/60 rounded-md p-5 md:p-6 flex items-center gap-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-transparent hover:shadow-[0_8px_30px_rgba(138,56,245,0.12),0_0_0_1px_rgba(138,56,245,0.35)]"
              >
                <span className="text-2xl md:text-3xl" aria-hidden="true">
                  {u.emoji}
                </span>
                <span className="text-text1 font-medium">{u.label}</span>
              </div>
            </RevealOnScroll>
          ))}
        </div>
      </div>
    </section>
  );
}
