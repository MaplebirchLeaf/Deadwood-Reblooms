import { beforeEach, describe, expect, test } from 'bun:test';
import WhitneySidebar from '../src/script/NamedNPCSidebarPortrait/Whitney';

let resolveLocation: () => string;
const core = {
  passage: { title: '' },
  npc: {
    addSchedule: (_npcName: string, configure: (schedule: { when: (_condition: () => boolean, location: () => string) => void }) => void) => {
      configure({ when: (_condition, location) => (resolveLocation = location) });
    }
  },
  tool: { onInit: () => undefined }
} as never;

WhitneySidebar(core, { school: new Map(), schoolOutfit: new Map(), outfit: new Map(), clothes: new Map() });

beforeEach(() => {
  Object.assign(globalThis, {
    C: { npc: { Whitney: { init: 1, state: 'active', pronoun: 'm' } } },
    V: { daily: { school: { lunchEaten: 0 } }, schoolstate: '' },
    Time: { hour: 10, minute: 0, schoolTime: false, schoolDay: false, weekDay: 2, dayState: 'day', season: 'spring' },
    Weather: { precipitation: 'none', temperature: 15 }
  });
  core.passage.title = '';
});

describe('Whitney location', () => {
  test('uses the school uniform for the whole school day', () => {
    Time.schoolDay = true;
    for (const hour of [6, 12, 22]) {
      Time.hour = hour;
      expect(resolveLocation()).toBe('school');
    }
  });

  test('uses school swimwear at the pool and swimwear at the beach', () => {
    Time.schoolDay = true;
    core.passage.title = 'School Pool Whitney Crossdress';
    expect(resolveLocation()).toBe('school_swim');

    Time.schoolDay = false;
    core.passage.title = 'Whitney Beach Sunbathing';
    expect(resolveLocation()).toBe('beach');
  });

  test('handles Whitney home undress states', () => {
    Time.hour = 6;
    Time.dayState = 'dawn';
    core.passage.title = 'Whitney Home Knock';
    expect(resolveLocation()).toBe('topless');

    core.passage.title = 'Whitney Home Dawn Shower Wash';
    expect(resolveLocation()).toBe('naked');

    core.passage.title = 'Whitney Home Dawn Shower Dry 2';
    expect(resolveLocation()).toBe('naked');

    core.passage.title = 'Whitney Home Hang';
    expect(resolveLocation()).toBe('home');
  });

  test('keeps Whitney naked throughout the reverse robbery', () => {
    for (const title of ['Bully Rob Reversal', 'Bully Rob Reversal 2', 'Bully Alley Rob', 'Bully Alley Sex']) {
      core.passage.title = title;
      expect(resolveLocation()).toBe('naked');
    }
  });

  test('uses the Halloween costume described by the story', () => {
    core.passage.title = 'Whitney Trick 3';
    expect(resolveLocation()).toBe('halloween');

    core.passage.title = 'Kylar Halloween Whitney';
    expect(resolveLocation()).toBe('halloween');
  });

  test('handles inactive, dungeon, and pillory states', () => {
    C.npc.Whitney.state = 'dungeon';
    expect(resolveLocation()).toBe('');

    C.npc.Whitney.state = 'pillory';
    expect(resolveLocation()).toBe('pillory');

    C.npc.Whitney.init = 0;
    expect(resolveLocation()).toBe('');
  });

  test('uses Whitney personal schedule on non-school days', () => {
    Time.hour = 7;
    Time.dayState = 'dawn';
    expect(resolveLocation()).toBe('topless');

    Time.hour = 12;
    Time.dayState = 'day';
    expect(resolveLocation()).toBe('park');

    Time.season = 'winter';
    expect(resolveLocation()).toBe('park');

    Time.weekDay = 1;
    Time.hour = 21;
    Time.dayState = 'night';
    expect(resolveLocation()).toBe('pub');
  });
});
