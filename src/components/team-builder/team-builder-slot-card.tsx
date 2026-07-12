import Link from 'next/link';
import Image from 'next/image';
import { Pencil, Trash2, Plus } from 'lucide-react';
import { GlassCard } from '@/components/ui/glass-card';
import { TypeBadgeRow, TypeBadge } from '@/components/ui/type-badge';
import { MoveCategoryIcon } from '@/components/ui/move-category-icon';
import { ItemIcon } from '@/components/team-builder/sprite-icon';
import { formatEvSpread, formatIvSpread, GENDER_SYMBOL } from '@/lib/team-builder/format-spread';
import { clearSlot } from '@/app/(app)/team-builder/[teamId]/slot/[position]/actions';

export interface TeamBuilderSlotData {
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
    spriteUrl: string | null;
  };
  item: { name: string; iconSheetUrl: string | null; iconTop: number | null; iconLeft: number | null } | null;
  ability: { name: string } | null;
  moves: { id: string; move: { name: string; type: string; category: string; pp: number } }[];
}

/**
 * Card do slot no editor do Team Builder — redesenho em duas colunas
 * inspirado na referencia visual enviada pelo usuario: painel esquerdo com
 * identidade (sprite, nivel, tipos, ability, item) e painel direito com os
 * 4 golpes (tipo, categoria, nome, PP). Os sprites em si nao mudam — so
 * layout/organizacao.
 */
export function TeamBuilderSlotCard({
  teamId,
  position,
  slot,
}: {
  teamId: string;
  position: number;
  slot: TeamBuilderSlotData;
}) {
  const spriteUrl =
    (slot.shiny ? slot.species.spriteShinyAnimatedUrl : slot.species.spriteAnimatedUrl) ??
    slot.species.spriteAnimatedUrl ??
    slot.species.spriteUrl ??
    '';
  const evSpread = formatEvSpread({
    hp: slot.evHp, atk: slot.evAtk, def: slot.evDef, spa: slot.evSpa, spd: slot.evSpd, spe: slot.evSpe,
  });
  const ivSpread = formatIvSpread({
    hp: slot.ivHp, atk: slot.ivAtk, def: slot.ivDef, spa: slot.ivSpa, spd: slot.ivSpd, spe: slot.ivSpe,
  });
  const genderSymbol = slot.gender ? GENDER_SYMBOL[slot.gender] : '';

  return (
    <GlassCard padding="none" className="grid grid-cols-2 overflow-hidden">
      {/* Painel esquerdo: identidade */}
      <div className="flex flex-col justify-between border-r border-white/5 p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="truncate font-display text-sm font-bold uppercase tracking-wide text-ink-primary">
              {slot.nickname || slot.species.name}
            </p>
            <div className="flex items-center gap-1 text-[10px] text-ink-dim">
              <span>Lv.{slot.level}</span>
              {genderSymbol && (
                <span className={genderSymbol === '♀' ? 'text-pink-300' : 'text-sky-300'}>{genderSymbol}</span>
              )}
            </div>
          </div>
          <TypeBadgeRow types={slot.species.types} size="sm" />
        </div>

        <div className="my-2 flex items-center gap-3">
          <div className="flex flex-1 flex-col gap-1.5 text-[11px]">
            <p className="truncate font-medium text-purple-ice">{slot.ability?.name ?? 'Sem ability'}</p>
            {slot.item ? (
              <span className="flex items-center gap-1.5 text-ink-muted">
                <ItemIcon icon={slot.item} alt={slot.item.name} />
                <span className="truncate">{slot.item.name}</span>
              </span>
            ) : (
              <span className="text-ink-dim">Sem item</span>
            )}
            {slot.teraType && (
              <span className="flex items-center gap-1">
                <TypeBadge type={toTitleCase(slot.teraType)} variant="full" size="sm" />
              </span>
            )}
          </div>
          {spriteUrl && (
            <Image src={spriteUrl} alt={slot.species.name} width={56} height={56} unoptimized className="shrink-0" />
          )}
        </div>

        {(evSpread || ivSpread) && (
          <div className="mb-2 flex flex-col gap-0.5 text-[10px] text-ink-dim">
            {evSpread && <p className="truncate font-mono">EVs: {evSpread}</p>}
            {ivSpread && <p className="truncate font-mono">IVs: {ivSpread}</p>}
          </div>
        )}

        <div className="flex items-center gap-1.5">
          <Link
            href={`/team-builder/${teamId}/slot/${position}`}
            className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/5 text-ink-muted transition-colors hover:bg-purple-core/20 hover:text-ink-primary"
            title="Editar set"
          >
            <Pencil className="h-3.5 w-3.5" strokeWidth={1.75} />
          </Link>
          <form action={clearSlot.bind(null, teamId, position)}>
            <button
              type="submit"
              title="Remover deste time"
              className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/5 text-ink-muted transition-colors hover:bg-danger/20 hover:text-danger"
            >
              <Trash2 className="h-3.5 w-3.5" strokeWidth={1.75} />
            </button>
          </form>
        </div>
      </div>

      {/* Painel direito: golpes */}
      <div className="grid grid-rows-4 divide-y divide-white/5">
        {Array.from({ length: 4 }).map((_, i) => {
          const entry = slot.moves[i];
          return (
            <Link
              key={entry?.id ?? i}
              href={`/team-builder/${teamId}/slot/${position}`}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs transition-colors hover:bg-white/[0.03]"
            >
              {entry ? (
                <>
                  <TypeBadge type={toTitleCase(entry.move.type)} variant="icon" size="sm" />
                  <MoveCategoryIcon category={entry.move.category} className="h-3 w-3 shrink-0 text-ink-dim" />
                  <span className="min-w-0 flex-1 truncate text-ink-primary">{entry.move.name}</span>
                  <span className="shrink-0 font-mono text-[10px] text-ink-dim">{entry.move.pp}/{entry.move.pp}</span>
                </>
              ) : (
                <span className="flex flex-1 items-center gap-1.5 text-ink-dim">
                  <Plus className="h-3 w-3" strokeWidth={1.75} />
                  Golpe vazio
                </span>
              )}
            </Link>
          );
        })}
      </div>
    </GlassCard>
  );
}

function toTitleCase(word: string): string {
  return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
}
