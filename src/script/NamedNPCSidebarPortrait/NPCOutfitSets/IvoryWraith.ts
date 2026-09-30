// ./src/script/NamedNPCSidebarPortrait/NPCOutfitSets/IvoryWraith.ts

import type { MaplebirchCore } from '@scml-dol-maplebirch/types';
import { cycle, wraith, present } from '../IvoryWraith';
import inject from './Inject';
import { addSet } from './Clothes';

const wardrobeKeys = ['ivory_robe', 'ivory_dress', 'ivory_habit'] as const;

export default function (maplebirch: MaplebirchCore): void {
  maplebirch.tool.onInit(() => {
    const name = 'Ivory Wraith';
    const wardrobe = maplebirch.npc.Clothes.wardrobe;
    const outfitNames: string[] = [];
    for (const key of wardrobeKeys) {
      const template = wardrobe.get(key);
      if (template)
        addSet(maplebirch, outfitNames, key, template, {
          type: key === 'ivory_robe' ? 'Wraith' : 'custom',
          gender: 'n',
          outfit: 1,
          upperAction: 'none',
          lowerAction: 'none'
        });
    }

    // 原版下一次生成仍读取 ivory_robe，当前战斗的裸体、破损不能写回这份初始套装。
    function sync(worn: Record<string, any>): void {
      const npc = C.npc?.[name];
      if (!npc || !present(maplebirch) || cycle(maplebirch) || !V.npc?.includes(name) || !wraith()) return;
      npc.clothes = {
        set: 'ivory_robe',
        upper: { name: worn.upper.name, integrity: worn.upper.integrity },
        lower: { name: worn.lower.name, integrity: worn.lower.integrity }
      };
    }

    wardrobe.modify(name, sync);

    maplebirch.on(
      ':npcInject',
      (npcName: string, npcno: number) => {
        if (npcName !== name) return;
        const npc = C.npc?.[name];
        if (!npc) return;
        npc.outfits = ['naked', 'ivory_robe'];
        wardrobe.worn(name);
        if (!present(maplebirch) || cycle(maplebirch)) return;
        inject(npcName, npcno, npc.clothes);
      },
      'Ivory Wraith current clothes'
    );
  });
}
