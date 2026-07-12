import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Tags, X } from 'lucide-react';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { GlassCard } from '@/components/ui/glass-card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { addUserTag, removeUserTag } from '../users-actions';

const SUGGESTED_TAGS = ['Apoiador', 'Dev', 'Moderador', 'Beta Tester', 'Parceiro'];

interface AdminUsersPageProps {
  searchParams: Promise<{ q?: string }>;
}

export default async function AdminUsersPage({ searchParams }: AdminUsersPageProps) {
  const session = await auth();
  if (session?.user.role !== 'ADMIN') redirect('/dashboard');

  const { q } = await searchParams;

  const users = await prisma.user.findMany({
    where: q ? { username: { contains: q, mode: 'insensitive' } } : {},
    orderBy: q ? { username: 'asc' } : { createdAt: 'desc' },
    take: 30,
  });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link href="/admin" className="inline-flex items-center gap-1.5 text-sm text-ink-muted hover:text-ink-primary">
          <ArrowLeft className="h-3.5 w-3.5" />
          Voltar à administração
        </Link>
      </div>

      <div className="flex items-center gap-3">
        <Tags className="h-6 w-6 text-purple-neon" strokeWidth={1.75} />
        <div>
          <h1 className="font-display text-2xl font-semibold text-ink-primary">Tags de usuário</h1>
          <p className="text-sm text-ink-muted">Marque usuários como Apoiador, Dev, Moderador, etc.</p>
        </div>
      </div>

      <GlassCard padding="md">
        <form className="flex gap-2">
          <Input name="q" defaultValue={q ?? ''} placeholder="Buscar por @username..." />
          <Button type="submit">Buscar</Button>
        </form>
      </GlassCard>

      <div className="flex flex-col gap-3">
        {users.length === 0 && <p className="text-sm text-ink-dim">Nenhum usuário encontrado.</p>}
        {users.map((u: (typeof users)[number]) => (
          <GlassCard key={u.id} padding="md">
            <div className="flex items-center gap-3">
              <Avatar src={u.avatarUrl} name={u.displayName ?? u.username} size={36} />
              <Link href={`/profile/${u.username}`} className="flex-1 text-sm text-ink-primary hover:underline">
                @{u.username}
              </Link>
              <Badge tone={u.role === 'ADMIN' ? 'danger' : 'neutral'}>{u.role}</Badge>
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-1.5">
              {u.tags.map((tag: string) => (
                <span key={tag} className="flex items-center gap-1 rounded-pill border border-purple-neon/30 bg-purple-core/15 py-0.5 pl-2.5 pr-1 text-[11px] font-medium text-purple-ice">
                  {tag}
                  <form action={removeUserTag.bind(null, u.id, tag)}>
                    <button type="submit" className="flex h-4 w-4 items-center justify-center rounded-full hover:bg-white/10">
                      <X className="h-2.5 w-2.5" strokeWidth={2.5} />
                    </button>
                  </form>
                </span>
              ))}
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-1.5 border-t border-white/5 pt-3">
              {SUGGESTED_TAGS.filter((t) => !u.tags.includes(t)).map((tag) => (
                <form key={tag} action={async () => {
                  'use server';
                  const fd = new FormData();
                  fd.set('tag', tag);
                  await addUserTag(u.id, fd);
                }}>
                  <button type="submit" className="rounded-pill border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] text-ink-muted hover:border-purple-neon/40 hover:text-ink-primary">
                    + {tag}
                  </button>
                </form>
              ))}
              <form action={addUserTag.bind(null, u.id)} className="flex items-center gap-1.5">
                <input
                  name="tag"
                  maxLength={24}
                  placeholder="Tag personalizada..."
                  className="h-7 w-36 rounded-lg border border-white/10 bg-void-surface/80 px-2 text-[11px] text-ink-primary placeholder:text-ink-dim outline-none focus:border-purple-neon/50"
                />
                <button type="submit" className="rounded-lg border border-white/10 px-2 py-1 text-[11px] text-ink-muted hover:text-ink-primary">
                  Adicionar
                </button>
              </form>
            </div>
          </GlassCard>
        ))}
      </div>
    </div>
  );
}
