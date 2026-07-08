import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getAllSpeciesOptions } from '@/lib/team-builder/queries';
import { ProfileForm } from './profile-form';

export default async function SettingsPage() {
  const session = await auth();
  const user = await prisma.user.findUnique({
    where: { id: session!.user.id },
    include: { favoritePokemon: true },
  });
  const speciesOptions = await getAllSpeciesOptions();

  const options = speciesOptions.map((s: (typeof speciesOptions)[number]) => ({
    value: s.name,
    icon: { iconSheetUrl: s.iconSheetUrl, iconTop: s.iconTop, iconLeft: s.iconLeft },
  }));

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-display text-2xl font-semibold text-ink-primary">Configurações do perfil</h1>
      <ProfileForm
        username={user!.username}
        displayName={user?.displayName ?? user!.username}
        bio={user?.bio ?? ''}
        bannerUrl={user?.bannerUrl ?? ''}
        profileThemeColor={user?.profileThemeColor ?? '#8B5CF6'}
        favoritePokemonName={user?.favoritePokemon?.name ?? ''}
        gamesPlayed={(user?.gamesPlayed as string[]) ?? []}
        speciesOptions={options}
      />
    </div>
  );
}
