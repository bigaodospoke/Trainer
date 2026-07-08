import { type HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

interface GlassCardProps extends HTMLAttributes<HTMLDivElement> {
  hover?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

const paddingClasses = {
  none: '',
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8',
};

/** Painel de vidro base usado em quase todas as superficies do dashboard. */
export function GlassCard({
  className,
  hover = false,
  padding = 'md',
  ...props
}: GlassCardProps) {
  return (
    <div
      className={cn('glass-panel', hover && 'glass-panel-hover', paddingClasses[padding], className)}
      {...props}
    />
  );
}
