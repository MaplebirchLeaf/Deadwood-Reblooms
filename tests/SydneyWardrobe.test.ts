import { beforeEach, describe, expect, test } from 'bun:test';
import SydneySidebar from '../src/script/NamedNPCSidebarPortrait/Sydney';

let init: () => void;
const wear: Array<{ location: string | readonly string[]; key: string; condition?: () => boolean }> = [];
const modifiers: Array<(clothes: Record<string, any>, context: { key: string }) => void> = [];
const layers: Array<{ source: string | (() => string); condition?: () => boolean }> = [];
const wardrobe = {
  get: () => ({}),
  base: () => undefined,
  layer: (_npcName: string, source: string | (() => string), condition?: () => boolean) => layers.push({ source, condition }),
  put: () => undefined,
  strip: (clothes: Record<string, any>, slot: string | readonly string[]) => {
    for (const key of typeof slot === 'string' ? [slot] : slot) clothes[key] = { slot: key, name: 'naked', index: 0, type: ['naked'] };
  },
  wear: (_npcName: string, location: string | readonly string[], key: string, condition?: () => boolean) => {
    wear.push({ location, key, condition });
  },
  modify: (_npcName: string, modifier: (clothes: Record<string, any>, context: { key: string }) => void) => modifiers.push(modifier),
  wet: () => undefined
};
const core = {
  passage: { title: '' },
  npc: { addSchedule: () => undefined, Clothes: { wardrobe } },
  tool: {
    onInit: (callback: () => void) => {
      init = callback;
    }
  },
  on: () => undefined,
  get: () => ({
    apply: (clothes: Record<string, any>, item: { slot: string }) => {
      clothes[item.slot] = item;
    },
    randomColour: (options: readonly string[]) => options[0]
  })
} as never;

SydneySidebar(core, { school: new Map(), schoolOutfit: new Map(), swim: new Map() });

beforeEach(() => {
  wear.length = 0;
  modifiers.length = 0;
  layers.length = 0;
  Object.assign(globalThis, {
    C: { npc: { Sydney: { pronoun: 'f', corruption: 0, purity: 50, chastity: {} } } },
    V: { sydney: { rank: 'monk', swim: 'normal' }, sydneyromance: 0 },
    setup: { clothes: {} },
    window: { isLoveInterest: () => false }
  });
  init();
});

function dressed(): Record<string, any> {
  return {
    upper: { name: 'shirt' },
    lower: { name: 'skirt' },
    under_upper: { name: 'bra' },
    under_lower: { name: 'panties' },
    head: { name: 'hairpin' },
    face: { name: 'glasses' },
    neck: { name: 'holy pendant' },
    genitals: { name: 'chastity belt' }
  };
}

function apply(clothes: Record<string, any>, title: string, key = 'nun_habit'): void {
  core.passage.title = title;
  for (const modifier of modifiers) modifier(clothes, { key });
}

function visible(clothes: Record<string, any>): string[] {
  return Object.entries(clothes)
    .filter(([, item]) => item.name !== 'naked')
    .map(([slot]) => slot)
    .sort();
}

describe('Sydney story clothing', () => {
  test('uses conditional gendered underwear as a base layer', () => {
    expect(layers).toHaveLength(1);
    expect((layers[0].source as () => string)()).toBe('female_underwear');
    expect(layers[0].condition?.()).toBeTrue();

    C.npc.Sydney.corruption = 10;
    expect(layers[0].condition?.()).toBeFalse();
  });

  test('registers the waist apron for helping at the shop', () => {
    expect(wear.some(rule => rule.location === 'shop' && rule.key === 'waist_apron')).toBeTrue();
  });

  test('keeps cow clothes unchanged while the original hands catalogue is unavailable', () => {
    const clothes = dressed();
    clothes.hands = { index: 16, name: 'cow gloves' };

    expect(() => apply(clothes, 'Adult Shop Opening', 'cow_onesie')).not.toThrow();
    expect(clothes.hands.name).toBe('cow gloves');
  });

  test('keeps school clothes unchanged while the original upper catalogue is unavailable', () => {
    const clothes = dressed();
    clothes.upper = { index: 16, name: 'school cardigan' };

    expect(() => apply(clothes, 'School', 'cardigan_sailor_uniform')).not.toThrow();
    expect(clothes.upper.accessory_colour).toBeUndefined();
  });

  test('removes all clothing in paint passages', () => {
    const clothes = dressed();
    clothes.lower = { name: 'waist apron' };

    apply(clothes, 'Dilapidated Paint Suit Romance', 'naked');

    expect(visible(clothes)).toEqual(['genitals']);
  });

  test('shows full nudity during temple tests, rituals, vigils, and the nightmare', () => {
    for (const title of ['Sydney Temple Test 2', 'Sydney Temple Pure Ritual', 'Sydney Temple Corrupt End', 'Temple Vigil 10', 'Nightmare Corrupt Sydney Rape']) {
      const clothes = dressed();
      apply(clothes, title);
      expect(visible(clothes)).toEqual(['genitals']);
    }
  });

  test('removes only outer lower clothing in the canteen reveal', () => {
    const clothes = dressed();
    apply(clothes, 'Sydney Canteen Encourage', 'school_uniform_skirt');

    expect(clothes.lower?.name).toBe('naked');
    expect(clothes.under_lower?.name).toBe('panties');
    expect(clothes.upper?.name).toBe('shirt');
  });

  test('shows underwear or nudity according to the changing-room branch', () => {
    const underwear = dressed();
    apply(underwear, 'Sydney Shopping Swim Enter');
    expect(visible(underwear)).toEqual(['face', 'genitals', 'head', 'neck', 'under_lower', 'under_upper']);

    C.npc.Sydney.corruption = 20;
    V.sydneyromance = 1;
    const naked = dressed();
    apply(naked, 'Sydney Shopping Swim Enter');
    expect(visible(naked)).toEqual(['genitals']);
  });

  test('removes Sydney lower clothing throughout the library spanking', () => {
    const clothes = dressed();
    apply(clothes, 'Sydney Leighton Spank 2', 'school_uniform_skirt');

    expect(clothes.lower?.name).toBe('naked');
    expect(clothes.under_lower?.name).toBe('panties');

    V.phase = 2;
    const groped = dressed();
    apply(groped, 'Sydney Leighton Spank 2', 'school_uniform_skirt');
    expect(groped.under_lower?.name).toBe('naked');
  });

  test('shows the visible changing-room undress after the rainy promenade', () => {
    C.npc.Sydney.corruption = 20;
    V.sydneyromance = 1;
    const clothes = dressed();
    apply(clothes, 'Sydney Beach Promenade Changing Rooms');

    expect(clothes.upper?.name).toBe('naked');
    expect(clothes.lower?.name).toBe('naked');
    expect(clothes.face?.name).toBe('glasses');
  });
});
