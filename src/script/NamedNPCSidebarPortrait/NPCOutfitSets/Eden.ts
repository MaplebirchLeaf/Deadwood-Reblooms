// ./src/script/NamedNPCSidebarPortrait/NPCOutfitSets/Eden.ts

import type { MaplebirchCore } from '@scml-dol-maplebirch/types';
import inject from './Inject';
import { addSet, sync, naked } from './Clothes';

export default function (maplebirch: MaplebirchCore): void {
  maplebirch.tool.onInit(() => {
    const wardrobe = maplebirch.npc.Clothes.wardrobe;
    const hunting = wardrobe.get('eden_hunting');
    if (!hunting) return;

    const outfitNames: string[] = [];

    const options = { upperAction: 'unbutton', lowerAction: 'pull' };
    addSet(maplebirch, outfitNames, 'eden_hunting', hunting, options);
    addSet(maplebirch, outfitNames, 'eden_upper_removed', { upper: naked, lower: hunting.lower }, options);
    addSet(maplebirch, outfitNames, 'eden_lower_removed', { upper: hunting.upper, lower: naked }, options);

    wardrobe.modify('Eden', (clothes, context) => {
      const name = context.key === 'naked' ? 'naked' : context.location === 'upper_removed' ? 'eden_upper_removed' : context.location === 'lower_removed' ? 'eden_lower_removed' : 'eden_hunting';
      sync('Eden', name, clothes, options);
    });

    maplebirch.on(
      ':npcInject',
      (npcName: string, npcno: number) => {
        if (npcName !== 'Eden') return;
        const npc = C.npc?.Eden;
        if (!npc) return;
        npc.outfits = ['naked', ...outfitNames];
        wardrobe.worn('Eden');
        inject(npcName, npcno, npc.clothes, npc);
      },
      'Eden outfit sets'
    );
  });
}
