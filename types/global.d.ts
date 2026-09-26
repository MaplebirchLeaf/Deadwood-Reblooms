import type { CarryItemConfig } from '../src/module/reblooms/CarryItems';
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
    isLoveInterest(name: string): boolean;
    isPossibleLoveInterest(name: string): boolean;
    mapMove: ((destination: string) => void) & { deadwoodPublicWalk?: boolean };
    LZString: {
      compressToBase64(input: string): string;
      decompressFromBase64(input: string): string | null;
    };
    saveAs(blob: Blob, filename: string): void;
    breakableSoftBinding(): boolean;
    playerChastity(slots?: string | readonly string[], inAllSlots?: boolean): boolean;
    playerPenisSize(): number;
    npcHasStrapon(index?: number): boolean;
    hasSexStat(input: string, required: number, modifiers?: boolean): boolean;
    currentSkillValue(skill: string, disableModifiers?: number): number;
    CombatRenderer: {
      indices: { xrayPenetrator2: number; xrayCondom2: number };
      getCondomOptions(condom: unknown): { colour: unknown };
    };
    NpcCombatMapper: { getNpcPenetratorFilter(npc: unknown): unknown };
    XrayCombatMapper: { mapXrayPlayerPenis(options: unknown, penetrator: unknown): void };
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
