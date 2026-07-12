import Image from 'next/image';
import { GlassCard } from '@/components/ui/glass-card';
import { TypeBadgeRow, TypeBadge } from '@/components/ui/type-badge';
import { ItemIcon } from '@/components/team-builder/sprite-icon';
import { formatEvSpread, formatIvSpread, GENDER_SYMBOL } from '@/lib/team-builder/format-spread';
import { formatNatureLabel } from '@/lib/team-builder/natures';

export interface TeamSlotCardData {
  id: string;
  nickname: string | null;
  gender: string | null;
  level: number;
  shiny: boolean;
  natureName: string;
  teraType: string | null;
  evHp: number;
  evAtk: number;
  evDef: number;
  evSpa: number;
  evSpd: number;
  evSpe: number;
  ivHp: number;
  ivAtk: number;
  ivDef: number;
  ivSpa: number;
  ivSpd: number;
  ivSpe: number;
  species: {
    name: string;
    types: string[];
    spriteAnimatedUrl: string | null;
    spriteShinyAnimatedUrl: string | null;
    spriteUrl?: string | null;
  };
  item: { name: string; iconSheetUrl: string | null; iconTop: number | null; iconLeft: number | null } | null;
  ability: { name: string } | null;
  moves: { id: string; move: { name: string; type?: string } }[];
}

/**
 * Card de Pokemon dentro de um time — visual denso ao estilo Pokemon
 * Showdown moderno (referencia do pedido original): sprite, item, ability,
 * nature, EVs/IVs investidos, tera type e golpes, tudo num painel so, em vez
 * do card minimalista anterior (so sprite + nome + golpes).
 */
export function TeamSlotCard({ slot }: { slot: TeamSlotCardData }) {
  const spriteUrl =
    (slot.shiny ? slot.species.spriteShinyAnimatedUrl : slot.species.spriteAnimatedUrl) ??
    slot.species.spriteAnimatedUrl ??
    slot.species.spriteUrl ??
    '';
  const evSpread = formatEvSpread({
    hp: slot.evHp,
    atk: slot.evAtk,
    def: slot.evDef,
    spa: slot.evSpa,
    spd: slot.evSpd,
    spe: slot.evSpe,
  });
  const ivSpread = formatIvSpread({
    hp: slot.ivHp,
    atk: slot.ivAtk,
    def: slot.ivDef,
    spa: slot.ivSpa,
    spd: slot.ivSpd,
    spe: slot.ivSpe,
  });
  const genderSymbol = slot.gender ? GENDER_SYMBOL[slot.gender] : '';

  return (
    <GlassCard padding="none" hover className="flex flex-col overflow-hidden">
      <div className="flex items-center gap-3 border-b border-white/5 bg-white/[0.02] px-4 py-3">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5">
          {spriteUrl && <Image src={spriteUrl} alt={slot.species.name} width={48} height={48} unoptimized />}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <p className="truncate font-display text-sm font-semibold text-ink-primary">
              {slot.nickname || slot.species.name}
            </p>
            {genderSymbol && (
              <span className={genderSymbol === '♀' ? 'text-pink-300' : 'text-sky-300'}>{genderSymbol}</span>
            )}
            <span className="shrink-0 font-mono text-[10px] text-ink-dim">Lv.{slot.level}</span>
          </div>
          <TypeBadgeRow types={slot.species.types} size="sm" />
        </div>
      </div>

      <div className="flex flex-col gap-2 px-4 py-3 text-xs">
        <Row label="Item">
          {slot.item ? (
            <span className="flex items-center gap-1.5 text-ink-primary">
              <ItemIcon icon={slot.item} alt={slot.item.name} />
              {slot.item.name}
            </span>
          ) : (
            <span className="text-ink-dim">—</span>
          )}
        </Row>
        <Row label="Ability">
          <span className="text-ink-primary">{slot.ability?.name ?? '—'}</span>
        </Row>
        <Row label="Nature">
          <span className="text-ink-primary">{formatNatureLabel(slot.natureName)}</span>
        </Row>
        {slot.teraType && (
          <Row label="Tera">
            <TypeBadge type={toTitleCase(slot.teraType)} variant="full" size="sm" />
          </Row>
        )}
        {evSpread && (
          <Row label="EVs">
            <span className="font-mono text-[11px] text-ink-muted">{evSpread}</span>
          </Row>
        )}
        {ivSpread && (
          <Row label="IVs">
            <span className="font-mono text-[11px] text-ink-muted">{ivSpread}</span>
          </Row>
        )}
      </div>

      <div className="grid grid-cols-2 gap-1 border-t border-white/5 px-4 py-3">
        {Array.from({ length: 4 }).map((_, i) => {
          const move = slot.moves[i];
          return (
            <span
              key={move?.id ?? i}
              className="truncate rounded-pill bg-white/5 px-2 py-1 text-center text-[11px] text-ink-muted"
            >
              {move?.move.name ?? '—'}
            </span>
          );
        })}
      </div>
    </GlassCard>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="shrink-0 text-[10px] font-medium uppercase tracking-wide text-ink-dim">{label}</span>
      {children}
    </div>
  );
}

function toTitleCase(word: string): string {
  return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
}
