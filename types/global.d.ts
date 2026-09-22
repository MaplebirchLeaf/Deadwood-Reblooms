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
  const Links: { enabled: boolean };

  interface Window {
    isLoveInterest(name: string): boolean;
    isPossibleLoveInterest(name: string): boolean;
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
