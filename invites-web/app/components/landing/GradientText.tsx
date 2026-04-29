import { ReactNode } from 'react';

type Variant = 'brand' | 'planning' | 'living' | 'recap';

const GRADIENTS: Record<Variant, string> = {
  brand: 'linear-gradient(90deg, #169C3E 0%, #8A38F5 50%, #FF751A 100%)',
  planning: 'linear-gradient(90deg, #169C3E 0%, #2FD66A 100%)',
  living: 'linear-gradient(90deg, #8A38F5 0%, #B47BFF 100%)',
  recap: 'linear-gradient(90deg, #FF751A 0%, #FFB07A 100%)',
};

type Props = {
  children: ReactNode;
  variant?: Variant;
  className?: string;
  as?: 'span' | 'h1' | 'h2' | 'h3' | 'p';
};

export default function GradientText({ children, variant = 'brand', className = '', as: Tag = 'span' }: Props) {
  return (
    <Tag
      className={className}
      style={{
        backgroundImage: GRADIENTS[variant],
        backgroundClip: 'text',
        WebkitBackgroundClip: 'text',
        color: 'transparent',
        WebkitTextFillColor: 'transparent',
      }}
    >
      {children}
    </Tag>
  );
}
