// ./src/script/NamedNPCSidebarPortrait/NPCOutfitSets/Kylar.ts

import type { MaplebirchCore } from '@scml-dol-maplebirch/types';
import { schoolUniformKeys } from '../Common/SchoolUniform';
import inject from './Inject';
import { addSet, sync } from './Clothes';

const wardrobeKeys = [
  ...schoolUniformKeys,
  'hoodie_legwarmers',
  'male_underwear',
  'female_underwear',
  'english_play_sterling',
  'english_play_taylor',
  'gothic_formal_suit',
  'gothic_rose_gown',
  'rose_wedding_suit',
  'rose_wedding_dress',
  'beach_shorts',
  'bikini',
  'christmas',
  'christmas_dress',
  'jingle_bell_christmas_dress',
  'mummy',
  'prison_jumpsuit'
] as const;

export default function (maplebirch: MaplebirchCore): void {
  maplebirch.tool.onInit(() => {
    const wardrobe = maplebirch.npc.Clothes.wardrobe;
    const outfitNames: string[] = [];
    for (const key of wardrobeKeys) {
      const template = wardrobe.get(key);
      if (template) addSet(maplebirch, outfitNames, `kylar_${key}`, template, { type: key === 'prison_jumpsuit' ? 'prison' : undefined });
    }

    wardrobe.modify('Kylar', (clothes, context) => sync('Kylar', context.key === 'naked' ? 'naked' : `kylar_${context.key}`, clothes));

    maplebirch.on(
      ':npcInject',
      (npcName: string, npcno: number) => {
        if (npcName !== 'Kylar') return;
        const npc = C.npc?.Kylar;
        if (!npc) return;
        npc.outfits = ['naked', ...outfitNames];
        wardrobe.worn('Kylar');
        inject(npcName, npcno, npc.clothes, npc);
      },
      'Kylar outfit sets'
    );
  });
}
