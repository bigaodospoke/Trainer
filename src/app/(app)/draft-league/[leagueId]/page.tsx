import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Shield, Swords } from 'lucide-react';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { GlassCard } from '@/components/ui/glass-card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PokemonIcon } from '@/components/team-builder/sprite-icon';
import { getAllSpeciesOptions } from '@/lib/team-builder/queries';
import { Combobox } from '@/components/team-builder/combobox';
import { addLeagueTeam, setLeagueStatus, makePick } from '../actions';

const STATUS_LABELS: Record<string, string> = {
  SETUP: 'Configurando',
  DRAFTING: 'Em draft',
  IN_SEASON: 'Em temporada',
  FINISHED: 'Finalizada',
};

interface Props { params: Promise<{ leagueId: string }>; }

export default async function LeaguePage({ params }: Props) {
  const { leagueId } = await params;
  const session = await auth();

  const league = await prisma.draftLeague.findUnique({
    where: { id: leagueId },
    include: {
      format: true,
      teams: {
        include: {
          owner: { select: { username: true, displayName: true } },
          picks: { include: { species: true }, orderBy: { pickNumber: 'asc' } },
        },
        orderBy: { name: 'asc' },
      },
    },
  });

  if (!league) notFound();

  const isParticipant = league.teams.some((t: (typeof league.teams)[number]) => t.ownerId === session!.user.id);
  const isOwner = league.ownerId === session!.user.id;
  if (!isParticipant && !isOwner) redirect('/draft-league');

  const myTeam = league.teams.find((t: (typeof league.teams)[number]) => t.ownerId === session!.user.id);
  const ruleset = league.ruleset as { rosterSize?: number } | null;
  const rosterSize = ruleset?.rosterSize ?? 11;
  const speciesOptions = league.status === 'DRAFTING' ? await getAllSpeciesOptions() : [];

  return (
    <div className="flex flex-col gap-6">
      <Link href="/draft-league" className="inline-flex items-center gap-1.5 text-sm text-ink-muted hover:text-ink-primary">
        <ArrowLeft className="h-3.5 w-3.5" /> Voltar às ligas
      </Link>

      <GlassCard padding="lg">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="mb-1 flex items-center gap-2">
              <h1 className="font-display text-2xl font-semibold text-ink-primary">{league.name}</h1>
              <Badge tone="purple">{STATUS_LABELS[league.status] ?? league.status}</Badge>
            </div>
            <p className="text-sm text-ink-dim">
              {league.format?.name} · {league.teams.length} participante(s) · Elenco: {rosterSize} Pokémon
            </p>
          </div>
          {isOwner && (
            <div className="flex gap-2">
              {league.status === 'SETUP' && (
                <form action={setLeagueStatus.bind(null, leagueId, 'DRAFTING')}>
                  <Button type="submit" size="sm">Iniciar draft</Button>
                </form>
              )}
              {league.status === 'DRAFTING' && (
                <form action={setLeagueStatus.bind(null, leagueId, 'IN_SEASON')}>
                  <Button type="submit" size="sm" variant="secondary">Encerrar draft</Button>
                </form>
              )}
              {league.status === 'IN_SEASON' && (
                <form action={setLeagueStatus.bind(null, leagueId, 'FINISHED')}>
                  <Button type="submit" size="sm" variant="danger">Finalizar temporada</Button>
                </form>
              )}
            </div>
          )}
        </div>
      </GlassCard>

      {isOwner && league.status === 'SETUP' && (
        <GlassCard padding="lg">
          <h2 className="mb-3 font-display text-sm font-semibold text-ink-primary">Adicionar participante</h2>
          <form action={addLeagueTeam.bind(null, leagueId)} className="flex flex-wrap gap-3">
            <Input name="username" placeholder="@username" className="w-48" required />
            <Input name="teamName" placeholder="Nome do time (opcional)" className="w-56" />
            <Button type="submit" size="sm" variant="secondary">Adicionar</Button>
          </form>
        </GlassCard>
      )}

      {league.status === 'DRAFTING' && myTeam && (
        <GlassCard padding="lg">
          <h2 className="mb-3 font-display text-sm font-semibold text-ink-primary">Fazer pick/ban</h2>
          <form action={makePick.bind(null, leagueId)} className="flex flex-wrap items-end gap-3">
            <input type="hidden" name="leagueTeamId" value={myTeam.id} />
            <div className="w-72">
              <Combobox
                name="species"
                options={speciesOptions.map((s: (typeof speciesOptions)[number]) => ({
                  value: s.name,
                  icon: { iconSheetUrl: s.iconSheetUrl, iconTop: s.iconTop, iconLeft: s.iconLeft },
                }))}
                placeholder="ex.: Landorus-Therian"
                required
                
              />
            </div>
            <Button type="submit" size="sm">
              <Swords className="h-3.5 w-3.5" /> Pick
            </Button>
            <Button type="submit" name="isBan" value="true" size="sm" variant="danger">
              <Shield className="h-3.5 w-3.5" /> Ban
            </Button>
          </form>
        </GlassCard>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {league.teams.map((team: (typeof league.teams)[number]) => {
          const roster = team.picks.filter((p: (typeof team.picks)[number]) => !p.isBan);
          const bans = team.picks.filter((p: (typeof team.picks)[number]) => p.isBan);
          return (
            <GlassCard key={team.id} padding="md">
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <p className="font-display text-sm font-semibold text-ink-primary">{team.name}</p>
                  <p className="text-xs text-ink-dim">@{team.owner.username} · {roster.length}/{rosterSize}</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {roster.map((pick: (typeof roster)[number]) => (
                  <PokemonIcon key={pick.id} icon={pick.species} alt={pick.species.name} />
                ))}
              </div>
              {bans.length > 0 && (
                <div className="mt-2">
                  <p className="mb-1 text-[10px] uppercase text-ink-dim">Bans</p>
                  <div className="flex flex-wrap gap-1.5 opacity-40">
                    {bans.map((pick: (typeof bans)[number]) => (
                      <PokemonIcon key={pick.id} icon={pick.species} alt={pick.species.name} />
                    ))}
                  </div>
                </div>
              )}
            </GlassCard>
          );
        })}
      </div>
    </div>
  );
}
