// ./src/script/NamedNPCSidebarPortrait/Niki.ts

import type { MaplebirchCore } from '@scml-dol-maplebirch/types';
import type NPCSidebarPortrait from '../../module/NPCSidebarPortrait';
import { Clothing } from './Clothing';
import trainers from './Common/Trainers';

export default function (maplebirch: MaplebirchCore, colours: { outfit: Map<string, string> }): void {
  maplebirch.tool.onInit(() => {
    maplebirch.on(':npcInject', data, 'Niki data');

    function data(npcName: string): void {
      if (npcName !== 'Niki') return;
      const npc = V.NPCName?.find((data: any) => data?.nam === npcName);
      if (!npc) return;
      npc.hair_side_type = 'sleek';
      npc.hair_fringe_type = 'sweep';
      npc.hair_sides_length = npc.gender === 'm' ? 200 : 600;
      npc.hair_fringe_length = 200;
    }

    const wardrobe = maplebirch.npc.Clothes.wardrobe;
    const sidebar = maplebirch.get('NPCSidebarPortrait') as NPCSidebarPortrait;
    wardrobe.base('Niki', clothes => {
      wardrobe.put(clothes, C.npc?.Niki?.pronoun === 'm' ? 'male_underwear' : 'female_underwear');
    });
    // Photography Chef、街头拍摄和 Livestock Job 均是摄影工作，实际出场由原版 npc Niki 写入 V.npc。
    wardrobe.wear('Niki', '*', 'turtleneck_jeans');
    wardrobe.modify('Niki', clothes => {
      if (clothes.upper) clothes.upper.colour = 'black';
      sidebar.apply(clothes, Clothing.high_top_trainers);
    });
    trainers(maplebirch, 'Niki', colours.outfit);
  });
}
