// ./src/script/NamedNPCSidebarPortrait/NPCOutfitSets/Jordan.ts

import type { MaplebirchCore } from '@scml-dol-maplebirch/types';
import inject from './Inject';
import { addSet, sync } from './Clothes';

export default function (maplebirch: MaplebirchCore): void {
  maplebirch.tool.onInit(() => {
    const wardrobe = maplebirch.npc.Clothes.wardrobe;
    const names: string[] = [];
    const outfits = {
      monk_habit: { name: 'jordan_monk', options: { type: 'temple', gender: 'm', outfit: 1 } },
      nun_habit: { name: 'jordan_nun', options: { type: 'temple', gender: 'f', outfit: 1 } },
      confessor_robe: { name: 'jordan_confessor_robe', options: { type: 'temple', gender: 'm', outfit: 1 } },
      confessor_habit: { name: 'jordan_confessor_habit', options: { type: 'temple', gender: 'f', outfit: 1 } },
      towel_wrap: { name: 'jordan_towel', options: { type: 'temple', gender: 'n', outfit: 0 } }
    };
    for (const [key, outfit] of Object.entries(outfits)) {
      const template = wardrobe.get(key);
      if (template) addSet(maplebirch, names, outfit.name, template, outfit.options);
    }
    wardrobe.modify('Jordan', (clothes, context) => {
      const outfit = outfits[context.key as keyof typeof outfits];
      if (context.key === 'naked') sync('Jordan', 'naked', clothes);
      else if (outfit) sync('Jordan', outfit.name, clothes, outfit.options);
    });
    maplebirch.on(
      ':npcInject',
      (npcName: string, npcno: number) => {
        if (npcName !== 'Jordan') return;
        const npc = C.npc?.Jordan;
        if (!npc) return;
        npc.outfits = ['naked', ...names];
        wardrobe.worn('Jordan');
        inject(npcName, npcno, npc.clothes, npc);
      },
      'Jordan outfit sets'
    );
  });
}
