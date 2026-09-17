// ./src/script/NamedNPCSidebarPortrait/NPCOutfitSets/Gwylan.ts

import type { MaplebirchCore } from '@scml-dol-maplebirch/types';
import inject from './Inject';
import { addSet, sync } from './Clothes';

const wardrobeKeys = ['gwylan_tunic', 'turtleneck_slacks', 'jacket_trousers', 'pyjama', 'flowy_layered', 'vintage_pantsuit_formal', 'vintage_skirtsuit_formal', 'witch', 'brown_fox'] as const;

export default function (maplebirch: MaplebirchCore): void {
  maplebirch.tool.onInit(() => {
    const wardrobe = maplebirch.npc.Clothes.wardrobe;
    const outfitNames: string[] = [];
    for (const key of wardrobeKeys) {
      const template = wardrobe.get(key);
      if (template) addSet(maplebirch, outfitNames, `gwylan_${key}`, template);
    }
    const ritual = wardrobe.get('exorcist_habit');
    if (ritual) addSet(maplebirch, outfitNames, 'gwylan_ritual_robes', ritual, { gender: 'n' });

    wardrobe.modify('Gwylan', (clothes, context) => {
      const name = context.key === 'naked' ? 'naked' : context.key === 'exorcist_cassock' || context.key === 'exorcist_habit' ? 'gwylan_ritual_robes' : `gwylan_${context.key}`;
      sync('Gwylan', name, clothes);
    });

    maplebirch.on(
      ':npcInject',
      (npcName: string, npcno: number) => {
        if (npcName !== 'Gwylan') return;
        const npc = C.npc?.Gwylan;
        if (!npc) return;
        npc.outfits = ['naked', ...outfitNames];
        wardrobe.worn('Gwylan');
        inject(npcName, npcno, npc.clothes, npc);
      },
      'Gwylan outfit sets'
    );
  });
}
