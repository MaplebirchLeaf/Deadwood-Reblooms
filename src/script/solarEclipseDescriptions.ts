// ./src/script/solarEclipseDescriptions.ts

type WeatherType = 'clear' | 'lightClouds' | 'heavyClouds' | 'lightPrecipitation' | 'heavyPrecipitation' | 'storm' | 'thunderstorm';
type Variant = 'default' | 'rain' | 'snow';
const keyPrefix = 'deadwoodReblooms.SolarEclipse';
const weatherTypes: WeatherType[] = ['clear', 'lightClouds', 'heavyClouds', 'lightPrecipitation', 'heavyPrecipitation', 'storm', 'thunderstorm'];

function variant(weather: WeatherType): Variant {
  if (weather !== 'lightPrecipitation' && weather !== 'heavyPrecipitation') return 'default';
  if (Weather.precipitation === 'rain') return 'rain';
  if (Weather.precipitation === 'snow') return 'snow';
  return 'default';
}

function solarEclipseText(weather: WeatherType): string {
  const index = maplebirch.rebloom.solarEclipse.stageIndex ?? 0;
  return maplebirch.t(`${keyPrefix}.${weather === 'storm' ? 'thunderstorm' : weather}.${variant(weather)}.${index}`);
}

export function solarEclipseDescriptions(): void {
  weatherTypes.forEach(weather => {
    const target = setup.WeatherDescriptions.type[weather];
    if (!target) return;
    target.solarEclipse = (): string => solarEclipseText(weather);
  });
}
