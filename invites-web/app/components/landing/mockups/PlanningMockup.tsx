const OPTIONS = [
  { label: 'Fri · Nov 7', votes: 8, pct: 80, leading: true },
  { label: 'Sat · Nov 8', votes: 5, pct: 50, leading: false },
  { label: 'Sun · Nov 9', votes: 3, pct: 30, leading: false },
  { label: 'Fri · Nov 14', votes: 1, pct: 10, leading: false },
];

export default function PlanningMockup() {
  return (
    <div className="h-full w-full flex flex-col p-5 pt-12 bg-bg1">
      <div className="text-center">
        <div className="text-3xl">🎂</div>
        <h3 className="text-lg font-semibold mt-2 text-text1">Ana&apos;s Birthday</h3>
        <p className="text-[11px] text-text2 mt-0.5">Pick a date</p>
      </div>

      <div className="mt-5 space-y-2">
        {OPTIONS.map((o) => (
          <div
            key={o.label}
            className="relative rounded-[10px] overflow-hidden bg-bg2"
            style={o.leading ? { boxShadow: 'inset 0 0 0 1.5px #169C3E' } : undefined}
          >
            <div
              className="absolute inset-y-0 left-0"
              style={{ width: `${o.pct}%`, backgroundColor: 'rgba(22, 156, 62, 0.18)' }}
            />
            <div className="relative flex items-center justify-between px-3 py-2.5">
              <span className="text-sm text-text1">{o.label}</span>
              <span className="text-xs text-text2">{o.votes}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-auto pb-6">
        <div
          className="rounded-[14px] py-3 text-center text-sm font-semibold text-white"
          style={{ backgroundColor: '#169C3E' }}
        >
          Cast your vote
        </div>
      </div>
    </div>
  );
}
