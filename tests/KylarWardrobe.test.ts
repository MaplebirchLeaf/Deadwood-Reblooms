import { beforeEach, describe, expect, test } from 'bun:test';
import KylarSidebar from '../src/script/NamedNPCSidebarPortrait/Kylar';

let init: () => void;
let base: (clothes: Record<string, any>, context: { key: string }) => void;
const wear: Array<{ location: string | readonly string[]; key: string; condition?: () => boolean }> = [];
const modifiers: Array<(clothes: Record<string, any>, context: { key: string }) => void> = [];
const colours: { school: Map<string, string>; schoolOutfit: Map<string, string>; clothes: Map<string, string>; christmas: Map<string, string>; roseEyepatch?: 'none' | 'alt' } = {
  school: new Map<string, string>(),
  schoolOutfit: new Map<string, string>(),
  clothes: new Map<string, string>(),
  christmas: new Map<string, string>()
};
const wardrobe = {
  get: (key: string) => {
    if (key === 'female_underwear') return { under_upper: { slot: 'under_upper', name: 'bra' }, under_lower: { slot: 'under_lower', name: 'panties' } };
    if (key === 'male_underwear') return { under_lower: { slot: 'under_lower', name: 'briefs' } };
    return {};
  },
  base: (_npcName: string, modifier: typeof base) => {
    base = modifier;
  },
  wear: (_npcName: string, location: string | readonly string[], key: string, condition?: () => boolean) => {
    wear.push({ location, key, condition });
  },
  modify: (_npcName: string, modifier: (clothes: Record<string, any>, context: { key: string }) => void) => {
    modifiers.push(modifier);
  }
};

KylarSidebar(
  {
    passage: { title: '' },
    npc: {
      addSchedule: () => undefined,
      Clothes: { wardrobe }
    },
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
  } as never,
  colours
);

beforeEach(() => {
  wear.length = 0;
  modifiers.length = 0;
  colours.school.clear();
  colours.schoolOutfit.clear();
  colours.clothes.clear();
  colours.christmas.clear();
  colours.roseEyepatch = undefined;
  Object.assign(globalThis, {
    C: { npc: { Kylar: { init: 1, pronoun: 'f', state: 'active' } } },
    V: {
      maplebirch: { npc: { kylar: {} } },
      NPCName: [],
      kylarSeen: [],
      daily: { kylar: { undies: false } }
    }
  });
  init();
});

