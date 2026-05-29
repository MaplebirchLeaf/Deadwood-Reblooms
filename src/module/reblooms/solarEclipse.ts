// ./src/module/reblooms/solarEclipse.ts

type EclipseStageIndex = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export interface StoredEclipse {
  year: number;
  month: number;
  day: number;
  start: number;
  end: number;
  startTime: string;
  endTime: string;
  durationHours: number;
}

interface EclipseState {
  seed: number;
  stored: StoredEclipse[];
}

type CurrentEclipse = {
  phase: number;
  stageIndex: EclipseStageIndex;
};

type SkyColors = {
  colorMin: { close: string; far: string };
  colorMed: { close: string; far: string };
  colorMax: { close: string; far: string };
};

function applySolarEclipse(): void {
  const weather = maplebirch.dynamic.Weather;

  const eclipseStrength = (): number => {
    const phase = Math.max(0, Math.min(1, maplebirch.rebloom.solarEclipse.phase));
    const progress = phase * 25;
    if (progress < 1) return progress * 0.25;
    if (progress < 4) return 0.25 + ((progress - 1) / 3) * 0.25;
    if (progress < 9) return 0.5 + ((progress - 4) / 5) * 0.5;
    if (progress < 16) return 1;
    if (progress < 21) return 1 - ((progress - 16) / 5) * 0.5;
    if (progress < 24) return 0.5 - ((progress - 21) / 3) * 0.25;
    return Math.max(0, 0.25 - (progress - 24) * 0.25);
  };

  const skyColors = (): SkyColors => {
    const normal: SkyColors = {
      colorMin: { close: '#14145200', far: '#00001c00' },
      colorMed: { close: '#d47d12', far: '#6c6d94' },
      colorMax: { close: '#d4d7ff', far: '#4692d4' }
    };

    const eclipse: SkyColors = {
      colorMin: { close: '#2d1f0000', far: '#1a120000' },
      colorMed: { close: '#2d1f00', far: '#1a1200' },
      colorMax: { close: '#2d1f00', far: '#1a1200' }
    };

    const strength = eclipseStrength();

    return {
      colorMin: {
        close: ColourUtils.interpolateColor(normal.colorMin.close, eclipse.colorMin.close, strength),
        far: ColourUtils.interpolateColor(normal.colorMin.far, eclipse.colorMin.far, strength)
      },
      colorMed: {
        close: ColourUtils.interpolateColor(normal.colorMed.close, eclipse.colorMed.close, strength),
        far: ColourUtils.interpolateColor(normal.colorMed.far, eclipse.colorMed.far, strength)
      },
      colorMax: {
        close: ColourUtils.interpolateColor(normal.colorMax.close, eclipse.colorMax.close, strength),
        far: ColourUtils.interpolateColor(normal.colorMax.far, eclipse.colorMax.far, strength)
      }
    };
  };

  const overlayPatch = (color: string) => ({
    params: {
      dayStateColors: {
        solarEclipse: color
      }
    },
    bindings: {
      solarEclipse(): boolean {
        return Weather.solarEclipse;
      },
      sunFactor(this: any): number {
        return this.renderInstance.orbitals.sun.factor;
      },
      moonFactor(this: any): number {
        return this.renderInstance.moonBrightnessFactor;
      },
      bloodMoon(): boolean {
        return Weather.bloodMoon;
      }
    }
  });

  // 1. 覆盖新版 colorOverlay。新版只使用 dayStateColors，不再读 this.color。
  weather.addEffect(
    'colorOverlay',
    {
      draw(this: any): void {
        const colors = this.dayStateColors;
        const darkenFactor = this.darkenFactor;
        const darkenTarget = this.darkenTarget;

        const baseDay = this.solarEclipse && colors.solarEclipse ? colors.solarEclipse : colors.day;

        const nightDark = darkenFactor > 0 ? ColourUtils.interpolateColor(colors.nightDark, darkenTarget, darkenFactor) : colors.nightDark;
        const nightBright = darkenFactor > 0 ? ColourUtils.interpolateColor(colors.nightBright, darkenTarget, darkenFactor) : colors.nightBright;
        const dawnDusk = darkenFactor > 0 ? ColourUtils.interpolateColor(colors.dawnDusk, darkenTarget, darkenFactor) : colors.dawnDusk;
        const day = darkenFactor > 0 ? ColourUtils.interpolateColor(baseDay, darkenTarget, darkenFactor) : baseDay;
        const bloodMoon = darkenFactor > 0 ? ColourUtils.interpolateColor(colors.bloodMoon, darkenTarget, darkenFactor) : colors.bloodMoon;

        const nightColor = this.bloodMoon ? bloodMoon : ColourUtils.interpolateColor(nightDark, nightBright, this.moonFactor);
        const mixFactor = this.solarEclipse && this.sunFactor > 0 ? Math.min(this.sunFactor * 0.05, 0.05) : this.sunFactor;
        const color = ColourUtils.interpolateTripleColor(nightColor, dawnDusk, day, mixFactor);

        this.canvas.ctx.fillStyle = color;
        this.canvas.fillRect();
      }
    },
    'replace'
  );

  // 2. 地点图与反射层染色。新版字段是 dayStateColors。
  const locationTint = {
    effects: [{}, overlayPatch('#1a1508d9')]
  };

  weather.addEffect('locationImage', locationTint, 'merge');
  weather.addEffect('locationReflective', locationTint, 'merge');

  // 3. 日蚀期间隐藏原版太阳。
  weather.addLayer(
    'sun',
    {
      effects: [
        {
          drawCondition(this: any): boolean {
            return !Weather.solarEclipse && this.renderInstance.orbitals.sun.factor > -0.5 && !this.renderInstance.sidebarSkyDisabled;
          }
        }
      ]
    },
    'merge'
  );

  // 4. 追加 7 张日蚀太阳图。
  weather.addLayer(
    'sun',
    {
      effects: Array.from({ length: 7 }, (_, index) => ({
        effect: 'skyOrbital',
        drawCondition(this: any): boolean {
          return Weather.solarEclipse && this.renderInstance.orbitals.sun.factor > -0.5 && !this.renderInstance.sidebarSkyDisabled && maplebirch.rebloom.solarEclipse.stageIndex === index;
        },
        params: {
          images: {
            orbital: `img/misc/sky/solar-eclipse-${index}.png`
          }
        },
        bindings: {
          position(this: any): any {
            return this.renderInstance.orbitals.sun.position;
          }
        }
      }))
    },
    'concat'
  );

  // 5. 日蚀天空渐变。
  const skyGradient = {
    effect: 'skyGradiant',
    drawCondition(this: any): boolean {
      return Weather.solarEclipse && !this.renderInstance.sidebarSkyDisabled;
    },
    params: {
      radius: 384
    },
    bindings: {
      color: skyColors,
      position(this: any): any {
        return this.renderInstance.orbitals.sun.position;
      },
      factor(this: any): number {
        return this.renderInstance.orbitals.sun.factor;
      }
    }
  };

  ['bannerSky', 'sky'].forEach(layer => {
    weather.addLayer(
      layer,
      {
        effects: [
          {},
          {},
          {
            drawCondition(this: any): boolean {
              return !Weather.solarEclipse && !this.renderInstance.sidebarSkyDisabled;
            }
          }
        ]
      },
      'merge'
    );

    weather.addLayer(layer, { effects: [skyGradient] }, 'concat');
  });

  // 6. 日蚀太阳光晕。
  [
    {
      layer: 'bannerSunGlow',
      radius: 100,
      diameter: 28,
      factor(this: any): number {
        return this.renderInstance.orbitals.sun.factor;
      }
    },
    {
      layer: 'sunGlow',
      radius: 82,
      diameter: 24,
      factor(): number {
        return Math.max(0.3, eclipseStrength());
      }
    }
  ].forEach(({ layer, radius, diameter, factor }) => {
    weather.addLayer(
      layer,
      {
        effects: [
          {
            drawCondition(this: any): boolean {
              return !Weather.solarEclipse && this.renderInstance.orbitals.sun.factor > -0.7 && !Weather.isOvercast && !this.renderInstance.sidebarSkyDisabled;
            }
          }
        ]
      },
      'merge'
    );

    weather.addLayer(
      layer,
      {
        effects: [
          {
            effect: 'outerRadialGlow',
            drawCondition(this: any): boolean {
              return Weather.solarEclipse && this.renderInstance.orbitals.sun.factor > -0.7 && !Weather.isOvercast && !this.renderInstance.sidebarSkyDisabled;
            },
            params: {
              outerRadius: radius,
              colorInside: {
                dark: '#f0e5d944',
                med: '#f0e5d944',
                bright: '#f0e5d944'
              },
              colorOutside: {
                dark: '#2d1f0000',
                med: '#2d1f0000',
                bright: '#2d1f0000'
              },
              cutCenter: false,
              diameter
            },
            bindings: {
              position(this: any): any {
                return this.renderInstance.orbitals.sun.position;
              },
              factor
            }
          }
        ]
      },
      'concat'
    );
  });

  // 7. 日蚀期间提前显示星空。
  ['bannerStarField', 'starField'].forEach(layer => {
    weather.addLayer(
      layer,
      {
        effects: [
          {
            drawCondition(this: any): boolean {
              return (this.renderInstance.orbitals.sun.factor < 0.75 || Weather.solarEclipse) && !this.renderInstance.sidebarSkyDisabled;
            }
          }
        ]
      },
      'merge'
    );
  });

  // 8. 云、雾等图层增加独立的日蚀染色层。
  const eclipseTint = (color: string) => ({
    effect: 'colorOverlay',

    drawCondition(this: any): boolean {
      return Weather.solarEclipse && !this.renderInstance.sidebarSkyDisabled;
    },

    compositeOperation: 'source-atop',

    params: {
      dayStateColors: {
        nightDark: color,
        nightBright: color,
        day: color,
        dawnDusk: color,
        bloodMoon: color
      },
      darkenFactor: 0,
      darkenTarget: '#000000'
    },

    bindings: {
      solarEclipse(): boolean {
        return Weather.solarEclipse;
      },

      sunFactor(this: any): number {
        return this.renderInstance.orbitals.sun.factor;
      },

      moonFactor(this: any): number {
        return this.renderInstance.moonBrightnessFactor;
      },

      bloodMoon(): boolean {
        return Weather.bloodMoon;
      }
    }
  });

  [
    { name: 'bannerClouds', color: '#5d4f20aa' },
    { name: 'bannerOvercastClouds', color: '#5d4f20aa' },
    { name: 'bannerCirrusClouds', color: '#5d4f20aa' },

    { name: 'clouds', color: '#5d4f20aa' },
    { name: 'overcastClouds', color: '#5d4f20aa' },
    { name: 'cirrusClouds', color: '#5d4f20aa' },

    { name: 'fog', color: '#3d2e10cc' },
    { name: 'fogOverlay', color: '#3d2e10cc' }
  ].forEach(({ name, color }) => {
    weather.addLayer(
      name,
      {
        effects: [eclipseTint(color)]
      },
      'concat'
    );
  });

  // 9. 降水层。新版降水主要由 particleRain / particleSnow 控制颜色，不再使用旧的 params.color。
  weather.addLayer(
    'bannerPrecipitation',
    {
      effects: [
        {
          params: {
            sunTint: '#2a1a4aaa',
            groundDayTint: '#2a1a4aaa',
            dawnDuskTint: '#2a1a4aaa',
            groundDawnDuskTint: '#2a1a4aaa'
          }
        },
        {
          params: {
            sunTint: '#2a1a4aaa',
            groundDayTint: '#2a1a4aaa',
            dawnDuskTint: '#2a1a4aaa',
            groundDawnDuskTint: '#2a1a4aaa'
          }
        },
        {},
        {
          params: {
            sunTint: '#d8c58aaa',
            groundDayTint: '#d8c58aaa',
            dawnDuskTint: '#d8c58aaa',
            groundDawnDuskTint: '#d8c58aaa'
          }
        },
        {
          params: {
            sunTint: '#d8c58aaa',
            groundDayTint: '#d8c58aaa',
            dawnDuskTint: '#d8c58aaa',
            groundDawnDuskTint: '#d8c58aaa'
          }
        }
      ]
    },
    'merge'
  );

  weather.addLayer(
    'precipitation',
    {
      effects: [
        {
          params: {
            sunTint: '#2a1a4aaa',
            groundDayTint: '#2a1a4aaa',
            dawnDuskTint: '#2a1a4aaa',
            groundDawnDuskTint: '#2a1a4aaa'
          }
        },
        {},
        {
          params: {
            sunTint: '#d8c58aaa',
            groundDayTint: '#d8c58aaa',
            dawnDuskTint: '#d8c58aaa',
            groundDawnDuskTint: '#d8c58aaa'
          }
        },
        {
          params: {
            sunTint: '#d8c58aaa',
            groundDayTint: '#d8c58aaa',
            dawnDuskTint: '#d8c58aaa',
            groundDawnDuskTint: '#d8c58aaa'
          }
        }
      ]
    },
    'merge'
  );
}

