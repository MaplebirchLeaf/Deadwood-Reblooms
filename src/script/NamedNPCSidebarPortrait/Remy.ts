// ./src/script/NamedNPCSidebarPortrait/Remy.ts

import type { MaplebirchCore } from '@scml-dol-maplebirch/types';
import type NPCSidebarPortrait from '../../module/NPCSidebarPortrait';
import { Clothing } from './Clothing';

export default function (maplebirch: MaplebirchCore): void {
  maplebirch.tool.onInit(() => {
    maplebirch.on(':npcInject', data, 'Remy data');

    function data(npcName: string): void {
      if (npcName !== 'Remy') return;
      const npc = V.NPCName?.find((data: any) => data?.nam === npcName);
      if (!npc) return;
      npc.hair_side_type = 'neat';
      npc.hair_fringe_type = 'framed';
      npc.hair_sides_length = npc.gender === 'm' ? 200 : 600;
      npc.hair_fringe_length = npc.gender === 'm' ? 0 : 200;
    }

    const wardrobe = maplebirch.npc.Clothes.wardrobe;
    const sidebar = maplebirch.get('NPCSidebarPortrait') as NPCSidebarPortrait;
    wardrobe.base('Remy', clothes => {
      wardrobe.put(clothes, C.npc?.Remy?.pronoun === 'm' ? 'male_underwear' : 'female_underwear');
    });
    // 骑术学校、地下农场与庄园的实际出场由原版 npc Remy 写入 V.npc。
    wardrobe.wear('Remy', '*', 'riding_formal');
    wardrobe.modify('Remy', clothes => {
      // Riding School、farmStage5 与 Livestock Intro：艾弗里事件后用白色面具遮盖烧伤；remy_mask 记录首次对话。
      if (['saved', 'fallen', 'kicked'].includes(V.avery_fate)) sidebar.apply(clothes, Clothing.skeleton_mask);
    });
  });
}
