// ./src/script/NamedNPCSidebarPortrait/NPCOutfitSets/Sydney.ts

import type { MaplebirchCore } from '@scml-dol-maplebirch/types';
import { Clothing } from '../Clothing';
import { schoolUniformKeys } from '../Common/SchoolUniform';
import inject from './Inject';
import { addSet, sync } from './Clothes';

const wardrobeKeys = [
  ...schoolUniformKeys,
  'nun_habit',
  'monk_habit',
  'novice_nun_habit',
  'initiate_robes',
  'sexy_nun_habit',
  'avowed_nun_habit',
  'waist_apron',
  'english_play_sterling',
  'english_play_cass',
  'cow_onesie',
  'babydoll_lingerie',
  'school_swim_shorts',
  'school_swimsuit',
  'beach_shorts',
  'bikini',
  'speedo',
  'microkini'
] as const;

export default function (maplebirch: MaplebirchCore): void {
  maplebirch.tool.onInit(() => {
    const wardrobe = maplebirch.npc.Clothes.wardrobe;
    const outfitNames: string[] = [];
    for (const key of wardrobeKeys) {
      const template = wardrobe.get(key);
      if (template)
        addSet(maplebirch, outfitNames, `sydney_${key}`, template, {
          type: ['nun_habit', 'monk_habit', 'novice_nun_habit', 'initiate_robes', 'sexy_nun_habit', 'avowed_nun_habit'].includes(key) ? 'temple' : undefined
        });
    }

    const schoolUniform = wardrobe.get('school_uniform_skirt');
    if (schoolUniform?.upper) {
      for (const lower of [Clothing.long_school_skirt, Clothing.short_school_skirt]) {
        const name = `sydney_school_uniform_${lower.name === 'long school skirt' ? 'long' : 'short'}_skirt`;
        addSet(maplebirch, outfitNames, name, { upper: schoolUniform.upper, lower }, { type: 'school', gender: 'f' });
      }
    }

    wardrobe.modify('Sydney', (clothes, context) => sync('Sydney', context.key === 'naked' ? 'naked' : `sydney_${context.key}`, clothes));

    maplebirch.on(
      ':npcInject',
      (npcName: string, npcno: number) => {
        if (npcName !== 'Sydney') return;
        const npc = C.npc?.Sydney;
        if (!npc) return;
        npc.outfits = ['naked', ...outfitNames];
        wardrobe.worn('Sydney');
        inject(npcName, npcno, npc.clothes, npc);
      },
      'Sydney outfit sets'
    );
  });
}
