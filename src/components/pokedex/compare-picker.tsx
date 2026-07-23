'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Combobox, type ComboboxOption } from '@/components/team-builder/combobox';

export function ComparePicker({ slot, options, defaultValue }: { slot: 'a' | 'b'; options: ComboboxOption[]; defaultValue: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  return (
    <Combobox
      options={options}
      defaultValue={defaultValue}
      placeholder={`Escolher Pokémon ${slot.toUpperCase()}...`}
      onValueChange={(value) => {
        const params = new URLSearchParams(searchParams.toString());
        if (value) params.set(slot, value);
        else params.delete(slot);
        router.push(`/pokedex/compare?${params.toString()}`);
      }}
    />
  );
}
