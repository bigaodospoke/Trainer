'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { Sparkles } from 'lucide-react';
import { FORM_KIND_FILTERS } from '@/lib/pokedex/form-kinds';
import { useUiSound } from '@/lib/audio/use-ui-sound';

const STORAGE_KEY = 'trainerly-pokedex-form-filters';

/** Paradox e Ultra Beasts vem habilitados por padrao (pedido explicito —
 *  sao Pokemon "normais" o suficiente pra fazer parte do competitivo atual,
 *  diferente de Mega/Gmax/Regional que ficam desligados ate o usuario pedir). */
const DEFAULT_ACTIVE_FORMS = ['PARADOX', 'ULTRA_BEAST'];

/** Checkbox de formas especiais (Mega, Gmax, Regional...) — a escolha vai
 *  pra URL (?forms=MEGA,GMAX) pra a busca server-side funcionar, e fica
 *  salva em localStorage pra persistir entre visitas. */
export function PokedexFormFilter() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [open, setOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const { play } = useUiSound();

  const urlForms = searchParams.get('forms');
  const active = urlForms !== null
    ? new Set(urlForms.split(',').filter(Boolean))
    : new Set(DEFAULT_ACTIVE_FORMS);

  // Na primeira carga sem `?forms=` na URL, aplica a preferencia salva (se
  // houver e for diferente do padrao) — assim a escolha do usuario persiste
  // entre visitas sem precisar de conta/banco pra isso.
  useEffect(() => {
    if (hydrated) return;
    setHydrated(true);
    if (urlForms !== null) return;
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (saved !== null) {
        const params = new URLSearchParams(searchParams.toString());
        params.set('forms', saved);
        router.replace(`${pathname}?${params.toString()}`);
      }
    } catch {
      // localStorage indisponivel — segue com o padrao (Paradox + Ultra Beasts)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function toggle(value: string) {
    play('toggle');
    const next = new Set(active);
    if (next.has(value)) next.delete(value);
    else next.add(value);

    const csv = Array.from(next).join(',');
    const params = new URLSearchParams(searchParams.toString());
    params.delete('page');
    if (csv) params.set('forms', csv);
    else params.delete('forms');
    router.push(`${pathname}?${params.toString()}`);

    try {
      window.localStorage.setItem(STORAGE_KEY, csv);
    } catch {
      // preferencia so nao persiste — sem problema, filtro continua funcionando
    }
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => { play('nav'); setOpen((o) => !o); }}
        className="flex h-10 items-center gap-2 rounded-xl border border-white/10 bg-void-surface/80 px-3.5 text-sm text-ink-primary outline-none transition-colors hover:border-purple-neon/40"
      >
        <Sparkles className="h-3.5 w-3.5 text-purple-neon" strokeWidth={1.75} />
        Formas especiais
        {active.size > 0 && (
          <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-purple-neon px-1 text-[10px] font-medium text-void">
            {active.size}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-20 mt-1.5 w-64 rounded-xl border border-white/10 bg-void-elevated p-3 shadow-panel">
            <p className="mb-2 text-[10px] uppercase tracking-wide text-ink-dim">
              Além das formas padrão, mostrar:
            </p>
            <div className="flex flex-col gap-1.5">
              {FORM_KIND_FILTERS.map((f) => (
                <label key={f.value} className="flex items-center gap-2 text-sm text-ink-primary">
                  <input
                    type="checkbox"
                    checked={active.has(f.value)}
                    onChange={() => toggle(f.value)}
                    className="h-3.5 w-3.5 accent-purple-neon"
                  />
                  {f.label}
                </label>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
