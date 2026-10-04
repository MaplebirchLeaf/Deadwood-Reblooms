import type { PlayingCard } from '../src/module/LifeSimulation/Casino/Blackjack';
import type { Security } from '../src/module/VanillaPlus/Finance';

declare module 'twine-sugarcube' {
  interface SugarCubeSetupObject {
    DeadwoodReblooms?: {
      finance?: {
        securities?: readonly Security[];
      };
    };
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

  function lanSwitch(this: void, ...lanObj: any[]): string;
  function lanSwitch(this: MacroContext, ...lanObj: any[]): HTMLElement;
}
