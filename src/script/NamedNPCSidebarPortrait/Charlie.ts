// ./src/script/NamedNPCSidebarPortrait/Charlie.ts

import type { MaplebirchCore } from '@scml-dol-maplebirch/types';
import type NPCSidebarPortrait from '../../module/NPCSidebarPortrait';
import { Clothing } from './Clothing';

type DanceResource = { name: string; colour_options?: string[]; accessory_colour_options?: string[] };

export default function (maplebirch: MaplebirchCore, colours: { outfit: Map<string, string> }): void {
  maplebirch.tool.onInit(() => {
    maplebirch.on(':npcInject', data, 'Charlie data');

    function data(npcName: string): void {
      if (npcName !== 'Charlie') return;
      const npc = V.NPCName?.find((data: any) => data?.nam === 'Charlie');
      if (!npc) return;
      npc.hair_fringe_type = 'thin flaps';
      npc.hair_side_type = 'short';
      if (npc.gender !== 'm') {
        npc.hair_sides_length = 600;
        npc.hair_fringe_length = 400;
      } else {
        npc.hair_sides_length = 400;
        npc.hair_fringe_length = 200;
      }
    }

    const sidebar = maplebirch.get('NPCSidebarPortrait') as NPCSidebarPortrait;
    const wardrobe = maplebirch.npc.Clothes.wardrobe;
    wardrobe.wear('Charlie', '*', 'dance_leotard');
    wardrobe.modify('Charlie', clothes => {
      if (!colours.outfit.has('variant')) {
        const roll = Math.random() * 10;
        colours.outfit.set('variant', roll < 6 ? 'skimpy' : roll < 8 ? 'plain' : roll < 9 ? 'latex' : 'turtleneck');
      }
      const variants = {
        plain: [Clothing.leotard, Clothing.leotard_bottom],
        latex: [Clothing.latex_leotard, Clothing.latex_leotard_bottom],
        turtleneck: [Clothing.turtleneck_leotard, Clothing.turtleneck_leotard_bottom]
      };
      const variant = colours.outfit.get('variant') as keyof typeof variants;
      for (const item of variants[variant] ?? []) sidebar.apply(clothes, item);
      const upper: DanceResource | undefined = setup.clothes.under_upper.find((item: DanceResource) => item.name === clothes.under_upper?.name);
      const lower: DanceResource | undefined = setup.clothes.under_lower.find((item: DanceResource) => item.name === clothes.under_lower?.name);
      const feet: DanceResource | undefined = setup.clothes.feet.find((item: DanceResource) => item.name === 'ballet pumps');
      const choices = [
        ['leotard', upper?.colour_options?.filter(colour => lower?.colour_options?.includes(colour))],
        ['feet', feet?.colour_options],
        ['feet.accessory', feet?.accessory_colour_options]
      ] as const;
      for (const [key, options] of choices) {
        if (!options?.length) continue;
        if (!colours.outfit.has(key)) colours.outfit.set(key, sidebar.randomColour(options, Object.fromEntries(options.map(colour => [colour, 1]))));
      }
      const colour = colours.outfit.get('leotard');
      if (colour) {
        if (clothes.under_upper) clothes.under_upper.colour = colour;
        if (clothes.under_lower) clothes.under_lower.colour = colour;
      }
      if (clothes.feet) {
        clothes.feet.colour = colours.outfit.get('feet') ?? clothes.feet.colour;
        clothes.feet.accessory_colour = colours.outfit.get('feet.accessory') ?? clothes.feet.accessory_colour;
      }
    });
  });
}
