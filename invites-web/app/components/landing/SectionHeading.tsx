type Props = {
  eyebrow: string;
  title: string;
  id?: string;
  align?: 'center' | 'left';
};

export default function SectionHeading({ eyebrow, title, id, align = 'center' }: Props) {
  const alignment = align === 'center' ? 'text-center mx-auto' : 'text-left';
  return (
    <div className={`max-w-3xl ${alignment}`}>
      <p className="text-xs font-bold tracking-[0.22em] text-text2 uppercase mb-5">
        {eyebrow}
      </p>
      <h2
        id={id}
        className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight leading-[1.04] text-text1"
      >
        {title}
      </h2>
    </div>
  );
}
