'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface TeraSpinnerProps {
  size?: number;
  className?: string;
  label?: string;
}

/**
 * Elemento de assinatura visual do MetaForge.
 *
 * Um hexagono facetado que pulsa faceta-a-faceta, em vez de girar como um
 * spinner generico — referencia direta ao cristal de Terastalizacao (mecanica
 * competitiva atual, citada no briefing como "Tera Type"). Reaparece como:
 *   - indicador de carregamento (este componente)
 *   - indicador de item ativo na sidebar (versao estatica, ver Sidebar)
 *   - glow ambiente de fundo (.tera-ambient em globals.css)
 */
const FACETS = [
  'M50 6 L82 24 L50 42 L18 24 Z',
  'M82 24 L94 50 L66 50 L50 42 Z',
  'M94 50 L82 76 L50 58 L66 50 Z',
  'M82 76 L50 94 L50 58 Z',
  'M50 94 L18 76 L50 58 Z',
  'M18 76 L6 50 L34 50 L50 58 Z',
  'M6 50 L18 24 L50 42 L34 50 Z',
];

export function TeraSpinner({ size = 56, className, label }: TeraSpinnerProps) {
  return (
    <div className={cn('inline-flex flex-col items-center gap-3', className)} role="status">
      <svg width={size} height={size} viewBox="0 0 100 100" fill="none" aria-hidden="true">
        {FACETS.map((d, i) => (
          <motion.path
            key={d}
            d={d}
            fill="url(#tera-gradient)"
            stroke="rgba(178,102,255,0.5)"
            strokeWidth={0.75}
            initial={{ opacity: 0.25 }}
            animate={{ opacity: [0.25, 1, 0.25] }}
            transition={{
              duration: 1.8,
              repeat: Infinity,
              delay: i * 0.16,
              ease: 'easeInOut',
            }}
          />
        ))}
        <defs>
          <linearGradient id="tera-gradient" x1="0" y1="0" x2="100" y2="100">
            <stop offset="0%" stopColor="#B266FF" />
            <stop offset="100%" stopColor="#5B21B6" />
          </linearGradient>
        </defs>
      </svg>
      {label && <span className="text-xs text-ink-muted">{label}</span>}
    </div>
  );
}
