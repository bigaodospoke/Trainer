'use client';

import { useCallback, useRef } from 'react';
import { usePreferences } from '@/components/providers/preferences-provider';

// Repositorio publico oficial de cries do PokeAPI (arquivo .ogg por numero da
// national dex) — mesma logica de "usar CDN publica estavel" que ja e usada
// para os sprites (play.pokemonshowdown.com).
function cryUrl(nationalDex: number): string {
  return `https://raw.githubusercontent.com/PokeAPI/cries/main/cries/pokemon/latest/${nationalDex}.ogg`;
}

/** Toca o cry oficial do Pokemon, com cache de elementos <audio> (evita
 *  recriar/rebaixar o arquivo a cada clique no mesmo Pokemon) e respeitando
 *  o toggle de som + volume salvos em Configuracoes > Aparencia. */
export function useCry() {
  const { soundEnabled, soundVolume } = usePreferences();
  const cacheRef = useRef<Map<number, HTMLAudioElement>>(new Map());

  const playCry = useCallback(
    (nationalDex: number | null | undefined) => {
      if (!soundEnabled || !nationalDex) return;
      try {
        let audio = cacheRef.current.get(nationalDex);
        if (!audio) {
          audio = new Audio(cryUrl(nationalDex));
          audio.preload = 'auto';
          cacheRef.current.set(nationalDex, audio);
        }
        audio.volume = soundVolume;
        audio.currentTime = 0;
        void audio.play().catch(() => {
          // Autoplay bloqueado pelo navegador antes de qualquer interacao —
          // silencioso, nao e um erro relevante pro usuario.
        });
      } catch {
        // Ambiente sem suporte a Audio (SSR/teste) — ignora.
      }
    },
    [soundEnabled, soundVolume]
  );

  return { playCry };
}
