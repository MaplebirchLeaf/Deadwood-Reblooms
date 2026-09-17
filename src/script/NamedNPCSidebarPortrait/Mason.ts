// ./src/script/NamedNPCSidebarPortrait/Mason.ts

import type { MaplebirchCore } from '@scml-dol-maplebirch/types';

export default function (maplebirch: MaplebirchCore, colours: { outfit: Map<string, string> }): void {
  maplebirch.tool.onInit(() => {
    maplebirch.on(':npcInject', data, 'Mason data');

    function data(npcName: string): void {
      if (npcName !== 'Mason') return;
      const npc = V.NPCName?.find((data: any) => data?.nam === npcName);
      if (!npc) return;
      npc.hair_side_type = npc.gender === 'm' ? 'neat' : 'ponytail';
      npc.hair_fringe_type = 'ringlet curl';
      npc.hair_sides_length = 400;
      npc.hair_fringe_length = 200;
    }

    const wardrobe = maplebirch.npc.Clothes.wardrobe;
    function location(): string {
      const title = maplebirch.passage.title;
      // Lake Underwater 的冰下救援及三个后续回应明确延续潜水服；在场仍以 V.npc 为准。
      if (['Lake Underwater', 'Lake Mason Reassure', 'Lake Mason Thank', 'Lake Mason Angry'].includes(title)) return 'diving';
      // Lake Mason Swim 揭示裸泳；池塘初见与聊天则明确仍穿泳装。
      if (title.startsWith('Lake Mason')) return 'naked';
      // 礼顿处罚后 swimall 标记裸体教学，普通泳池状态不能据玩家裸泳直接脱掉梅森衣物。
      if (V.location === 'pool') return V.swimall === 1 ? 'naked' : 'swim';
      if (title === 'Mason Pond' || title.startsWith('Mason In Pond') || title.startsWith('Mason Beside Pond') || title.startsWith('Mason Pond ')) return 'swim';
      return '';
    }
    wardrobe.wear('Mason', '*', 'speedo', () => location() === 'swim' && C.npc?.Mason?.pronoun === 'm');
    for (const key of ['school_swimsuit', 'school_swim_two_piece'])
      wardrobe.wear('Mason', '*', key, () => {
        if (location() !== 'swim' || C.npc?.Mason?.pronoun === 'm') return false;
        if (!colours.outfit.has('swim')) colours.outfit.set('swim', Math.random() < 0.75 ? 'school_swim_two_piece' : 'school_swimsuit');
        return colours.outfit.get('swim') === key;
      });
    wardrobe.wear('Mason', '*', 'diving_suit', () => location() === 'diving');
    wardrobe.wear('Mason', '*', 'naked', () => location() === 'naked');
    wardrobe.modify('Mason', (clothes, context) => {
      if (context.key !== 'diving_suit' || C.npc?.Mason?.pronoun !== 'm') return;
      delete clothes.under_upper;
      const speedo = wardrobe.get('speedo');
      if (speedo?.under_lower) clothes.under_lower = clone(speedo.under_lower);
    });
  });
}
