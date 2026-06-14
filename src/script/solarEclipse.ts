// ./src/script/solarEclipse.ts

import { solarEclipseDescriptions } from './solarEclipseDescriptions';

function patchWeather(): void {
  Object.defineProperties(Weather, {
    skyState: {
      configurable: true,
      get(this: any): string {
        if (Weather.solarEclipse) return 'solarEclipse';
        if (Weather.bloodMoon) return 'bloodMoon';
        return this.dayState;
      }
    },

    solarEclipse: {
      configurable: true,
      get(): boolean {
        return maplebirch.rebloom.solarEclipse.active;
      }
    }
  });
}

(function (maplebirch): void {
  'use strict';

  maplebirch.tool.onInit(() => {
    patchWeather();
    solarEclipseDescriptions();
  });
})(maplebirch);
