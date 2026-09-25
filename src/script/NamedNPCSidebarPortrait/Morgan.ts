// ./src/script/NamedNPCSidebarPortrait/Morgan.ts

import type { MaplebirchCore } from '@scml-dol-maplebirch/types';

export default function (maplebirch: MaplebirchCore): void {
  maplebirch.tool.onInit(() => {
    maplebirch.on(':npcInject', data, 'Morgan data');

    function data(npcName: string): void {
      if (npcName !== 'Morgan') return;
      const npc = V.NPCName?.find((data: any) => data?.nam === npcName);
      if (!npc) return;
      npc.hair_side_type = 'ruffled';
      npc.hair_fringe_type = 'bedhead';
      npc.hair_sides_length = npc.gender === 'm' ? 400 : 800;
      npc.hair_fringe_length = npc.gender === 'm' ? 200 : 400;
    }

    const wardrobe = maplebirch.npc.Clothes.wardrobe;
    function naked(): boolean {
      const title = maplebirch.passage.title;
      return title === 'Sewers Sex Ed' || ((title === 'Sewers Rape' || title === 'Sewers Rape Finish') && V.phase === 1);
    }
    wardrobe.base('Morgan', clothes => {
      if (naked()) return;
      wardrobe.put(clothes, C.npc?.Morgan?.pronoun === 'm' ? 'male_underwear' : 'female_underwear');
    });
    // Sewers Intro 明写破旧西装／礼服；追猎提示不代表在场，仍以 V.npc 为准。
    wardrobe.wear('Morgan', '*', 'tattered_tuxedo', () => !naked() && C.npc?.Morgan?.pronoun === 'm');
    wardrobe.wear('Morgan', '*', 'tattered_gown', () => !naked() && C.npc?.Morgan?.pronoun !== 'm');
    // Sex Ed 脱衣后进入 phase 1；拒绝分支 phase 2 没有这段脱衣描述。
    wardrobe.wear('Morgan', '*', 'naked', naked);
  });
}
