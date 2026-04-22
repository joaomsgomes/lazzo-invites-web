export default function RecapMockup() {
  return (
    <div className="h-full w-full flex flex-col p-5 pt-12 bg-bg1">
      <div className="text-center mb-4">
        <p className="text-[10px] font-bold tracking-wider" style={{ color: '#FF751A' }}>
          MEMORY · 47 PHOTOS
        </p>
        <h3 className="text-lg font-semibold mt-1 text-text1">Ana&apos;s Birthday</h3>
      </div>

      <div className="grid grid-cols-3 grid-rows-4 gap-1 flex-1 min-h-0">
        <div
          className="row-span-2 rounded-[6px]"
          style={{ background: 'linear-gradient(135deg, #FF751A 0%, #cc5a0d 100%)' }}
        />
        <div
          className="rounded-[6px]"
          style={{ background: 'linear-gradient(120deg, #8A38F5 0%, #5a1fa6 100%)' }}
        />
        <div
          className="rounded-[6px]"
          style={{ background: 'linear-gradient(45deg, #FF751A 0%, #FFB07A 100%)' }}
        />
        <div
          className="col-span-2 rounded-[6px]"
          style={{ background: 'linear-gradient(90deg, #169C3E 0%, #FF751A 100%)' }}
        />
        <div
          className="rounded-[6px]"
          style={{ background: 'linear-gradient(200deg, #FF751A 0%, #2B2B2B 100%)' }}
        />
        <div
          className="rounded-[6px]"
          style={{ background: 'linear-gradient(60deg, #8A38F5 0%, #FF751A 100%)' }}
        />
        <div
          className="col-span-2 rounded-[6px]"
          style={{ background: 'linear-gradient(135deg, #FF751A 0%, #169C3E 100%)' }}
        />
      </div>

      <div className="mt-4 pb-4">
        <div
          className="rounded-[14px] py-3 text-center text-sm font-semibold"
          style={{
            backgroundColor: 'rgba(255, 117, 26, 0.14)',
            color: '#FF751A',
            boxShadow: 'inset 0 0 0 1px rgba(255, 117, 26, 0.3)',
          }}
        >
          Share memory
        </div>
      </div>
    </div>
  );
}
