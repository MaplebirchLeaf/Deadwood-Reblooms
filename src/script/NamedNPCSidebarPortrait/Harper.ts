// ./src/script/NamedNPCSidebarPortrait/Harper.ts

import type { MaplebirchCore } from '@scml-dol-maplebirch/types';

export default function (maplebirch: MaplebirchCore): void {
  maplebirch.tool.onInit(() => {
    maplebirch.on(':npcInject', data, 'Harper data');

    function data(npcName: string): void {
      if (npcName !== 'Harper') return;
      V.maplebirch.npc.harper.tucked = [true, true];
      const npc = V.NPCName?.find((data: any) => data?.nam === 'Harper');
      if (!npc) return;
      npc.hair_fringe_type = 'emo left';
      npc.hair_side_type = 'sleek';
      if (npc.gender === 'm') {
        npc.hair_sides_length = 400;
        npc.hair_fringe_length = 200;
      } else {
        npc.hair_sides_length = 600;
        npc.hair_fringe_length = 400;
      }
    }

    const wardrobe = maplebirch.npc.Clothes.wardrobe;
    const party = () => /^Skyscraper Party(?: |$)/.test(maplebirch.passage.title);
    // 原版 hospital 衣物类型：医院、精神病院、农场检查均穿医生服。
    // Mansion Party Harper 明写刚下班仍穿工作服；在场沿用原版 V.npc。
    wardrobe.wear('Harper', '*', 'doctor', () => !party());
    // Skyscraper Party 初见明写为重要场合盛装打扮，后续宴会分支延续该服装。
    wardrobe.wear('Harper', '*', 'tuxedo_formal', () => party() && C.npc?.Harper?.pronoun === 'm');
    wardrobe.wear('Harper', '*', 'evening_gown', () => party() && C.npc?.Harper?.pronoun !== 'm');
    wardrobe.modify('Harper', (clothes, context) => {
      if (context.key !== 'evening_gown') return;
      for (const slot of ['upper', 'lower'] as const) if (clothes[slot]) clothes[slot].pattern = '';
    });
  });
}
