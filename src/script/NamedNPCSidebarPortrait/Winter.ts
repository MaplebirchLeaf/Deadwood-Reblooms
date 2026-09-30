// ./src/script/NamedNPCSidebarPortrait/Winter.ts

import type { MaplebirchCore } from '@scml-dol-maplebirch/types';

export default function (maplebirch: MaplebirchCore): void {
  maplebirch.tool.onInit(() => {
    maplebirch.on(':npcInject', data, 'Winter data');

    function data(npcName: string): void {
      if (npcName !== 'Winter') return;
      const npc = V.NPCName?.find((data: any) => data?.nam === npcName);
      if (!npc) return;
      npc.hair_side_type = 'default';
      npc.hair_fringe_type = 'middlepart';
      npc.hair_sides_length = npc.gender === 'm' ? 200 : 400;
      npc.hair_fringe_length = npc.gender === 'm' ? 0 : 200;
    }

    const wardrobe = maplebirch.npc.Clothes.wardrobe;
    wardrobe.base('Winter', clothes => {
      wardrobe.put(clothes, C.npc?.Winter?.pronoun === 'm' ? 'male_underwear' : 'female_underwear');
    });
    // 原版注册 teacher，学校、博物馆和 Lake Office 的实际会面均穿复古装，在场由 V.npc 决定。
    wardrobe.wear('Winter', '*', 'vintage_pantsuit_formal', () => C.npc?.Winter?.pronoun === 'm');
    wardrobe.wear('Winter', '*', 'vintage_skirtsuit_formal', () => C.npc?.Winter?.pronoun !== 'm');
    wardrobe.modify('Winter', clothes => {
      if (clothes.upper) {
        clothes.upper.colour = 'black';
        clothes.upper.accessory_colour = 'grey';
      }
      if (clothes.lower) clothes.lower.colour = 'black';
      if (clothes.feet) {
        clothes.feet.colour = 'black';
        clothes.feet.accessory_colour = 'grey';
      }
    });
  });
}
