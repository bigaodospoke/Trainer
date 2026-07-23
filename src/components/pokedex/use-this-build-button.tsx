'use client';

import { useRouter } from 'next/navigation';
import { Wand2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { RecommendedBuild } from '@/lib/pokedex/builds';

export const PENDING_BUILD_KEY = 'trainerly-pending-build';

/** Guarda a build no sessionStorage (sobrevive a navegacao entre paginas, ao
 *  contrario de state em memoria) e manda o usuario pro Team Builder — la,
 *  ao escolher esse Pokemon num slot, o CompetitiveFields detecta a build
 *  pendente e oferece aplicar automaticamente (mesmo mecanismo do "Aplicar"
 *  dos componentes mais usados). */
export function UseThisBuildButton({ build }: { build: RecommendedBuild }) {
  const router = useRouter();

  function handleClick() {
    try {
      sessionStorage.setItem(PENDING_BUILD_KEY, JSON.stringify(build));
    } catch {
      // sessionStorage indisponivel — segue sem a build pendente, sem quebrar nada
    }
    router.push('/team-builder');
  }

  return (
    <Button type="button" size="sm" onClick={handleClick}>
      <Wand2 className="h-3.5 w-3.5" />
      Use This Build
    </Button>
  );
}
