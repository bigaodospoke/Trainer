'use client';

import { type ButtonHTMLAttributes, forwardRef, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { useUiSound } from '@/lib/audio/use-ui-sound';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  /** false pra silenciar o clique sonoro em botoes muito repetitivos (ex.:
   *  steppers de EV/IV) — ligado por padrao em todo o resto. */
  silent?: boolean;
}

const variantClasses: Record<Variant, string> = {
  primary:
    'bg-gradient-to-r from-purple-deep to-purple-core text-ink-primary shadow-glow-sm hover:shadow-glow hover:brightness-110',
  secondary:
    'bg-void-elevated text-ink-primary border border-white/10 hover:border-purple-neon/40',
  ghost: 'bg-transparent text-ink-muted hover:text-ink-primary hover:bg-white/5',
  danger: 'bg-danger/15 text-danger border border-danger/30 hover:bg-danger/25',
};

const sizeClasses: Record<Size, string> = {
  sm: 'h-8 px-3 text-sm rounded-lg',
  md: 'h-10 px-4 text-sm rounded-xl',
  lg: 'h-12 px-6 text-base rounded-xl',
};

/** Botao base do Trainerly. Variante `primary` carrega o gradiente roxo-neon
 *  assinatura. Client Component (precisa do hook de som) — ainda funciona
 *  normal quando renderizado a partir de Server Components/forms de action,
 *  o Next so faz a hidratacao dessa peca especifica na arvore. */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', silent, onClick, ...props }, ref) => {
    const { play } = useUiSound();

    const handleClick = useCallback(
      (e: React.MouseEvent<HTMLButtonElement>) => {
        if (!silent) play(variant === 'danger' ? 'toggle' : 'click');
        onClick?.(e);
      },
      [onClick, play, silent, variant]
    );

    return (
      <button
        ref={ref}
        onClick={handleClick}
        className={cn(
          'inline-flex items-center justify-center gap-2 font-medium transition-all duration-200 ease-out disabled:opacity-40 disabled:pointer-events-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-neon/60 focus-visible:ring-offset-2 focus-visible:ring-offset-void',
          variantClasses[variant],
          sizeClasses[size],
          className
        )}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';
