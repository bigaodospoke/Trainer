'use client';

import { useRef, useState } from 'react';
import Image from 'next/image';
import { Download, Copy, Check, Film, Clapperboard } from 'lucide-react';
import { toPng, toBlob } from 'html-to-image';
import { Button } from '@/components/ui/button';
import { TypeBadge } from '@/components/ui/type-badge';
import { MoveCategoryIcon } from '@/components/ui/move-category-icon';
import { NatureBadge } from '@/components/ui/nature-badge';
import { GENDER_SYMBOL } from '@/lib/team-builder/format-spread';

export interface HofSlotData {
  id: string;
  nickname: string | null;
  gender: string | null;
  natureName: string;
  teraType: string | null;
  species: { name: string; spriteAnimatedUrl: string | null; spriteUrl: string | null };
  item: { name: string } | null;
  ability: { name: string } | null;
  moves: { id: string; move: { name: string; type: string; category: string } }[];
}

export interface HofTeamData {
  name: string;
  battleFormat: string;
  ownerUsername: string;
  slots: HofSlotData[];
}

/** Card do Hall of Fame — identidade propria do Trainerly (roxo/preto,
 *  inspirado em GBA mas nao uma copia do Emerald), usando exatamente os
 *  mesmos sprites do Team Builder (requisito explicito — nada de trocar por
 *  outra arte). Exportado via html-to-image porque o card tem texto+sprites+
 *  gradientes que seriam muito trabalhosos pra desenhar a mao num &lt;canvas&gt;. */
export function HofCard({ team }: { team: HofTeamData }) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);
  const [busy, setBusy] = useState(false);

  async function handleDownload() {
    if (!cardRef.current) return;
    setBusy(true);
    try {
      const dataUrl = await toPng(cardRef.current, { pixelRatio: 2, cacheBust: true });
      const link = document.createElement('a');
      link.download = `${team.name.replace(/[^a-z0-9]/gi, '-').toLowerCase()}-hall-of-fame.png`;
      link.href = dataUrl;
      link.click();
    } finally {
      setBusy(false);
    }
  }

  async function handleCopy() {
    if (!cardRef.current) return;
    setBusy(true);
    try {
      const blob = await toBlob(cardRef.current, { pixelRatio: 2, cacheBust: true });
      if (blob) {
        await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <div
        ref={cardRef}
        className="relative w-full max-w-4xl overflow-hidden rounded-2xl border-2 border-purple-neon/40 p-6 sm:p-10"
        style={{
          background: 'radial-gradient(120% 100% at 50% 0%, #2a1049 0%, #120821 55%, #06030d 100%)',
          fontFamily: 'ui-monospace, "Courier New", monospace',
        }}
      >
        <div className="pointer-events-none absolute inset-3 rounded-xl border border-purple-neon/20" />

        <div className="relative mb-8 text-center">
          <h1
            className="text-3xl font-black uppercase tracking-[0.15em] text-white sm:text-4xl"
            style={{ textShadow: '0 0 18px rgba(178,102,255,0.8)' }}
          >
            Trainerly
          </h1>
          <h2 className="text-xl font-black uppercase tracking-[0.35em] text-purple-neon sm:text-2xl">
            Hall of Fame
          </h2>
        </div>

        <div className="relative grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {team.slots.map((slot, i) => (
            <HofSlot key={slot.id} slot={slot} index={i + 1} />
          ))}
        </div>

        <div className="relative mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-purple-neon/20 pt-4 text-xs text-white/70">
          <span className="font-bold text-purple-ice">TRAINERLY</span>
          <span>Time: <span className="text-white">{team.name}</span></span>
          <span>Formato: <span className="text-white">{team.battleFormat}</span></span>
          <span>Criador: <span className="text-white">@{team.ownerUsername}</span></span>
          <span>Data: <span className="text-white">{new Date().toLocaleDateString('pt-BR')}</span></span>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-2">
        <Button size="sm" onClick={handleDownload} disabled={busy}>
          <Download className="h-3.5 w-3.5" />
          Download PNG
        </Button>
        <Button size="sm" variant="secondary" onClick={handleCopy} disabled={busy}>
          {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
          {copied ? 'Copiado!' : 'Copy Image'}
        </Button>
        <Button size="sm" variant="ghost" disabled title="Em breve">
          <Film className="h-3.5 w-3.5" />
          GIF (em breve)
        </Button>
        <Button size="sm" variant="ghost" disabled title="Em breve">
          <Clapperboard className="h-3.5 w-3.5" />
          MP4 (em breve)
        </Button>
      </div>
    </div>
  );
}

function HofSlot({ slot, index }: { slot: HofSlotData; index: number }) {
  const spriteUrl = slot.species.spriteAnimatedUrl ?? slot.species.spriteUrl ?? '';
  const genderSymbol = slot.gender ? GENDER_SYMBOL[slot.gender] : '';

  return (
    <div className="rounded-xl border border-purple-neon/25 bg-white/[0.03] p-3">
      <div className="mb-1 flex items-center gap-2">
        <span className="rounded-md border border-purple-neon/40 px-1.5 py-0.5 font-mono text-[10px] font-bold text-purple-neon">
          {String(index).padStart(2, '0')}
        </span>
        <p className="truncate text-sm font-bold text-white">
          {slot.nickname || slot.species.name}
          {genderSymbol && <span className="ml-1 text-xs">{genderSymbol}</span>}
        </p>
      </div>

      <div className="mb-2 flex items-center justify-center">
        {spriteUrl && (
          <Image src={spriteUrl} alt={slot.species.name} width={72} height={72} unoptimized style={{ imageRendering: 'pixelated' }} />
        )}
      </div>

      <div className="mb-2 flex flex-col gap-0.5 text-[10px] text-white/70">
        <p>Item: <span className="text-white">{slot.item?.name ?? '—'}</span></p>
        <p>Ability: <span className="text-white">{slot.ability?.name ?? '—'}</span></p>
        <p className="flex items-center gap-1">Nature: <NatureBadge nature={slot.natureName} size="sm" /></p>
        {slot.teraType && (
          <span className="mt-0.5 flex items-center gap-1">
            Tera: <TypeBadge type={slot.teraType.charAt(0) + slot.teraType.slice(1).toLowerCase()} size="sm" />
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 gap-1">
        {Array.from({ length: 4 }).map((_, i) => {
          const entry = slot.moves[i];
          return (
            <div key={entry?.id ?? i} className="flex items-center gap-1 rounded-md bg-black/30 px-1.5 py-1">
              {entry ? (
                <>
                  <TypeBadge type={entry.move.type.charAt(0) + entry.move.type.slice(1).toLowerCase()} size="sm" />
                  <MoveCategoryIcon category={entry.move.category} className="h-2.5 w-2.5 shrink-0 text-white/60" />
                  <span className="truncate text-[9px] text-white">{entry.move.name}</span>
                </>
              ) : (
                <span className="text-[9px] text-white/30">—</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
