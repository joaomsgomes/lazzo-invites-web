'use client';

import { ReactNode } from 'react';
import { useRevealOnScroll } from '../../hooks/useRevealOnScroll';

type Props = {
  children: ReactNode;
  delay?: number;
  className?: string;
};

export default function RevealOnScroll({ children, delay = 0, className = '' }: Props) {
  const ref = useRevealOnScroll<HTMLDivElement>();
  return (
    <div
      ref={ref}
      className={`reveal-up ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}
