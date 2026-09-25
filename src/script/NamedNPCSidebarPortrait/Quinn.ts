// ./src/script/NamedNPCSidebarPortrait/Quinn.ts

import type { MaplebirchCore } from '@scml-dol-maplebirch/types';
import type NPCSidebarPortrait from '../../module/NPCSidebarPortrait';
import { Clothing } from './Clothing';

export default function (maplebirch: MaplebirchCore): void {
  maplebirch.tool.onInit(() => {
    maplebirch.on(':npcInject', data, 'Quinn data');

    function data(npcName: string): void {
      if (npcName !== 'Quinn') return;
      const npc = V.NPCName?.find((data: any) => data?.nam === npcName);
      if (!npc) return;
      npc.hair_side_type = npc.gender === 'm' ? 'sleek' : 'neat';
      npc.hair_fringe_type = 'middlepart';
      npc.hair_sides_length = npc.gender === 'm' ? 200 : 600;
      npc.hair_fringe_length = npc.gender === 'm' ? 0 : 200;
    }

    const wardrobe = maplebirch.npc.Clothes.wardrobe;
    const sidebar = maplebirch.get('NPCSidebarPortrait') as NPCSidebarPortrait;
    const party = () => /^Mansion Party Quinn(?: |$)/.test(maplebirch.passage.title);
    wardrobe.base('Quinn', clothes => {
      if (!party()) wardrobe.put(clothes, C.npc?.Quinn?.pronoun === 'm' ? 'male_underwear' : 'female_underwear');
    });
    // 市政厅、咖啡馆开幕与艾弗里牌局：在场沿用原版 npc Quinn 写入的 V.npc。
    wardrobe.wear('Quinn', '*', 'business_suit_male', () => !party() && C.npc?.Quinn?.pronoun === 'm');
    wardrobe.wear('Quinn', '*', 'business_suit_female', () => !party() && C.npc?.Quinn?.pronoun !== 'm');
    // Mansion Party Quinn 是泳池派对；Quinn 3 明写离开泳池后未换衣服便入席，后续分支继续泳装。
    wardrobe.wear('Quinn', '*', 'speedo', () => party() && C.npc?.Quinn?.pronoun === 'm');
    wardrobe.wear('Quinn', '*', 'bikini', () => party() && C.npc?.Quinn?.pronoun !== 'm');
    wardrobe.modify('Quinn', clothes => {
      if (!party()) return;
      wardrobe.strip(clothes, ['feet', 'legs']);
      sidebar.apply(clothes, Clothing.heart_sunglasses);
    });
  });
}
