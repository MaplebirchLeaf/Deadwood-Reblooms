// ./src/script/NPCSidebarPortrait.ts

import type SidebarPortrait from '../module/NPCSidebarPortrait';
import type { MaplebirchCore } from '@scml-dol-maplebirch/types';
import AlexSidebar from './NamedNPCSidebarPortrait/Alex';
import AverySidebar from './NamedNPCSidebarPortrait/Avery';
import BaileySidebar from './NamedNPCSidebarPortrait/Bailey';
import BriarSidebar from './NamedNPCSidebarPortrait/Briar';
import CharlieSidebar from './NamedNPCSidebarPortrait/Charlie';
import { preferColours } from './NamedNPCSidebarPortrait/Common/Preference';
import DarrylSidebar from './NamedNPCSidebarPortrait/Darryl';
import DorenSidebar from './NamedNPCSidebarPortrait/Doren';
import EdenSidebar from './NamedNPCSidebarPortrait/Eden';
import GwylanSidebar from './NamedNPCSidebarPortrait/Gwylan';
import HarperSidebar from './NamedNPCSidebarPortrait/Harper';
import IvoryWraithSidebar from './NamedNPCSidebarPortrait/IvoryWraith';
import JordanSidebar from './NamedNPCSidebarPortrait/Jordan';
import KylarSidebar from './NamedNPCSidebarPortrait/Kylar';
import LandrySidebar from './NamedNPCSidebarPortrait/Landry';
import LeightonSidebar from './NamedNPCSidebarPortrait/Leighton';
import MasonSidebar from './NamedNPCSidebarPortrait/Mason';
import MorganSidebar from './NamedNPCSidebarPortrait/Morgan';
import NPCOutfitSets from './NamedNPCSidebarPortrait/NPCOutfitSets';
import NikiSidebar from './NamedNPCSidebarPortrait/Niki';
import QuinnSidebar from './NamedNPCSidebarPortrait/Quinn';
import RemySidebar from './NamedNPCSidebarPortrait/Remy';
import RiverSidebar from './NamedNPCSidebarPortrait/River';
import RobinSidebar from './NamedNPCSidebarPortrait/Robin';
import SamSidebar from './NamedNPCSidebarPortrait/Sam';
import SirrisSidebar from './NamedNPCSidebarPortrait/Sirris';
import SydneySidebar from './NamedNPCSidebarPortrait/Sydney';
import WhitneySidebar from './NamedNPCSidebarPortrait/Whitney';
import WinterSidebar from './NamedNPCSidebarPortrait/Winter';
import WrenSidebar from './NamedNPCSidebarPortrait/Wren';
import ZephyrSidebar from './NamedNPCSidebarPortrait/Zephyr';

export default function (maplebirch: MaplebirchCore) {
  const sidebar = maplebirch.get('NPCSidebarPortrait') as SidebarPortrait;
  const wardrobe = maplebirch.npc.Clothes.wardrobe;
  // 各角色的颜色缓存只在这次运行中复用，不写入 SugarCube 存档，换装脚本负责按当前剧情重算。
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
  const darrylColours = { outfit: new Map<string, string>() };
  const charlieColours = { outfit: new Map<string, string>() };
  const landryColours = { outfit: new Map<string, string>() };
  const nikiColours = { outfit: new Map<string, string>() };
  const masonColours = { outfit: new Map<string, string>() };
  const dorenColours = { outfit: new Map<string, string>() };
  const sirrisColours = { outfit: new Map<string, string>() };
  const alexColours = {
    outfit: new Map<string, string>()
  };

  RobinSidebar(maplebirch, robinColours);
  SydneySidebar(maplebirch, sydneyColours);
  KylarSidebar(maplebirch, kylarColours);
  WhitneySidebar(maplebirch, whitneyColours);
  GwylanSidebar(maplebirch, gwylanColours);
  AverySidebar(maplebirch);
  BaileySidebar(maplebirch);
  BriarSidebar(maplebirch);
  CharlieSidebar(maplebirch, charlieColours);
  DarrylSidebar(maplebirch, darrylColours);
  HarperSidebar(maplebirch);
  JordanSidebar(maplebirch);
  SamSidebar(maplebirch);
  SirrisSidebar(maplebirch, sirrisColours);
  RiverSidebar(maplebirch);
  DorenSidebar(maplebirch, dorenColours);
  WinterSidebar(maplebirch);
  MasonSidebar(maplebirch, masonColours);
  MorganSidebar(maplebirch);
  NikiSidebar(maplebirch, nikiColours);
  RemySidebar(maplebirch);
  WrenSidebar(maplebirch);
  ZephyrSidebar(maplebirch);
  QuinnSidebar(maplebirch);
  LandrySidebar(maplebirch, landryColours);
  LeightonSidebar(maplebirch);
  AlexSidebar(maplebirch, alexColours);
  EdenSidebar(maplebirch);
  IvoryWraithSidebar(maplebirch);
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
      alexColours.outfit.clear();
      charlieColours.outfit.clear();
      darrylColours.outfit.clear();
      landryColours.outfit.clear();
      sirrisColours.outfit.clear();
      dorenColours.outfit.clear();
      masonColours.outfit.clear();
      nikiColours.outfit.clear();
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
