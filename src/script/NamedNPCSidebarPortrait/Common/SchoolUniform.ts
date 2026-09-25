// ./src/script/NamedNPCSidebarPortrait/Common/SchoolUniform.ts

import type { MaplebirchCore } from '@scml-dol-maplebirch/types';
import type NPCSidebarPortrait from '../../../module/NPCSidebarPortrait';
import { preferColours } from './Preference';

// prettier-ignore
const femaleSchool = [
  ['school_uniform_skirt'          , 5],
  ['school_uniform_female'         , 5],
  ['preppy_skirt_uniform'          , 3],
  ['serafuku_dress'                , 1],
  ['classic_serafuku_short_skirt'  , 1],
  ['cardigan_sailor_uniform'       , 1]
] as const;

// prettier-ignore
const maleSchool = [
  ['school_uniform_trousers', 5],
  ['school_uniform_male'    , 5],
  ['preppy_shorts_uniform'  , 2],
  ['gakuran_uniform'        , 2]
] as const;

export const schoolUniformKeys = [...femaleSchool.map(([key]) => key), ...maleSchool.map(([key]) => key)] as const;

// prettier-ignore
const accessoryWeights: Readonly<Record<string, Readonly<Record<string, number>>>> = {
  school_uniform_female            : {},
  school_uniform_male              : {},
  preppy_shorts_uniform            : { 'navy blue' : 6, black       : 4, white: 3, teal  : 2, wine       : 2, brown : 1, olive      : 1, purple: 1, red: 1 },
  preppy_skirt_uniform             : {  pink       : 6, 'light pink': 5, lilac: 4, purple: 3, white      : 3, wine  : 2, 'navy blue': 2, teal  : 2, red: 1 },
  serafuku_dress                   : {  pink       : 5, 'navy blue' : 4, blue : 3, white : 3, purple     : 2, teal  : 2, black      : 1, grey  : 1, red: 1 },
  classic_serafuku_short_skirt     : {  pink       : 5, blue        : 4, white: 3, purple: 2, teal       : 2, black : 1, green      : 1, red   : 1 },
  cardigan_sailor_uniform          : { 'light pink': 6, pink        : 4, lilac: 3, white : 3, 'navy blue': 2, purple: 2, wine       : 1, teal  : 1 }
};

// prettier-ignore
const skirtColours = {
  Kylar  : 'white',
  Robin  : 'black',
  Sydney : 'red',
  Whitney: 'teal'
} as const;

interface SchoolColours {
  school: Map<string, string>;
  schoolOutfit: Map<string, string>;
}

export default function (maplebirch: MaplebirchCore, sidebar: NPCSidebarPortrait, npcName: 'Kylar' | 'Robin' | 'Sydney' | 'Whitney', locations: string | string[], colours: SchoolColours): void {
  const wardrobe = maplebirch.npc.Clothes.wardrobe;

  for (const [key] of femaleSchool) {
    wardrobe.wear(npcName, locations, key, () => {
      if (C.npc?.[npcName]?.pronoun === 'm') return false;
      if (!colours.schoolOutfit.has('female')) {
        colours.schoolOutfit.set('female', femaleSchool.map(([name]) => name).either(femaleSchool.map(([, weight]) => weight)) ?? femaleSchool[0][0]);
      }
      return colours.schoolOutfit.get('female') === key;
    });
  }

  for (const [key] of maleSchool) {
    wardrobe.wear(npcName, locations, key, () => {
      if (C.npc?.[npcName]?.pronoun !== 'm') return false;
      if (!colours.schoolOutfit.has('male')) {
        colours.schoolOutfit.set('male', maleSchool.map(([name]) => name).either(maleSchool.map(([, weight]) => weight)) ?? maleSchool[0][0]);
      }
      return colours.schoolOutfit.get('male') === key;
    });
  }

  wardrobe.modify(npcName, (clothes, context) => {
    if (context.key === 'school_uniform_female' && clothes.lower) clothes.lower.colour = skirtColours[npcName];
    if (context.key === 'school_uniform_male' && clothes.lower) clothes.lower.colour = 'black';

    const weights = accessoryWeights[context.key];
    if (!weights) return;
    const slots: Array<keyof typeof clothes> = context.key === 'school_uniform_female' || context.key === 'school_uniform_male' ? ['upper'] : ['upper', 'lower'];
    const items = slots.map(slot => ({ slot, item: clothes[slot] })).filter(entry => entry.item?.index);
    const optionSets = items
      .map(({ slot, item }) => (item?.index === undefined ? undefined : (setup.clothes[slot]?.[item.index]?.accessory_colour_options as string[] | undefined)))
      .filter((options): options is string[] => Array.isArray(options) && options.length > 0);
    if (!optionSets.length || optionSets.length !== items.length) return;
    const options = optionSets[0].filter(colour => optionSets.every(set => set.includes(colour)));
    if (!options.length) return;
    let colour = colours.school.get(context.key);
    if (!colour || !options.includes(colour)) {
      colour = sidebar.randomColour(options, preferColours(npcName, weights, C.npc?.[npcName]?.pronoun !== 'm'));
      colours.school.set(context.key, colour);
    }
    for (const { item } of items) if (item) item.accessory_colour = colour;
  });
}
