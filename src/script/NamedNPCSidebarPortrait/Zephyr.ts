// ./src/script/NamedNPCSidebarPortrait/Zephyr.ts

import type { MaplebirchCore } from '@scml-dol-maplebirch/types';
import type NPCSidebarPortrait from '../../module/NPCSidebarPortrait';
import { Clothing } from './Clothing';

export default function (maplebirch: MaplebirchCore): void {
  maplebirch.tool.onInit(() => {
    maplebirch.on(':npcInject', data, 'Zephyr data');

    function data(npcName: string): void {
      if (npcName !== 'Zephyr') return;
      const npc = V.NPCName?.find((data: any) => data?.nam === npcName);
      if (!npc) return;
      npc.hair_side_type = 'braid left';
      npc.hair_fringe_type = 'sweep';
      npc.hair_sides_length = 600;
      npc.hair_fringe_length = 200;
    }

    const wardrobe = maplebirch.npc.Clothes.wardrobe;
    const sidebar = maplebirch.get('NPCSidebarPortrait') as NPCSidebarPortrait;
    const male = wardrobe.get('male_underwear') ?? {};
    const female = wardrobe.get('female_underwear') ?? {};
    wardrobe.base('Zephyr', clothes => {
      for (const item of Object.values(C.npc?.Zephyr?.pronoun === 'm' ? male : female)) sidebar.apply(clothes, item);
    });
    // 海盗船与走私者酒吧的实际出场由原版 npc Zephyr 写入 V.npc。
    wardrobe.wear('Zephyr', '*', 'gothic_formal_suit');
    wardrobe.modify('Zephyr', clothes => {
      sidebar.apply(clothes, Clothing.thigh_high_heeled_boots);
      sidebar.apply(clothes, Clothing.cowboy_hat);
    });
  });
}
