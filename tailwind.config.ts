import type { Config } from 'tailwindcss';

/**
 * Trainerly Design System
 * -------------------------------------------------------------------------
 * Token source of truth. Estes mesmos valores existem como CSS vars em
 * src/app/globals.css (para uso em gradientes / box-shadow / SVG que o
 * Tailwind nao alcanca). Se mudar aqui, espelhe la.
 *
 * Direcao de design: "Tera Crystal" — a identidade visual do Trainerly gira
 * em torno da faceta de cristal (referencia direta a Terastalizacao, a
 * mecanica competitiva atual), usada como motivo de loading, indicador de
 * estado ativo na navegacao e glow ambiente. Nao e um "near-black + 1 accent"
 * generico: o roxo tem 3 camadas (deep/core/neon) que se comportam como
 * facetas de luz diferentes, nao um unico tom plano.
 */
export default {
  content: ['./src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Tokens ligados a variaveis CSS (ver globals.css :root / .light) para
        // que o toggle de tema reskine o app inteiro sem tocar em componentes.
        void: {
          DEFAULT: 'rgb(var(--c-void) / <alpha-value>)',
          surface: 'rgb(var(--c-void-surface) / <alpha-value>)',
          elevated: 'rgb(var(--c-void-elevated) / <alpha-value>)',
          raised: 'rgb(var(--c-void-raised) / <alpha-value>)',
        },
        purple: {
          deep: 'rgb(var(--c-purple-deep) / <alpha-value>)',
          core: 'rgb(var(--c-purple-core) / <alpha-value>)',
          neon: 'rgb(var(--c-purple-neon) / <alpha-value>)',
          ice: 'rgb(var(--c-purple-ice) / <alpha-value>)',
        },
        ink: {
          primary: 'rgb(var(--c-ink-primary) / <alpha-value>)',
          muted: 'rgb(var(--c-ink-muted) / <alpha-value>)',
          dim: 'rgb(var(--c-ink-dim) / <alpha-value>)',
        },
        tier: {
          ubers: '#FF4D6D',
          ou: '#FFD166',
          uu: '#6BCB77',
          ru: '#4D96FF',
          nu: '#C77DFF',
          pu: '#9B9B9B',
        },
        success: '#5FD98A',
        warning: '#FFC857',
        danger: '#FF5C7A',
      },
      fontFamily: {
        display: ['var(--font-display)'],
        body: ['var(--font-body)'],
        mono: ['var(--font-mono)'],
      },
      borderRadius: {
        card: '18px',
        pill: '999px',
      },
      boxShadow: {
        glow: '0 0 40px -8px rgba(178, 102, 255, 0.45)',
        'glow-sm': '0 0 18px -4px rgba(178, 102, 255, 0.4)',
        panel: '0 20px 60px -20px rgba(0, 0, 0, 0.65)',
      },
      backgroundImage: {
        'tera-radial':
          'radial-gradient(60% 50% at 50% 0%, rgba(139, 92, 246, 0.25) 0%, rgba(10, 6, 18, 0) 70%)',
        'facet-sheen':
          'linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0) 40%)',
      },
      animation: {
        'facet-pulse': 'facetPulse 2.4s ease-in-out infinite',
        'facet-spin': 'facetSpin 1.6s cubic-bezier(0.65, 0, 0.35, 1) infinite',
      },
      keyframes: {
        facetPulse: {
          '0%, 100%': { opacity: '0.55', transform: 'scale(1)' },
          '50%': { opacity: '1', transform: 'scale(1.04)' },
        },
        facetSpin: {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
      },
    },
  },
  plugins: [],
} satisfies Config;