class EclipseSystem {
  private readonly config = {
    threshold: 0.03,
    triggerMod: 2,
    futureCount: 4,
    searchDays: 800
  } as const;

  private cache: {
    key: string;
    current: { phase: number; stageIndex: EclipseStageIndex } | null;
  } = {
    key: '',
    current: null
  };

  constructor(readonly core: typeof maplebirch) {
    this.core.once(':variable', () => {
      if (!this.state.seed) this.state.seed = this.createSeed();
      this.refreshStored();
    });

    this.core.dynamic.regTimeEvent('onDay', ':deadwood-reblooms-solar-eclipse', {
      action: () => this.refreshStored(),
      cond: () => this.enabled,
      exact: true
    });
  }

  public apply = applySolarEclipse;

  private get state(): EclipseState {
    V.DeadwoodReblooms ??= {};
    V.DeadwoodReblooms.solarEclipse ??= { seed: 0, stored: [] };
    const state = V.DeadwoodReblooms.solarEclipse as EclipseState;
    if (!Number.isSafeInteger(state.seed) || state.seed === 0) state.seed = this.createSeed();
    if (!Array.isArray(state.stored)) state.stored = [];
    return state;
  }

  private get enabled(): boolean {
    return V.options?.maplebirch?.DeadwoodReblooms?.solarEclipse === true;
  }