describe('Kylar wardrobe', () => {
  test('removes only lower underwear for temporary and permanent commando states', () => {
    const normal: Record<string, any> = {};
    base(normal, { key: 'school_uniform_skirt' });
    expect(Object.keys(normal).sort()).toEqual(['head', 'under_lower', 'under_upper']);
    expect(normal.head?.name).toBe('hairpin');

    V.daily.kylar.undies = true;
    const temporary: Record<string, any> = {};
    base(temporary, { key: 'school_uniform_skirt' });
    expect(Object.keys(temporary).sort()).toEqual(['head', 'under_upper']);

    V.daily.kylar.undies = false;
    V.kylarSeen.push('commando');
    const permanent: Record<string, any> = {};
    base(permanent, { key: 'school_uniform_skirt' });
    expect(Object.keys(permanent).sort()).toEqual(['head', 'under_upper']);

    C.npc.Kylar.pronoun = 'm';
    const male: Record<string, any> = {};
    base(male, { key: 'school_uniform_trousers' });
    expect(male.head).toBeUndefined();
  });

  test('removes underwear and the hairpin for fully naked story states', () => {
    const clothes: Record<string, any> = {};
    base(clothes, { key: 'naked' });
    expect(clothes).toEqual({});

    expect(wear.filter(rule => ['naked', 'underwear'].includes(rule.location as string)).map(rule => [rule.location, rule.key])).toEqual([
      ['naked', 'naked'],
      ['underwear', 'female_underwear'],
      ['underwear', 'male_underwear']
    ]);
  });

  test('registers every school-uniform variant', () => {
    const keys = wear.filter(rule => Array.isArray(rule.location) && rule.location.includes('class')).map(rule => rule.key);
    expect(keys).toEqual([
      'school_uniform_skirt',
      'preppy_skirt_uniform',
      'serafuku_dress',
      'classic_serafuku_short_skirt',
      'cardigan_sailor_uniform',
      'school_uniform_trousers',
      'preppy_shorts_uniform',
      'gakuran_uniform'
    ]);
    expect(wear.filter(rule => rule.key === 'school_uniform_skirt').every(rule => Array.isArray(rule.location) && rule.location.includes('school'))).toBeTrue();
  });

  test('uses a green sweater and white short skirt for the basic female school uniform', () => {
    const clothes: Record<string, any> = { upper: { colour: 'tangerine' }, lower: { colour: 'red' } };
    for (const modifier of modifiers) modifier(clothes, { key: 'school_uniform_skirt' });
    expect(clothes.upper.colour).toBe('green');
    expect(clothes.lower?.name).toBe('short school skirt');
    expect(clothes.lower.colour).toBe('white');
  });

  test('uses gendered formal, gothic, and rose-wedding outfits', () => {
    expect(wear.filter(rule => ['abduction_formal', 'abduction_goth', 'wedding'].includes(rule.location as string)).map(rule => [rule.location, rule.key])).toEqual([
      ['abduction_formal', 'vintage_pantsuit_formal'],
      ['abduction_formal', 'vintage_skirtsuit_formal'],
      ['abduction_goth', 'gothic_formal_suit'],
      ['abduction_goth', 'gothic_rose_gown'],
      ['wedding', 'rose_wedding_suit'],
      ['wedding', 'rose_wedding_dress']
    ]);
  });

  test('uses role costumes during rehearsal', () => {
    const rules = wear.filter(rule => ['english_play_sterling', 'english_play_taylor'].includes(rule.key));
    expect(rules.every(rule => Array.isArray(rule.location) && rule.location.includes('englishPlay') && rule.location.includes('rehearsal'))).toBeTrue();
  });

  test('adds a rose eyepatch on either eye to wedding outfits', () => {
    const clothes: Record<string, any> = {};
    for (const modifier of modifiers) modifier(clothes, { key: 'rose_wedding_dress' });
    expect(clothes.face?.name).toBe('rose eyepatch');
    expect(['none', 'alt']).toContain(clothes.face?.altposition);
  });

  test('uses a mummy costume for Halloween', () => {
    expect(wear.filter(rule => rule.location === 'halloween').map(rule => rule.key)).toEqual(['mummy']);
  });

  test('uses one male and two female Christmas outfits without a snowman', () => {
    expect(wear.filter(rule => rule.location === 'christmas').map(rule => rule.key)).toEqual(['christmas', 'christmas_dress', 'jingle_bell_christmas_dress']);
  });

  test('gives the casual outfit cached colours supported by every matching item', () => {
    Object.assign(globalThis, {
      setup: {
        clothes: {
          upper: { 77: { colour_options: ['light pink', 'white'] } },
          lower: { 67: { colour_options: ['light pink', 'white'] } },
          head: { 32: { colour_options: ['light pink', 'white'] } },
          legs: { 8: { colour_options: ['pink', 'white'] } },
          feet: { 6: { colour_options: ['pink', 'white'] } }
        }
      }
    });
    const clothes: Record<string, any> = {
      upper: { slot: 'upper', index: 77, colour: 'black' },
      lower: { slot: 'lower', index: 67, colour: 'black' },
      head: { slot: 'head', index: 32, colour: 'black' },
      legs: { slot: 'legs', index: 8, colour: 'black' },
      feet: { slot: 'feet', index: 6, colour: 'black' }
    };
    for (const modifier of modifiers) modifier(clothes, { key: 'hoodie_legwarmers' });
    expect([clothes.upper.colour, clothes.lower.colour, clothes.head.colour]).toEqual(['light pink', 'light pink', 'light pink']);
    expect([clothes.legs.colour, clothes.feet.colour]).toEqual(['pink', 'pink']);
  });
});
