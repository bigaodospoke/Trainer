'use client';

import { useActionState } from 'react';
import { GlassCard } from '@/components/ui/glass-card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Combobox } from '@/components/team-builder/combobox';
import { PokemonIcon } from '@/components/team-builder/sprite-icon';
import { updateFullProfile, type ProfileResult } from './profile-actions';

const POKEMON_GAMES = [
  { id: 'RBY', label: 'Red / Blue / Yellow' },
  { id: 'GSC', label: 'Gold / Silver / Crystal' },
  { id: 'RSE', label: 'Ruby / Sapphire / Emerald' },
  { id: 'FRLG', label: 'FireRed / LeafGreen' },
  { id: 'DPPt', label: 'Diamond / Pearl / Platinum' },
  { id: 'HGSS', label: 'HeartGold / SoulSilver' },
  { id: 'BW', label: 'Black / White' },
  { id: 'BW2', label: 'Black 2 / White 2' },
  { id: 'XY', label: 'X / Y' },
  { id: 'ORAS', label: 'Omega Ruby / Alpha Sapphire' },
  { id: 'SM', label: 'Sun / Moon' },
  { id: 'USUM', label: 'Ultra Sun / Ultra Moon' },
  { id: 'SwSh', label: 'Sword / Shield' },
  { id: 'BDSP', label: 'Brilliant Diamond / Shining Pearl' },
  { id: 'LA', label: 'Legends: Arceus' },
  { id: 'SV', label: 'Scarlet / Violet' },
];

interface ProfileFormProps {
  username: string;
  displayName: string;
  bio: string;
  bannerUrl: string;
  profileThemeColor: string;
  favoritePokemonName: string;
  gamesPlayed: string[];
  speciesOptions: { value: string; icon: { iconSheetUrl: string | null; iconTop: number | null; iconLeft: number | null } }[];
}

export function ProfileForm(props: ProfileFormProps) {
  const [result, formAction, isPending] = useActionState<ProfileResult | null, FormData>(
    updateFullProfile,
    null
  );

  return (
    <GlassCard padding="lg" className="max-w-2xl">
      <form action={formAction} className="flex flex-col gap-6">
        {/* Identidade */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-ink-dim">Nome de exibição</label>
            <Input name="displayName" defaultValue={props.displayName} maxLength={32} required />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-ink-dim">Cor do tema (hex)</label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                name="profileThemeColor"
                defaultValue={props.profileThemeColor || '#8B5CF6'}
                className="h-10 w-12 cursor-pointer rounded-xl border border-white/10 bg-transparent p-1"
              />
              <Input
                name="profileThemeColorText"
                defaultValue={props.profileThemeColor || '#8B5CF6'}
                placeholder="#8B5CF6"
                maxLength={7}
                className="flex-1"
                readOnly
              />
            </div>
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-ink-dim">Biografia</label>
          <textarea
            name="bio"
            defaultValue={props.bio}
            maxLength={280}
            rows={3}
            className="w-full rounded-xl border border-white/10 bg-void-surface/80 px-3.5 py-2.5 text-sm text-ink-primary placeholder:text-ink-dim outline-none focus:border-purple-neon/50 focus:ring-2 focus:ring-purple-neon/20"
            placeholder="Conta um pouco sobre seu estilo de jogo..."
          />
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-ink-dim">URL do banner</label>
          <Input name="bannerUrl" defaultValue={props.bannerUrl} placeholder="https://... (imagem de capa do perfil)" />
        </div>

        {/* Pokémon favorito */}
        <div>
          <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-ink-dim">Pokémon favorito</label>
          <Combobox
            name="favoritePokemonName"
            options={props.speciesOptions}
            defaultValue={props.favoritePokemonName}
            placeholder="ex.: Landorus-Therian"
            allowEmpty
            
          />
          <p className="mt-1 text-xs text-ink-dim">Aparece em destaque no seu perfil público.</p>
        </div>

        {/* Jogos */}
        <div>
          <label className="mb-2 block text-xs font-medium uppercase tracking-wide text-ink-dim">Jogos que joguei</label>
          <input type="hidden" name="gamesPlayed" id="gamesPlayedHidden" defaultValue={props.gamesPlayed.join(',')} />
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {POKEMON_GAMES.map((game) => (
              <label key={game.id} className="flex cursor-pointer items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-ink-muted hover:bg-white/10">
                <input
                  type="checkbox"
                  defaultChecked={props.gamesPlayed.includes(game.id)}
                  onChange={(e) => {
                    const hidden = document.getElementById('gamesPlayedHidden') as HTMLInputElement;
                    const current = hidden.value ? hidden.value.split(',').filter(Boolean) : [];
                    if (e.target.checked) {
                      hidden.value = [...new Set([...current, game.id])].join(',');
                    } else {
                      hidden.value = current.filter((g: string) => g !== game.id).join(',');
                    }
                  }}
                  className="h-3.5 w-3.5 accent-purple-core"
                />
                {game.label}
              </label>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button type="submit" disabled={isPending}>
            {isPending ? 'Salvando...' : 'Salvar perfil'}
          </Button>
          {result?.ok === true && <span className="text-sm text-success">Salvo com sucesso!</span>}
          {result?.ok === false && <span className="text-sm text-danger">{result.error}</span>}
        </div>
      </form>
    </GlassCard>
  );
}
