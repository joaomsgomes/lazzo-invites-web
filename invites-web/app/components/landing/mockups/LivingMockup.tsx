const PHOTOS = [
  'linear-gradient(135deg, #8A38F5 0%, #3a1a6e 100%)',
  'linear-gradient(160deg, #FF751A 0%, #8A38F5 90%)',
  'linear-gradient(45deg, #2B2B2B 0%, #8A38F5 90%)',
  'linear-gradient(200deg, #8A38F5 0%, #FF751A 100%)',
  'linear-gradient(90deg, #169C3E 0%, #8A38F5 100%)',
  'linear-gradient(220deg, #8A38F5 0%, #1F1F1F 100%)',
  'linear-gradient(60deg, #FF751A 0%, #8A38F5 100%)',
  'linear-gradient(140deg, #8A38F5 0%, #0a0a0a 100%)',
  'linear-gradient(100deg, #8A38F5 0%, #B47BFF 100%)',
];

export default function LivingMockup() {
  return (
    <div className="h-full w-full flex flex-col p-5 pt-12 bg-bg1">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-1.5">
          <span className="relative flex h-2 w-2">
            <span
              className="absolute inline-flex h-full w-full rounded-full opacity-75 animate-ping"
              style={{ backgroundColor: '#8A38F5' }}
            />
            <span
              className="relative inline-flex rounded-full h-2 w-2"
              style={{ backgroundColor: '#8A38F5' }}
            />
          </span>
          <span className="text-[11px] font-bold tracking-wider" style={{ color: '#8A38F5' }}>
            LIVE
          </span>
        </div>
        <span className="text-[11px] text-text2">12 guests</span>
      </div>

      <div className="grid grid-cols-3 gap-1">
        {PHOTOS.map((bg, i) => (
          <div
            key={i}
            className="aspect-square rounded-[6px]"
            style={{ background: bg }}
          />
        ))}
      </div>

      <div className="mt-4 space-y-2">
        <div className="flex items-start gap-2">
          <div
            className="w-6 h-6 rounded-full flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, #FF751A, #8A38F5)' }}
          />
          <div className="bg-bg2 rounded-[12px] px-3 py-1.5">
            <p className="text-xs text-text1">just arrived 🎉</p>
          </div>
        </div>
        <div className="flex items-start gap-2">
          <div
            className="w-6 h-6 rounded-full flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, #169C3E, #FF751A)' }}
          />
          <div className="bg-bg2 rounded-[12px] px-3 py-1.5">
            <p className="text-xs text-text1">where are you?</p>
          </div>
        </div>
      </div>
    </div>
  );
}
