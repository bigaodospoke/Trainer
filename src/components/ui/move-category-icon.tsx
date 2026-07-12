import { Swords, Sparkles, Shield } from 'lucide-react';

const CATEGORY_ICON = { PHYSICAL: Swords, SPECIAL: Sparkles, STATUS: Shield } as const;

/** Fisico/Especial/Status — mostrado ao lado do tipo em toda lista de golpes
 *  (card do Team Builder, combobox de golpe, Damage Calculator). */
export function MoveCategoryIcon({ category, className }: { category: string; className?: string }) {
  const Icon = CATEGORY_ICON[category as keyof typeof CATEGORY_ICON];
  if (!Icon) return null;
  return <Icon className={className ?? 'h-3 w-3'} strokeWidth={1.75} />;
}
