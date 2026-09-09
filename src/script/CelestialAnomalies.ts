// ./src/script/SolarEclipse.ts

import type { MaplebirchCore } from '@scml-maplebirch/types';

type WeatherType = 'clear' | 'lightClouds' | 'heavyClouds' | 'lightPrecipitation' | 'heavyPrecipitation' | 'storm' | 'thunderstorm';
type Variant = 'default' | 'rain' | 'snow';
const weatherTypes: WeatherType[] = ['clear', 'lightClouds', 'heavyClouds', 'lightPrecipitation', 'heavyPrecipitation', 'storm', 'thunderstorm'];

class SolarEclipse {
  public static variant(weather: WeatherType): Variant {
    if (weather !== 'lightPrecipitation' && weather !== 'heavyPrecipitation') return 'default';
    if (Weather.precipitation === 'rain') return 'rain';
    if (Weather.precipitation === 'snow') return 'snow';
    return 'default';
  }

  public static text(weather: WeatherType): string {
    const index = maplebirch.CA.StageIndex ?? 0;
    return maplebirch.t(`deadwood-reblooms.SolarEclipse.${weather === 'storm' ? 'thunderstorm' : weather}.${SolarEclipse.variant(weather)}.${index}`);
  }

  public static descriptions(): void {
    weatherTypes.forEach(weather => {
      const target = setup.WeatherDescriptions.type[weather];
      if (!target) return;
      target.solarEclipse = (): string => SolarEclipse.text(weather);
    });
  }

  public static patch(): void {
    Object.defineProperties(Weather, {
      solarEclipse: {
        configurable: true,
        get(): boolean {
          return maplebirch.CA.Active;
        }
      },

      skyState: {
        configurable: true,
        get(this: any): string {
          if (Weather.solarEclipse) return 'solarEclipse';
          if (Weather.bloodMoon) return 'bloodMoon';
          return this.dayState;
        }
      }
    });
  }
}

export default function (maplebirch: MaplebirchCore) {
  maplebirch.tool.addTo('Options', 'Celestial-Anomalies-Options');
  maplebirch.tool.onInit(() => {
    SolarEclipse.patch();
    SolarEclipse.descriptions();
  });
}
