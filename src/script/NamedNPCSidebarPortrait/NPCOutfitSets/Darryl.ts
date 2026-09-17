// ./src/script/NamedNPCSidebarPortrait/NPCOutfitSets/Darryl.ts

import type { MaplebirchCore } from '@scml-dol-maplebirch/types';
import inject from './Inject';
import { addSet, sync } from './Clothes';

export default function (maplebirch: MaplebirchCore): void {
  maplebirch.tool.onInit(() => {
    const wardrobe = maplebirch.npc.Clothes.wardrobe;
    const names: string[] = [];
    const outfits = {
      tuxedo_formal: { name: 'darryl_tuxedo', options: { type: 'formal', gender: 'm', outfit: 0, upperAction: 'unbutton', lowerAction: 'pull' } },
      evening_gown: { name: 'darryl_gown', options: { type: 'formal', gender: 'f', outfit: 1, upperAction: 'lift', lowerAction: 'lift' } }
    };
    for (const [key, outfit] of Object.entries(outfits)) {
      const template = wardrobe.get(key);
      if (template) addSet(maplebirch, names, outfit.name, template, outfit.options);
    }
    wardrobe.modify('Darryl', (clothes, context) => {
      const outfit = outfits[context.key as keyof typeof outfits];
      if (outfit) sync('Darryl', outfit.name, clothes, outfit.options);
    });
    maplebirch.on(
      ':npcInject',
      (npcName: string, npcno: number) => {
        if (npcName !== 'Darryl') return;
        const npc = C.npc?.Darryl;
        if (!npc) return;
        npc.outfits = ['naked', ...names];
        wardrobe.worn('Darryl');
        inject(npcName, npcno, npc.clothes, npc);
      },
      'Darryl outfit sets'
    );
  });
}
