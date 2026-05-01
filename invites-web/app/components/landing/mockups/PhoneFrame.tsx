import { ReactNode } from 'react';

type Props = {
  children: ReactNode;
  glowColor?: string;
};

export default function PhoneFrame({ children, glowColor }: Props) {
  return (
    <div
      className="relative"
      style={glowColor ? { filter: `drop-shadow(0 0 90px ${glowColor}66)` } : undefined}
    >
      <div className="relative w-[280px] h-[608px] rounded-[44px] bg-[#0a0a0a] p-[6px] shadow-[0_20px_80px_rgba(0,0,0,0.6),inset_0_0_0_1.5px_rgba(255,255,255,0.06)]">
        <div className="relative h-full w-full rounded-[38px] overflow-hidden bg-bg1">
          {children}
        </div>
      </div>
    </div>
  );
}
