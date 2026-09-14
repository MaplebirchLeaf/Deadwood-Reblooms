import { beforeEach, describe, expect, test } from 'bun:test';
import KylarOutfitSets from '../src/script/NamedNPCSidebarPortrait/NPCOutfitSets/Kylar';

let init: () => void;
const events = new Map<string, (...args: any[]) => void>();
const modifiers: Array<(clothes: Record<string, any>, context: { key: string }) => void> = [];
const mummy = {
  upper: { slot: 'upper', name: 'mummy wrap', integrity: 70, plural: 0, cn_name_cap: '木乃伊裹布', type: ['costume'], gender: 'n' },
  lower: { slot: 'lower', name: 'mummy wrap skirt', integrity: 70, plural: 0, cn_name_cap: '木乃伊裹裙', type: ['costume'], gender: 'n', skirt_down: 1 }
};
const wardrobe = {
  get: () => mummy,
  modify: (_npcName: string, modifier: (clothes: Record<string, any>, context: { key: string }) => void) => modifiers.push(modifier),
  worn: () => {
    const clothes = structuredClone(mummy);
    for (const modifier of modifiers) modifier(clothes, { key: 'mummy' });
    return clothes;
  }
};

KylarOutfitSets({
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
    C: { npc: { Kylar: { pronoun: 'f', penis: 'clothed', vagina: 'none', chest: 'clothed', clothes: { set: 'coldTrench' } } } },
    setup: { npcClothesSets: [] }
  });
  init();
});

describe('Kylar NPC outfit sets', () => {
  test('replaces the vanilla clothes with the currently worn sidebar outfit', () => {
    events.get(':npcInit')?.('Kylar');

    expect(C.npc.Kylar.clothes).toEqual({
      set: 'kylar_mummy',
      upper: { name: 'mummy wrap', integrity: 70 },
      lower: { name: 'mummy wrap skirt', integrity: 70 }
    });
  });
});
