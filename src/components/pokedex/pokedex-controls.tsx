'use client';

import { useEffect, useRef, useState, useTransition } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { Search, Loader2, Layers } from 'lucide-react';
import { GENERATIONS } from '@/lib/pokedex/generations';

const TYPES = [
  'NORMAL', 'FIRE', 'WATER', 'ELECTRIC', 'GRASS', 'ICE', 'FIGHTING', 'POISON',
  'GROUND', 'FLYING', 'PSYCHIC', 'BUG', 'ROCK', 'GHOST', 'DRAGON', 'DARK',
  'STEEL', 'FAIRY', 'STELLAR',
];

const DEBOUNCE_MS = 300;

/** Busca em tempo real (debounced) + tipo + geracoes (multi-select) — tudo
 *  atualiza a URL direto (sem botao "Filtrar"), a Pokedex (Server Component)
 *  refaz a query a cada mudanca. Substitui o antigo form com submit manual. */
export function PokedexControls() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();
  const [isTyping, setIsTyping] = useState(false);
  const [text, setText] = useState(searchParams.get('q') ?? '');
  const [genOpen, setGenOpen] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const selectedGens = new Set((searchParams.get('gens') ?? '').split(',').filter(Boolean));

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  function pushParams(mutate: (params: URLSearchParams) => void) {
    const params = new URLSearchParams(searchParams.toString());
    mutate(params);
    params.delete('page');
    startTransition(() => router.push(`${pathname}?${params.toString()}`));
  }

  function handleTextChange(value: string) {
    setText(value);
    setIsTyping(true);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      pushParams((params) => {
        if (value.trim()) params.set('q', value.trim());
        else params.delete('q');
      });
      setIsTyping(false);
    }, DEBOUNCE_MS);
  }

  function toggleGen(gen: number) {
    const next = new Set(selectedGens);
    const key = String(gen);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    pushParams((params) => {
      const csv = Array.from(next).join(',');
      if (csv) params.set('gens', csv);
      else params.delete('gens');
    });
  }

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
      <div className="relative sm:col-span-2">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-dim" strokeWidth={1.75} />
        <input
          value={text}
          onChange={(e) => handleTextChange(e.target.value)}
          placeholder="Buscar Pokémon, golpe, ability, tipo ou tier..."
          className="h-10 w-full rounded-xl border border-white/10 bg-void-surface/80 pl-10 pr-9 text-sm text-ink-primary placeholder:text-ink-dim outline-none transition-colors focus:border-purple-neon/50 focus:ring-2 focus:ring-purple-neon/20"
        />
        {isTyping && (
          <Loader2 className="absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-purple-neon" strokeWidth={2} />
        )}
      </div>

      <select
        defaultValue={searchParams.get('type') ?? ''}
        onChange={(e) => pushParams((params) => {
          if (e.target.value) params.set('type', e.target.value);
          else params.delete('type');
        })}
        className="h-10 w-full rounded-xl border border-white/10 bg-void-surface/80 px-3 text-sm text-ink-primary outline-none focus:border-purple-neon/50 focus:ring-2 focus:ring-purple-neon/20"
      >
        <option value="">Todos os tipos</option>
        {TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
      </select>

      <div className="relative">
        <button
          type="button"
          onClick={() => setGenOpen((o) => !o)}
          className="flex h-10 w-full items-center gap-2 rounded-xl border border-white/10 bg-void-surface/80 px-3.5 text-sm text-ink-primary outline-none transition-colors hover:border-purple-neon/40"
        >
          <Layers className="h-3.5 w-3.5 text-purple-neon" strokeWidth={1.75} />
          Gerações
          {selectedGens.size > 0 && (
            <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-purple-neon px-1 text-[10px] font-medium text-void">
              {selectedGens.size}
            </span>
          )}
        </button>
        {genOpen && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setGenOpen(false)} />
            <div className="absolute right-0 z-20 mt-1.5 w-56 rounded-xl border border-white/10 bg-void-elevated p-3 shadow-panel">
              <div className="grid grid-cols-1 gap-1.5">
                {GENERATIONS.map((g) => (
                  <label key={g.value} className="flex items-center gap-2 text-sm text-ink-primary">
                    <input
                      type="checkbox"
                      checked={selectedGens.has(String(g.value))}
                      onChange={() => toggleGen(g.value)}
                      className="h-3.5 w-3.5 accent-purple-neon"
                    />
                    {g.label} <span className="text-xs text-ink-dim">({g.region})</span>
                  </label>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
