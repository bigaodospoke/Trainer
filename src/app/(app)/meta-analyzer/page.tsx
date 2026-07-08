import Link from 'next/link';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { prisma } from '@/lib/prisma';
import { getAvailableMonths, getSpeciesUsage, getWeightedAggregate } from '@/lib/meta-analyzer/queries';
import { GlassCard } from '@/components/ui/glass-card';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { PokemonIcon } from '@/components/team-builder/sprite-icon';

interface MetaAnalyzerPageProps {
  searchParams: Promise<{ format?: string }>;
}

function Bar({ value, max }: { value: number; max: number }) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  return (
    <div className="h-1.5 flex-1 overflow-hidden rounded-pill bg-white/5">
      <div className="h-full rounded-pill bg-gradient-to-r from-purple-deep to-purple-neon" style={{ width: `${pct}%` }} />
    </div>
  );
}

export default async function MetaAnalyzerPage({ searchParams }: MetaAnalyzerPageProps) {
  const params = await searchParams;
  const formats = await prisma.format.findMany({ where: { isActive: true }, orderBy: { slug: 'asc' } });
  const selectedSlug = params.format ?? 'gen9ou';
  const format = formats.find((f: { slug: string }) => f.slug === selectedSlug) ?? formats[0];

  if (!format) {
    return (
      <GlassCard padding="lg">
        <EmptyState title="Nenhum formato cadastrado" description="Rode npm run db:seed primeiro." />
      </GlassCard>
    );
  }

  const months = await getAvailableMonths(format.id);
  const latestMonth = months[0] ?? null;
  const previousMonth = months[1] ?? null;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <TrendingUp className="h-6 w-6 text-purple-neon" strokeWidth={1.75} />
        <div>
          <h1 className="font-display text-2xl font-semibold text-ink-primary">Meta Analyzer</h1>
          <p className="text-sm text-ink-muted">
            {latestMonth ? `Dados de ${latestMonth.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}` : 'Sem dados sincronizados ainda'}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {formats.map((f: { id: string; slug: string; name: string }) => (
          <Link key={f.id} href={`/meta-analyzer?format=${f.slug}`}>
            <Badge tone={f.slug === format.slug ? 'purple' : 'neutral'}>{f.name}</Badge>
          </Link>
        ))}
      </div>

      {!latestMonth ? (
        <GlassCard padding="lg">
          <EmptyState
            title="Sem dados de uso para este formato"
            description="Rode npm run sync:smogon para popular os usage stats — precisa de acesso real a smogon.com."
          />
        </GlassCard>
      ) : (
        <MetaContent formatId={format.id} month={latestMonth} previousMonth={previousMonth} />
      )}
    </div>
  );
}

async function MetaContent({ formatId, month, previousMonth }: { formatId: string; month: Date; previousMonth: Date | null }) {
  const [species, moves, items, abilities, teraTypes] = await Promise.all([
    getSpeciesUsage(formatId, month, previousMonth),
    getWeightedAggregate(formatId, month, 'MOVE'),
    getWeightedAggregate(formatId, month, 'ITEM'),
    getWeightedAggregate(formatId, month, 'ABILITY'),
    getWeightedAggregate(formatId, month, 'TERA_TYPE'),
  ]);

  const maxSpecies = species[0]?.usagePercent ?? 1;

  return (
    <div className="flex flex-col gap-4">
      <GlassCard padding="lg">
        <h2 className="mb-4 font-display text-sm font-semibold text-ink-primary">Pokémon mais usados</h2>
        <div className="flex flex-col gap-2.5">
          {species.map((s, i) => {
            const trend =
              s.previousPercent === null ? null : s.usagePercent > s.previousPercent ? 'up' : s.usagePercent < s.previousPercent ? 'down' : 'flat';
            return (
              <Link
                key={s.speciesId}
                href={`/pokedex/${s.slug}`}
                className="flex items-center gap-3 rounded-lg px-2 py-1.5 hover:bg-white/5"
              >
                <span className="w-5 text-right font-mono text-xs text-ink-dim">{i + 1}</span>
                <PokemonIcon icon={s} alt={s.name} />
                <span className="w-36 shrink-0 truncate text-sm text-ink-primary">{s.name}</span>
                <Bar value={s.usagePercent} max={maxSpecies} />
                <span className="w-14 shrink-0 text-right font-mono text-xs text-ink-primary">
                  {s.usagePercent.toFixed(1)}%
                </span>
                <span className="w-4 shrink-0">
                  {trend === 'up' && <TrendingUp className="h-3.5 w-3.5 text-success" />}
                  {trend === 'down' && <TrendingDown className="h-3.5 w-3.5 text-danger" />}
                  {trend === 'flat' && <Minus className="h-3.5 w-3.5 text-ink-dim" />}
                </span>
              </Link>
            );
          })}
        </div>
        {!previousMonth && (
          <p className="mt-3 text-xs text-ink-dim">
            Tendência (subida/queda) aparece a partir do segundo mês de sync acumulado.
          </p>
        )}
      </GlassCard>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <AggregateCard title="Moves mais usados" rows={moves} />
        <AggregateCard title="Items mais usados" rows={items} />
        <AggregateCard title="Abilities mais usadas" rows={abilities} />
      </div>

      <GlassCard padding="lg">
        <h2 className="mb-1 font-display text-sm font-semibold text-ink-primary">Tera Types mais usados</h2>
        <p className="mb-4 text-xs text-ink-dim">Ponderado pelo uso de cada Pokémon — ver nota de metodologia abaixo.</p>
        <div className="flex flex-col gap-2">
          {teraTypes.map((t) => (
            <RowBar key={t.refSlug} label={t.displayName} value={t.weightedPercent} max={teraTypes[0]?.weightedPercent ?? 1} />
          ))}
        </div>
      </GlassCard>

      <p className="text-xs text-ink-dim">
        Metodologia: moves/items/abilities/tera types não são publicados pela Smogon como agregado direto do
        formato — são relatados por espécie (ex.: &quot;Stealth Rock em X% dos sets de Landorus-T&quot;). Os rankings acima
        ponderam isso pelo usage% de cada espécie para aproximar &quot;em quantos times esse elemento aparece&quot; no
        formato inteiro.
      </p>
    </div>
  );
}

function AggregateCard({ title, rows }: { title: string; rows: { refSlug: string; displayName: string; weightedPercent: number }[] }) {
  const max = rows[0]?.weightedPercent ?? 1;
  return (
    <GlassCard padding="lg">
      <h2 className="mb-4 font-display text-sm font-semibold text-ink-primary">{title}</h2>
      <div className="flex flex-col gap-2">
        {rows.length === 0 ? (
          <p className="text-xs text-ink-dim">Sem dados.</p>
        ) : (
          rows.map((r) => <RowBar key={r.refSlug} label={r.displayName} value={r.weightedPercent} max={max} />)
        )}
      </div>
    </GlassCard>
  );
}

function RowBar({ label, value, max }: { label: string; value: number; max: number }) {
  return (
    <div className="flex items-center gap-2">
      <span className="w-32 shrink-0 truncate text-xs text-ink-muted">{label}</span>
      <Bar value={value} max={max} />
      <span className="w-12 shrink-0 text-right font-mono text-xs text-ink-primary">{value.toFixed(1)}%</span>
    </div>
  );
}
