// ./src/script/NamedNPCSidebarPortrait/Wren.ts

import type { MaplebirchCore } from '@scml-dol-maplebirch/types';

export default function (maplebirch: MaplebirchCore): void {
  maplebirch.tool.onInit(() => {
    maplebirch.on(':npcInject', data, 'Wren data');

    function data(npcName: string): void {
      if (npcName !== 'Wren') return;
      const npc = V.NPCName?.find((data: any) => data?.nam === npcName);
      if (!npc) return;
      npc.hair_side_type = 'ruffled';
      npc.hair_fringe_type = 'aerial';
      npc.hair_sides_length = npc.gender === 'm' ? 200 : 600;
      npc.hair_fringe_length = npc.gender === 'm' ? 0 : 200;
    }

    const wardrobe = maplebirch.npc.Clothes.wardrobe;
    wardrobe.base('Wren', clothes => {
      wardrobe.put(clothes, C.npc?.Wren?.pronoun === 'm' ? 'male_underwear' : 'female_underwear');
    });
    // 原版 npc Wren 决定实际在场，监狱交易采用囚服外观，不赋予囚犯作息。
    const heist = () => maplebirch.passage.title.startsWith('Wren Heist');
    wardrobe.wear('Wren', '*', 'prison_jumpsuit', () => V.location === 'prison');
    wardrobe.wear('Wren', '*', 'catsuit', () => V.location !== 'prison' && heist());
    wardrobe.wear('Wren', '*', 'leather_jacket_jeans', () => V.location !== 'prison' && !heist() && C.npc?.Wren?.pronoun === 'm');
    wardrobe.wear('Wren', '*', 'leather_jacket_skirt', () => V.location !== 'prison' && !heist() && C.npc?.Wren?.pronoun !== 'm');
    wardrobe.modify('Wren', (clothes, context) => {
      if (context.key === 'prison_jumpsuit') wardrobe.strip(clothes, 'feet');
      else if (clothes.feet) clothes.feet.colour = 'black';
      if (!maplebirch.passage.title.startsWith('Estate ')) return;
      const cards = V.estate?.cards;
      if (cards?.wren_top === 0) wardrobe.strip(clothes, 'upper');
      if (cards?.wren_bottoms === 0) wardrobe.strip(clothes, 'lower');
      if (cards?.wren_under_top === 0) wardrobe.strip(clothes, 'under_upper');
      if (cards?.wren_under_bottoms === 0) wardrobe.strip(clothes, 'under_lower');
    });
  });
}
