// ./src/script/NamedNPCSidebarPortrait/NPCOutfitSets/Bailey.ts

import type { MaplebirchCore } from '@scml-dol-maplebirch/types';
import { Clothing } from '../Clothing';
import inject from './Inject';
import { addSet, sync } from './Clothes';

export default function (maplebirch: MaplebirchCore): void {
  maplebirch.tool.onInit(() => {
    const wardrobe = maplebirch.npc.Clothes.wardrobe;
    const formal = wardrobe.get('formal_suit');
    if (!formal?.lower) return;
    const options = { gender: 'n', upperAction: 'unbutton', lowerAction: 'pull' };
    addSet(maplebirch, [], 'bailey_formal', { ...formal, upper: Clothing.double_breasted_jacket }, options);
    wardrobe.modify('Bailey', clothes => sync('Bailey', 'bailey_formal', clothes, options));

    maplebirch.on(
      ':npcInject',
      (npcName: string, npcno: number) => {
        if (npcName !== 'Bailey') return;
        const npc = C.npc?.Bailey;
        if (!npc) return;
        npc.outfits = ['naked', 'bailey_formal'];
        wardrobe.worn('Bailey');
        inject(npcName, npcno, npc.clothes, npc);
      },
      'Bailey outfit sets'
    );
  });
}
