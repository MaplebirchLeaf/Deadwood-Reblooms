// ./src/module/constants.ts

export const options: Record<string, any> = {
  modHint: 'disable',
  bodywriting: false,
  solarEclipse: true,
  LongerCombat: {
    turnSeconds: 10,
    maxRounds: 3,
    rounds: 0,
    againChance: 50,
    endCombat: null
  }
};

const statusLimits = {
  sanity: [-500, 1000, 1000],
  satiety: [0, 10000, 10000],
  hydration: [0, 4000, 4000]
} as const;

export const defaults = {
  rand: {
    seed: null,
    history: [],
    index: 0
  },
  solarEclipse: {
    seed: 0,
    stored: []
  },
  carries: {
    body: {
      hand: [null, null],
      bag: [null, null],
      accessory: [null, null],
      container: [null, null],
      special: [null, null]
    },
    items: {
      stacks: []
    }
  },
  wardrobeSearch: '',
  hintlocation: 'Hint',
  // Core Characteristics Breakthrough
  CCB: {
    physique: false,
    willpower: false,
    beauty: false,
    promiscuity: false,
    exhibitionism: false,
    deviancy: false
  },
  status: Object.fromEntries(Object.entries(statusLimits).map(([key, [, , initial]]) => [key, initial]))
};

export function bindStatus(): void {
  for (const [key, [min, max, initial]] of Object.entries(statusLimits)) {
    Object.defineProperty(C.DeadwoodReblooms, key, {
      configurable: true,
      enumerable: true,
      get() {
        if (!Number.isFinite(V.DeadwoodReblooms.status[key])) V.DeadwoodReblooms.status[key] = initial;
        V.DeadwoodReblooms.status[key] = Math.clamp(V.DeadwoodReblooms.status[key], min, max);
        return V.DeadwoodReblooms.status[key];
      },
      set(value) {
        if (Number.isFinite(value)) V.DeadwoodReblooms.status[key] = Math.clamp(value, min, max);
      }
    });
  }
}

export function dataUpdate(migration: ReturnType<typeof maplebirch.tool.migration.create>): void {
  migration.add('0.0.0', '1.0.0', (data, utils) => {
    try {
      utils.fill(data, defaults);
      if (!data.solarEclipse || typeof data.solarEclipse !== 'object') data.solarEclipse = clone(defaults.solarEclipse);
      if (!Number.isSafeInteger(data.solarEclipse.seed)) data.solarEclipse.seed = 0;
      if (!Array.isArray(data.solarEclipse.stored)) data.solarEclipse.stored = [];
    } finally {
      data.version = '1.0.0';
    }
  });
}
