import { describe, expect, test } from 'bun:test';
import { solarEclipseProgress } from '../src/module/CelestialAnomalies/SolarEclipse';
import { meteorShowerStrength, predictMeteorShower } from '../src/module/CelestialAnomalies/MeteorShower';
import applyMeteorShowerLayer from '../src/module/CelestialAnomalies/MeteorShowerLayer';
import CelestialAnomaliesScript from '../src/script/CelestialAnomalies';

describe('celestial anomaly schedules', () => {
  test('recalculates solar-eclipse progress as time advances', () => {
    expect(solarEclipseProgress(12, 8, 16)).toBe(0.5);
    expect(solarEclipseProgress(14, 8, 16)).toBe(0.75);
  });

  test('predicts the same meteor shower for the same save seed and date', () => {
    const date = { year: 2026, month: 9, day: 16, midnight: 1_000_000 };
    let event = null;

    for (let day = 1; day <= 365 && !event; day++) {
      event = predictMeteorShower(123456, { ...date, day, midnight: date.midnight + (day - 1) * 86400 });
    }

    expect(event).not.toBeNull();
    expect(predictMeteorShower(123456, event!.date)).toEqual(event);
    expect(event!.start).toBeGreaterThanOrEqual(event!.date.midnight + 20 * 3600);
    expect(event!.end).toBeGreaterThan(event!.date.midnight + 24 * 3600);
  });

  test('ramps meteor-shower strength in and out', () => {
    expect(meteorShowerStrength(0)).toBe(0);
    expect(meteorShowerStrength(0.1)).toBe(0.5);
    expect(meteorShowerStrength(0.5)).toBe(1);
    expect(meteorShowerStrength(0.9)).toBeCloseTo(0.5);
    expect(meteorShowerStrength(1)).toBe(0);
  });
});

describe('meteor-shower weather integration', () => {
  test('registers a meteor effect behind both star fields', () => {
    const layers: Array<[string, any, string]> = [];
    let modifyWeather: (() => void) | undefined;
    let effect: any;

    Object.assign(globalThis, {
      maplebirch: {
        once: (event: string, callback: () => void) => {
          if (event === ':modifyWeather') modifyWeather = callback;
        },
        dynamic: {
          Weather: {
            addLayer: (name: string, patch: any, mode: string) => layers.push([name, patch, mode])
          }
        }
      },
      Weather: {
        Renderer: {
          Effects: {
            add: (value: any) => {
              effect = value;
            }
          }
        }
      }
    });

    applyMeteorShowerLayer();
    modifyWeather?.();

    expect(effect.name).toBe('meteorShower');
    expect(layers.map(([name]) => name)).toEqual(['starField', 'bannerStarField']);
    expect(layers.every(([, , mode]) => mode === 'concat')).toBeTrue();
  });

  test('exposes meteor-shower state and gives it sky-description priority', () => {
    const callbacks: Array<() => void> = [];
    const descriptions = Object.fromEntries(
      ['clear', 'lightClouds', 'heavyClouds', 'lightPrecipitation', 'heavyPrecipitation', 'storm', 'thunderstorm'].map(name => [name, {}])
    );

    Object.assign(globalThis, {
      maplebirch: {
        CA: { Active: false, StageIndex: 0, MeteorActive: true },
        t: (key: string) => key,
        tool: {
          addTo: () => {},
          onInit: (callback: () => void) => callbacks.push(callback)
        }
      },
      setup: { WeatherDescriptions: { type: descriptions } },
      Weather: { bloodMoon: true, dayState: 'night', precipitation: 'none' }
    });

    CelestialAnomaliesScript((globalThis as any).maplebirch);
    callbacks.forEach(callback => callback());

    expect((globalThis as any).Weather.meteorShower).toBeTrue();
    expect((globalThis as any).Weather.skyState).toBe('meteorShower');
    expect((descriptions.clear as any).meteorShower()).toBe('deadwood-reblooms.MeteorShower.clear');
  });
});
