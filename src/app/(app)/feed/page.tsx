import Link from 'next/link';
import Image from 'next/image';
import { Newspaper, Sparkles } from 'lucide-react';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getFeedPosts, getMyLikedPostIds, getFeaturedTeams } from '@/lib/feed/queries';
import { GlassCard } from '@/components/ui/glass-card';
import { EmptyState } from '@/components/ui/empty-state';
import { FeedComposer } from '@/components/feed/feed-composer';
import { PostCard } from '@/components/feed/post-card';

export default async function FeedPage() {
  const session = await auth();
  const me = session!.user;

  const [posts, myTeams, featuredTeams, myFavorites] = await Promise.all([
    getFeedPosts(me.id),
    prisma.team.findMany({ where: { ownerId: me.id }, select: { id: true, name: true }, orderBy: { updatedAt: 'desc' } }),
    getFeaturedTeams(),
    prisma.favorite.findMany({ where: { userId: me.id, targetType: 'POST' }, select: { targetId: true } }),
  ]);

  const likedPostIds = await getMyLikedPostIds(me.id, posts.map((p: (typeof posts)[number]) => p.id));
  const favoritedPostIds = new Set(myFavorites.map((f: { targetId: string }) => f.targetId));

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <Newspaper className="h-6 w-6 text-purple-neon" strokeWidth={1.75} />
          <div>
            <h1 className="font-display text-2xl font-semibold text-ink-primary">Feed</h1>
            <p className="text-sm text-ink-muted">Times, sets e novidades de quem você segue.</p>
          </div>
        </div>

        <FeedComposer myTeams={myTeams} />

        {posts.length === 0 ? (
          <GlassCard padding="lg">
            <EmptyState
              title="Seu feed está vazio"
              description="Siga outros treinadores nos perfis deles pra ver os posts aqui, ou publique o primeiro post você mesmo."
            />
          </GlassCard>
        ) : (
          posts.map((post: (typeof posts)[number]) => (
            <PostCard
              key={post.id}
              post={post}
              meUsername={me.username}
              initiallyLiked={likedPostIds.has(post.id)}
              initiallyFavorited={favoritedPostIds.has(post.id)}
            />
          ))
        )}
      </div>

      <div className="flex flex-col gap-4">
        <GlassCard padding="lg">
          <h2 className="mb-3 flex items-center gap-1.5 font-display text-sm font-semibold text-ink-primary">
            <Sparkles className="h-4 w-4 text-purple-neon" />
            Times em destaque
          </h2>
          <div className="flex flex-col gap-3">
            {featuredTeams.length === 0 && <p className="text-xs text-ink-dim">Nenhum time público em destaque ainda.</p>}
            {featuredTeams.map((t: (typeof featuredTeams)[number]) => (
              <Link key={t.id} href={`/library/${t.id}`} className="block rounded-xl border border-white/5 bg-white/[0.02] p-2.5 transition-colors hover:border-purple-neon/30">
                <p className="mb-1.5 truncate text-xs font-medium text-ink-primary">{t.name}</p>
                <p className="mb-2 truncate text-[10px] text-ink-dim">por @{t.owner.username}</p>
                <div className="flex gap-1">
                  {t.slots.map((s, i) => (
                    <div key={i} className="flex h-7 w-7 items-center justify-center rounded-md border border-white/10 bg-white/5">
                      {s.species.spriteUrl && <Image src={s.species.spriteUrl} alt={s.species.name} width={20} height={20} unoptimized />}
                    </div>
                  ))}
                </div>
              </Link>
            ))}
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
