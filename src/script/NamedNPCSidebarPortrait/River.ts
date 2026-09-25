// ./src/script/NamedNPCSidebarPortrait/River.ts

import type { MaplebirchCore } from '@scml-dol-maplebirch/types';
import type NPCSidebarPortrait from '../../module/NPCSidebarPortrait';
import { Clothing } from './Clothing';

export default function (maplebirch: MaplebirchCore): void {
  maplebirch.tool.onInit(() => {
    maplebirch.on(':npcInject', data, 'River data');

    function data(npcName: string): void {
      if (npcName !== 'River') return;
      const npc = V.NPCName?.find((data: any) => data?.nam === 'River');
      if (!npc) return;
      npc.hair_side_type = 'straight';
      npc.hair_fringe_type = 'middlepart';
      npc.hair_sides_length = npc.gender === 'm' ? 200 : 800;
      npc.hair_fringe_length = npc.gender === 'm' ? 0 : 200;
    }

    const wardrobe = maplebirch.npc.Clothes.wardrobe;
    const sidebar = maplebirch.get('NPCSidebarPortrait') as NPCSidebarPortrait;
    wardrobe.base('River', clothes => {
      wardrobe.put(clothes, C.npc?.River?.pronoun === 'm' ? 'male_underwear' : 'female_underwear');
    });
    // 数学与家务课采用男女商务装；在场由原版 npc River 写入 V.npc。
    wardrobe.wear('River', '*', 'business_suit_male', () => V.location === 'school' && C.npc?.River?.pronoun === 'm');
    wardrobe.wear('River', '*', 'business_suit_female', () => V.location === 'school' && C.npc?.River?.pronoun !== 'm');
    // Soup Kitchen 的 location 是 temple，剧情明确描述衬衫；采用白衬衫与卡其裤，不套修士袍。
    wardrobe.wear('River', '*', 'shirt_khakis', () => V.location !== 'school');
    wardrobe.modify('River', (clothes, context) => {
      sidebar.apply(clothes, Clothing.horsebit_loafers);
      if (context.key === 'shirt_khakis') delete clothes.neck;
    });
  });
}
