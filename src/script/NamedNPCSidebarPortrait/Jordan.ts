// ./src/script/NamedNPCSidebarPortrait/Jordan.ts

import type { MaplebirchCore } from '@scml-dol-maplebirch/types';
import type NPCSidebarPortrait from '../../module/NPCSidebarPortrait';
import { Clothing } from './Clothing';

export default function (maplebirch: MaplebirchCore): void {
  maplebirch.tool.onInit(() => {
    maplebirch.on(':npcInject', data, 'Jordan data');

    function data(npcName: string): void {
      if (npcName !== 'Jordan') return;
      V.maplebirch.npc.jordan.tucked = [true, true];
      const npc = V.NPCName?.find((data: any) => data?.nam === 'Jordan');
      if (!npc) return;
      npc.hair_side_type = 'neat';
      npc.hair_fringe_type = 'middlepart';
      npc.hair_sides_length = 1000;
      npc.hair_fringe_length = 400;
    }

    const wardrobe = maplebirch.npc.Clothes.wardrobe;
    const sidebar = maplebirch.get('NPCSidebarPortrait') as NPCSidebarPortrait;
    function bathing(): string {
      const title = maplebirch.passage.title;
      // 偷看和自慰时仍在洗浴，Sneak 失败后重新生成裸体对象。
      if (['Temple Jordan Peek', 'Temple Jordan Masturbation', 'Temple Jordan Masturbation Finish', 'Temple Jordan Sneak'].includes(title)) return 'naked';
      // 道歉、调情和逃跑失败明确只裹毛巾，成功离开不会补入人物。
      if (title === 'Temple Jordan Apologise' || title === 'Temple Jordan Flirt' || (title === 'Temple Jordan Run' && !V.athleticsSuccess)) return 'towel';
      return '';
    }
    const confessor = () => maplebirch.passage.title.startsWith('Temple Confess Self') && V.attendant === 'Jordan';
    // Widgets Named Npcs 固定 temple 服装，男女分别使用修士袍和修女袍。
    // 原版 V.npc 决定在场，这些条件只选择当前衣物，不创建人物或校服日程。
    wardrobe.wear('Jordan', '*', 'monk_habit', () => !bathing() && C.npc?.Jordan?.pronoun === 'm');
    wardrobe.wear('Jordan', '*', 'nun_habit', () => !bathing() && C.npc?.Jordan?.pronoun !== 'm');
    wardrobe.wear('Jordan', '*', 'naked', () => bathing() === 'naked');
    wardrobe.wear('Jordan', '*', 'towel_wrap', () => bathing() === 'towel');
    wardrobe.wear('Jordan', '*', 'confessor_robe', () => confessor() && C.npc?.Jordan?.pronoun === 'm');
    wardrobe.wear('Jordan', '*', 'confessor_habit', () => confessor() && C.npc?.Jordan?.pronoun !== 'm');
    wardrobe.modify('Jordan', (clothes, context) => {
      if (context.key === 'monk_habit' || context.key === 'nun_habit') sidebar.apply(clothes, Clothing.sandals);
    });
  });
}
