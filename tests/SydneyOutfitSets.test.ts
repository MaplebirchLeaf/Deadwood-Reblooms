import { beforeEach, describe, expect, test } from 'bun:test';
import SydneyOutfitSets from '../src/script/NamedNPCSidebarPortrait/NPCOutfitSets/Sydney';

let init: () => void;
const events = new Map<string, (...args: any[]) => void>();
const modifiers: Array<(clothes: Record<string, any>, context: { key: string }) => void> = [];
const uniform = {
  upper: { slot: 'upper', name: 'school shirt', integrity: 100, plural: 0, cn_name_cap: '校服衬衫', type: ['school'], gender: 'f' },
  lower: { slot: 'lower', name: 'school skirt', integrity: 120, plural: 0, cn_name_cap: '校服裙', type: ['school'], gender: 'f', skirt_down: 1 }
};
const wardrobe = {
  get: () => uniform,
  modify: (_npcName: string, modifier: (clothes: Record<string, any>, context: { key: string }) => void) => modifiers.push(modifier),
  worn: () => {
    const clothes = structuredClone(uniform);
    for (const modifier of modifiers) modifier(clothes, { key: 'school_uniform_skirt' });
    return clothes;
  }
};

SydneyOutfitSets({
  npc: {
    Clothes: { wardrobe },
    addClothes: (config: any) => {
      setup.npcClothesSets.push({ ...config, clothes: { upper: config.upper, lower: config.lower } });
    }
  },
  tool: {
    onInit: (callback: () => void) => {
      init = callback;
    }
  },
  on: (event: string, callback: (...args: any[]) => void) => events.set(event, callback)
} as never);

beforeEach(() => {
  events.clear();
  modifiers.length = 0;
  Object.assign(globalThis, {
    C: { npc: { Sydney: { penis: 'none', vagina: 0, chest: 'clothed', clothes: { set: 'femaleDefault' } } } },
    setup: { npcClothesSets: [] }
  });
  init();
});

describe('Sydney NPC outfit sets', () => {
  test('replaces the vanilla clothes with the currently worn sidebar outfit', () => {
    events.get(':npcInit')?.('Sydney');

    expect(C.npc.Sydney.clothes).toEqual({
      set: 'sydney_school_uniform_skirt',
      upper: { name: 'school shirt', integrity: 100 },
      lower: { name: 'school skirt', integrity: 120 }
    });
  });

  test('refreshes current clothes on passage changes', () => {
    events.get(':passageinit')?.();

    expect(C.npc.Sydney.clothes.set).toBe('sydney_school_uniform_skirt');
  });
});
