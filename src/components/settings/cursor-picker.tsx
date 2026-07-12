'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { Search, Check } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { usePreferences, type CursorSpecies } from '@/components/providers/preferences-provider';

const PSYDUCK_OPTION: CursorSpecies = {
  slug: 'psyduck',
  name: 'Psyduck (padrão)',
  spriteUrl: 'https://play.pokemonshowdown.com/sprites/gen5/psyduck.png',
  types: ['Water'],
};

/** Grid de sprites com busca para escolher qual Pokemon acompanha o cursor.
 *  Usado em Configuracoes > Aparencia. A busca consulta uma rota leve
 *  (/api/pokemon/cursor-options) que le direto do banco local da Pokedex. */
export function CursorPicker() {
  const { cursorSpecies, setCursorSpecies } = usePreferences();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<CursorSpecies[]>([]);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/pokemon/cursor-options?q=${encodeURIComponent(query)}`);
        if (res.ok) {
          const data = await res.json();
          setResults(
            (data.species as { slug: string; name: string; spriteUrl: string | null; types: string[] }[])
              .filter((s) => s.spriteUrl)
              .map((s) => ({ slug: s.slug, name: s.name, spriteUrl: s.spriteUrl as string, types: s.types }))
          );
        }
      } catch {
        // busca opcional — falha silenciosa, mantem a lista anterior
      } finally {
        setLoading(false);
      }
    }, 250);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  const options = [PSYDUCK_OPTION, ...results.filter((r) => r.slug !== 'psyduck')];

  return (
    <div className="flex flex-col gap-3">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-dim" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar Pokémon..."
          className="pl-9"
        />
      </div>

      <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
        {options.map((opt) => {
          const isSelected = opt.slug === cursorSpecies.slug;
          return (
            <button
              key={opt.slug}
              type="button"
              onClick={() => setCursorSpecies(opt)}
              title={opt.name}
              className={cn(
                'relative flex flex-col items-center gap-1 rounded-xl border p-2 text-center transition-colors',
                isSelected
                  ? 'border-purple-neon/60 bg-purple-core/15'
                  : 'border-white/10 hover:border-white/20 hover:bg-white/5'
              )}
            >
              {isSelected && (
                <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-purple-neon text-void">
                  <Check className="h-2.5 w-2.5" strokeWidth={3} />
                </span>
              )}
              <Image src={opt.spriteUrl} alt={opt.name} width={40} height={40} unoptimized className="shrink-0" />
              <span className="w-full truncate text-[10px] text-ink-muted">{opt.name}</span>
            </button>
          );
        })}
        {loading && options.length === 1 && (
          <p className="col-span-full py-2 text-center text-xs text-ink-dim">Buscando...</p>
        )}
        {!loading && query && results.length === 0 && (
          <p className="col-span-full py-2 text-center text-xs text-ink-dim">Nenhum Pokémon encontrado</p>
        )}
      </div>
    </div>
  );
}
