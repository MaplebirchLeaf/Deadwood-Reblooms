// ./src/script/NamedNPCSidebarPortrait/Leighton.ts

import type { MaplebirchCore } from '@scml-dol-maplebirch/types';
import type NPCSidebarPortrait from '../../module/NPCSidebarPortrait';
import { Clothing } from './Clothing';

export default function (maplebirch: MaplebirchCore): void {
  maplebirch.tool.onInit(() => {
    maplebirch.on(':npcInject', data, 'Leighton data');

    function data(npcName: string): void {
      if (npcName !== 'Leighton') return;
      const npc = V.NPCName?.find((data: any) => data?.nam === 'Leighton');
      if (!npc) return;
      npc.hair_side_type = npc.gender === 'm' ? 'all down' : 'neat bun';
      npc.hair_fringe_type = 'split';
      npc.hair_sides_length = npc.gender === 'm' ? 200 : 600;
      npc.hair_fringe_length = npc.gender === 'm' ? 0 : 200;
    }

    const wardrobe = maplebirch.npc.Clothes.wardrobe;
    const sidebar = maplebirch.get('NPCSidebarPortrait') as NPCSidebarPortrait;
    const male = wardrobe.get('male_underwear') ?? {};
    const female = wardrobe.get('female_underwear') ?? {};
    wardrobe.base('Leighton', clothes => {
      for (const item of Object.values(C.npc?.Leighton?.pronoun === 'm' ? male : female)) sidebar.apply(clothes, item);
    });
    // Widgets Named Npcs 注册 teacher；办公室、巡查及妓院会面采用商务装，在场沿用原版 V.npc。
    wardrobe.wear('Leighton', '*', 'business_suit_male', () => C.npc?.Leighton?.pronoun === 'm');
    wardrobe.wear('Leighton', '*', 'business_suit_female', () => C.npc?.Leighton?.pronoun !== 'm');
    wardrobe.modify('Leighton', (clothes, context) => {
      if (context.key === 'business_suit_female') sidebar.apply(clothes, Clothing.horsebit_loafers);
    });
  });
}
