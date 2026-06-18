import type { CarryItemConfig } from '../src/module/reblooms/CarryItems';

declare global {
  interface Window {}

  function wearingCondom(npcNumber: number): boolean;
  const Renderer: { CanvasModels: { main: any }; [key: string]: any };
  function isPartEnabled(type: string): boolean;
  function playerNormalPregnancyType(): string;
  function isChimeraEnabled(type: string, part: string): boolean;
  function wikifier(widget: string, ...args: any): DocumentFragment;
  const Weather: any;
  const ColourUtils: any;

  function lanSwitch(this: void, ...lanObj: any[]): string;
  function lanSwitch(this: MacroContext, ...lanObj: any[]): HTMLElement;
}

export {};
