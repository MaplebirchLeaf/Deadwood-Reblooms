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
  status: {
    sanity: 1000,
    satiety: 10000,
    hydration: 4000
  },

  get sanity() {
    this.status['sanity'] = Math.clamp(this.status['sanity'], -500, 1000);
    return this.status['sanity'];
  },
  set sanity(value) {
    if (Number.isFinite(value)) this.status['sanity'] = Math.clamp(this.status['sanity'] + value, -500, 1000);
  },

  get satiety() {
    this.status['satiety'] = Math.clamp(this.status['satiety'], 0, 10000);
    return this.status['satiety'];
  },
  set satiety(value) {
    if (Number.isFinite(value)) this.status['satiety'] = Math.clamp(this.status['satiety'] + value, 0, 10000);
  },

  get hydration() {
    this.status['hydration'] = Math.clamp(this.status['hydration'], 0, 4000);
    return this.status['hydration'];
  },
  set hydration(value) {
    if (Number.isFinite(value)) this.status['hydration'] = Math.clamp(this.status['hydration'] + value, 0, 4000);
  }
};

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
