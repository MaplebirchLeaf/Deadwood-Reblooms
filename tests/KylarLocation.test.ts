import { beforeEach, describe, expect, test } from 'bun:test';
import KylarSidebar from '../src/script/NamedNPCSidebarPortrait/Kylar';

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

KylarSidebar(core, { school: new Map(), schoolOutfit: new Map(), clothes: new Map(), christmas: new Map(), roseEyepatch: undefined });

beforeEach(() => {
  Object.assign(globalThis, {
    C: { npc: { Kylar: { init: 1, state: 'active', love: 60 } } },
    V: {
      kylar_clothes: undefined,
      kylarSeen: [],
      phase: 0,
      schoolstate: '',
      englishPlay: '',
      englishPlayReadiness: 0,
      englishPlayDoubleRehearsal: false,
      englishPlayRoles: { Kylar: 'none', KylarKnown: false, SydneyKnown: false },
      daily: { school: { lunchEaten: 0 } }
    },
    Time: { hour: 8, schoolTime: false, schoolDay: false },
    Weather: { precipitation: 'none' }
  });
  core.passage.title = '';
  delete (globalThis as { getKylarLocation?: () => object }).getKylarLocation;
});

describe('Kylar location', () => {
  test('handles inactive and prison states', () => {
    C.npc.Kylar.state = '';
    expect(resolveLocation()).toBe('inactive');

    C.npc.Kylar.state = 'prison';
    expect(resolveLocation()).toBe('prison');
  });

  test('keeps prison clothing during the escape sequence', () => {
    C.npc.Kylar.state = 'active';
    core.passage.title = 'Prison Kylar Escape 3';

    expect(resolveLocation()).toBe('prison');
  });

  test('uses story outfits for abduction and seasonal events', () => {
    core.passage.title = 'Kylar Abduction Formal';
    V.kylar_clothes = 'formal';
    expect(resolveLocation()).toBe('abduction_formal');

    V.kylar_clothes = 'goth';
    expect(resolveLocation()).toBe('abduction_goth');

    V.kylar_clothes = 'swimsuit';
    expect(resolveLocation()).toBe('abduction_swim');

    core.passage.title = 'Kylar Halloween Mansion';
    expect(resolveLocation()).toBe('halloween');

    core.passage.title = 'Kylar Christmas 8';
    expect(resolveLocation()).toBe('christmas');
  });

  test('prioritises English play rehearsal during the school afternoon', () => {
    V.schoolstate = 'afternoon';
    V.englishPlay = 'ongoing';
    V.englishPlayRoles.Kylar = 'Sterling';

    expect(resolveLocation()).toBe('english');

    V.englishPlayRoles.KylarKnown = true;
    expect(resolveLocation()).toBe('rehearsal');

    Weather.precipitation = 'rain';
    expect(resolveLocation()).toBe('rehearsal');

    V.englishPlayReadiness = 56;
    V.englishPlayRoles.SydneyKnown = true;
    expect(resolveLocation()).toBe('rehearsal');

    core.passage.title = 'English Play Rehearse Both 2';
    expect(resolveLocation()).toBe('rehearsal');
  });

  test('uses the classroom and lunchtime school schedule', () => {
    Time.schoolTime = true;
    V.schoolstate = 'third';
    expect(resolveLocation()).toBe('english');

    V.schoolstate = 'second';
    expect(resolveLocation()).toBe('class');

    V.schoolstate = 'lunch';
    expect(resolveLocation()).toBe('canteen');

    V.daily.school.lunchEaten = 1;
    expect(resolveLocation()).toBe('rear_courtyard');

    Weather.precipitation = 'snow';
    expect(resolveLocation()).toBe('library');
  });

  test('uses wedding clothes during the basement ceremony', () => {
    for (const title of [
      'Kylar Basement 4 Ceremony',
      'Kylar Basement Protest Refuse',
      'Kylar Basement Silent Kiss',
      'Kylar Basement Police',
      'Kylar Basement Police Heroics',
      'Kylar Basement Police Silent'
    ]) {
      core.passage.title = title;
      expect(resolveLocation()).toBe('wedding');
    }

    for (const title of ['Kylar Basement 3', 'Kylar Basement Car']) {
      core.passage.title = title;
      expect(resolveLocation()).toBe('');
    }
  });

  test('uses nudity during the bath and after the Christmas costume tears', () => {
    for (const title of ['Kylar Bath Help', 'Kylar Bath Sex', 'Kylar Bath End', 'Kylar Christmas 3', 'Kylar Christmas 5']) {
      core.passage.title = title;
      expect(resolveLocation()).toBe('naked');
    }

    core.passage.title = 'Kylar Christmas 6';
    expect(resolveLocation()).toBe('christmas');
  });

  test('keeps only underwear after Kylar gives away their park clothes', () => {
    V.phase = 1;
    core.passage.title = 'Park Streak Kylar';
    expect(resolveLocation()).toBe('underwear');

    V.kylarSeen.push('commando');
    expect(resolveLocation()).toBe('naked');

    core.passage.title = 'Park Streak Kylar 2';
    expect(resolveLocation()).toBe('naked');
  });

  test('uses the manor, park, and arcade personal schedule', () => {
    Time.hour = 6;
    expect(resolveLocation()).toBe('manor_bedroom');

    Time.hour = 12;
    expect(resolveLocation()).toBe('park');

    Weather.precipitation = 'rain';
    expect(resolveLocation()).toBe('arcade');

    Time.hour = 20;
    expect(resolveLocation()).toBe('');
  });

  test('uses the school uniform all day on school days unless a story outfit applies', () => {
    Time.schoolDay = true;
    for (const hour of [6, 12, 20]) {
      Time.hour = hour;
      expect(resolveLocation()).toBe('school');
    }

    core.passage.title = 'Kylar Christmas 4';
    expect(resolveLocation()).toBe('naked');
  });
});
