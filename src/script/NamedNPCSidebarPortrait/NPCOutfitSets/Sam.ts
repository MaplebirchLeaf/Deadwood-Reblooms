// ./src/script/NamedNPCSidebarPortrait/NPCOutfitSets/Sam.ts

import type { MaplebirchCore } from '@scml-dol-maplebirch/types';
import inject from './Inject';
import { addSet, sync } from './Clothes';

export default function (maplebirch: MaplebirchCore): void {
  maplebirch.tool.onInit(() => {
    const wardrobe = maplebirch.npc.Clothes.wardrobe;
    const names: string[] = [];
    const outfits = {
      chef_uniform: { name: 'chef_uniform', options: { type: 'normal', gender: 'n', outfit: 0, upperAction: 'unbutton', lowerAction: 'pull' } },
      shirt_trousers: { name: 'shirt_trousers', options: { type: 'normal', gender: 'n', outfit: 0, upperAction: 'unbutton', lowerAction: 'pull' } },
      tuxedo_formal: { name: 'sam_suit', options: { type: 'formal', gender: 'm', outfit: 0, upperAction: 'unbutton', lowerAction: 'pull' } },
      evening_gown: { name: 'sam_gown', options: { type: 'formal', gender: 'f', outfit: 1, upperAction: 'lift', lowerAction: 'lift' } }
    };
    for (const [key, outfit] of Object.entries(outfits)) {
      const template = wardrobe.get(key);
      if (template) addSet(maplebirch, names, outfit.name, template, outfit.options);
    }
    wardrobe.modify('Sam', (clothes, context) => {
      const outfit = outfits[context.key as keyof typeof outfits];
      if (outfit) sync('Sam', outfit.name, clothes, outfit.options);
    });
    maplebirch.on(
      ':npcInject',
      (npcName: string, npcno: number) => {
        if (npcName !== 'Sam') return;
        const npc = C.npc?.Sam;
        if (!npc) return;
        npc.outfits = ['naked', ...names];
        wardrobe.worn('Sam');
        inject(npcName, npcno, npc.clothes, npc);
      },
      'Sam outfit sets'
    );
  });
}
