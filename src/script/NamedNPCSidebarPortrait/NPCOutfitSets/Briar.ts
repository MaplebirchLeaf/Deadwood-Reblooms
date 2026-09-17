// ./src/script/NamedNPCSidebarPortrait/NPCOutfitSets/Briar.ts

import type { MaplebirchCore } from '@scml-dol-maplebirch/types';
import inject from './Inject';
import { addSet, sync } from './Clothes';

export default function (maplebirch: MaplebirchCore): void {
  maplebirch.tool.onInit(() => {
    const wardrobe = maplebirch.npc.Clothes.wardrobe;
    const names: string[] = [];
    const outfits = {
      formal_suit: { name: 'briar_suit', options: { type: 'Briar', gender: 'm', outfit: 0, upperAction: 'unbutton', lowerAction: 'pull' } },
      evening_gown: { name: 'briar_gown', options: { type: 'Briar', gender: 'f', outfit: 1, upperAction: 'lift', lowerAction: 'lift' } }
    };
    for (const [key, outfit] of Object.entries(outfits)) {
      const template = wardrobe.get(key);
      if (template) addSet(maplebirch, names, outfit.name, template, outfit.options);
    }
    wardrobe.modify('Briar', (clothes, context) => {
      const outfit = outfits[context.key as keyof typeof outfits];
      if (outfit) sync('Briar', outfit.name, clothes, outfit.options);
    });
    maplebirch.on(
      ':npcInject',
      (npcName: string, npcno: number) => {
        if (npcName !== 'Briar') return;
        const npc = C.npc?.Briar;
        if (!npc) return;
        npc.outfits = ['naked', ...names];
        wardrobe.worn('Briar');
        inject(npcName, npcno, npc.clothes, npc);
      },
      'Briar outfit sets'
    );
  });
}
