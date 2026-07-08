import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { UserPlus, UserCheck, Clock, Gamepad2, Trash2 } from 'lucide-react';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Avatar } from '@/components/ui/avatar';
import { GlassCard } from '@/components/ui/glass-card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { formatCount } from '@/lib/utils';
import { CopyLinkButton } from '@/components/profile/copy-link-button';
import { PostComposer } from '@/components/profile/post-composer';
import { toggleFollow, sendFriendRequest } from './actions';
import { deletePost } from './post-actions';

const GAME_LABELS: Record<string, string> = {
  RBY: 'Red/Blue/Yellow', GSC: 'Gold/Silver/Crystal', RSE: 'Ruby/Sapphire/Emerald',
  FRLG: 'FireRed/LeafGreen', DPPt: 'Diamond/Pearl/Platinum', HGSS: 'HeartGold/SoulSilver',
  BW: 'Black/White', BW2: 'Black 2/White 2', XY: 'X/Y', ORAS: 'ORAS',
  SM: 'Sun/Moon', USUM: 'Ultra Sun/Moon', SwSh: 'Sword/Shield',
  BDSP: 'BD/SP', LA: 'Legends: Arceus', SV: 'Scarlet/Violet',
};

interface ProfilePageProps {
  params: Promise<{ username: string }>;
}

