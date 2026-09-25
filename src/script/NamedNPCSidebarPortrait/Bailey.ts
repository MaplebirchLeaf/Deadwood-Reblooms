// ./src/script/NamedNPCSidebarPortrait/Bailey.ts

import type { MaplebirchCore } from '@scml-dol-maplebirch/types';
import type NPCSidebarPortrait from '../../module/NPCSidebarPortrait';
import { Clothing } from './Clothing';

export default function (maplebirch: MaplebirchCore): void {
  maplebirch.tool.onInit(() => {
    maplebirch.on(':npcInject', data, 'Bailey data');

    function data(npcName: string): void {
      if (npcName !== 'Bailey') return;
      V.maplebirch.npc.bailey.tucked = [true, true];
      const npc = V.NPCName?.find((data: any) => data?.nam === 'Bailey');
      if (!npc) return;
      npc.hair_fringe_type = 'middlepart';
      npc.hair_side_type = 'neat';
      if (npc.gender === 'm') {
        npc.hair_sides_length = 400;
        npc.hair_fringe_length = 200;
      } else {
        npc.hair_sides_length = 600;
        npc.hair_fringe_length = 400;
      }
    }

    const sidebar = maplebirch.get('NPCSidebarPortrait') as NPCSidebarPortrait;
    const wardrobe = maplebirch.npc.Clothes.wardrobe;

    // 内衣沿用现有基础套装；剧情战斗暴露由框架使用原版当前对象处理。
    wardrobe.base('Bailey', clothes => {
      wardrobe.put(clothes, C.npc?.Bailey?.pronoun === 'm' ? 'male_underwear' : 'female_underwear');
    });
    wardrobe.wear('Bailey', '*', 'formal_suit');
    wardrobe.modify('Bailey', clothes => {
      sidebar.apply(clothes, Clothing.double_breasted_jacket);
      sidebar.apply(clothes, Clothing.necktie);
      sidebar.apply(clothes, Clothing.cordovan_loafers);
    });
  });
}
