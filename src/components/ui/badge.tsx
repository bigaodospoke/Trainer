import { type HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

type Tone = 'neutral' | 'purple' | 'success' | 'warning' | 'danger';

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: Tone;
}

const toneClasses: Record<Tone, string> = {
  neutral: 'bg-white/5 text-ink-muted border-white/10',
  purple: 'bg-purple-core/15 text-purple-ice border-purple-core/30',
  success: 'bg-success/15 text-success border-success/30',
  warning: 'bg-warning/15 text-warning border-warning/30',
  danger: 'bg-danger/15 text-danger border-danger/30',
};

/**
 * Badge generico (tier, formato, status). Para tiers especificos (OU/UU/...)
 * use as cores semanticas em tailwind.config.ts > colors.tier na fase do
 * Team Builder / Pokedex.
 */
export function Badge({ className, tone = 'neutral', ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-pill border px-2.5 py-0.5 text-xs font-medium uppercase tracking-wide',
        toneClasses[tone],
        className
      )}
      {...props}
    />
  );
}
