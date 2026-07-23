import { getTypeInfo } from '@/lib/pokemon-types';

/** Fundo ambiente sutil por tipo na pagina de detalhe — glow radial + 2
 *  "particulas" desfocadas na cor do tipo primario, so CSS (sem canvas/JS de
 *  particulas, pra nao pesar performance). Nao e uma animacao exclusiva por
 *  tipo (fogo/agua/eletrico teriam efeitos bem diferentes um do outro) — e
 *  uma unica linguagem visual generica tingida pela cor de cada tipo, o que
 *  cobre os 19 tipos sem precisar de 19 implementacoes bespoke. Fica atras
 *  do conteudo (z-index negativo) e com opacidade baixa pra nao atrapalhar
 *  legibilidade. Preparado pra virar opcional em Configuracoes mais tarde —
 *  hoje sempre ligado. */
export function TypeAmbientBackground({ type }: { type: string }) {
  const color = getTypeInfo(type).color;

  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden" aria-hidden="true">
      <div
        className="absolute -top-1/4 left-1/2 h-[60vh] w-[60vh] -translate-x-1/2 rounded-full opacity-[0.12] blur-3xl animate-facet-pulse"
        style={{ background: color }}
      />
      <div
        className="absolute bottom-0 right-0 h-[40vh] w-[40vh] rounded-full opacity-[0.08] blur-3xl animate-facet-pulse"
        style={{ background: color, animationDelay: '1.2s' }}
      />
    </div>
  );
}
