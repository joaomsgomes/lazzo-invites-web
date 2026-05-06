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
      <p className="text-xs font-bold tracking-[0.22em] text-text2 uppercase mb-2">
        {eyebrow}
      </p>
      <h2
        id={id}
        className="text-3xl sm:text-4xl md:text-5xl font-semibold tracking-tight leading-[1.05] text-text1"
      >
        {title}
      </h2>
    </div>
  );
}
