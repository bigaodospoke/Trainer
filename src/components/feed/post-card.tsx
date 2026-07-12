'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Heart, MessageCircle, Trash2, Send } from 'lucide-react';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { GlassCard } from '@/components/ui/glass-card';
import { FavoriteButton } from '@/components/ui/favorite-button';
import { togglePostLike, addPostComment, deletePost } from '@/app/(app)/feed/actions';
import { cn } from '@/lib/utils';

export interface FeedPostData {
  id: string;
  content: string;
  imageUrl: string | null;
  likesCount: number;
  commentsCount: number;
  createdAt: Date;
  author: { username: string; displayName: string | null; avatarUrl: string | null };
  sharedTeam: {
    id: string; name: string; battleFormat: string; generation: number; isPublic: boolean;
    owner: { username: string };
    slots: { species: { name: string; spriteUrl: string | null } }[];
  } | null;
  comments: {
    id: string; content: string; createdAt: Date;
    author: { username: string; displayName: string | null; avatarUrl: string | null };
  }[];
}

export function PostCard({
  post,
  meUsername,
  initiallyLiked,
  initiallyFavorited,
}: {
  post: FeedPostData;
  meUsername: string;
  initiallyLiked: boolean;
  initiallyFavorited: boolean;
}) {
  const [liked, setLiked] = useState(initiallyLiked);
  const [likesCount, setLikesCount] = useState(post.likesCount);
  const [showComments, setShowComments] = useState(false);
  const [isPending, startTransition] = useTransition();
  const isOwn = post.author.username === meUsername;

  function handleLike() {
    setLiked((l) => !l);
    setLikesCount((c) => (liked ? c - 1 : c + 1));
    startTransition(() => togglePostLike(post.id));
  }

  return (
    <GlassCard padding="lg" className="flex flex-col gap-3">
      <div className="flex items-start gap-3">
        <Avatar src={post.author.avatarUrl} name={post.author.displayName ?? post.author.username} size={36} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <Link href={`/profile/${post.author.username}`} className="text-sm font-medium text-ink-primary hover:underline">
              @{post.author.username}
            </Link>
            <span className="text-[11px] text-ink-dim">{new Date(post.createdAt).toLocaleString('pt-BR')}</span>
          </div>
          <p className="mt-1 whitespace-pre-wrap text-sm text-ink-primary">{post.content}</p>
        </div>
        {isOwn && (
          <form action={deletePost.bind(null, post.id)}>
            <button type="submit" className="text-ink-dim hover:text-danger">
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </form>
        )}
      </div>

      {post.imageUrl && (
        <div className="relative h-56 w-full overflow-hidden rounded-xl border border-white/10">
          <Image src={post.imageUrl} alt="" fill unoptimized className="object-cover" />
        </div>
      )}

      {post.sharedTeam && (
        <Link href={`/library/${post.sharedTeam.id}`}>
          <div className="rounded-xl border border-purple-neon/20 bg-purple-core/10 p-3 transition-colors hover:border-purple-neon/40">
            <p className="mb-2 text-sm font-medium text-ink-primary">📋 {post.sharedTeam.name}</p>
            <p className="mb-2 text-xs text-ink-dim">
              {post.sharedTeam.battleFormat} · Gen {post.sharedTeam.generation} · por @{post.sharedTeam.owner.username}
            </p>
            <div className="flex gap-1.5">
              {post.sharedTeam.slots.map((s, i) => (
                <div key={i} className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/5">
                  {s.species.spriteUrl && <Image src={s.species.spriteUrl} alt={s.species.name} width={28} height={28} unoptimized />}
                </div>
              ))}
            </div>
          </div>
        </Link>
      )}

      <div className="flex items-center gap-4 border-t border-white/5 pt-3">
        <button
          type="button"
          onClick={handleLike}
          disabled={isPending}
          className={cn('flex items-center gap-1.5 text-xs transition-colors', liked ? 'text-danger' : 'text-ink-muted hover:text-ink-primary')}
        >
          <Heart className={cn('h-4 w-4', liked && 'fill-current')} strokeWidth={1.75} />
          {likesCount}
        </button>
        <button
          type="button"
          onClick={() => setShowComments((s) => !s)}
          className="flex items-center gap-1.5 text-xs text-ink-muted transition-colors hover:text-ink-primary"
        >
          <MessageCircle className="h-4 w-4" strokeWidth={1.75} />
          {post.commentsCount}
        </button>
        <FavoriteButton targetType="POST" targetId={post.id} initialFavorited={initiallyFavorited} size="sm" />
      </div>

      {showComments && (
        <div className="flex flex-col gap-3 border-t border-white/5 pt-3">
          {post.comments.map((c) => (
            <div key={c.id} className="flex items-start gap-2.5">
              <Avatar src={c.author.avatarUrl} name={c.author.displayName ?? c.author.username} size={24} />
              <div>
                <p className="text-xs text-ink-muted">@{c.author.username}</p>
                <p className="text-sm text-ink-primary">{c.content}</p>
              </div>
            </div>
          ))}
          <form
            action={async (formData) => {
              await addPostComment(post.id, formData);
            }}
            className="flex items-center gap-2"
          >
            <input
              name="content"
              maxLength={1000}
              placeholder="Escreva um comentário..."
              required
              className="h-9 flex-1 rounded-lg border border-white/10 bg-void-surface/80 px-3 text-sm text-ink-primary placeholder:text-ink-dim outline-none focus:border-purple-neon/50"
            />
            <Button type="submit" size="sm" variant="secondary">
              <Send className="h-3.5 w-3.5" />
            </Button>
          </form>
        </div>
      )}
    </GlassCard>
  );
}
