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
  { label: 'Birthdays',     tag: 'Turning one year louder.',         accent: PHASE.planning, image: UNSPLASH('photo-1530103862676-de8c9debad1d') },
  { label: 'House parties', tag: "The night you'll want to relive.", accent: PHASE.living,   image: UNSPLASH('photo-1414235077428-338989a2e8c0') },
  { label: 'Weekend trips', tag: 'Pack light, remember everything.', accent: PHASE.recap,    image: UNSPLASH('photo-1501785888041-af3ef285b470') },
  { label: 'Dinner nights', tag: 'Slow meals, loud memories.',       accent: PHASE.planning, image: UNSPLASH('photo-1555939594-58d7cb561ad1') },
  { label: 'Festival crews',tag: 'Find your people. Keep them.',     accent: PHASE.living,   image: UNSPLASH('photo-1533174072545-7a4b6ad7a6c3') },
  { label: 'Game nights',   tag: 'Rivalries that deserve replays.',  accent: PHASE.recap,    image: UNSPLASH('photo-1610890716171-6b1bb98ffd09') },
];

export default function UseCases() {
  return (
    <section aria-labelledby="usecases-heading" className="relative px-6 py-40 md:py-56">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -inset-y-[20%] inset-x-0 -z-10"
        style={{
          backgroundImage:
            'radial-gradient(circle at 20% 30%, rgba(22,156,62,0.08) 0%, transparent 55%), radial-gradient(circle at 80% 70%, rgba(255,117,26,0.08) 0%, transparent 55%)',
        }}
      />

      <div className="flex flex-col items-center">
        <SectionHeading
          id="usecases-heading"
          eyebrow="PERFECT FOR"
          title="Any time your people are in the same place."
        />

        <div className="mt-48 md:mt-[28rem] w-full max-w-3xl grid grid-cols-2 md:grid-cols-3 gap-6 md:gap-8">
          {USE_CASES.map((u, i) => (
            <RevealOnScroll key={u.label} delay={i * 60}>
              <div
                className="group relative overflow-hidden rounded-xl aspect-square transition-all duration-200 hover:-translate-y-1"
                style={{ border: `1.5px solid ${u.accent}` }}
              >
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
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                  style={{ boxShadow: `inset 0 0 0 1.5px ${u.accent}, 0 12px 40px ${u.accent}33` }}
                />
                <div className="absolute left-0 right-0 bottom-0 p-6 pl-8 md:pl-9">
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
