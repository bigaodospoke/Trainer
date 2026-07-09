import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { GlassCard } from '@/components/ui/glass-card';
import { EmptyState } from '@/components/ui/empty-state';
import { Button } from '@/components/ui/button';
import { Avatar } from '@/components/ui/avatar';
import { formatCount } from '@/lib/utils';
import { Swords, Heart, Download, Users, Plus, Check, X, Activity } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { respondFriendRequest } from '../profile/[username]/actions';

const ACTIVITY_LABELS: Record<string, (payload: Record<string, unknown>) => string> = {
  TEAM_PUBLISHED: (p) => `publicou o time "${p.teamName}"`,
  TEAM_LIKED: (p) => `curtiu o time "${p.teamName}"`,
  USER_FOLLOWED: (p) => `começou a seguir @${p.targetUsername}`,
  COMMENT_POSTED: (p) => `comentou no time "${p.teamName}"`,
  LEAGUE_JOINED: () => `entrou em uma draft league`,
};

function activityLink(type: string, payload: Record<string, unknown>): string | null {
  if (type === 'TEAM_PUBLISHED' || type === 'TEAM_LIKED' || type === 'COMMENT_POSTED') {
    return `/library/${payload.teamId}`;
  }
  if (type === 'USER_FOLLOWED') return `/profile/${payload.targetUsername}`;
  return null;
}

export default async function DashboardPage() {
  const session = await auth();
  const user = await prisma.user.findUnique({ where: { id: session!.user.id } });

  const [recentTeams, pendingRequests, following] = await Promise.all([
    prisma.team.findMany({
      where: { ownerId: session!.user.id },
      orderBy: { updatedAt: 'desc' },
      take: 4,
      include: { slots: { include: { species: true }, orderBy: { position: 'asc' } } },
    }),
    prisma.friend.findMany({
      where: { addresseeId: session!.user.id, status: 'PENDING' },
      include: { requester: { select: { username: true, displayName: true, avatarUrl: true } } },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.follow.findMany({ where: { followerId: session!.user.id }, select: { followingId: true } }),
  ]);

  const followingIds = following.map((f: { followingId: string }) => f.followingId);
  const feed = followingIds.length
    ? await prisma.activityEvent.findMany({
        where: { userId: { in: followingIds } },
        orderBy: { createdAt: 'desc' },
        take: 12,
        include: { user: { select: { username: true, displayName: true, avatarUrl: true } } },
      })
    : [];

  const stats = [
    { label: 'Times criados', value: user?.teamsCount ?? 0, icon: Swords },
    { label: 'Curtidas recebidas', value: user?.likesReceived ?? 0, icon: Heart },
    { label: 'Downloads recebidos', value: user?.downloadsCount ?? 0, icon: Download },
    { label: 'Seguidores', value: user?.followersCount ?? 0, icon: Users },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-ink-primary">
          Bem-vindo, {user?.displayName ?? user?.username}
        </h1>
        <p className="text-sm text-ink-muted">Aqui esta o resumo da sua conta no Trainerly.</p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((stat) => (
          <GlassCard key={stat.label} padding="md">
            <stat.icon className="mb-3 h-[18px] w-[18px] text-purple-neon" strokeWidth={1.75} />
            <p className="font-mono text-2xl font-semibold text-ink-primary">
              {formatCount(stat.value)}
            </p>
            <p className="text-xs text-ink-muted">{stat.label}</p>
          </GlassCard>
        ))}
      </div>

      {pendingRequests.length > 0 && (
        <GlassCard padding="lg">
          <h2 className="mb-3 font-display text-sm font-semibold text-ink-primary">
            Solicitações de amizade ({pendingRequests.length})
          </h2>
          <div className="flex flex-col gap-2">
            {pendingRequests.map((req: (typeof pendingRequests)[number]) => (
              <div key={req.id} className="flex items-center gap-3 rounded-lg bg-white/5 px-3 py-2">
                <Avatar src={req.requester.avatarUrl} name={req.requester.displayName ?? req.requester.username} size={28} />
                <span className="flex-1 text-sm text-ink-primary">@{req.requester.username}</span>
                <form action={respondFriendRequest.bind(null, req.id, true)}>
                  <Button type="submit" size="sm" variant="secondary">
                    <Check className="h-3.5 w-3.5" />
                  </Button>
                </form>
                <form action={respondFriendRequest.bind(null, req.id, false)}>
                  <Button type="submit" size="sm" variant="ghost">
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </form>
              </div>
            ))}
          </div>
        </GlassCard>
      )}

      <GlassCard padding="lg">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-base font-semibold text-ink-primary">
            Seus times recentes
          </h2>
          <Link href="/team-builder/new">
            <Button size="sm">
              <Plus className="h-3.5 w-3.5" />
              Novo time
            </Button>
          </Link>
        </div>

        {recentTeams.length === 0 ? (
          <EmptyState
            title="Nenhum time ainda"
            description="Crie seu primeiro time no Team Builder — espécie, EVs/IVs, Tera Type, golpes filtrados pelo learnset real."
            action={
              <Link href="/team-builder/new">
                <Button variant="secondary" size="sm">
                  Criar o primeiro time
                </Button>
              </Link>
            }
          />
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {recentTeams.map((team: (typeof recentTeams)[number]) => (
              <Link key={team.id} href={`/team-builder/${team.id}`}>
                <GlassCard padding="sm" hover>
                  <p className="mb-2 truncate text-xs font-medium text-ink-primary">{team.name}</p>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: 6 }).map((_, i) => {
                      const slot = team.slots.find((s: (typeof team.slots)[number]) => s.position === i + 1);
                      return (
                        <div key={i} className="flex h-7 w-7 items-center justify-center rounded-md border border-white/10 bg-white/5">
                          {slot && (
                            <Image src={slot.species.spriteUrl ?? ''} alt={slot.species.name} width={20} height={20} unoptimized />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </GlassCard>
              </Link>
            ))}
          </div>
        )}
      </GlassCard>

      <GlassCard padding="lg">
        <div className="mb-4 flex items-center gap-2">
          <Activity className="h-4 w-4 text-purple-neon" />
          <h2 className="font-display text-sm font-semibold text-ink-primary">Atividade de quem você segue</h2>
        </div>
        {feed.length === 0 ? (
          <p className="text-sm text-ink-dim">
            {followingIds.length === 0
              ? 'Você ainda não segue ninguém — visite um perfil e clique em "Seguir".'
              : 'Nenhuma atividade recente.'}
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            {feed.map((event: (typeof feed)[number]) => {
              const payload = event.payload as Record<string, unknown>;
              const label = ACTIVITY_LABELS[event.type]?.(payload) ?? event.type;
              const link = activityLink(event.type, payload);
              const content = (
                <>
                  <Avatar src={event.user.avatarUrl} name={event.user.displayName ?? event.user.username} size={28} />
                  <p className="text-sm text-ink-muted">
                    <span className="text-ink-primary">@{event.user.username}</span> {label}
                  </p>
                </>
              );
              return link ? (
                <Link key={event.id} href={link} className="flex items-center gap-3 rounded-lg px-1 py-1 hover:bg-white/5">
                  {content}
                </Link>
              ) : (
                <div key={event.id} className="flex items-center gap-3 px-1 py-1">
                  {content}
                </div>
              );
            })}
          </div>
        )}
      </GlassCard>
    </div>
  );
}
