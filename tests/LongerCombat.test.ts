import { beforeEach, describe, expect, test } from 'bun:test';
import LongerCombat from '../src/module/LongerCombat';

const fragment = { append: () => undefined };

beforeEach(() => {
  Math.clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
  Object.assign(globalThis, {
    V: {
      options: {
        maplebirch: {
          LongerCombat: { seconds: 10, max: 3, rounds: 0, again: 100, end: null }
        }
      },
      enemyarousal: 100,
      enemyarousalmax: 100
    },
    T: {},
    document: { createDocumentFragment: () => fragment },
    Wikifier: { wikifyEval: () => ({}) },
    maplebirch: {
      passage: { title: 'Street' },
      SugarCube: { State: { history: [] } },
      lodash: { findLast: () => undefined }
    }
  });
});

describe('LongerCombat rounds', () => {
  test('increments the current options object after ejaculation processing', () => {
    const combat = new LongerCombat({} as never);
    combat.ejaculation = () => {
      V.options.maplebirch.LongerCombat = { ...V.options.maplebirch.LongerCombat };
    };

    combat.main();

    expect(V.options.maplebirch.LongerCombat.rounds).toBe(1);
  });

  test('continues indefinitely when unlimited encounters are enabled', () => {
    const combat = new LongerCombat({} as never);
    V.options.maplebirch.LongerCombat.unlimited = true;
    V.options.maplebirch.LongerCombat.max = 1;
    V.options.maplebirch.LongerCombat.again = 0;
    combat.ejaculation = () => undefined;

    combat.main();

    expect(V.options.maplebirch.LongerCombat.rounds).toBe(1);
    expect(T.combatend).toBeUndefined();
  });
});