  get active(): boolean {
    return !!this.current();
  }

  get phase(): number {
    return this.current()?.phase ?? 0;
  }

  get stageIndex(): EclipseStageIndex {
    return this.current()?.stageIndex ?? 0;
  }

  get stored(): StoredEclipse[] {
    return this.state.stored.map(eclipse => ({
      ...eclipse,
      startTime: eclipse.startTime ?? this.timeText(eclipse.start),
      endTime: eclipse.endTime ?? this.timeText(eclipse.end)
    }));
  }

  private createSeed(): number {
    const date = new DateTime(Time.date);
    return (date.year * 10000 + date.month * 100 + date.day + Math.floor(Math.random() * 0xffffffff)) >>> 0 || 1;
  }

  private timeText(seconds: number): string {
    const hour = Math.floor(seconds / 3600) % 24;
    const minute = Math.floor((seconds % 3600) / 60);
    return `${hour}:${String(minute).padStart(2, '0')}`;
  }

  private dateHash(date: DateTime, salt: number): number {
    const dayOfYear = Math.floor((date.timeStamp - new DateTime(date.year, 1, 1).timeStamp) / 86400);
    return (this.state.seed + date.year * salt + date.month * 131 + date.day * 17 + dayOfYear * 37) >>> 0;
  }

  private build(date: DateTime): StoredEclipse | null {
    const fraction = date.moonPhaseFraction;
    const threshold = this.config.threshold;
    if (typeof fraction !== 'number') return null;
    if (fraction > threshold && fraction < 1 - threshold) return null;
    const previous = new DateTime(date).addDays(-1).moonPhaseFraction;
    if (typeof previous === 'number' && (previous <= threshold || previous >= 1 - threshold)) return null;
    if (this.dateHash(date, 997) % this.config.triggerMod !== 0) return null;
    const hash = this.dateHash(date, 421);
    const start = (7 + (hash % 2)) * 3600 + ((hash * 13) % 60) * 60;
    const durationHours = 9 + (this.dateHash(date, 733) % 3);
    const end = start + durationHours * 3600;

    return {
      year: date.year,
      month: date.month,
      day: date.day,
      start,
      end,
      startTime: this.timeText(start),
      endTime: this.timeText(end),
      durationHours
    };
  }

