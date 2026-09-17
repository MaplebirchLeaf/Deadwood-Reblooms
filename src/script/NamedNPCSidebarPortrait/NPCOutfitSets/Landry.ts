// ./src/script/NamedNPCSidebarPortrait/NPCOutfitSets/Landry.ts

import type { MaplebirchCore } from '@scml-dol-maplebirch/types';
import inject from './Inject';
import { addSet, sync } from './Clothes';

export default function (maplebirch: MaplebirchCore): void {
  maplebirch.tool.onInit(() => {
    const wardrobe = maplebirch.npc.Clothes.wardrobe;
    const names: string[] = [];
    const options = { type: 'Landry', gender: 'n', outfit: 0, upperAction: 'lift', lowerAction: 'pull' };
    for (const key of ['cardigan_trousers', 'sweater_trousers']) {
      const template = wardrobe.get(key);
      if (template) addSet(maplebirch, names, key, template, options);
    }
    wardrobe.modify('Landry', (clothes, context) => {
      if (names.includes(context.key)) sync('Landry', context.key, clothes, options);
    });
    maplebirch.on(
      ':npcInject',
      (npcName: string, npcno: number) => {
        if (npcName !== 'Landry') return;
        const npc = C.npc?.Landry;
        if (!npc) return;
        npc.outfits = ['naked', ...names];
        wardrobe.worn('Landry');
        inject(npcName, npcno, npc.clothes, npc);
      },
      'Landry outfit sets'
    );
  });
}
