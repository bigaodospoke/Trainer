'use client';

import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import { PokemonIcon, ItemIcon } from '@/components/team-builder/sprite-icon';

export interface ComboboxOption {
  value: string;
  icon: { iconSheetUrl: string | null; iconTop: number | null; iconLeft: number | null };
}

interface ComboboxProps {
  name?: string;
  options: ComboboxOption[];
  defaultValue?: string;
  placeholder?: string;
  allowEmpty?: boolean;
  required?: boolean;
  autoFocus?: boolean;
  previewSize?: number;
  /**
   * "pokemon" usa a grade 40x30 de pokemonicons-sheet.png; "item" usa a
   * grade 24x24 de itemicons-sheet.png. Escolher o errado aqui distorce o
   * recorte do sprite sheet (era a causa do bug de sprites de item
   * "desalinhados/esticados" — o combobox de item usava sempre o icone de
   * Pokemon por engano).
   */
  iconKind?: 'pokemon' | 'item';
  /** Para uso controlado fora de um <form> (ex.: Damage Calculator), chamado
   *  a cada mudanca de texto e quando uma opcao e selecionada. */
  onValueChange?: (value: string) => void;
}

const MAX_RESULTS = 40;

/**
 * Combobox de busca com preview de sprite/icone no dropdown — usado tanto
 * para escolher especie (Pokemon) quanto item no Team Builder. O valor
 * submetido no form e o texto exato do nome (resolvido no servidor via
 * toId()), igual ao datalist nativo que substituiu, só que agora com imagem.
 *
 * Mostra tambem um preview fixo ao lado do campo (a imagem do que esta
 * selecionado agora), nao só dentro da lista — assim a imagem continua
 * visivel depois que o dropdown fecha.
 */
export function Combobox({
  name,
  options,
  defaultValue = '',
  placeholder,
  allowEmpty = false,
  required = false,
  autoFocus = false,
  previewSize,
  iconKind = 'pokemon',
  onValueChange,
}: ComboboxProps) {
  const resolvedPreviewSize = previewSize ?? (iconKind === 'item' ? 32 : 40);
  const Icon = iconKind === 'item' ? ItemIcon : PokemonIcon;
  const [text, setText] = useState(defaultValue);
  const [open, setOpen] = useState(false);
  const [highlighted, setHighlighted] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const listboxId = useId();

  const filtered = useMemo(() => {
    const query = text.trim().toLowerCase();
    if (!query) return options.slice(0, MAX_RESULTS);
    return options.filter((o) => o.value.toLowerCase().includes(query)).slice(0, MAX_RESULTS);
  }, [text, options]);

  const matched = useMemo(
    () => options.find((o) => o.value.toLowerCase() === text.trim().toLowerCase()),
    [text, options]
  );

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  function selectOption(value: string) {
    setText(value);
    setOpen(false);
    onValueChange?.(value);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setOpen(true);
      setHighlighted((h) => Math.min(h + 1, filtered.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlighted((h) => Math.max(h - 1, 0));
    } else if (e.key === 'Enter') {
      if (open && filtered[highlighted]) {
        e.preventDefault();
        selectOption(filtered[highlighted].value);
      }
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  }

  return (
    <div className="flex items-center gap-2.5">
      <div
        className="flex shrink-0 items-center justify-center overflow-hidden rounded-lg border border-white/10 bg-white/5"
        style={{ width: resolvedPreviewSize, height: resolvedPreviewSize }}
      >
        {matched ? <Icon icon={matched.icon} alt={matched.value} /> : null}
      </div>

      <div ref={containerRef} className="relative flex-1">
        <input
          type="text"
          name={name}
          role="combobox"
          aria-expanded={open}
          aria-controls={listboxId}
          autoComplete="off"
          required={required}
          autoFocus={autoFocus}
          placeholder={placeholder}
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            setOpen(true);
            setHighlighted(0);
            onValueChange?.(e.target.value);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKeyDown}
          className="h-10 w-full rounded-xl border border-white/10 bg-void-surface/80 px-3.5 text-sm text-ink-primary placeholder:text-ink-dim outline-none transition-colors focus:border-purple-neon/50 focus:ring-2 focus:ring-purple-neon/20"
        />

        {open && (filtered.length > 0 || allowEmpty) && (
          <ul
            id={listboxId}
            role="listbox"
            className="absolute z-20 mt-1.5 max-h-72 w-full overflow-y-auto rounded-xl border border-white/10 bg-void-elevated p-1.5 shadow-panel"
          >
            {allowEmpty && (
              <li role="presentation">
                <button
                  type="button"
                  onClick={() => selectOption('')}
                  className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-sm text-ink-muted hover:bg-white/5"
                >
                  — vazio —
                </button>
              </li>
            )}
            {filtered.map((option, i) => (
              <li key={option.value} role="presentation">
                <button
                  type="button"
                  onClick={() => selectOption(option.value)}
                  className={cn(
                    'flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 text-left text-sm transition-colors',
                    i === highlighted ? 'bg-purple-core/15 text-ink-primary' : 'text-ink-muted hover:bg-white/5'
                  )}
                  onMouseEnter={() => setHighlighted(i)}
                >
                  <Icon icon={option.icon} alt={option.value} />
                  <span className="truncate">{option.value}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
