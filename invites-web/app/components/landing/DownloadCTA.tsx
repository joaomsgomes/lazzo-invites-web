import RevealOnScroll from './RevealOnScroll';

export default function DownloadCTA() {
  return (
    <section
      id="download"
      aria-labelledby="download-heading"
      className="relative px-6 pt-40 pb-56 md:pt-56 md:pb-80 overflow-hidden"
    >
      <div
        aria-hidden="true"
        className="absolute top-0 left-0 right-0 h-px"
        style={{ background: 'linear-gradient(90deg, transparent 0%, #169C3E 25%, #8A38F5 50%, #FF751A 75%, transparent 100%)' }}
      />
      <div
        aria-hidden="true"
        className="absolute bottom-0 left-0 right-0 h-px"
        style={{ background: 'linear-gradient(90deg, transparent 0%, #169C3E 25%, #8A38F5 50%, #FF751A 75%, transparent 100%)' }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          backgroundImage:
            'radial-gradient(circle at 50% 50%, rgba(138, 56, 245, 0.14) 0%, transparent 60%)',
        }}
      />

      <RevealOnScroll className="relative flex flex-col items-center text-center">
        <h2
          id="download-heading"
          className="text-5xl sm:text-6xl md:text-7xl font-bold tracking-tight leading-[1.02] text-text1"
        >
          Start your next event.
        </h2>
        <p className="mt-6 text-lg text-text2">Free. No ads, ever.</p>
      </RevealOnScroll>
    </section>
  );
}
