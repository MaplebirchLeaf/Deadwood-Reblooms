import type { CarryItemConfig } from '../src/module/reblooms/CarryItems';

declare module 'twine-sugarcube/userdata' {
  export interface SugarCubeSetupObject {
    DeadwoodReblooms?: DeadwoodRebloomsSetupConfig;
    deadwoodReblooms?: DeadwoodRebloomsSetupConfig;
    maplebirch: {
      DeadwoodReblooms?: DeadwoodRebloomsSetupConfig;
      deadwoodReblooms?: DeadwoodRebloomsSetupConfig;
      [key: string]: any;
    };
  }
}

interface DeadwoodRebloomsSetupConfig {
  items?: Record<string, CarryItemConfig> | CarryItemConfig[];
  itemFiles?: string[];
}

declare global {
  interface Window {}

  function wearingCondom(npcNumber: number): boolean;
  const Renderer: { CanvasModels: { main: any }; [key: string]: any };
  function wikifier(widget: string, ...args: any): DocumentFragment;
  const Weather: any;
  const ColourUtils: any;
}

export {};
