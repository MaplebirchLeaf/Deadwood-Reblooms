// ./src/script/NamedNPCSidebarPortrait/Sam.ts

import type { MaplebirchCore } from '@scml-dol-maplebirch/types';
import type NPCSidebarPortrait from '../../module/NPCSidebarPortrait';

export default function (maplebirch: MaplebirchCore): void {
  maplebirch.tool.onInit(() => {
    maplebirch.on(':npcInject', data, 'Sam data');

    function data(npcName: string): void {
      if (npcName !== 'Sam') return;
      V.maplebirch.npc.sam.tucked = [true, true];
      const npc = V.NPCName?.find((data: any) => data?.nam === 'Sam');
      if (!npc) return;
      npc.hair_fringe_type = 'loose';
      npc.hair_fringe_length = 200;
      if (npc.gender === 'm') {
        npc.hair_side_type = 'short';
        npc.hair_sides_length = 200;
      } else {
        npc.hair_side_type = 'messy bun';
        npc.hair_sides_length = 400;
      }
    }

    const wardrobe = maplebirch.npc.Clothes.wardrobe;
    const sidebar = maplebirch.get('NPCSidebarPortrait') as NPCSidebarPortrait;
    const formal = () => /^Chef Opening(?: |$)/.test(maplebirch.passage.title) || (V.location === 'cafe' && V.chef_state === 8);
    // Ocean Breeze Rework 在 chef_state 8 明写正装；Chef Opening 的开幕及送客分支延续正装。
    wardrobe.wear('Sam', '*', 'tuxedo_formal', () => formal() && C.npc?.Sam?.pronoun === 'm');
    wardrobe.wear('Sam', '*', 'evening_gown', () => formal() && C.npc?.Sam?.pronoun !== 'm');
    // 咖啡馆工作采用用户提供的厨师套装；在场仍由原版 V.npc 决定。
    wardrobe.wear('Sam', '*', 'chef_uniform', () => !formal() && V.location === 'cafe');
    // Sam Park 的清晨喂鸭、散步及其他日常地点使用衬衫长裤。
    wardrobe.wear('Sam', '*', 'shirt_trousers', () => !formal() && V.location !== 'cafe');
    wardrobe.modify('Sam', (clothes, context) => {
      if (context.key === 'evening_gown')
        for (const slot of ['upper', 'lower'] as const) {
          if (!clothes[slot]) continue;
          clothes[slot].colour = 'red';
          clothes[slot].accessory_colour = 'red';
          clothes[slot].pattern = 0;
        }
    });
  });
}
