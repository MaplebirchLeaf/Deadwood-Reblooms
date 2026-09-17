// ./src/script/NamedNPCSidebarPortrait/Common/Preference.ts

export type PaletteNPC = 'Kylar' | 'Robin' | 'Whitney' | 'Sydney';

// prettier-ignore
const preferences: Readonly<Record<PaletteNPC, Readonly<Record<string, number>>>> = {
  Kylar  : { green: 12 , 'light green' : 10, 'dark green': 8, olive       : 6, lime: 5 },
  Robin  : { 'light blue': 12, blue    : 10, 'navy blue' : 9, 'blue steel': 8, teal: 6 },
  Whitney: { yellow: 12, 'light yellow': 10, gold        : 8, orange      : 5 },
  Sydney : { orange: 12, tangerine     : 10, peach       : 8, tan         : 6, gold: 5 }
};

export function preferColours(npcName: PaletteNPC, weights: Readonly<Record<string, number>> = {}, femaleWhite = false): Record<string, number> {
  const result = { ...weights };
  for (const [colour, weight] of Object.entries(preferences[npcName])) result[colour] = Math.max(result[colour] ?? 0, weight);
  if (femaleWhite) result.white = Math.max(result.white ?? 0, 11);
  return result;
}