  private current(date = new DateTime(Time.date)): { phase: number; stageIndex: EclipseStageIndex } | null {
    const enabled = this.enabled;
    const key = `${enabled}-${date.year}-${date.month}-${date.day}-${date.hour}-${date.minute}-${date.second}`;
    if (this.cache.key === key) return this.cache.current;
    this.cache.key = key;

    if (!enabled) {
      this.cache.current = null;
      return null;
    }

    const eclipse = this.build(date.midnight);
    if (!eclipse) {
      this.cache.current = null;
      return null;
    }

    const seconds = date.hour * 3600 + date.minute * 60 + date.second;

    if (seconds < eclipse.start || seconds > eclipse.end) {
      this.cache.current = null;
      return null;
    }

    const phase = (seconds - eclipse.start) / (eclipse.end - eclipse.start);
    const progress = phase * 25;

    this.cache.current = {
      phase,
      stageIndex: (progress < 1 ? 0 : progress < 4 ? 1 : progress < 9 ? 2 : progress < 16 ? 3 : progress < 21 ? 4 : progress < 24 ? 5 : 6) as EclipseStageIndex
    };

    return this.cache.current;
  }

  private refreshStored(count = this.config.futureCount): void {
    const now = new DateTime(Time.date);
    const todayStamp = now.midnight.timeStamp;
    const seconds = now.hour * 3600 + now.minute * 60 + now.second;
    const state = this.state;

    const sortByDate = (a: StoredEclipse, b: StoredEclipse): number => {
      if (a.year !== b.year) return a.year - b.year;
      if (a.month !== b.month) return a.month - b.month;
      if (a.day !== b.day) return a.day - b.day;
      return a.start - b.start;
    };

    state.stored = state.stored
      .filter(eclipse => {
        const date = new DateTime(eclipse.year, eclipse.month, eclipse.day);
        const isToday = now.year === eclipse.year && now.month === eclipse.month && now.day === eclipse.day;

        return date.timeStamp > todayStamp || (isToday && seconds < eclipse.end);
      })
      .sort(sortByDate)
      .slice(0, count);

    const known = new Set(state.stored.map(eclipse => `${eclipse.year}-${eclipse.month}-${eclipse.day}`));

    for (let cursor = now.midnight, guard = 0; state.stored.length < count && guard < this.config.searchDays; cursor = new DateTime(cursor).addDays(1), guard++) {
      const eclipse = this.build(cursor);
      if (!eclipse) continue;

      const key = `${eclipse.year}-${eclipse.month}-${eclipse.day}`;
      const isToday = now.year === eclipse.year && now.month === eclipse.month && now.day === eclipse.day;

      if (!known.has(key) && (!isToday || seconds < eclipse.end)) {
        known.add(key);
        state.stored.push(eclipse);
      }
    }

    state.stored.sort(sortByDate);
    this.cache = { key: '', current: null };
  }
}

export default EclipseSystem;
