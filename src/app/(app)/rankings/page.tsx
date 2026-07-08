import Link from 'next/link';
import Image from 'next/image';
import { Trophy, Heart, Users, Download } from 'lucide-react';
import { prisma } from '@/lib/prisma';
import { GlassCard } from '@/components/ui/glass-card';
import { Avatar } from '@/components/ui/avatar';
import { formatCount } from '@/lib/utils';

export default async function RankingsPage() {
  const [popularUsers, mostFollowed, mostLikedTeams, mostDownloadedTeams] = await Promise.all([
    prisma.user.findMany({ orderBy: { likesReceived: 'desc' }, take: 10, where: { likesReceived: { gt: 0 } } }),
    prisma.user.findMany({ orderBy: { followersCount: 'desc' }, take: 10, where: { followersCount: { gt: 0 } } }),
    prisma.team.findMany({
      where: { isPublic: true, likesCount: { gt: 0 } },
      orderBy: { likesCount: 'desc' },
      take: 10,
      include: { owner: { select: { username: true } }, slots: { include: { species: true }, take: 1, orderBy: { position: 'asc' } } },
    }),
    prisma.team.findMany({
      where: { isPublic: true, downloadsCount: { gt: 0 } },
      orderBy: { downloadsCount: 'desc' },
      take: 10,
      include: { owner: { select: { username: true } }, slots: { include: { species: true }, take: 1, orderBy: { position: 'asc' } } },
    }),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <Trophy className="h-6 w-6 text-purple-neon" strokeWidth={1.75} />
        <h1 className="font-display text-2xl font-semibold text-ink-primary">Rankings</h1>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <RankCard title="Usuários mais populares" icon={Heart}>
          {popularUsers.map((u: (typeof popularUsers)[number], i: number) => (
            <UserRow key={u.id} rank={i + 1} user={u} metric={`${formatCount(u.likesReceived)} curtidas`} />
          ))}
        </RankCard>

        <RankCard title="Criadores mais seguidos" icon={Users}>
          {mostFollowed.map((u: (typeof mostFollowed)[number], i: number) => (
            <UserRow key={u.id} rank={i + 1} user={u} metric={`${formatCount(u.followersCount)} seguidores`} />
          ))}
        </RankCard>

        <RankCard title="Times mais curtidos" icon={Heart}>
          {mostLikedTeams.map((t: (typeof mostLikedTeams)[number], i: number) => (
            <TeamRow key={t.id} rank={i + 1} team={t} metric={`${formatCount(t.likesCount)} curtidas`} />
          ))}
        </RankCard>

        <RankCard title="Times mais utilizados" icon={Download}>
          {mostDownloadedTeams.map((t: (typeof mostDownloadedTeams)[number], i: number) => (
            <TeamRow key={t.id} rank={i + 1} team={t} metric={`${formatCount(t.downloadsCount)} downloads`} />
          ))}
        </RankCard>
      </div>
    </div>
  );
}

function RankCard({ title, icon: Icon, children }: { title: string; icon: typeof Heart; children: React.ReactNode }) {
  return (
    <GlassCard padding="lg">
      <div className="mb-4 flex items-center gap-2">
        <Icon className="h-4 w-4 text-purple-neon" strokeWidth={1.75} />
        <h2 className="font-display text-sm font-semibold text-ink-primary">{title}</h2>
      </div>
      <div className="flex flex-col gap-1">{children}</div>
    </GlassCard>
  );
}

function UserRow({
  rank,
  user,
  metric,
}: {
  rank: number;
  user: { username: string; displayName: string | null; avatarUrl: string | null };
  metric: string;
}) {
  return (
    <Link href={`/profile/${user.username}`} className="flex items-center gap-3 rounded-lg px-2 py-1.5 hover:bg-white/5">
      <span className="w-5 text-right font-mono text-xs text-ink-dim">{rank}</span>
      <Avatar src={user.avatarUrl} name={user.displayName ?? user.username} size={28} />
      <span className="flex-1 truncate text-sm text-ink-primary">@{user.username}</span>
      <span className="font-mono text-xs text-ink-muted">{metric}</span>
    </Link>
  );
}

function TeamRow({
  rank,
  team,
  metric,
}: {
  rank: number;
  team: { id: string; name: string; owner: { username: string }; slots: { species: { spriteUrl: string | null; name: string } }[] };
  metric: string;
}) {
  const lead = team.slots[0]?.species;
  return (
    <Link href={`/library/${team.id}`} className="flex items-center gap-3 rounded-lg px-2 py-1.5 hover:bg-white/5">
      <span className="w-5 text-right font-mono text-xs text-ink-dim">{rank}</span>
      <div className="flex h-7 w-7 items-center justify-center rounded-md border border-white/10 bg-white/5">
        {lead && <Image src={lead.spriteUrl ?? ''} alt={lead.name} width={20} height={20} unoptimized />}
      </div>
      <div className="flex-1 truncate">
        <p className="truncate text-sm text-ink-primary">{team.name}</p>
        <p className="truncate text-[10px] text-ink-dim">@{team.owner.username}</p>
      </div>
      <span className="font-mono text-xs text-ink-muted">{metric}</span>
    </Link>
  );
}
