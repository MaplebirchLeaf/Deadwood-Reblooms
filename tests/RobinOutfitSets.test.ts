import { beforeEach, describe, expect, test } from 'bun:test';
import RobinOutfitSets from '../src/script/NamedNPCSidebarPortrait/NPCOutfitSets/Robin';

let init: () => void;
let currentKey = 'school_uniform_skirt';
const events = new Map<string, (...args: any[]) => void>();
const modifiers: Array<(clothes: Record<string, any>, context: { key: string }) => void> = [];
const templates: Record<string, Record<string, any>> = {
  school_uniform_skirt: {
    upper: { slot: 'upper', name: 'school shirt', integrity: 100, plural: 0, cn_name_cap: '校服衬衫', type: ['school'], gender: 'f' },
    lower: { slot: 'lower', name: 'school skirt', integrity: 120, plural: 0, cn_name_cap: '校服裙', type: ['school'], gender: 'f', skirt_down: 1 }
  },
  gift_wrap: {
    upper: { slot: 'upper', name: 'gift wrap top', integrity: 20, plural: 0, cn_name_cap: '礼物包装上衣', type: ['costume'], gender: 'n' },
    lower: { slot: 'lower', name: 'gift wrap skirt', integrity: 20, plural: 0, cn_name_cap: '礼物包装下装', type: ['costume'], gender: 'n' }
  }
};
const wardrobe = {
  get: (key: string) => templates[key],
  modify: (_npcName: string, modifier: (clothes: Record<string, any>, context: { key: string }) => void) => modifiers.push(modifier),
  worn: () => {
    const clothes = structuredClone(templates[currentKey] ?? {});
    for (const modifier of modifiers) modifier(clothes, { key: currentKey });
    return clothes;
  }
};

RobinOutfitSets({
  npc: {
    Clothes: { wardrobe },
    addClothes: (config: any) => setup.npcClothesSets.push({ ...config, clothes: { upper: config.upper, lower: config.lower } })
  },
  tool: {
    onInit: (callback: () => void) => {
      init = callback;
    }
  },
  on: (event: string, callback: (...args: any[]) => void) => events.set(event, callback)
} as never);

beforeEach(() => {
  currentKey = 'school_uniform_skirt';
  events.clear();
  modifiers.length = 0;
  Object.assign(globalThis, {
    C: { npc: { Robin: { penis: 'none', vagina: 0, chest: 'clothed', clothes: { set: 'femaleDefault' } } } },
    setup: {
      npcClothesSets: [
        {
          name: 'naked',
          clothes: {
            upper: { name: 'naked', integrity_max: 100, desc: '裸体' },
            lower: { name: 'naked', integrity_max: 100, desc: '裸体' }
          }
        }
      ]
    }
  });
  init();
});

describe('Robin NPC outfit sets', () => {
  test('replaces vanilla clothes with the current sidebar outfit', () => {
    events.get(':npcInit')?.('Robin');

    expect(C.npc.Robin.clothes).toEqual({
      set: 'robin_school_uniform_skirt',
      upper: { name: 'school shirt', integrity: 100 },
      lower: { name: 'school skirt', integrity: 120 }
    });
    expect(C.npc.Robin.outfits).toContain('robin_gift_wrap');
  });

  test('refreshes naked story states on passage changes', () => {
    events.get(':npcInit')?.('Robin');
    currentKey = 'naked';
    events.get(':passageinit')?.();

    expect(C.npc.Robin.clothes).toEqual({
      set: 'naked',
      upper: { name: 'naked', integrity: 100 },
      lower: { name: 'naked', integrity: 100 }
    });
    expect(C.npc.Robin.chest).toBe(0);
  });
});
