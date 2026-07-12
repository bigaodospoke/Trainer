import Link from 'next/link';
import { cn } from '@/lib/utils';

const TABS = [
  { key: 'aparencia', label: 'Aparência', href: '/settings' },
  { key: 'perfil', label: 'Editar perfil', href: '/settings/perfil' },
] as const;

/** Separa "Configurações" (cursor/tema/som — preferências do app) de
 *  "Editar perfil" (bio/banner/pokemon favorito — dados públicos do
 *  usuário) em duas rotas, pra nao misturar os dois assuntos numa pagina so. */
export function SettingsTabs({ active }: { active: 'aparencia' | 'perfil' }) {
  return (
    <div className="flex w-fit gap-1 rounded-xl border border-white/10 bg-void-surface/80 p-1">
      {TABS.map((tab) => (
        <Link
          key={tab.key}
          href={tab.href}
          className={cn(
            'rounded-lg px-4 py-1.5 text-sm font-medium transition-colors',
            active === tab.key ? 'bg-purple-core/20 text-ink-primary' : 'text-ink-muted hover:text-ink-primary'
          )}
        >
          {tab.label}
        </Link>
      ))}
    </div>
  );
}
