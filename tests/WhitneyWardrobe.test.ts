import { beforeEach, describe, expect, test } from 'bun:test';
import WhitneySidebar from '../src/script/NamedNPCSidebarPortrait/Whitney';

let init: () => void;
let base: (clothes: Record<string, any>, context: { key: string }) => void;
const wear: Array<{ location: string | readonly string[]; key: string; condition?: () => boolean }> = [];
const modifiers: Array<(clothes: Record<string, any>, context: { key: string; location: string }) => void> = [];
const colours = { school: new Map<string, string>(), schoolOutfit: new Map<string, string>(), outfit: new Map<string, string>(), clothes: new Map<string, string>() };
const wardrobe = {
  get: (key: string) => {
    if (key === 'female_underwear') return { under_upper: { slot: 'under_upper', name: 'bra' }, under_lower: { slot: 'under_lower', name: 'panties' } };
    if (key === 'male_underwear') return { under_lower: { slot: 'under_lower', name: 'briefs' } };
    return {};
  },
  base: (_npcName: string, modifier: typeof base) => (base = modifier),
  wear: (_npcName: string, location: string | readonly string[], key: string, condition?: () => boolean) => wear.push({ location, key, condition }),
  modify: (_npcName: string, modifier: (clothes: Record<string, any>, context: { key: string; location: string }) => void) => modifiers.push(modifier)
};

WhitneySidebar(
  {
    passage: { title: '' },
    npc: { addSchedule: () => undefined, Clothes: { wardrobe } },
    tool: { onInit: (callback: () => void) => (init = callback) },
    on: () => undefined,
    get: () => ({
      apply: (clothes: Record<string, any>, item: { slot: string }) => (clothes[item.slot] = item),
      randomColour: (options: readonly string[]) => options[0]
    })
  } as never,
  colours
);

beforeEach(() => {
  wear.length = 0;
  modifiers.length = 0;
  Object.assign(globalThis, {
    C: { npc: { Whitney: { init: 1, state: 'active', pronoun: 'f' } } },
    V: { pillory: { tenant: { upperexposed: 0, lowerexposed: 0 } } },
    Time: { season: 'spring' },
    Weather: { temperature: 15 },
    setup: { clothes: {} }
  });
  colours.outfit.clear();
  init();
});

describe('Whitney wardrobe', () => {
  test('uses gendered underwear except while naked', () => {
    const normal: Record<string, any> = {};
    base(normal, { key: 'school_uniform_skirt' });
    expect(Object.keys(normal).sort()).toEqual(['under_lower', 'under_upper']);

    const naked: Record<string, any> = {};
    base(naked, { key: 'naked' });
    expect(naked).toEqual({});

    C.npc.Whitney.pronoun = 'm';
    const male: Record<string, any> = {};
    base(male, { key: 'school_uniform_trousers' });
    expect(Object.keys(male)).toEqual(['under_lower']);
  });

  test('registers every standard school-uniform variant', () => {
    expect(wear.filter(rule => rule.location === 'school').map(rule => rule.key)).toEqual([
      'school_uniform_skirt',
      'preppy_skirt_uniform',
      'serafuku_dress',
      'classic_serafuku_short_skirt',
      'cardigan_sailor_uniform',
      'school_uniform_trousers',
      'preppy_shorts_uniform',
      'gakuran_uniform'
    ]);
    expect(wear.filter(rule => Array.isArray(rule.location) && rule.location.includes('school_swim') && rule.location.includes('beach')).map(rule => rule.key)).toEqual([
      'school_swim_shorts',
      'school_swimsuit'
    ]);
  });

  test('uses ordinary, hot-weather, and winter casual clothes without rerolling', () => {
    const casual = wear.filter(rule => Array.isArray(rule.location) && rule.location.includes('park'));
    expect(casual.map(rule => rule.key)).toEqual(['leather_jacket_jeans', 'sweater_sweatpants_sport', 'tshirt_shorts', 'hoodie_legwarmers']);

    colours.outfit.set('normal', 'leather_jacket_jeans');
    expect(casual.find(rule => rule.key === 'leather_jacket_jeans')?.condition?.()).toBeTrue();
    expect(casual.find(rule => rule.key === 'sweater_sweatpants_sport')?.condition?.()).toBeFalse();

    Time.season = 'summer';
    expect(casual.find(rule => rule.key === 'tshirt_shorts')?.condition?.()).toBeTrue();
    expect(casual.find(rule => rule.key === 'leather_jacket_jeans')?.condition?.()).toBeFalse();

    Time.season = 'spring';
    Weather.temperature = 25;
    expect(casual.find(rule => rule.key === 'tshirt_shorts')?.condition?.()).toBeTrue();

    Time.season = 'winter';
    expect(casual.find(rule => rule.key === 'hoodie_legwarmers')?.condition?.()).toBeTrue();
    expect(casual.find(rule => rule.key === 'tshirt_shorts')?.condition?.()).toBeFalse();
    expect(wear.find(rule => rule.location === 'halloween')?.key).toBe('rags');
  });

  test('uses a yellow sweater and teal short skirt for the basic uniform', () => {
    const clothes: Record<string, any> = { upper: { colour: 'tangerine' }, lower: { colour: 'red' } };
    for (const modifier of modifiers) modifier(clothes, { key: 'school_uniform_skirt', location: 'school' });
    expect(clothes.upper.colour).toBe('yellow');
    expect(clothes.lower.name).toBe('short school skirt');
    expect(clothes.lower.colour).toBe('teal');
  });

  test('uses only accessory colours shared by both uniform pieces', () => {
    setup.clothes = {
      upper: { 1: { accessory_colour_options: ['pink', 'white'] } },
      lower: { 2: { accessory_colour_options: ['white', 'blue'] } }
    };
    const clothes: Record<string, any> = {
      upper: { slot: 'upper', index: 1 },
      lower: { slot: 'lower', index: 2 }
    };
    for (const modifier of modifiers) modifier(clothes, { key: 'preppy_skirt_uniform', location: 'school' });
    expect(clothes.upper.accessory_colour).toBe('white');
    expect(clothes.lower.accessory_colour).toBe('white');
  });

  test('removes the entire upper body outfit in topless scenes', () => {
    const clothes: Record<string, any> = { upper: { name: 'jacket' }, under_upper: { name: 'bra' }, lower: { name: 'jeans' }, under_lower: { name: 'panties' } };
    for (const modifier of modifiers) modifier(clothes, { key: 'leather_jacket_jeans', location: 'topless' });
    expect(clothes).toEqual({ lower: { name: 'jeans' }, under_lower: { name: 'panties' } });
  });

  test('reflects pillory exposure state', () => {
    V.pillory.tenant.upperexposed = 1;
    V.pillory.tenant.lowerexposed = 1;
    const clothes: Record<string, any> = { upper: {}, lower: {}, under_upper: {}, under_lower: {} };
    for (const modifier of modifiers) modifier(clothes, { key: 'leather_jacket_jeans', location: 'pillory' });
    expect(clothes).toEqual({ under_upper: {}, under_lower: {} });
  });
});
