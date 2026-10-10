import type { PlayingCard } from '../src/module/LifeSimulation/Casino/Blackjack';
import type { Security, FinanceState } from '../src/module/Finance';
import type { BirdTowerState } from '../src/module/constants';
import type { TransportState } from '../src/module/Transport';

declare module 'twine-sugarcube' {
  interface SugarCubeSetupObject {
    DeadwoodReblooms?: {
      finance?: {
        securities?: readonly Security[];
      };
    };
  }
}

declare module 'twine-sugarcube/userdata' {
  interface SugarCubeStoryVariables {
    /** 鹰塔模块的存档字段。 */
    BirdTower: BirdTowerState;
    Finance: FinanceState;
    Transport: TransportState;
  }
}

declare global {
  interface Array<T> {
    either(weights?: readonly number[], allowNull?: boolean): T | null | undefined;
  }

  interface ReadonlyArray<T> {
    either(weights?: readonly number[], allowNull?: boolean): T | null | undefined;
  }

  const Links: { enabled: boolean };

  interface Window {
    sexShopOnBuyClick(index: number, inSexShop?: boolean, colour?: string, costsMoney?: boolean): void;
    deck(): PlayingCard[];
    shuffle<T>(items: T[]): T[];
    formatMoney(amount: number): string;
    statChange: { stress(amount: number, multiplierOverride?: number): void };
    isLoveInterest(name: string): boolean;
    isPossibleLoveInterest(name: string): boolean;
    getRobinLocation(): string | undefined;
    weekPassed?: () => void;
    getKylarLocation(): { area: string; state: string };
    mapMove: ((destination: string) => void) & { deadwoodPublicWalk?: boolean };
    LZString: {
      compressToBase64(input: string): string;
      decompressFromBase64(input: string): string | null;
    };
    saveAs(blob: Blob, filename: string): void;
    breakableSoftBinding(): boolean;
    pcAreArmsBound(arm?: 'any' | 'both'): boolean;
    playerChastity(slots?: string | readonly string[], inAllSlots?: boolean): boolean;
    playerPenisSize(): number;
    npcHasStrapon(index?: number): boolean;
    hasSexStat(input: string, required: number, modifiers?: boolean): boolean;
    wearingSchoolOutfit?: () => boolean;
    isCrossdressing?: () => boolean;
    Furniture: {
      get(id: string, onlySetup: true): { name: string; nameCap: string; cost: number; type: string[]; iconFile: string } | null;
      setPrice(pounds: number): number;
    };
    currentSkillValue(skill: string, disableModifiers?: number): number;
    Renderer: { CanvasModels: Record<'main' | 'combatMainPc', { layers: CanvasLayerMap }> };
    CombatRenderer: {
      indices: { xrayPenetrator2: number; xrayCondom2: number };
      getCondomOptions(condom: unknown): { colour: unknown };
    };
    NpcCombatMapper: { getNpcPenetratorFilter(npc: unknown): unknown };
    XrayCombatMapper: { mapXrayPlayerPenis(options: unknown, penetrator: unknown): void };
    sydneySchedule?: () => void;
  }

  function wearingCondom(who: number | 'player'): boolean;
  function currentSkillValue(skill: string, disableModifiers: number): number;
  function playerHasStrapon(): boolean;
  const Renderer: { CanvasModels: { main: any }; [key: string]: any };
  function isPartEnabled(type: string): boolean;
  function playerNormalPregnancyType(): string;
  function isChimeraEnabled(type: string, part: string): boolean;
  function orphanagePlotsPlanted(): boolean;
  function orphanagePlotsWatered(): boolean;
  function wikifier(widget: string, ...args: any): DocumentFragment;
  const Weather: any;
  const ColourUtils: any;

  // 原版妊娠与育儿系统的全局函数与常量，鹰塔模块直接复用。
  interface VanillaChild {
    childId: number;
    species: string;
    features: Record<string, any>;
    development: Record<string, any> & { location?: string; activity?: string; trait?: string; stage?: string };
    bornDate?: number | null;
  }

  function getBornChildren(): VanillaChild[];
  function childIsBorn(child: VanillaChild): boolean;
  function pushPregnancyRecord(fields: Record<string, any>): number;
  function pushChildRecord(fields: Record<string, any>): number;
  function beginRearing(child: VanillaChild, location: string, birthLocation: string): void;
  function npcIsPregnant(npc: string): boolean;
  const TimeConstants: { secondsPerDay: number; secondsPerHour: number; secondsPerMinute: number; minutesPerHour: number };

  function lanSwitch(this: void, ...lanObj: any[]): string;
  function lanSwitch(this: MacroContext, ...lanObj: any[]): HTMLElement;
}