export default async function ProfilePage({ params }: ProfilePageProps) {
  const { username } = await params;
  const session = await auth();

  const user = await prisma.user.findUnique({
    where: { username },
    include: { favoritePokemon: true },
  });
  if (!user) notFound();

  const isOwnProfile = session?.user.username === username;

  const [isFollowing, friend, publicTeams, posts] = await Promise.all([
    isOwnProfile
      ? null
      : prisma.follow.findUnique({ where: { followerId_followingId: { followerId: session!.user.id, followingId: user.id } } }),
    isOwnProfile
      ? null
      : prisma.friend.findFirst({
          where: { OR: [{ requesterId: session!.user.id, addresseeId: user.id }, { requesterId: user.id, addresseeId: session!.user.id }] },
        }),
    prisma.team.findMany({
      where: { ownerId: user.id, isPublic: true },
      orderBy: { likesCount: 'desc' },
      take: 6,
      include: { slots: { include: { species: true }, orderBy: { position: 'asc' } } },
    }),
    prisma.userPost.findMany({
      where: { authorId: user.id, isHidden: false },
      orderBy: { createdAt: 'desc' },
      take: 20,
    }),
  ]);

  const gamesPlayed = (user.gamesPlayed as string[]) ?? [];
  const themeColor = user.profileThemeColor ?? '#8B5CF6';

  const stats = [
    { label: 'Times', value: user.teamsCount },
    { label: 'Curtidas', value: user.likesReceived },
    { label: 'Seguidores', value: user.followersCount },
    { label: 'Seguindo', value: user.followingCount },
  ];

  let friendLabel: string | null = null;
  if (friend) {
    friendLabel = friend.status === 'ACCEPTED' ? 'Amigos' :
      friend.requesterId === session!.user.id ? 'Solicitação enviada' : 'Responder no painel';
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Banner + header */}
      <div
        className="relative overflow-hidden rounded-card"
        style={{ background: `linear-gradient(135deg, ${themeColor}33, ${themeColor}11)`, border: `1px solid ${themeColor}44` }}
      >
        {user.bannerUrl && (
          <div className="absolute inset-0 opacity-20">
            <Image src={user.bannerUrl} alt="banner" fill className="object-cover" unoptimized />
          </div>
        )}

        <div className="relative flex flex-col items-center gap-4 px-6 py-8 sm:flex-row sm:items-end sm:gap-6">
          {/* Pokémon favorito em destaque */}
          {user.favoritePokemon && (
            <div className="absolute right-6 top-4 flex flex-col items-center gap-1 opacity-80">
              <Image
                src={user.favoritePokemon.spriteAnimatedUrl ?? user.favoritePokemon.spriteUrl ?? ''}
                alt={user.favoritePokemon.name}
                width={80}
                height={80}
                unoptimized
              />
              <span className="text-[10px] text-ink-dim">{user.favoritePokemon.name}</span>
            </div>
          )}

          <Avatar src={user.avatarUrl} name={user.displayName ?? user.username} size={72} />

          <div className="flex-1 text-center sm:text-left">
            <h1 className="font-display text-2xl font-semibold text-ink-primary">
              {user.displayName ?? user.username}
            </h1>
            <p className="text-sm text-ink-muted">@{user.username}</p>
            {user.bio && <p className="mt-1 max-w-md text-sm text-ink-muted">{user.bio}</p>}
          </div>

          <div className="flex flex-wrap gap-2">
            <CopyLinkButton username={user.username} />
            {isOwnProfile ? (
              <Link href="/settings"><Button size="sm" variant="secondary">Editar perfil</Button></Link>
            ) : (
              <>
                <form action={toggleFollow.bind(null, user.id, user.username)}>
                  <Button type="submit" variant={isFollowing ? 'primary' : 'secondary'} size="sm">
                    {isFollowing ? <UserCheck className="h-3.5 w-3.5" /> : <UserPlus className="h-3.5 w-3.5" />}
                    {isFollowing ? 'Seguindo' : 'Seguir'}
                  </Button>
                </form>
                {!friend ? (
                  <form action={sendFriendRequest.bind(null, user.id, user.username)}>
                    <Button type="submit" variant="ghost" size="sm">Adicionar amigo</Button>
                  </form>
                ) : (
                  <Button variant="ghost" size="sm" disabled>
                    <Clock className="h-3.5 w-3.5" />{friendLabel}
                  </Button>
                )}
              </>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="relative grid grid-cols-4 divide-x divide-white/5 border-t border-white/10 px-6 py-3">
          {stats.map((stat) => (
            <div key={stat.label} className="flex flex-col items-center">
              <p className="font-mono text-base font-semibold text-ink-primary">{formatCount(stat.value)}</p>
              <p className="text-[10px] text-ink-dim">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Jogos */}
      {gamesPlayed.length > 0 && (
        <GlassCard padding="md">
          <div className="mb-2 flex items-center gap-2">
            <Gamepad2 className="h-4 w-4 text-purple-neon" strokeWidth={1.75} />
            <h2 className="font-display text-sm font-semibold text-ink-primary">Jogos que joguei</h2>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {gamesPlayed.map((g: string) => (
              <Badge key={g} tone="neutral">{GAME_LABELS[g] ?? g}</Badge>
            ))}
          </div>
        </GlassCard>
      )}

      {/* Times publicados */}
      {publicTeams.length > 0 && (
        <GlassCard padding="lg">
          <h2 className="mb-4 font-display text-sm font-semibold text-ink-primary">Times publicados</h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {publicTeams.map((team: (typeof publicTeams)[number]) => (
              <Link key={team.id} href={`/library/${team.id}`}>
                <GlassCard padding="sm" hover>
                  <p className="mb-2 truncate text-xs font-medium text-ink-primary">{team.name}</p>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: 6 }).map((_, i) => {
                      const slot = team.slots.find((s: (typeof team.slots)[number]) => s.position === i + 1);
                      return (
                        <div key={i} className="flex h-7 w-7 items-center justify-center rounded-md border border-white/10 bg-white/5">
                          {slot && <Image src={slot.species.spriteUrl ?? ''} alt={slot.species.name} width={20} height={20} unoptimized />}
                        </div>
                      );
                    })}
                  </div>
                </GlassCard>
              </Link>
            ))}
          </div>
        </GlassCard>
      )}

      {/* Posts */}
      <GlassCard padding="lg">
        <h2 className="mb-4 font-display text-sm font-semibold text-ink-primary">Publicações</h2>

        {isOwnProfile && (
          <div className="mb-6 border-b border-white/5 pb-6">
            <PostComposer />
          </div>
        )}

        {posts.length === 0 ? (
          <EmptyState
            title="Nenhuma publicação ainda"
            description={isOwnProfile ? 'Compartilhe análises, sets, novidades ou qualquer coisa sobre Pokémon.' : 'Este usuário ainda não publicou nada.'}
          />
        ) : (
          <div className="flex flex-col gap-4">
            {posts.map((post: (typeof posts)[number]) => (
              <div key={post.id} className="flex flex-col gap-2 rounded-xl border border-white/10 bg-white/5 p-4">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm text-ink-primary whitespace-pre-wrap">{post.content}</p>
                  {isOwnProfile && (
                    <form action={deletePost.bind(null, post.id)}>
                      <Button type="submit" variant="ghost" size="sm">
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </form>
                  )}
                </div>
                {post.imageUrl && (
                  <Image
                    src={post.imageUrl}
                    alt="imagem do post"
                    width={600}
                    height={400}
                    className="max-h-80 rounded-lg object-cover"
                    unoptimized
                  />
                )}
                <p className="text-[10px] text-ink-dim">{new Date(post.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
              </div>
            ))}
          </div>
        )}
      </GlassCard>
    </div>
  );
}
