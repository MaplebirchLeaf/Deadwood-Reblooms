import { beforeEach, describe, expect, test } from 'bun:test';
import SydneySidebar from '../src/script/NamedNPCSidebarPortrait/Sydney';

let resolveLocation: () => string;
const core = {
  passage: { title: '' },
  npc: {
    addSchedule: (_npcName: string, configure: (schedule: { when: (_condition: () => boolean, location: () => string) => void }) => void) => {
      configure({
        when: (_condition, location) => {
          resolveLocation = location;
        }
      });
    }
  },
  tool: { onInit: () => undefined }
} as never;

SydneySidebar(core, {
  school: new Map(),
  schoolOutfit: new Map(),
  swim: new Map()
});

beforeEach(() => {
  Object.assign(globalThis, {
    C: { npc: { Sydney: { init: 1, corruption: 0 } } },
    V: {
      exit: 'library',
      replayScene: false,
      sydney_location_override: undefined,
      sydney: { rank: 'monk', swim: 'normal' },
      daily: { sydney: { punish: 0, templeSkip: false }, school: { lunchEaten: 0 } },
      englishPlay: '',
      englishPlayDays: 1,
      adultshopopeningsydney: false,
      adultshophelped: 0,
      adultshopunlocked: false,
      sydneySeen: [],
      sydneyLate: 0,
      sydneyScience: 0,
      schoolstate: ''
    },
    Time: { hour: 12, minute: 0, weekDay: 2, schoolTerm: true, schoolDay: true },
    Weather: { precipitation: 'none' }
  });
  core.passage.title = '';
});

describe('Sydney location', () => {
  test('retains the current outfit during rainy promenade scenes', () => {
    core.passage.title = 'Sydney Beach Promenade Soak Both';
    V.daily.sydney.punish = 1;

    expect(resolveLocation()).toBe('');
  });

  test('changes back into the outfit selected by the date origin when leaving the beach', () => {
    core.passage.title = 'Sydney Beach Leave';
    expect(resolveLocation()).toBe('library');

    V.exit = 'temple';
    expect(resolveLocation()).toBe('temple');
  });

  test('keeps story clothing through ambulance, hospital, and car passages', () => {
    V.daily.sydney.punish = 1;
    for (const title of ['Ambulance Sydney', 'Hospital Sydney Rescue', 'Sydney Ride Home']) {
      core.passage.title = title;
      expect(resolveLocation()).toBe('');
    }
  });

  test('uses the swimsuit only after Sydney has changed', () => {
    core.passage.title = 'Sydney Beach Start';
    expect(resolveLocation()).toBe('');

    core.passage.title = 'Sydney Beach Swimsuit';
    expect(resolveLocation()).toBe('swim');

    core.passage.title = 'Sydney Beach Changing Room Leave';
    expect(resolveLocation()).toBe('swim');
  });

  test('prioritises explicit story locations over the changed schedule time', () => {
    V.daily.sydney.punish = 1;

    core.passage.title = 'Sydney Temple Corrupt 4';
    expect(resolveLocation()).toBe('temple');

    core.passage.title = 'Sydney Library Rescue Reward';
    expect(resolveLocation()).toBe('library');

    core.passage.title = 'Sydney Canteen Fight';
    expect(resolveLocation()).toBe('canteen');

    core.passage.title = 'Sydney Backroom Lift End';
    expect(resolveLocation()).toBe('shop');
  });

  test('keeps the date-origin outfit while shopping and visiting the hairdresser', () => {
    core.passage.title = 'Sydney Shopping Centre';
    expect(resolveLocation()).toBe('library');

    V.exit = 'temple';
    core.passage.title = 'Sydney Hairdressers Session';
    expect(resolveLocation()).toBe('temple');
  });

  test('uses model clothing only during the adult-shop opening display', () => {
    core.passage.title = 'Adult Shop Opening Corrupt';
    expect(resolveLocation()).toBe('');

    core.passage.title = 'Adult Shop Opening Corrupt Babydoll';
    expect(resolveLocation()).toBe('shopOpening');

    core.passage.title = 'Adult Shop Opening Refuse 2';
    expect(resolveLocation()).toBe('shopOpening');

    core.passage.title = 'Adult Shop Opening Refuse 3';
    expect(resolveLocation()).toBe('temple');
  });

  test('uses role costumes during rehearsal passages', () => {
    core.passage.title = 'English Play Rehearse Sydney';
    expect(resolveLocation()).toBe('rehearsal');

    core.passage.title = 'English Play Rehearse Both 3';
    expect(resolveLocation()).toBe('rehearsal');
  });

  test('uses the ordinary schedule at the dilapidated shop', () => {
    core.passage.title = 'Dilapidated Help';
    expect(resolveLocation()).toBe('library');

    core.passage.title = 'Dilapidated Paint Watch Romance';
    expect(resolveLocation()).toBe('library');

    core.passage.title = 'Dilapidated End';
    expect(resolveLocation()).toBe('library');
  });

  test('does not switch changing-room undress scenes to the completed swimsuit', () => {
    core.passage.title = 'Sydney Shopping Swim Enter';
    expect(resolveLocation()).toBe('');

    core.passage.title = 'Sydney Shopping Lock';
    expect(resolveLocation()).toBe('');
  });
});
