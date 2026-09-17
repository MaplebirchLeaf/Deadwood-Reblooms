// ./src/script/NamedNPCSidebarPortrait/NPCOutfitSets/Charlie.ts

import type { MaplebirchCore } from '@scml-dol-maplebirch/types';
import inject from './Inject';
import { addSet, sync } from './Clothes';

export default function (maplebirch: MaplebirchCore): void {
  maplebirch.tool.onInit(() => {
    const wardrobe = maplebirch.npc.Clothes.wardrobe;
    const template = wardrobe.get('dance_leotard');
    if (!template) return;
    const outfitNames: string[] = [];
    const options = { type: 'dance_studio', gender: 'n', outfit: 1, upperAction: 'pull', lowerAction: 'pull' };
    addSet(maplebirch, outfitNames, 'charlie_dance', template, options);
    wardrobe.modify('Charlie', clothes => sync('Charlie', 'charlie_dance', clothes, options));

    maplebirch.on(
      ':npcInject',
      (npcName: string, npcno: number) => {
        if (npcName !== 'Charlie') return;
        const npc = C.npc?.Charlie;
        if (!npc) return;
        npc.outfits = ['naked', ...outfitNames];
        wardrobe.worn('Charlie');
        inject(npcName, npcno, npc.clothes, npc);
      },
      'Charlie outfit sets'
    );
  });
}
