// ./src/script/NamedNPCSidebarPortrait/NPCOutfitSets/Avery.ts

import type { MaplebirchCore } from '@scml-dol-maplebirch/types';
import { Clothing } from '../Clothing';
import inject from './Inject';
import { addSet, sync, naked } from './Clothes';

const wardrobeKeys = ['business_suit_male', 'business_suit_female', 'tuxedo_formal', 'evening_gown', 'pyjama', 'towel_wrap', 'bathrobe'] as const;

export default function (maplebirch: MaplebirchCore): void {
  maplebirch.tool.onInit(() => {
    const wardrobe = maplebirch.npc.Clothes.wardrobe;
    const outfitNames: string[] = [];

    for (const key of wardrobeKeys) {
      const template = wardrobe.get(key);
      if (template) addSet(maplebirch, outfitNames, `avery_${key}`, template);
    }

    wardrobe.modify('Avery', (clothes, context) => {
      const name = context.key === 'naked' ? (context.location === 'underwear' ? 'avery_underwear' : 'naked') : `avery_${context.key}`;
      sync('Avery', name, clothes);
    });

    maplebirch.on(
      ':npcInject',
      (npcName: string, npcno: number) => {
        if (npcName !== 'Avery') return;
        const npc = C.npc?.Avery;
        if (!npc) return;
        if (npc.pronoun === 'm') addSet(maplebirch, outfitNames, 'avery_underwear', { upper: naked, lower: Clothing.briefs });
        else addSet(maplebirch, outfitNames, 'avery_underwear', { upper: Clothing.lace_bra, lower: Clothing.lace_panties });
        npc.outfits = ['naked', ...outfitNames];
        wardrobe.worn('Avery');
        inject(npcName, npcno, npc.clothes, npc);
      },
      'Avery outfit sets'
    );
  });
}
