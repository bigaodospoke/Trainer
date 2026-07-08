import { type InputHTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils';

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={cn(
          'h-10 w-full rounded-xl border border-white/10 bg-void-surface/80 px-3.5 text-sm text-ink-primary placeholder:text-ink-dim',
          'outline-none transition-colors focus:border-purple-neon/50 focus:ring-2 focus:ring-purple-neon/20',
          className
        )}
        {...props}
      />
    );
  }
);
Input.displayName = 'Input';
