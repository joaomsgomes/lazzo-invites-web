import RevealOnScroll from './RevealOnScroll';
import SectionHeading from './SectionHeading';

type Case = {
  label: string;
  tag: string;
  accent: string;
  image: string;
};

const PHASE = {
  planning: '#169C3E',
  living: '#8A38F5',
  recap: '#FF751A',
};

const UNSPLASH = (id: string) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=700&q=80`;

const USE_CASES: Case[] = [
  { label: 'Birthdays',     tag: 'Turning one year louder.',         accent: PHASE.planning, image: UNSPLASH('photo-1496024840928-4c417adf211d') },
  { label: 'House parties', tag: "The night you'll want to relive.", accent: PHASE.living,   image: UNSPLASH('photo-1414235077428-338989a2e8c0') },
  { label: 'Weekend trips', tag: 'Pack light, remember everything.', accent: PHASE.recap,    image: UNSPLASH('photo-1529156069898-49953e39b3ac') },
  { label: 'Dinner nights', tag: 'Slow meals, loud memories.',       accent: PHASE.planning, image: UNSPLASH('photo-1555939594-58d7cb561ad1') },
  { label: 'Festival crews',tag: 'Find your people. Keep them.',     accent: PHASE.living,   image: UNSPLASH('photo-1492684223066-81342ee5ff30') },
  { label: 'Game nights',   tag: 'Rivalries that deserve replays.',  accent: PHASE.recap,    image: UNSPLASH('photo-1543269865-cbf427effbad') },
];

export default function UseCases() {
  return (
    <section aria-labelledby="usecases-heading" className="landing-shell relative landing-section-y">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -inset-y-[20%] inset-x-0 -z-10"
        style={{
          backgroundImage:
            'radial-gradient(circle at 20% 30%, rgba(22,156,62,0.08) 0%, transparent 55%), radial-gradient(circle at 80% 70%, rgba(255,117,26,0.08) 0%, transparent 55%)',
        }}
      />

      <div className="flex flex-col items-center justify-start gap-10 md:gap-12">
        <SectionHeading
          id="usecases-heading"
          eyebrow="PERFECT FOR"
          title="Any time your people are in the same place"
        />

        <div className="mt-12 md:mt-16 w-full max-w-3xl grid grid-cols-2 md:grid-cols-3 gap-5 md:gap-6">
          {USE_CASES.map((u, i) => (
            <RevealOnScroll key={u.label} delay={i * 60}>
              <div className="group relative overflow-hidden rounded-xl aspect-square transition-all duration-200 hover:-translate-y-1">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={u.image}
                  alt={u.label}
                  loading="lazy"
                  className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div
                  aria-hidden="true"
                  className="absolute inset-0"
                  style={{
                    background:
                      'linear-gradient(to top, rgba(18,18,18,0.92) 0%, rgba(18,18,18,0.45) 45%, rgba(18,18,18,0.15) 100%)',
                  }}
                />
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-2 rounded-[inherit] opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                  style={{ boxShadow: `0 12px 40px ${u.accent}33` }}
                />
                <div className="absolute left-2 right-2 bottom-[9px] p-4 sm:p-5 md:p-6">
                  <div className="text-base md:text-lg font-semibold text-text1 tracking-tight leading-tight">
                    {u.label}
                  </div>
                  <div className="mt-2 text-xs text-text1/80 leading-snug">
                    {u.tag}
                  </div>
                </div>
              </div>
            </RevealOnScroll>
          ))}
        </div>
      </div>
    </section>
  );
}
