import { beforeEach, describe, expect, test } from 'bun:test';
import WhitneyOutfitSets from '../src/script/NamedNPCSidebarPortrait/NPCOutfitSets/Whitney';

let init: () => void;
const events = new Map<string, (...args: any[]) => void>();
const modifiers: Array<(clothes: Record<string, any>, context: { key: string }) => void> = [];
const outfit = {
  upper: { slot: 'upper', name: 'school sweater vest', integrity: 200, plural: 0, cn_name_cap: '学校毛衣背心', type: ['school'], gender: 'n' },
  lower: { slot: 'lower', name: 'short school skirt', integrity: 80, plural: 0, cn_name_cap: '短校服裙', type: ['school'], gender: 'f', skirt_down: 1 }
};
const wardrobe = {
  get: () => outfit,
  modify: (_npcName: string, modifier: (clothes: Record<string, any>, context: { key: string }) => void) => modifiers.push(modifier),
  worn: () => {
    const clothes = structuredClone(outfit);
    for (const modifier of modifiers) modifier(clothes, { key: 'school_uniform_skirt' });
    return clothes;
  }
};

WhitneyOutfitSets({
  npc: {
    Clothes: { wardrobe },
    addClothes: (config: any) => setup.npcClothesSets.push({ ...config, clothes: { upper: config.upper, lower: config.lower } })
  },
  tool: { onInit: (callback: () => void) => (init = callback) },
  on: (event: string, callback: (...args: any[]) => void) => events.set(event, callback)
} as never);

beforeEach(() => {
  events.clear();
  modifiers.length = 0;
  Object.assign(globalThis, {
    C: { npc: { Whitney: { pronoun: 'f', penis: 'none', vagina: 'clothed', chest: 'clothed', clothes: { set: 'femaleDefault' } } } },
    setup: { npcClothesSets: [] }
  });
  init();
});

describe('Whitney NPC outfit sets', () => {
  test('replaces the vanilla outfit with the current sidebar outfit', () => {
    events.get(':npcInit')?.('Whitney');
    expect(C.npc.Whitney.clothes).toEqual({
      set: 'whitney_school_uniform_skirt',
      upper: { name: 'school sweater vest', integrity: 200 },
      lower: { name: 'short school skirt', integrity: 80 }
    });
    expect(C.npc.Whitney.outfits).toContain('whitney_school_uniform_skirt');
  });
});
