import { cn } from '@/lib/utils';

interface StatBarProps {
  label: string;
  value: number;
  max?: number;
  className?: string;
}

/** Barra de stat estilo "competitive dashboard", numero em mono para escaneabilidade. */
export function StatBar({ label, value, max = 255, className }: StatBarProps) {
  const pct = Math.min(100, (value / max) * 100);

  return (
    <div className={cn('flex items-center gap-3', className)}>
      <span className="w-9 shrink-0 text-xs font-medium uppercase text-ink-dim">{label}</span>
      <div className="h-2 flex-1 overflow-hidden rounded-pill bg-white/5">
        <div
          className="h-full rounded-pill bg-gradient-to-r from-purple-deep to-purple-neon"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="w-9 shrink-0 text-right font-mono text-xs text-ink-primary">{value}</span>
    </div>
  );
}
