import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, Heart, MessageCircle } from 'lucide-react';
import { auth } from '@/lib/auth';
import { getPublicTeamDetail, hasUserLiked } from '@/lib/library/queries';
import { buildExportTeamText, type ExportableSlot } from '@/lib/team-builder/showdown-format';
import { GlassCard } from '@/components/ui/glass-card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar } from '@/components/ui/avatar';
import { toggleLike, postComment } from '../actions';
import { CopyExportButton } from './copy-export-button';

interface LibraryDetailPageProps {
  params: Promise<{ teamId: string }>;
}

export default async function LibraryDetailPage({ params }: LibraryDetailPageProps) {
  const { teamId } = await params;
  const session = await auth();
  const team = await getPublicTeamDetail(teamId);

  if (!team) notFound();
  if (!team.isPublic && team.ownerId !== session!.user.id) redirect('/library');

  const liked = await hasUserLiked(session!.user.id, teamId);

  const exportableSlots: ExportableSlot[] = team.slots.map((slot: (typeof team.slots)[number]) => ({
    speciesName: slot.species.name,
    nickname: slot.nickname,
    gender: slot.gender,
    itemName: slot.item?.name ?? null,
    abilityName: slot.ability?.name ?? null,
    teraType: slot.teraType,
    nature: slot.natureName,
    level: slot.level,
    shiny: slot.shiny,
    evs: { hp: slot.evHp, atk: slot.evAtk, def: slot.evDef, spa: slot.evSpa, spd: slot.evSpd, spe: slot.evSpe },
    ivs: { hp: slot.ivHp, atk: slot.ivAtk, def: slot.ivDef, spa: slot.ivSpa, spd: slot.ivSpd, spe: slot.ivSpe },
    moveNames: slot.moves.map((m: (typeof slot.moves)[number]) => m.move.name),
  }));
  const exportText = buildExportTeamText(exportableSlots);

  return (
    <div className="flex flex-col gap-6">
      <Link href="/library" className="inline-flex items-center gap-1.5 text-sm text-ink-muted hover:text-ink-primary">
        <ArrowLeft className="h-3.5 w-3.5" />
        Voltar à biblioteca
      </Link>

      <GlassCard padding="lg">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="mb-1 flex items-center gap-2">
              <h1 className="font-display text-2xl font-semibold text-ink-primary">{team.name}</h1>
              <Badge tone="purple">Gen {team.generation}</Badge>
              <Badge tone="neutral">{team.battleFormat}</Badge>
              {team.format && <Badge tone="neutral">{team.format.name}</Badge>}
            </div>
            <Link href={`/profile/${team.owner.username}`} className="flex items-center gap-2 text-sm text-ink-muted hover:text-ink-primary">
              <Avatar src={team.owner.avatarUrl} name={team.owner.displayName ?? team.owner.username} size={20} />
              @{team.owner.username}
            </Link>
            {team.description && <p className="mt-2 max-w-xl text-sm text-ink-muted">{team.description}</p>}
          </div>

          <div className="flex gap-2">
            <form action={toggleLike.bind(null, team.id)}>
              <Button type="submit" variant={liked ? 'primary' : 'secondary'} size="sm">
                <Heart className="h-3.5 w-3.5" />
                {team.likesCount}
              </Button>
            </form>
            <CopyExportButton teamId={team.id} exportText={exportText} downloadsCount={team.downloadsCount} />
          </div>
        </div>
      </GlassCard>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        {team.slots.map((slot: (typeof team.slots)[number]) => (
          <GlassCard key={slot.id} padding="sm" className="flex flex-col items-center gap-2 text-center">
            <Image src={slot.species.spriteAnimatedUrl ?? ''} alt={slot.species.name} width={56} height={56} unoptimized />
            <p className="text-xs font-medium text-ink-primary">{slot.nickname || slot.species.name}</p>
            {slot.item && <p className="text-[10px] text-ink-dim">@ {slot.item.name}</p>}
            <div className="flex flex-wrap justify-center gap-1">
              {slot.moves.map((m: (typeof slot.moves)[number]) => (
                <span key={m.id} className="rounded-pill bg-white/5 px-1.5 py-0.5 text-[10px] text-ink-muted">
                  {m.move.name}
                </span>
              ))}
            </div>
          </GlassCard>
        ))}
      </div>

      <GlassCard padding="lg">
        <div className="mb-4 flex items-center gap-2">
          <MessageCircle className="h-4 w-4 text-purple-neon" />
          <h2 className="font-display text-sm font-semibold text-ink-primary">
            Comentários ({team.comments.length})
          </h2>
        </div>

        <form action={postComment.bind(null, team.id)} className="mb-5 flex flex-col gap-2">
          <textarea
            name="content"
            rows={2}
            maxLength={1000}
            placeholder="Deixe um comentário sobre este time..."
            required
            className="w-full rounded-xl border border-white/10 bg-void-surface/80 px-3.5 py-2.5 text-sm text-ink-primary placeholder:text-ink-dim outline-none focus:border-purple-neon/50 focus:ring-2 focus:ring-purple-neon/20"
          />
          <Button type="submit" size="sm" className="w-fit">
            Comentar
          </Button>
        </form>

        <div className="flex flex-col gap-4">
          {team.comments.length === 0 && <p className="text-sm text-ink-dim">Nenhum comentário ainda.</p>}
          {team.comments.map((comment: (typeof team.comments)[number]) => (
            <div key={comment.id} className="flex gap-3">
              <Avatar
                src={comment.author.avatarUrl}
                name={comment.author.displayName ?? comment.author.username}
                size={28}
              />
              <div>
                <p className="text-xs text-ink-muted">
                  @{comment.author.username} · {new Date(comment.createdAt).toLocaleDateString('pt-BR')}
                </p>
                <p className="text-sm text-ink-primary">{comment.content}</p>
              </div>
            </div>
          ))}
        </div>
      </GlassCard>
    </div>
  );
}
