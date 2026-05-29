// ./src/module/constants.ts

export const options: Record<string, any> = {
  modHint: 'disable',
  bodywriting: false,
  solarEclipse: true
};

export const defaults = {
  rand: {},
  solarEclipse: {
    seed: 0,
    stored: []
  },
  wardrobeSearch: '',
  hintlocation: 'Hint'
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
