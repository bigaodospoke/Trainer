import { natureMultiplier, type StatKey } from './natures';

export interface BaseStats {
  hp: number; atk: number; def: number; spa: number; spd: number; spe: number;
}
export interface StatSpread {
  hp: number; atk: number; def: number; spa: number; spd: number; spe: number;
}

/** Formula oficial de stats (mesma usada pelos jogos principais desde Gen 3). */
export function calculateStat(
  stat: StatKey,
  base: number,
  iv: number,
  ev: number,
  level: number,
  nature: string
): number {
  const core = Math.floor(((2 * base + iv + Math.floor(ev / 4)) * level) / 100);
  if (stat === 'hp') {
    if (base === 1) return 1; // Shedinja
    return core + level + 10;
  }
  return Math.floor((core + 5) * natureMultiplier(nature, stat));
}

export function calculateAllStats(
  base: BaseStats,
  ivs: StatSpread,
  evs: StatSpread,
  level: number,
  nature: string
): StatSpread {
  return {
    hp: calculateStat('hp', base.hp, ivs.hp, evs.hp, level, nature),
    atk: calculateStat('atk', base.atk, ivs.atk, evs.atk, level, nature),
    def: calculateStat('def', base.def, ivs.def, evs.def, level, nature),
    spa: calculateStat('spa', base.spa, ivs.spa, evs.spa, level, nature),
    spd: calculateStat('spd', base.spd, ivs.spd, evs.spd, level, nature),
    spe: calculateStat('spe', base.spe, ivs.spe, evs.spe, level, nature),
  };
}
