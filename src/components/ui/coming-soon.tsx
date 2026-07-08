import type { LucideIcon } from 'lucide-react';
import { GlassCard } from '@/components/ui/glass-card';
import { Badge } from '@/components/ui/badge';
import { TeraSpinner } from '@/components/ui/tera-spinner';

interface ComingSoonProps {
  icon: LucideIcon;
  title: string;
  phase: string;
  description: string;
  bullets: string[];
}

/** Tela de status para areas ainda nao construidas, com o que falta e por que. */
export function ComingSoon({ icon: Icon, title, phase, description, bullets }: ComingSoonProps) {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Icon className="h-6 w-6 text-purple-neon" strokeWidth={1.75} />
          <h1 className="font-display text-2xl font-semibold text-ink-primary">{title}</h1>
        </div>
        <Badge tone="purple">{phase}</Badge>
      </div>

      <GlassCard padding="lg" className="flex flex-col items-center gap-6 text-center">
        <TeraSpinner size={52} />
        <div className="max-w-md">
          <p className="mb-4 text-sm text-ink-muted">{description}</p>
          <ul className="space-y-1.5 text-left text-sm text-ink-muted">
            {bullets.map((bullet) => (
              <li key={bullet} className="flex gap-2">
                <span className="text-purple-neon">→</span>
                {bullet}
              </li>
            ))}
          </ul>
        </div>
      </GlassCard>
    </div>
  );
}
