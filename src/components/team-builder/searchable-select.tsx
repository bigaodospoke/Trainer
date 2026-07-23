'use client';

import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface SearchableSelectOption {
  value: string;
  label: string;
  hint?: string;
}

interface SearchableSelectProps {
  name: string;
  options: SearchableSelectOption[];
  defaultValue?: string;
  placeholder?: string;
  allowEmpty?: boolean;
  emptyLabel?: string;
  /** Icone por opcao (ex.: sprite do Tera Type) — mostrado tanto fechado
   *  quanto em cada linha da lista. Opcional pra nao afetar os outros usos
   *  (Ability, Nature) que nao tem icone. */
  renderIcon?: (opt: SearchableSelectOption) => React.ReactNode;
}

/**
 * Select com busca instantanea e autocomplete — usado para Ability, Nature e
 * Tera Type no Team Builder. Ao contrario do <select> nativo, filtra
 * conforme digita e mostra o hint (ex.: "Hidden" na ability, cor do tipo no
 * tera). Envia o valor via input hidden, entao funciona com o mesmo
 * <form action={...}> server action de sempre.
 */
export function SearchableSelect({
  name,
  options,
  defaultValue = '',
  placeholder = 'Buscar...',
  allowEmpty = false,
  emptyLabel = '— vazio —',
  renderIcon,
}: SearchableSelectProps) {
  const initialOption = options.find((o) => o.value === defaultValue);
  const [value, setValue] = useState(defaultValue);
  const [text, setText] = useState(initialOption?.label ?? '');
  const currentOption = options.find((o) => o.value === value);
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [highlighted, setHighlighted] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const listboxId = useId();

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options.slice(0, 60);
    return options.filter((o) => o.label.toLowerCase().includes(q)).slice(0, 60);
  }, [query, options]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setQuery('');
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  function select(opt: SearchableSelectOption | null) {
    setValue(opt?.value ?? '');
    setText(opt?.label ?? '');
    setQuery('');
    setOpen(false);
  }

  return (
    <div ref={containerRef} className="relative">
      <input type="hidden" name={name} value={value} />
      <button
        type="button"
        role="combobox"
        aria-expanded={open}
        aria-controls={listboxId}
        onClick={() => {
          setOpen((o) => !o);
          setQuery('');
        }}
        className="flex h-10 w-full items-center justify-between gap-2 rounded-xl border border-white/10 bg-void-surface/80 px-3 text-left text-sm text-ink-primary outline-none transition-colors focus:border-purple-neon/50 focus:ring-2 focus:ring-purple-neon/20"
      >
        <span className="flex min-w-0 flex-1 items-center gap-2">
          {renderIcon && currentOption && (
            <span key={value} className="shrink-0 animate-pop-in">{renderIcon(currentOption)}</span>
          )}
          <span className={cn('truncate', !text && 'text-ink-dim')}>{text || placeholder}</span>
        </span>
        <ChevronDown className="h-3.5 w-3.5 shrink-0 text-ink-dim" strokeWidth={1.75} />
      </button>

      {open && (
        <div className="absolute z-20 mt-1.5 w-full overflow-hidden rounded-xl border border-white/10 bg-void-elevated shadow-panel">
          <input
            autoFocus
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setHighlighted(0);
            }}
            onKeyDown={(e) => {
              if (e.key === 'ArrowDown') {
                e.preventDefault();
                setHighlighted((h) => Math.min(h + 1, filtered.length - 1));
              } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setHighlighted((h) => Math.max(h - 1, 0));
              } else if (e.key === 'Enter') {
                e.preventDefault();
                if (filtered[highlighted]) select(filtered[highlighted]);
              } else if (e.key === 'Escape') {
                setOpen(false);
              }
            }}
            placeholder="Digite para filtrar..."
            className="w-full border-b border-white/10 bg-transparent px-3 py-2 text-sm text-ink-primary placeholder:text-ink-dim outline-none"
          />
          <ul id={listboxId} role="listbox" className="max-h-64 overflow-y-auto p-1.5">
            {allowEmpty && (
              <li role="presentation">
                <button
                  type="button"
                  onClick={() => select(null)}
                  className="flex w-full items-center rounded-lg px-2 py-1.5 text-left text-sm text-ink-muted hover:bg-white/5"
                >
                  {emptyLabel}
                </button>
              </li>
            )}
            {filtered.map((opt, i) => (
              <li key={opt.value} role="presentation">
                <button
                  type="button"
                  onClick={() => select(opt)}
                  onMouseEnter={() => setHighlighted(i)}
                  className={cn(
                    'flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-left text-sm transition-colors',
                    i === highlighted ? 'bg-purple-core/15 text-ink-primary' : 'text-ink-muted hover:bg-white/5'
                  )}
                >
                  <span className="flex min-w-0 items-center gap-2">
                    {renderIcon && <span className="shrink-0">{renderIcon(opt)}</span>}
                    <span className="truncate">{opt.label}</span>
                  </span>
                  {opt.hint && <span className="ml-2 shrink-0 text-[10px] text-ink-dim">{opt.hint}</span>}
                </button>
              </li>
            ))}
            {filtered.length === 0 && <li className="px-2 py-3 text-center text-xs text-ink-dim">Nada encontrado</li>}
          </ul>
        </div>
      )}
    </div>
  );
}
