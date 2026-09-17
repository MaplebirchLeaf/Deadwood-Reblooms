// ./src/script/NamedNPCSidebarPortrait/Sirris.ts

import type { MaplebirchCore } from '@scml-dol-maplebirch/types';
import type NPCSidebarPortrait from '../../module/NPCSidebarPortrait';
import { Clothing } from './Clothing';

export default function (maplebirch: MaplebirchCore, colours: { outfit: Map<string, string> }): void {
  maplebirch.tool.onInit(() => {
    maplebirch.on(':npcInject', data, 'Sirris data');

    function data(npcName: string): void {
      if (npcName !== 'Sirris') return;
      V.maplebirch.npc.sirris.tucked = [true, true];
      const npc = V.NPCName?.find((data: any) => data?.nam === 'Sirris');
      if (!npc) return;
      npc.hair_side_type = 'ponytail';
      npc.hair_fringe_type = 'straight tails';
      npc.hair_sides_length = npc.gender === 'm' ? 400 : 800;
      npc.hair_fringe_length = npc.gender === 'm' ? 200 : 400;
    }

    const wardrobe = maplebirch.npc.Clothes.wardrobe;
    const sidebar = maplebirch.get('NPCSidebarPortrait') as NPCSidebarPortrait;
    const male = wardrobe.get('male_underwear') ?? {};
    const female = wardrobe.get('female_underwear') ?? {};
    wardrobe.base('Sirris', clothes => {
      for (const item of Object.values(C.npc?.Sirris?.pronoun === 'm' ? male : female)) sidebar.apply(clothes, item);
    });
    // Widgets Named Npcs 的 teacher：学校采用衬衫与夹克、领带和长裤，在场仍由 V.npc 决定。
    wardrobe.wear('Sirris', '*', 'business_suit_male', () => V.location === 'school');
    // townTurtleneck/townCollar 对应成人商店与日常便装；两套按日固定，男女均采用长裤。
    const outfits = ['turtleneck_jeans', 'shirt_khakis'] as const;
    for (const key of outfits)
      wardrobe.wear('Sirris', '*', key, () => {
        if (V.location === 'school') return false;
        if (!colours.outfit.has('town')) colours.outfit.set('town', outfits[Math.floor(Math.random() * outfits.length)]);
        return colours.outfit.get('town') === key;
      });
    wardrobe.modify('Sirris', clothes => sidebar.apply(clothes, Clothing.cordovan_loafers));
  });
}
