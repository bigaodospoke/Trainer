'use client';

import Image from 'next/image';
import { useTheme } from '@/components/providers/theme-provider';
import { useUiSound } from '@/lib/audio/use-ui-sound';
import { LYCANROC_SPRITES } from '@/lib/lycanroc';

/** Botao rapido escuro/claro para a topbar — Lycanroc Midday (claro) /
 *  Midnight (escuro) no lugar dos icones genericos de sol/lua, com uma
 *  pequena animacao de "transformacao" (escala+rotacao, ver keyframe
 *  themeMorph no tailwind.config.ts) e som de transformacao a cada troca.
 *  Controle completo (com "Seguir sistema") fica em Configuracoes > Aparencia. */
export function ThemeToggle() {
  const { resolved, setMode } = useTheme();
  const { play } = useUiSound();
  const sprite = LYCANROC_SPRITES[resolved].battle;

  function handleClick() {
    const next = resolved === 'dark' ? 'light' : 'dark';
    play(next === 'dark' ? 'themeToDark' : 'themeToLight');
    setMode(next);
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className="relative flex h-9 w-9 items-center justify-center rounded-full text-ink-muted transition-colors hover:bg-white/5 hover:text-ink-primary"
      aria-label={resolved === 'dark' ? 'Mudar para tema claro (Lycanroc Midday)' : 'Mudar para tema escuro (Lycanroc Midnight)'}
      title={resolved === 'dark' ? 'Tema claro — Lycanroc Midday' : 'Tema escuro — Lycanroc Midnight'}
    >
      <span key={resolved} className="flex h-7 w-7 items-center justify-center animate-theme-morph">
        <Image
          src={sprite}
          alt=""
          width={28}
          height={28}
          unoptimized
          style={{ imageRendering: 'pixelated' }}
        />
      </span>
    </button>
  );
}
