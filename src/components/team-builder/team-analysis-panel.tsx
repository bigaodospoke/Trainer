import { Check, X, AlertTriangle, ShieldAlert, Swords, Users } from 'lucide-react';
import { GlassCard } from '@/components/ui/glass-card';
import { TypeBadge } from '@/components/ui/type-badge';
import { PokemonIcon } from '@/components/team-builder/sprite-icon';
import { analyzeTeam, type AnalysisSlot } from '@/lib/team-builder/team-analysis';
import { computeOffensiveCoverage } from '@/lib/team-builder/offensive-coverage';
import { suggestForWeakType, suggestSpeedControl, suggestHazardRemoval, type SuggestionRow } from '@/lib/team-builder/team-suggestions';
import Link from 'next/link';

/** Painel de "Análise Automática do Time" — hazards, estrutura, fraquezas
 *  agregadas, cobertura ofensiva e sugestões de Pokémon pra fechar lacunas.
 *  Tudo calculado a partir de dados reais (types/stats/moveset/tier), sem
 *  IA/heurística de "meta" inventada. So aparece com pelo menos 2 slots
 *  preenchidos — com 0-1 Pokemon a analise nao diz muita coisa. */
export async function TeamAnalysisPanel({ slots, speciesIds }: { slots: AnalysisSlot[]; speciesIds: string[] }) {
  if (slots.length < 2) return null;

  const analysis = analyzeTeam(slots);
  const moveTypes = slots.flatMap((s) => s.moves.map((m) => m.move.type));
  const coverage = computeOffensiveCoverage(moveTypes);

  const missingHazardRemoval = !analysis.hazards[1]?.ok;
  const missingSpeedControl = !analysis.structure.find((s) => s.label.includes('Speed Control'))?.ok;
  const topWeakType = analysis.weakTypes[0]?.type;

  const [weakSuggestions, speedSuggestions, removalSuggestions] = await Promise.all([
    topWeakType ? suggestForWeakType(topWeakType, speciesIds) : Promise.resolve([]),
    missingSpeedControl ? suggestSpeedControl(speciesIds) : Promise.resolve([]),
    missingHazardRemoval ? suggestHazardRemoval(speciesIds) : Promise.resolve([]),
  ]);

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <GlassCard padding="lg">
          <h2 className="mb-3 flex items-center gap-2 font-display text-sm font-semibold text-ink-primary">
            <ShieldAlert className="h-4 w-4 text-purple-neon" strokeWidth={1.75} />
            Hazards
          </h2>
          <div className="flex flex-col gap-2">
            {analysis.hazards.map((c) => <CheckRow key={c.label} item={c} />)}
          </div>

          <h2 className="mb-3 mt-5 flex items-center gap-2 font-display text-sm font-semibold text-ink-primary">
            <Users className="h-4 w-4 text-purple-neon" strokeWidth={1.75} />
            Estrutura
          </h2>
          <div className="flex flex-col gap-2">
            {analysis.structure.map((c) => <CheckRow key={c.label} item={c} />)}
          </div>
        </GlassCard>

        <GlassCard padding="lg">
          <h2 className="mb-3 flex items-center gap-2 font-display text-sm font-semibold text-ink-primary">
            <AlertTriangle className="h-4 w-4 text-warning" strokeWidth={1.75} />
            Fraquezas do time
          </h2>
          {analysis.weakTypes.length === 0 ? (
            <p className="text-xs text-ink-dim">Nenhum tipo com 3+ membros fracos — boa distribuição defensiva.</p>
          ) : (
            <div className="flex flex-col gap-1.5">
              {analysis.weakTypes.map((w) => (
                <div key={w.type} className="flex items-center gap-2 text-sm text-ink-primary">
                  <TypeBadge type={w.type} size="sm" />
                  <span className="text-xs text-warning">Muito fraco — {w.count}/{slots.length} membros vulneráveis</span>
                </div>
              ))}
            </div>
          )}

          <h2 className="mb-2 mt-5 font-display text-sm font-semibold text-ink-primary">Resistências gerais</h2>
          <div className="flex flex-wrap gap-1.5">
            {analysis.resistedTypes.length === 0 && <p className="text-xs text-ink-dim">Sem resistências relevantes ainda.</p>}
            {analysis.resistedTypes.map((r) => (
              <span key={r.type} className="flex items-center gap-1">
                <TypeBadge type={r.type} size="sm" />
                <span className="font-mono text-[10px] text-ink-dim">{r.count}x</span>
              </span>
            ))}
          </div>
        </GlassCard>
      </div>

      <GlassCard padding="lg">
        <h2 className="mb-3 flex items-center gap-2 font-display text-sm font-semibold text-ink-primary">
          <Swords className="h-4 w-4 text-purple-neon" strokeWidth={1.75} />
          Cobertura ofensiva
        </h2>
        <div className="mb-3">
          <p className="mb-1.5 text-[10px] font-medium uppercase tracking-wide text-ink-dim">Tipos cobertos ({coverage.covered.length}/18)</p>
          <div className="flex flex-wrap gap-1.5">
            {coverage.covered.map((t) => <TypeBadge key={t} type={t} size="sm" />)}
          </div>
        </div>
        {coverage.uncovered.length > 0 && (
          <div>
            <p className="mb-1.5 text-[10px] font-medium uppercase tracking-wide text-ink-dim">Tipos problemáticos (sem cobertura)</p>
            <div className="flex flex-wrap gap-1.5">
              {coverage.uncovered.map((t) => <TypeBadge key={t} type={t} size="sm" />)}
            </div>
          </div>
        )}
      </GlassCard>

      {(weakSuggestions.length > 0 || speedSuggestions.length > 0 || removalSuggestions.length > 0) && (
        <GlassCard padding="lg">
          <h2 className="mb-3 font-display text-sm font-semibold text-ink-primary">Sugestões pra fechar lacunas</h2>
          <div className="flex flex-col gap-4">
            {weakSuggestions.length > 0 && <SuggestionGroup title={`Fraco a ${topWeakType}`} rows={weakSuggestions} />}
            {speedSuggestions.length > 0 && <SuggestionGroup title="Faltando Speed Control" rows={speedSuggestions} />}
            {removalSuggestions.length > 0 && <SuggestionGroup title="Faltando Hazard Removal" rows={removalSuggestions} />}
          </div>
        </GlassCard>
      )}
    </div>
  );
}

function CheckRow({ item }: { item: { ok: boolean; label: string } }) {
  return (
    <div className="flex items-center gap-2 text-sm">
      {item.ok ? <Check className="h-3.5 w-3.5 shrink-0 text-success" strokeWidth={2.5} /> : <X className="h-3.5 w-3.5 shrink-0 text-ink-dim" strokeWidth={2.5} />}
      <span className={item.ok ? 'text-ink-primary' : 'text-ink-dim'}>{item.label}</span>
    </div>
  );
}

function SuggestionGroup({ title, rows }: { title: string; rows: SuggestionRow[] }) {
  return (
    <div>
      <p className="mb-2 text-xs font-medium text-ink-muted">{title}</p>
      <div className="flex flex-wrap gap-2">
        {rows.map((s) => (
          <Link
            key={s.slug}
            href={`/pokedex/${s.slug}`}
            className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-2.5 py-1.5 text-xs text-ink-primary transition-colors hover:border-purple-neon/40"
          >
            <PokemonIcon icon={s} alt={s.name} />
            {s.name}
          </Link>
        ))}
      </div>
    </div>
  );
}
