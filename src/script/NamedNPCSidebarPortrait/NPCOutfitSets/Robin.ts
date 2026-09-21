// ./src/script/NamedNPCSidebarPortrait/NPCOutfitSets/Robin.ts

import type { MaplebirchCore } from '@scml-dol-maplebirch/types';
import { Clothing } from '../Clothing';
import { schoolUniformKeys } from '../Common/SchoolUniform';
import inject from './Inject';
import { addSet, sync } from './Clothes';

const wardrobeKeys = [
  ...schoolUniformKeys,
  'tshirt_shorts',
  'summer_sundress',
  'puffer_slacks',
  'hoodie_legwarmers',
  'sweater_sweatpants_sport',
  'leather_jacket_jeans',
  'school_swim_shorts',
  'school_swimsuit',
  'diving_suit',
  'pyjama',
  'towel_wrap',
  'witch',
  'classy_vampire_formal',
  'ghost_sheet',
  'kimono',
  'tuxedo_formal',
  'gothic_rose_gown',
  'christmas',
  'christmas_dress',
  'jingle_bell_christmas_dress',
  'gift_wrap',
  'rags'
] as const;

export default function (maplebirch: MaplebirchCore): void {
  maplebirch.tool.onInit(() => {
    const wardrobe = maplebirch.npc.Clothes.wardrobe;
    const outfitNames: string[] = [];
    for (const key of wardrobeKeys) {
      const template = wardrobe.get(key);
      if (template) addSet(maplebirch, outfitNames, `robin_${key}`, template);
    }

    const schoolUniform = wardrobe.get('school_uniform_skirt');
    if (schoolUniform?.upper) {
      for (const lower of [Clothing.long_school_skirt, Clothing.short_school_skirt]) {
        const name = `robin_school_uniform_${lower.name === 'long school skirt' ? 'long' : 'short'}_skirt`;
        addSet(maplebirch, outfitNames, name, { upper: schoolUniform.upper, lower }, { type: 'school', gender: 'f' });
      }
    }

    wardrobe.modify('Robin', (clothes, context) => sync('Robin', context.key === 'naked' ? 'naked' : `robin_${context.key}`, clothes));

    maplebirch.on(
      ':npcInject',
      (npcName: string, npcno: number) => {
        if (npcName !== 'Robin') return;
        const npc = C.npc?.Robin;
        if (!npc) return;
        npc.outfits = ['naked', ...outfitNames];
        wardrobe.worn('Robin');
        inject(npcName, npcno, npc.clothes, npc);
      },
      'Robin outfit sets'
    );
  });
}
