// ./src/script/NamedNPCSidebarPortrait/NPCOutfitSets/Whitney.ts

import type { MaplebirchCore } from '@scml-dol-maplebirch/types';
import { schoolUniformKeys } from '../Common/SchoolUniform';
import inject from './Inject';
import { addSet, sync } from './Clothes';

const wardrobeKeys = [...schoolUniformKeys, 'school_swim_shorts', 'school_swimsuit', 'leather_jacket_jeans', 'sweater_sweatpants_sport', 'tshirt_shorts', 'hoodie_legwarmers', 'rags'] as const;

export default function (maplebirch: MaplebirchCore): void {
  maplebirch.tool.onInit(() => {
    const wardrobe = maplebirch.npc.Clothes.wardrobe;
    const outfitNames: string[] = [];
    for (const key of wardrobeKeys) {
      const template = wardrobe.get(key);
      if (template) addSet(maplebirch, outfitNames, `whitney_${key}`, template);
    }

    wardrobe.modify('Whitney', (clothes, context) => sync('Whitney', context.key === 'naked' ? 'naked' : `whitney_${context.key}`, clothes));

    maplebirch.on(
      ':npcInject',
      (npcName: string, npcno: number) => {
        if (npcName !== 'Whitney') return;
        const npc = C.npc?.Whitney;
        if (!npc) return;
        npc.outfits = ['naked', ...outfitNames];
        wardrobe.worn('Whitney');
        inject(npcName, npcno, npc.clothes, npc);
      },
      'Whitney outfit sets'
    );
  });
}
