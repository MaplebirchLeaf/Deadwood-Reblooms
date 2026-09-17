// ./src/script/NamedNPCSidebarPortrait/Darryl.ts

import type { MaplebirchCore } from '@scml-dol-maplebirch/types';
import type NPCSidebarPortrait from '../../module/NPCSidebarPortrait';
import { Clothing } from './Clothing';

type Resource = { name: string; colour_options?: string[]; accessory_colour_options?: string[] };

export default function (maplebirch: MaplebirchCore, colours: { outfit: Map<string, string> }): void {
  maplebirch.tool.onInit(() => {
    maplebirch.on(':npcInject', data, 'Darryl data');

    function data(npcName: string): void {
      if (npcName !== 'Darryl') return;
      V.maplebirch.npc.darryl.tucked = [true, true];
      const npc = V.NPCName?.find((data: any) => data?.nam === 'Darryl');
      if (!npc) return;
      npc.hair_side_type = 'sleek';
      npc.hair_fringe_type = 'framed';
      npc.hair_sides_length = npc.gender === 'm' ? 200 : 400;
      npc.hair_fringe_length = npc.gender === 'm' ? 0 : 200;
    }

    const sidebar = maplebirch.get('NPCSidebarPortrait') as NPCSidebarPortrait;
    const wardrobe = maplebirch.npc.Clothes.wardrobe;
    const male = wardrobe.get('male_underwear') ?? {};
    const female = wardrobe.get('female_underwear') ?? {};
    wardrobe.base('Darryl', clothes => {
      for (const item of Object.values(C.npc?.Darryl?.pronoun === 'm' ? male : female)) sidebar.apply(clothes, item);
    });

    // Widgets Named Npcs 固定选择 formal；办公室、吧台和救援均沿用该正装。
    wardrobe.wear('Darryl', '*', 'tuxedo_formal', () => C.npc?.Darryl?.pronoun === 'm');
    wardrobe.wear('Darryl', '*', 'evening_gown', () => C.npc?.Darryl?.pronoun !== 'm');
    wardrobe.modify('Darryl', (clothes, context) => {
      sidebar.apply(clothes, { ...Clothing.glasses, colour: 'black' });
      if (context.key !== 'evening_gown') return;
      const upper: Resource | undefined = setup.clothes.upper.find((item: Resource) => item.name === 'evening gown');
      const lower: Resource | undefined = setup.clothes.lower.find((item: Resource) => item.name === 'evening gown skirt');
      const options = upper?.colour_options?.filter(
        colour => lower?.colour_options?.includes(colour) && upper.accessory_colour_options?.includes(colour) && lower.accessory_colour_options?.includes(colour)
      );
      if (options?.length && !colours.outfit.has('gown')) colours.outfit.set('gown', sidebar.randomColour(options, Object.fromEntries(options.map(colour => [colour, 1]))));
      const colour = colours.outfit.get('gown');
      for (const slot of ['upper', 'lower'] as const) {
        if (!clothes[slot]) continue;
        clothes[slot].pattern = 0;
        if (colour) clothes[slot].colour = clothes[slot].accessory_colour = colour;
      }
      const feet = clothes.feet;
      if (!feet || !colour) return;
      const resource: Resource | undefined = setup.clothes.feet.find((item: Resource) => item.name === feet.name);
      const shades: Record<string, string> = { 'navy blue': 'blue', wine: 'red', lilac: 'purple', 'light pink': 'pink' };
      const shoeColour = shades[colour] ?? colour;
      if (resource?.colour_options?.includes(shoeColour)) feet.colour = shoeColour;
      if (resource?.accessory_colour_options?.includes(shoeColour)) feet.accessory_colour = shoeColour;
    });
  });
}
