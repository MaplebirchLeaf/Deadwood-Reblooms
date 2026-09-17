// ./src/script/NamedNPCSidebarPortrait/Doren.ts

import type { MaplebirchCore } from '@scml-dol-maplebirch/types';
import type NPCSidebarPortrait from '../../module/NPCSidebarPortrait';
import { Clothing } from './Clothing';
import trainers from './Common/Trainers';

export default function (maplebirch: MaplebirchCore, colours: { outfit: Map<string, string> }): void {
  maplebirch.tool.onInit(() => {
    maplebirch.on(':npcInject', data, 'Doren data');

    function data(npcName: string): void {
      if (npcName !== 'Doren') return;
      V.maplebirch.npc.doren.tucked = [true, true];
      const npc = V.NPCName?.find((data: any) => data?.nam === npcName);
      if (!npc) return;
      npc.hair_side_type = 'ruffled';
      npc.hair_fringe_type = 'ruffled';
      npc.hair_sides_length = npc.gender === 'm' ? 400 : 800;
      npc.hair_fringe_length = npc.gender === 'm' ? 200 : 400;
    }

    const wardrobe = maplebirch.npc.Clothes.wardrobe;
    const sidebar = maplebirch.get('NPCSidebarPortrait') as NPCSidebarPortrait;
    const male = wardrobe.get('male_underwear') ?? {};
    const female = wardrobe.get('female_underwear') ?? {};
    wardrobe.base('Doren', clothes => {
      for (const item of Object.values(C.npc?.Doren?.pronoun === 'm' ? male : female)) sidebar.apply(clothes, item);
    });
    // Doren Jog 明确穿跑鞋一起慢跑；只选择服装，在场仍由原版 npc Doren 决定。
    wardrobe.wear('Doren', '*', 'tracksuit', () => maplebirch.passage.title === 'Doren Jog');
    wardrobe.modify('Doren', (clothes, context) => {
      if (context.key !== 'tracksuit') return;
      if (C.npc?.Doren?.pronoun !== 'm') sidebar.apply(clothes, Clothing.sports_bra);
      if (!colours.outfit.has('sport')) colours.outfit.set('sport', Math.random() < 0.5 ? 'jacket' : 'shirt');
      if (colours.outfit.get('sport') === 'shirt') sidebar.apply(clothes, Clothing.jersey_shirt);
      if (C.npc?.Doren?.pronoun !== 'm') {
        if (!colours.outfit.has('sport.lower')) colours.outfit.set('sport.lower', Math.random() < 0.5 ? 'trousers' : 'skort');
        if (colours.outfit.get('sport.lower') === 'skort') sidebar.apply(clothes, Clothing.open_side_skort);
      }
      // 上下装主色取各自资源的共同选项；运动衫的配饰色也与裤子的配饰选项保持一致。
      let palette =
        colours.outfit.get('sport') === 'shirt'
          ? ['black', 'white', 'light pink', 'red', 'tangerine', 'teal']
          : ['black', 'blue steel', 'grey', 'white', 'light pink', 'light blue', 'light green', 'sand', 'red', 'pink', 'purple', 'tangerine', 'teal', 'neon blue'];
      if (clothes.lower?.name === 'open-side skort') palette = palette.filter(colour => ['black', 'white', 'pink', 'purple', 'red', 'tangerine', 'teal'].includes(colour));
      if (!colours.outfit.has('sport.colour')) colours.outfit.set('sport.colour', sidebar.randomColour(palette));
      if (!colours.outfit.has('sport.accessory')) colours.outfit.set('sport.accessory', sidebar.randomColour(['black', 'white']));
      for (const slot of ['upper', 'lower'] as const) {
        if (!clothes[slot]) continue;
        clothes[slot].colour = colours.outfit.get('sport.colour')!;
        clothes[slot].accessory_colour = colours.outfit.get('sport.accessory')!;
      }
      sidebar.apply(clothes, C.npc?.Doren?.pronoun === 'm' ? Clothing.boys_gym_socks : Clothing.girls_gym_socks);
    });
    trainers(maplebirch, 'Doren', colours.outfit);
  });
}
