// ./src/script/NamedNPCSidebarPortrait/Briar.ts

import type { MaplebirchCore } from '@scml-dol-maplebirch/types';

export default function (maplebirch: MaplebirchCore): void {
  maplebirch.tool.onInit(() => {
    maplebirch.on(':npcInject', data, 'Briar data');

    function data(npcName: string): void {
      if (npcName !== 'Briar') return;
      V.maplebirch.npc.briar.tucked = [true, true];
      const npc = V.NPCName?.find((data: any) => data?.nam === 'Briar');
      if (!npc) return;
      npc.hair_side_type = 'sleek';
      npc.hair_fringe_type = 'french bob';
      npc.hair_sides_length = 400;
      npc.hair_fringe_length = 200;
    }

    const wardrobe = maplebirch.npc.Clothes.wardrobe;
    // Brothel Intro phase 2：男性蓝色西装不穿衬衫，女性红色低领礼服；在场沿用原版 V.npc。
    wardrobe.wear('Briar', '*', 'formal_suit', () => C.npc?.Briar?.pronoun === 'm');
    wardrobe.wear('Briar', '*', 'evening_gown', () => C.npc?.Briar?.pronoun !== 'm');
    wardrobe.modify('Briar', (clothes, context) => {
      const male = context.key === 'formal_suit';
      for (const slot of ['upper', 'lower'] as const) {
        if (!clothes[slot]) continue;
        clothes[slot].colour = male ? 'blue' : 'red';
        if (!male) {
          clothes[slot].accessory_colour = 'red';
          clothes[slot].pattern = 0;
        }
      }
      // 单排扣夹克的衬衫属于 accessory 图层，关闭该图层呈现裸胸。
      if (male && clothes.upper) clothes.upper.accessory = 0;
    });
  });
}
