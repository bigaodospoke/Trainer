import Link from 'next/link';
import { Swords, Calculator, BookOpen, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { GlassCard } from '@/components/ui/glass-card';

const PILLARS = [
  {
    icon: Swords,
    title: 'Team Builder',
    description: 'EVs, IVs, Tera Type e validacao de tier em tempo real, com import/export Showdown.',
  },
  {
    icon: Calculator,
    title: 'Damage Calculator',
    description: 'Mesmo motor de calculo usado pela comunidade competitiva, sem aproximacoes.',
  },
  {
    icon: BookOpen,
    title: 'Pokedex competitiva',
    description: 'Learnsets, parceiros, counters e checks — nao so stats base.',
  },
  {
    icon: TrendingUp,
    title: 'Meta Analyzer',
    description: 'Usage stats atualizados, tiers que se movem com o metagame real.',
  },
];

export default function LandingPage() {
  return (
    <main className="relative mx-auto flex min-h-screen max-w-6xl flex-col px-6">
      <header className="flex items-center justify-between py-6">
        <div className="flex items-center gap-2">
          <svg width="22" height="22" viewBox="0 0 100 100" aria-hidden="true">
            <path d="M50 6 L94 50 L50 94 L6 50 Z" fill="url(#brand-gradient-landing)" />
            <defs>
              <linearGradient id="brand-gradient-landing" x1="0" y1="0" x2="100" y2="100">
                <stop offset="0%" stopColor="#B266FF" />
                <stop offset="100%" stopColor="#5B21B6" />
              </linearGradient>
            </defs>
          </svg>
          <span className="font-display text-lg font-semibold text-ink-primary">Trainerly</span>
        </div>
        <Link href="/signin">
          <Button variant="secondary" size="sm">
            Entrar
          </Button>
        </Link>
      </header>

      <section className="flex flex-1 flex-col items-start justify-center gap-8 py-20">
        <span className="rounded-pill border border-purple-core/30 bg-purple-core/10 px-3 py-1 text-xs font-medium uppercase tracking-wide text-purple-ice">
          Fundacao da plataforma — fase 1
        </span>

        <h1 className="max-w-2xl font-display text-5xl font-semibold leading-[1.05] tracking-tight text-ink-primary sm:text-6xl">
          Monte, calcule e <span className="text-gradient-neon">forje</span> o seu time competitivo.
        </h1>

        <p className="max-w-lg text-lg text-ink-muted">
          Team Builder, Damage Calculator, Pokedex e analise de meta — unificados, com a mesma
          precisao de dados que a comunidade competitiva ja confia.
        </p>

        <Link href="/signin">
          <Button size="lg" className="gap-2.5">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M20.317 4.37a19.79 19.79 0 0 0-4.885-1.515.07.07 0 0 0-.073.035c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.07.07 0 0 0-.073-.035 19.736 19.736 0 0 0-4.885 1.515.064.064 0 0 0-.03.026C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128c.126-.094.252-.192.372-.291a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.073.073 0 0 1 .078.01c.12.099.246.198.373.292a.077.077 0 0 1-.006.127 12.3 12.3 0 0 1-1.873.892.076.076 0 0 0-.04.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.84 19.84 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028" />
            </svg>
            Entrar com Discord
          </Button>
        </Link>
      </section>

      <section className="grid grid-cols-1 gap-4 pb-20 sm:grid-cols-2 lg:grid-cols-4">
        {PILLARS.map((pillar) => (
          <GlassCard key={pillar.title} padding="md" hover>
            <pillar.icon className="mb-3 h-5 w-5 text-purple-neon" strokeWidth={1.75} />
            <h3 className="mb-1 font-display text-sm font-semibold text-ink-primary">
              {pillar.title}
            </h3>
            <p className="text-sm text-ink-muted">{pillar.description}</p>
          </GlassCard>
        ))}
      </section>
    </main>
  );
}
