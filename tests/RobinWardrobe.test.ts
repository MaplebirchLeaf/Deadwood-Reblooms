import { beforeEach, describe, expect, test } from 'bun:test';
import RobinSidebar from '../src/script/NamedNPCSidebarPortrait/Robin';

let init: () => void;
let base: (clothes: Record<string, any>, context: { key: string }) => void;
const wear: Array<{ location: string | readonly string[]; key: string }> = [];
const modifiers: Array<(clothes: Record<string, any>, context: { key: string; location?: string }) => void> = [];
const wardrobe = {
  get: (key: string) => {
    if (key === 'female_underwear') return { under_upper: { slot: 'under_upper', name: 'bra' }, under_lower: { slot: 'under_lower', name: 'panties' } };
    if (key === 'male_underwear') return { under_lower: { slot: 'under_lower', name: 'briefs' } };
    return {};
  },
  base: (_npcName: string, modifier: typeof base) => {
    base = modifier;
  },
  wear: (_npcName: string, location: string | readonly string[], key: string) => wear.push({ location, key }),
  modify: (_npcName: string, modifier: (clothes: Record<string, any>, context: { key: string; location?: string }) => void) => modifiers.push(modifier)
};

RobinSidebar(
  {
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
  } as never,
  { school: new Map(), schoolOutfit: new Map(), outfit: new Map(), clothes: new Map(), christmas: new Map() }
);

beforeEach(() => {
  wear.length = 0;
  modifiers.length = 0;
  Object.assign(globalThis, {
    C: { npc: { Robin: { init: 1, pronoun: 'f', breastsize: 2 } } },
    V: { maplebirch: { npc: { robin: {} } }, NPCName: [], robinPillory: { danger: 0 } },
    Time: { season: 'spring' }
  });
  init();
});

describe('Robin wardrobe', () => {
  test('does not read Robin before wardrobe evaluation', () => {
    let accessed = false;
    Object.assign(globalThis, {
      C: {
        npc: Object.defineProperty({}, 'Robin', {
          get() {
            accessed = true;
            throw new Error('Robin is not initialized');
          }
        })
      }
    });

    expect(() => init()).not.toThrow();
    expect(accessed).toBeFalse();
  });

  test('removes underwear and the flower crown when fully naked', () => {
    const clothes: Record<string, any> = {};
    base(clothes, { key: 'naked' });
    expect(clothes).toEqual({});

    expect(wear.filter(rule => rule.location === 'giftWrap' || (Array.isArray(rule.location) && rule.location.includes('naked'))).map(rule => [rule.location, rule.key])).toEqual([
      [['naked', 'docks', 'dinner', 'underground'], 'naked'],
      ['giftWrap', 'gift_wrap']
    ]);
  });

  test('follows the pillory clothing-loss stages', () => {
    const clothes = {
      upper: { name: 'shirt' },
      lower: { name: 'skirt' },
      under_upper: { name: 'bra' },
      under_lower: { name: 'panties' }
    } as Record<string, any>;

    V.robinPillory.danger = 5;
    for (const modifier of modifiers) modifier(clothes, { key: 'pillory', location: 'pillory' });
    expect(Object.keys(clothes).sort()).toEqual(['under_lower', 'under_upper', 'upper']);

    clothes.lower = { name: 'skirt' };
    V.robinPillory.danger = 6;
    for (const modifier of modifiers) modifier(clothes, { key: 'pillory', location: 'pillory' });
    expect(clothes).toEqual({});
  });
});
