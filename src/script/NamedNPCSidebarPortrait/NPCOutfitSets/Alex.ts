// ./src/script/NamedNPCSidebarPortrait/NPCOutfitSets/Alex.ts

import type { MaplebirchCore } from '@scml-dol-maplebirch/types';
import { Clothing } from '../Clothing';
import inject from './Inject';
import { addSet, sync, naked } from './Clothes';

export default function (maplebirch: MaplebirchCore): void {
  maplebirch.tool.onInit(() => {
    const wardrobe = maplebirch.npc.Clothes.wardrobe;
    const outfitNames: string[] = [];

    const farm = wardrobe.get('wilds_flannel');
    if (farm) {
      addSet(maplebirch, outfitNames, 'alex_lower_removed', { ...farm, lower: Clothing.striped_panties });
      addSet(maplebirch, outfitNames, 'wilds_flannel', farm);
    }
    addSet(maplebirch, outfitNames, 'alex_sleep', { upper: Clothing.t_shirt, lower: Clothing.striped_panties });
    addSet(maplebirch, outfitNames, 'alex_sleep_shirt_only', { upper: Clothing.t_shirt, lower: naked });

    wardrobe.modify('Alex', (clothes, context) => {
      const name =
        context.key === 'naked'
          ? 'naked'
          : context.location === 'lower_removed'
            ? 'alex_lower_removed'
            : context.location === 'sleep_shirt_only'
              ? 'alex_sleep_shirt_only'
              : context.key === 'pyjama'
                ? 'alex_sleep'
                : context.key;
      sync('Alex', name, clothes);
    });

    maplebirch.on(
      ':npcInject',
      (npcName: string, npcno: number) => {
        if (npcName !== 'Alex') return;
        const npc = C.npc?.Alex;
        if (!npc) return;
        npc.outfits = ['naked', ...outfitNames];
        wardrobe.worn('Alex');
        inject(npcName, npcno, npc.clothes, npc);
      },
      'Alex outfit sets'
    );
  });
}
