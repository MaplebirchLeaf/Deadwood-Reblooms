// ./src/script/SidebarPortrait.ts

import type { MaplebirchCore } from '@scml-dol-maplebirch/types';
import type SidebarPortrait from '../module/NPCSidebarPortrait';
import AlexSidebar from './NamedNPCSidebarPortrait/Alex';
import AverySidebar from './NamedNPCSidebarPortrait/Avery';
import EdenSidebar from './NamedNPCSidebarPortrait/Eden';
import KylarSidebar from './NamedNPCSidebarPortrait/Kylar';
import GwylanSidebar from './NamedNPCSidebarPortrait/Gwylan';
import NPCOutfitSets from './NamedNPCSidebarPortrait/NPCOutfitSets';
import RobinSidebar from './NamedNPCSidebarPortrait/Robin';
import SydneySidebar from './NamedNPCSidebarPortrait/Sydney';
import WhitneySidebar from './NamedNPCSidebarPortrait/Whitney';
import { preferColours } from './NamedNPCSidebarPortrait/Preference';

export default function (maplebirch: MaplebirchCore) {
  const sidebar = maplebirch.get('NPCSidebarPortrait') as SidebarPortrait;
  const wardrobe = maplebirch.npc.Clothes.wardrobe;
  const pyjamaColours = new Map<string, string>();
  const robinColours = {
    school: new Map<string, string>(),
    schoolOutfit: new Map<string, string>(),
    outfit: new Map<string, string>(),
    clothes: new Map<string, string>(),
    christmas: new Map<string, string>()
  };
  const sydneyColours = {
    school: new Map<string, string>(),
    schoolOutfit: new Map<string, string>(),
    swim: new Map<string, string>(),
    cow: undefined as string | undefined
  };
  const kylarColours = {
    school: new Map<string, string>(),
    schoolOutfit: new Map<string, string>(),
    clothes: new Map<string, string>(),
    christmas: new Map<string, string>(),
    roseEyepatch: undefined as 'none' | 'alt' | undefined
  };
  const whitneyColours = {
    school: new Map<string, string>(),
    schoolOutfit: new Map<string, string>(),
    outfit: new Map<string, string>(),
    clothes: new Map<string, string>()
  };
  const gwylanColours = {
    outfit: new Map<string, string>()
  };
  const averyColours = {
    outfit: new Map<string, string>()
  };
  const alexColours = {
    outfit: new Map<string, string>()
  };

  RobinSidebar(maplebirch, robinColours);
  SydneySidebar(maplebirch, sydneyColours);
  KylarSidebar(maplebirch, kylarColours);
  WhitneySidebar(maplebirch, whitneyColours);
  GwylanSidebar(maplebirch, gwylanColours);
  AverySidebar(maplebirch, averyColours);
  AlexSidebar(maplebirch, alexColours);
  EdenSidebar(maplebirch);
  NPCOutfitSets(maplebirch);

  function pyjamaColour(npcName: string): string {
    const isMale = C.npc?.[npcName]?.pronoun === 'm';
    const genderWeights: Record<string, number> = isMale ? { blue: 6, teal: 3, white: 3, black: 2, purple: 1, red: 1 } : { pink: 6, purple: 4, white: 4, blue: 2, teal: 2, red: 1, black: 1 };
    const weights = npcName === 'Robin' || npcName === 'Sydney' ? preferColours(npcName, genderWeights, !isMale) : genderWeights;
    return sidebar.randomColour(setup.clothes.upper[2].colour_options as string[], weights);
  }

  maplebirch.dynamic.regTimeEvent('onDay', 'npcsidebar', {
    action: () => {
      for (const npcName of ['Robin', 'Sydney']) pyjamaColours.set(npcName, pyjamaColour(npcName));
      for (const colours of [robinColours, sydneyColours, kylarColours, whitneyColours]) {
        colours.school.clear();
        colours.schoolOutfit.clear();
      }
      robinColours.outfit.clear();
      robinColours.clothes.clear();
      robinColours.christmas.clear();
      sydneyColours.swim.clear();
      sydneyColours.cow = undefined;
      kylarColours.clothes.clear();
      kylarColours.christmas.clear();
      kylarColours.roseEyepatch = undefined;
      whitneyColours.outfit.clear();
      whitneyColours.clothes.clear();
      gwylanColours.outfit.clear();
      averyColours.outfit.clear();
      alexColours.outfit.clear();
    },
    exact: true
  });

  maplebirch.tool.onInit(() => {
    for (const npcName of ['Robin', 'Sydney']) {
      wardrobe.modify(npcName, (clothes, context) => {
        if (context.key !== 'pyjama') return;
        const colour = pyjamaColours.get(npcName);
        if (!colour) return;
        if (clothes.upper) clothes.upper.colour = colour;
        if (clothes.lower) clothes.lower.colour = colour;
      });
    }
  });
}
