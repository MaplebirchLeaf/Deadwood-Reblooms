import { afterEach, beforeEach, describe, expect, mock, test } from 'bun:test';
import { readFileSync } from 'node:fs';

const globals = globalThis as any;
const saved = Object.fromEntries(['maplebirch', 'setup', 'V', 'window'].map(key => [key, globals[key]]));
mock.module('@/assets/transformations/fish.yaml', () => ({ default: {} }));
globals.maplebirch = {
  yaml: { load: (value: unknown) => value },
  modUtils: { getMod: () => ({ version: '1.0.0' }) }
};
const { default: Fish } = await import('../src/module/MoreTransformations/Fish');
const widgets = readFileSync(new URL('../src/twee/MoreTransformations.twee', import.meta.url), 'utf8');

let initCallbacks: Array<() => void>;
let injected: any;
let skillsBonus: unknown;
let fish: any;

beforeEach(() => {
  initCallbacks = [];
  injected = undefined;
  skillsBonus = undefined;
  globals.V = {
    transformationParts: { traits: { finnedLimbs: 'enabled' } }
  };
  globals.maplebirch = {
    yaml: { load: (value: unknown) => value },
    modUtils: { getMod: () => ({ version: '1.0.0' }) },
    char: { ZIndices: { front_hair: 80, over_head: 90, back_lower: 20 } }
  };
  globals.setup = { clothes: { head: [] } };
  globals.window = globals;
  globals.currentSkillValue = (skill: string) => (skill === 'swimmingskill' ? 500 : 200);

  fish = new Fish();
  (fish as any).extend({
    t: (key: string) => key,
    on: () => {},
    tool: {
      onInit: (callback: () => void) => initCallbacks.push(callback),
      patch: { addTraits: () => {} },
      zone: { inject: (rules: unknown) => (injected = rules) },
      addTo: (zone: string, content: unknown) => {
        if (zone === 'SkillsBonusDisplay') skillsBonus = content;
      }
    }
  } as any);
});

afterEach(() => Object.assign(globals, saved));

describe('fish transformation effects', () => {
  test('finned limbs increase modified swimming skill by 10%', () => {
    initCallbacks.forEach(callback => callback());
    expect(globals.currentSkillValue('swimmingskill')).toBe(550);
    expect(globals.currentSkillValue('athletics')).toBe(200);
    expect(globals.currentSkillValue('swimmingskill', 2)).toBe(500);
  });

  test('disabled finned limbs do not increase swimming skill', () => {
    globals.V.transformationParts.traits.finnedLimbs = 'disabled';
    initCallbacks.forEach(callback => callback());
    expect(globals.currentSkillValue('swimmingskill')).toBe(500);
  });

  test('missing fish traits do not activate transformation effects', () => {
    delete globals.V.transformationParts.traits.finnedLimbs;
    initCallbacks.forEach(callback => callback());
    expect(globals.currentSkillValue('swimmingskill')).toBe(500);
    expect(skillsBonus).toContain('$transformationParts.traits.finnedLimbs and isPartEnabled');
  });

  test('water actions reduce oxygen cost by 75% with gills and halve time at fish level six', () => {
    const rules = injected.widgetPassage.Widgets;
    expect(rules).toContainEqual({
      src: '<<set _waterActionTime to [18, 15, 12, 10, 8, 8, 7, 7, 6, 6, 5, 4][$_swimLevel] || 3>>',
      applyafter: '<<if $maplebirch.transformation.fish.level >= 6>><<set _waterActionTime to Math.max(1, Math.ceil(_waterActionTime / 2))>><</if>>'
    });
    expect(rules).toContainEqual({
      src: '<<set $oxygen -= _waterActionTime * 10>>',
      to: '<<set $oxygen -= _waterActionTime * 10 * ($transformationParts.traits.gills && isPartEnabled($transformationParts.traits.gills) ? 0.25 : 1)>>'
    });
  });

  test('characteristics display includes the finned-limbs swimming modifier', () => {
    expect(skillsBonus).toContain('_swimmingConfig.modifier * 1.1');
    expect(skillsBonus).toContain('deadwood-reblooms.Traits.finnedLimbs.name');
  });

  test('standing fins use headwear masks and move above hidden head accessories', () => {
    const fins = fish.transformation.layers.fish_fins;
    const options = {
      worn: { over_upper: { setup: { name: 'shirt' } } },
      hideHeadAcc: false,
      headMask: 'img/clothes/head/example/mask.png'
    };
    expect(fins.masksrcfn(options)).toBe(options.headMask);
    expect(fins.zfn(options)).toBe(81);
    options.hideHeadAcc = true;
    expect(fins.masksrcfn(options)).toBeUndefined();
    expect(fins.zfn(options)).toBe(90);
  });

  test('standing fish parts use the kaiju costume mask', () => {
    const options = {
      worn: { over_upper: { setup: { name: 'kaiju costume' } } },
      hideHeadAcc: false,
      headMask: 'img/clothes/head/example/mask.png'
    };
    expect(fish.transformation.layers.fish_fins.masksrcfn(options)).toBe('img/clothes/over-upper/kaiju/mask.png');
    expect(fish.transformation.layers.fish_tail.masksrcfn(options)).toBe('img/clothes/over-upper/kaiju/mask.png');
  });

  test('resting like a fish in the rock pool repeatedly grants one fish point', () => {
    const rules = injected.locationPassage['Rocks Pool'];
    const diveLink = rules[0].srcmatch;
    expect(rules).toContainEqual({
      srcmatch: expect.any(RegExp),
      applybefore: expect.stringContaining('<<icon "fish.png">>')
    });
    expect(diveLink.test('<<swimicon "dive">><<link [[Dive (0:01)|Rocks Dive]]>>')).toBeTrue();
    expect(diveLink.test('<<swimicon "dive">><<link [[潜水 (0:01)|Rocks Dive]]>>')).toBeTrue();
    expect(rules[0].applybefore).toEndWith('<br>');
  });

  test('eating cooked white rice consumes one cup and grants one fish point', () => {
    const rules = injected.widgetPassage['Widgets Kitchen'];
    expect(rules).toContainEqual({
      src: '<<set $_group to _recipeKeys.find((obj) => obj.key is $lastRecipeViewed).group>>',
      applyafter: '<<deadwood-reblooms-eat-rice>>'
    });
    expect(widgets).toContain('<<set $foodstuff.rice.amount -= 1>><<pass 10>><<transform "fish" 1>>');
    expect(widgets).toContain('<<set $foodstuff.rice.amount -= 3>><<pass 30>><<transform "fish" 2>>');
    expect(widgets).not.toContain('<</link>> | <<link');
    expect(widgets.match(/<\/link>><<transform-hint "fish" "lblue">><br>/g)).toHaveLength(2);
  });

  test('swimming practice can obtain or progress fish transformation using the passage rng', () => {
    expect(injected.widgetPassage.Widgets).toContainEqual({
      src: '<<set $swimmingskill to Math.clamp($swimmingskill, 0, 1000)>>',
      applyafter: '<<if $rng <= 30>><<transform "fish" 1>><</if>>'
    });
  });

  test('underwater movement can obtain or progress fish transformation', () => {
    expect(injected.widgetPassage.Widgets).toContainEqual({
      src: '<<pass _waterActionTime sec>>',
      applyafter: '<<if $rng <= 20>><<transform "fish" 1>><</if>>'
    });
  });
});
