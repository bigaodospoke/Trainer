'use client';

import { Moon, Sun } from 'lucide-react';
import { useTheme } from '@/components/providers/theme-provider';

/** Botao rapido escuro/claro para a topbar. Controle completo (com "Seguir
 *  sistema") fica em Configuracoes > Aparencia. */
export function ThemeToggle() {
  const { resolved, setMode } = useTheme();

  return (
    <button
      type="button"
      onClick={() => setMode(resolved === 'dark' ? 'light' : 'dark')}
      className="relative flex h-9 w-9 items-center justify-center rounded-full text-ink-muted transition-colors hover:bg-white/5 hover:text-ink-primary"
      aria-label={resolved === 'dark' ? 'Mudar para tema claro' : 'Mudar para tema escuro'}
      title={resolved === 'dark' ? 'Tema claro' : 'Tema escuro'}
    >
      {resolved === 'dark' ? (
        <Sun className="h-[18px] w-[18px]" strokeWidth={1.75} />
      ) : (
        <Moon className="h-[18px] w-[18px]" strokeWidth={1.75} />
      )}
    </button>
  );
}
