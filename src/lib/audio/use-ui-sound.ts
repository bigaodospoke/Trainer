'use client';

import { useCallback } from 'react';
import { usePreferences } from '@/components/providers/preferences-provider';

/** Sons de UI sintetizados via Web Audio API — sem arquivo de audio nenhum
 *  (nao ha assets de "click sound" no projeto, e sintetizar evita depender
 *  de um CDN externo so pra isso). Reusa a mesma preferencia soundEnabled/
 *  soundVolume que ja controla o cry dos Pokemon (ver useCry), entao o
 *  usuario ja tem como desativar em Configuracoes > Aparencia. */

let sharedCtx: AudioContext | null = null;

function getContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return null;
  if (!sharedCtx) sharedCtx = new Ctor();
  return sharedCtx;
}

export type UiSoundType = 'click' | 'toggle' | 'nav' | 'themeToDark' | 'themeToLight';

const PRESETS: Record<UiSoundType, { freqs: number[]; duration: number; type: OscillatorType }> = {
  click: { freqs: [880], duration: 0.05, type: 'sine' },
  toggle: { freqs: [660, 900], duration: 0.09, type: 'sine' },
  nav: { freqs: [520], duration: 0.06, type: 'triangle' },
  // Transformacao Midday -> Midnight: sequencia descendente, transmite "algo se fechando/escurecendo".
  themeToDark: { freqs: [700, 520, 380], duration: 0.34, type: 'sine' },
  // Transformacao Midnight -> Midday: sequencia ascendente, "algo se abrindo/clareando".
  themeToLight: { freqs: [380, 520, 700], duration: 0.34, type: 'sine' },
};

export function useUiSound() {
  const { soundEnabled, soundVolume } = usePreferences();

  const play = useCallback(
    (type: UiSoundType) => {
      if (!soundEnabled) return;
      const ctx = getContext();
      if (!ctx) return;
      if (ctx.state === 'suspended') void ctx.resume();

      const preset = PRESETS[type];
      const step = preset.duration / preset.freqs.length;
      const now = ctx.currentTime;
      const peak = Math.max(0.0001, soundVolume * 0.16);

      preset.freqs.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = preset.type;
        osc.frequency.value = freq;
        const start = now + i * step;
        const end = start + step;
        gain.gain.setValueAtTime(0.0001, start);
        gain.gain.linearRampToValueAtTime(peak, start + step * 0.2);
        gain.gain.exponentialRampToValueAtTime(0.0001, end);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(start);
        osc.stop(end + 0.02);
      });
    },
    [soundEnabled, soundVolume]
  );

  return { play };
}
