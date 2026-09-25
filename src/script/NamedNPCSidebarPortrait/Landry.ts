// ./src/script/NamedNPCSidebarPortrait/Landry.ts

import type { MaplebirchCore } from '@scml-dol-maplebirch/types';
import type NPCSidebarPortrait from '../../module/NPCSidebarPortrait';
import { Clothing } from './Clothing';

export default function (maplebirch: MaplebirchCore, colours: { outfit: Map<string, string> }): void {
  maplebirch.tool.onInit(() => {
    maplebirch.on(':npcInject', data, 'Landry data');

    function data(npcName: string): void {
      if (npcName !== 'Landry') return;
      const npc = V.NPCName?.find((data: any) => data?.nam === 'Landry');
      if (!npc) return;
      npc.hair_side_type = 'straight';
      npc.hair_fringe_type = 'french bob';
      npc.hair_sides_length = npc.gender === 'm' ? 200 : 400;
      npc.hair_fringe_length = npc.gender === 'm' ? 0 : 200;
    }

    const wardrobe = maplebirch.npc.Clothes.wardrobe;
    const sidebar = maplebirch.get('NPCSidebarPortrait') as NPCSidebarPortrait;
    wardrobe.base('Landry', clothes => {
      wardrobe.put(clothes, C.npc?.Landry?.pronoun === 'm' ? 'male_underwear' : 'female_underwear');
    });
    // Pub Intro 与 maleLandry/femaleLandry 分别描述毛衣、开衫和深色长裤；在场沿用原版 V.npc。
    wardrobe.wear('Landry', '*', 'sweater_trousers', () => C.npc?.Landry?.pronoun === 'm');
    wardrobe.wear('Landry', '*', 'cardigan_trousers', () => C.npc?.Landry?.pronoun !== 'm');
    wardrobe.modify('Landry', (clothes, context) => {
      if (context.key !== 'sweater_trousers') return;
      const variants = ['standard', 'cable'] as const;
      if (!colours.outfit.has('sweater')) colours.outfit.set('sweater', variants[Math.floor(Math.random() * variants.length)]);
      if (colours.outfit.get('sweater') === 'cable') sidebar.apply(clothes, { ...Clothing.cable_knit_turtleneck, colour: 'black', exposed: 0, lastTaken: 'wardrobe' });
    });
  });
}
