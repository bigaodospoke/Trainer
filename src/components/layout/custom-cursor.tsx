'use client';

import { useEffect, useRef } from 'react';
import { getTypeInfo } from '@/lib/pokemon-types';
import type { CursorSpecies } from '@/components/providers/preferences-provider';

/**
 * Cursor customizado — NAO substitui a seta do sistema pelo sprite (era o
 * comportamento antigo, via `cursor: url(sprite)`). Em vez disso desenha uma
 * seta propria colorida com a cor do tipo do Pokemon escolhido (ex.: verde
 * pra Bulbasaur), com o sprite dele acompanhando ao lado — a seta do SO fica
 * escondida (`cursor: none`, aplicado pelo PreferencesProvider) pra nao
 * duplicar. Posicao atualizada direto no DOM via ref (nao useState) pra nao
 * re-renderizar a arvore inteira a cada mousemove.
 */
export function CustomCursor({ species }: { species: CursorSpecies }) {
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleMove(e: MouseEvent) {
      const el = wrapperRef.current;
      if (el) el.style.transform = `translate(${e.clientX}px, ${e.clientY}px)`;
    }
    function handleLeave() {
      const el = wrapperRef.current;
      if (el) el.style.opacity = '0';
    }
    function handleEnter() {
      const el = wrapperRef.current;
      if (el) el.style.opacity = '1';
    }
    document.addEventListener('mousemove', handleMove);
    document.addEventListener('mouseleave', handleLeave);
    document.addEventListener('mouseenter', handleEnter);
    return () => {
      document.removeEventListener('mousemove', handleMove);
      document.removeEventListener('mouseleave', handleLeave);
      document.removeEventListener('mouseenter', handleEnter);
    };
  }, []);

  const color = getTypeInfo(species.types[0] ?? 'Normal').color;
  // Psyduck e o mascote padrao do Trainerly — ganha um destaque extra de
  // tamanho em relacao aos demais Pokemon escolhiveis (pedido explicito).
  const isPsyduck = species.slug === 'psyduck';
  const spriteSize = isPsyduck ? 66 : 54;
  const offset = isPsyduck ? 18 : 20;

  return (
    <div
      ref={wrapperRef}
      className="pointer-events-none fixed left-0 top-0 z-[9999] opacity-0 transition-opacity duration-150"
      style={{ willChange: 'transform' }}
    >
      <svg width="30" height="30" viewBox="0 0 24 24" style={{ filter: 'drop-shadow(0 1px 3px rgba(0,0,0,0.5))' }}>
        <path
          d="M3 2 L3 19 L7.5 15.2 L10.5 21.5 L13.2 20.2 L10.2 14 L16.5 13.8 Z"
          fill={color}
          stroke="white"
          strokeWidth="1.2"
          strokeLinejoin="round"
        />
      </svg>
      <img
        src={species.spriteUrl}
        alt=""
        width={spriteSize}
        height={spriteSize}
        className="absolute drop-shadow-md"
        style={{ imageRendering: 'pixelated', left: offset, top: offset }}
      />
    </div>
  );
}
