import { getTypeInfo } from '@/lib/pokemon-types';

interface TypeBadgeProps {
  type: string;
  /** "icon": so o glifo colorido, compacto. "full": glifo + nome do tipo. */
  variant?: 'icon' | 'full';
  size?: 'sm' | 'md';
}

/** Substitui o texto puro do tipo ("Grass", "Poison"...) por um chip visual
 *  colorido com o glifo do tipo — usado em Pokedex, Team Builder, Damage
 *  Calculator, Biblioteca e Rankings. */
export function TypeBadge({ type, variant = 'full', size = 'md' }: TypeBadgeProps) {
  const info = getTypeInfo(type);
  const dims = size === 'sm' ? 'h-5 px-1.5 text-[10px]' : 'h-6 px-2 text-xs';

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-pill font-medium text-white ${dims}`}
      style={{ backgroundColor: info.color }}
      title={type}
    >
      <span aria-hidden="true" className="leading-none">
        {info.glyph}
      </span>
      {variant === 'full' && <span>{type}</span>}
    </span>
  );
}

/** Linha compacta de badges de tipo (1 ou 2 tipos). */
export function TypeBadgeRow({ types, size = 'sm' }: { types: string[]; size?: 'sm' | 'md' }) {
  if (types.length === 0) return null;
  return (
    <span className="inline-flex items-center gap-1">
      {types.map((t) => (
        <TypeBadge key={t} type={t} variant="icon" size={size} />
      ))}
    </span>
  );
}
