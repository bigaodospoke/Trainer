import Link from 'next/link';
import { History, BookOpen, Swords } from 'lucide-react';
import { GlassCard } from '@/components/ui/glass-card';
import { PokemonIcon } from '@/components/team-builder/sprite-icon';
import type { RecentViewRow } from '@/lib/recent-views/queries';

/** "Recently Viewed" do Dashboard — Pokemon e times acessados recentemente
 *  (RecentView, atualizado por <RecordView/> nas paginas de detalhe). */
export function RecentlyViewed({ views }: { views: RecentViewRow[] }) {
  if (views.length === 0) return null;

  return (
    <GlassCard padding="lg">
      <h2 className="mb-3 flex items-center gap-2 font-display text-sm font-semibold text-ink-primary">
        <History className="h-4 w-4 text-purple-neon" strokeWidth={1.75} />
        Recently Viewed
      </h2>
      <div className="flex flex-wrap gap-2">
        {views.map((v) => (
          <Link
            key={v.id}
            href={v.href}
            className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-2.5 py-1.5 text-xs text-ink-primary transition-colors hover:border-purple-neon/40"
          >
            {v.targetType === 'POKEMON' ? (
              <PokemonIcon icon={{ iconSheetUrl: v.iconSheetUrl ?? null, iconTop: v.iconTop ?? null, iconLeft: v.iconLeft ?? null }} alt={v.label} />
            ) : (
              <Swords className="h-4 w-4 text-purple-neon" strokeWidth={1.75} />
            )}
            <span className="truncate max-w-[120px]">{v.label}</span>
            {v.targetType === 'POKEMON' && <BookOpen className="h-3 w-3 shrink-0 text-ink-dim" strokeWidth={1.75} />}
          </Link>
        ))}
      </div>
    </GlassCard>
  );
}
