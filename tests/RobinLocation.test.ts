import { beforeEach, describe, expect, test } from 'bun:test';
import RobinSidebar from '../src/script/NamedNPCSidebarPortrait/Robin';

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

RobinSidebar(core, {
  school: new Map(),
  schoolOutfit: new Map(),
  outfit: new Map(),
  clothes: new Map(),
  christmas: new Map()
});

beforeEach(() => {
  Object.assign(globalThis, {
    C: { npc: { Robin: { init: 1, trauma: 0 } } },
    V: {
      robin: { autoWater: false },
      robinromance: 0,
      christmas_robin_lewd: 0,
      robinlocationoverride: undefined,
      robinmissing: 0,
      robinPillory: { danger: 0, naked: false },
      christmas: 0,
      christmas_gift_robin_given: false,
      halloween: 0,
      halloween_robin_costume: 'ghost',
      englishPlay: '',
      englishPlayDays: 1,
      alex_greenhouse: 0,
      daily: { robin: { bath: false } }
    },
    Time: {
      hour: 12,
      minute: 0,
      monthDay: 1,
      dayState: 'day',
      schoolDay: false,
      season: 'spring',
      isWeekEnd: () => false
    },
    Weather: { precipitation: 'none' },
    orphanagePlotsPlanted: () => false,
    orphanagePlotsWatered: () => false
  });
  core.passage.title = '';
});

describe('Robin location', () => {
  test('uses Robin-specific location overrides', () => {
    V.robinlocationoverride = { location: 'school', during: [12] };
    expect(resolveLocation()).toBe('school');
  });

  test('keeps bath and Halloween story locations after their schedule window', () => {
    Time.hour = 19;
    core.passage.title = 'Robin Bath Join';
    expect(resolveLocation()).toBe('naked');

    core.passage.title = 'Robin Bath Out';
    expect(resolveLocation()).toBe('bath');

    core.passage.title = 'Robin Trick 6';
    expect(resolveLocation()).toBe('halloween');
  });

  test('uses story nudity for hospital, captivity, and sex scenes', () => {
    for (const title of ['Robin Hospital Watch', 'Robin Hospital 2', 'Docks_Robin', 'Underground Robin Hunt Intro', 'Canteen Robin Sex Finish', 'Robin Forest Vore Comfort 2']) {
      core.passage.title = title;
      expect(resolveLocation()).toBe('naked');
    }
  });

  test('uses gift wrap before unwrapping Robin and nudity afterwards', () => {
    V.christmas_robin_lewd = 1;
    core.passage.title = "Robin's Room Entrance";
    expect(resolveLocation()).toBe('giftWrap');

    core.passage.title = 'Robin Unwrap';
    expect(resolveLocation()).toBe('naked');

    core.passage.title = 'Robin Unwrap No';
    expect(resolveLocation()).toBe('giftWrap');
  });

  test('sleeps naked only in the low-trauma romance', () => {
    core.passage.title = 'Robin Bed';
    V.robinromance = 1;
    expect(resolveLocation()).toBe('naked');

    C.npc.Robin.trauma = 30;
    expect(resolveLocation()).toBe('sleep');
  });

  test('uses nudity after Robin is stripped in the pillory', () => {
    V.robinmissing = 'pillory';
    V.robinPillory.danger = 7;
    expect(resolveLocation()).toBe('pillory');

    V.robinPillory.danger = 8;
    expect(resolveLocation()).toBe('naked');

    V.robinmissing = 0;
    V.robinPillory.naked = true;
    core.passage.title = 'Robin Pillory Escape Orphanage';
    expect(resolveLocation()).toBe('naked');
  });

  test('ends the watering window at 17:29', () => {
    V.robin.autoWater = true;
    V.daily.robin.bath = false;
    Time.hour = 17;
    Time.minute = 30;
    orphanagePlotsPlanted = () => true;

    expect(resolveLocation()).toBe('orphanage');
  });

  test('keeps the school uniform for ordinary school-day locations', () => {
    Time.schoolDay = true;
    for (const hour of [7, 16, 18, 20]) {
      Time.hour = hour;
      Time.minute = 0;
      expect(resolveLocation()).toBe('school');
    }

    Time.hour = 16;
    Time.minute = 30;
    expect(resolveLocation()).toBe('bath');

    Time.hour = 18;
    Time.minute = 0;
    V.englishPlay = 'ongoing';
    V.englishPlayDays = 0;
    expect(resolveLocation()).toBe('englishPlay');
  });
});
