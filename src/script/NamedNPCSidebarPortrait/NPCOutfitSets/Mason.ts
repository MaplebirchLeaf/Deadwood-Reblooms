// ./src/script/NamedNPCSidebarPortrait/NPCOutfitSets/Mason.ts

import type { MaplebirchCore } from '@scml-dol-maplebirch/types';
import inject from './Inject';
import { addSet, sync } from './Clothes';

export default function (maplebirch: MaplebirchCore): void {
  maplebirch.tool.onInit(() => {
    const wardrobe = maplebirch.npc.Clothes.wardrobe;
    const names: string[] = [];
    const options = { upperAction: 'unbutton', lowerAction: 'pull' };
    for (const key of ['speedo', 'school_swimsuit', 'school_swim_two_piece', 'diving_suit', 'naked']) {
      const template = wardrobe.get(key);
      if (template) addSet(maplebirch, names, `mason_${key}`, template, options);
    }
    wardrobe.modify('Mason', (clothes, context) => {
      const name = `mason_${context.key}`;
      if (names.includes(name)) sync('Mason', name, clothes, options);
    });
    maplebirch.on(
      ':npcInject',
      (npcName: string, npcno: number) => {
        if (npcName !== 'Mason') return;
        const npc = C.npc?.Mason;
        if (!npc) return;
        npc.outfits = [...new Set([...(npc.outfits ?? ['naked']), ...names])];
        wardrobe.worn('Mason');
        if (names.includes(npc.clothes?.set)) inject(npcName, npcno, npc.clothes, npc);
      },
      'Mason outfit sets'
    );
  });
}
