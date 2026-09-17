// ./src/script/NamedNPCSidebarPortrait/NPCOutfitSets/Morgan.ts

import type { MaplebirchCore } from '@scml-dol-maplebirch/types';
import inject from './Inject';
import { addSet, sync } from './Clothes';

export default function (maplebirch: MaplebirchCore): void {
  maplebirch.tool.onInit(() => {
    const wardrobe = maplebirch.npc.Clothes.wardrobe;
    const names: string[] = [];
    const options = { upperAction: 'unbutton', lowerAction: 'pull' };
    for (const key of ['tattered_tuxedo', 'tattered_gown', 'naked']) {
      const template = wardrobe.get(key);
      if (template) addSet(maplebirch, names, `morgan_${key}`, template, options);
    }
    wardrobe.modify('Morgan', (clothes, context) => {
      const name = `morgan_${context.key}`;
      if (names.includes(name)) sync('Morgan', name, clothes, options);
    });
    maplebirch.on(
      ':npcInject',
      (npcName: string, npcno: number) => {
        if (npcName !== 'Morgan') return;
        const npc = C.npc?.Morgan;
        if (!npc) return;
        npc.outfits = [...new Set([...(npc.outfits ?? ['naked']), ...names])];
        wardrobe.worn('Morgan');
        if (names.includes(npc.clothes?.set)) inject(npcName, npcno, npc.clothes, npc);
      },
      'Morgan outfit sets'
    );
  });
}
