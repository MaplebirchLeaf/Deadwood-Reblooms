// ./src/script/NamedNPCSidebarPortrait/NPCOutfitSets/Harper.ts

import type { MaplebirchCore } from '@scml-dol-maplebirch/types';
import inject from './Inject';
import { addSet, sync } from './Clothes';

export default function (maplebirch: MaplebirchCore): void {
  maplebirch.tool.onInit(() => {
    const wardrobe = maplebirch.npc.Clothes.wardrobe;
    const names: string[] = [];
    const outfits = {
      doctor: { name: 'harper_doctor', options: { type: 'hospital', gender: 'n', outfit: 0, upperAction: 'unbutton', lowerAction: 'pull' } },
      tuxedo_formal: { name: 'harper_tuxedo', options: { type: 'formal', gender: 'm', outfit: 0, upperAction: 'unbutton', lowerAction: 'pull' } },
      evening_gown: { name: 'harper_gown', options: { type: 'formal', gender: 'f', outfit: 1, upperAction: 'lift', lowerAction: 'lift' } }
    };
    for (const [key, outfit] of Object.entries(outfits)) {
      const template = wardrobe.get(key);
      if (template) addSet(maplebirch, names, outfit.name, template, outfit.options);
    }
    wardrobe.modify('Harper', (clothes, context) => {
      const outfit = outfits[context.key as keyof typeof outfits];
      if (outfit) sync('Harper', outfit.name, clothes, outfit.options);
    });
    maplebirch.on(
      ':npcInject',
      (npcName: string, npcno: number) => {
        if (npcName !== 'Harper') return;
        const npc = C.npc?.Harper;
        if (!npc) return;
        npc.outfits = ['naked', ...names];
        wardrobe.worn('Harper');
        inject(npcName, npcno, npc.clothes, npc);
      },
      'Harper outfit sets'
    );
  });
}
