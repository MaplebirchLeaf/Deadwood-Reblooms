// ./src/module/CelestialAnomalies/SolarEclipse.ts

import apply from './SolarEclipseLayer';

type StageIndex = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export interface SolarEclipseStored {
  year: number;
  month: number;
  day: number;
  start: number;
  end: number;
  durationHours: number;
}

interface SolarEclipseState {
  seed: number;
  stored: SolarEclipseStored[];
}

class SolarEclipse {
  private static readonly config = {
    threshold: 0.03,
    trigger: 2,
    futureCount: 4,
    searchDays: 800
  };

  private cache = {
    date: '',
    eclipse: null as SolarEclipseStored | null,
    current: null as {
      phase: number;
      stageIndex: StageIndex;
    } | null
  };

  constructor(readonly core: typeof maplebirch) {
    this.core.once(':variable', () => this.refresh());

    this.core.dynamic.regTimeEvent('onDay', ':deadwood-reblooms-solar-eclipse', {
      action: () => this.refresh(),
      cond: () => this.enabled,
      exact: true
    });
  }

  public apply = apply;

  private get state(): SolarEclipseState {
    return ((V.CelestialAnomalies ??= {}).solarEclipse ??= {
      seed: this.seed(),
      stored: []
    });
  }

  private get enabled(): boolean {
    return V.options?.maplebirch?.CelestialAnomalies?.SolarEclipse === true;
  }

  public get active(): boolean {
    return !!this.current();
  }

  public get phase(): number {
    return this.current()?.phase ?? 0;
  }

  public get stageIndex(): StageIndex {
    return this.current()?.stageIndex ?? 0;
  }

  public get stored(): SolarEclipseStored[] {
    return this.state.stored;
  }

  private seed(): number {
    const d = new DateTime(Time.date);
    return (d.year * 10000 + d.month * 100 + d.day + Math.random() * 0xffffffff) >>> 0;
  }

  private hash(date: DateTime, salt: number): number {
    return (this.state.seed + date.year * salt + date.month * 131 + date.day * 17) >>> 0;
  }

  private build(date: DateTime): SolarEclipseStored | null {
    const phase = date.moonPhaseFraction;
    const threshold = SolarEclipse.config.threshold;
    if (phase > threshold && phase < 1 - threshold) return null;
    if (this.hash(date, 997) % SolarEclipse.config.trigger) return null;
    const hash = this.hash(date, 421);
    const start = (7 + (hash % 2)) * 3600 + (hash % 60) * 60;
    const durationHours = 9 + (this.hash(date, 733) % 3);
    return {
      year: date.year,
      month: date.month,
      day: date.day,
      start,
      end: start + durationHours * 3600,
      durationHours
    };
  }

  private today(date: DateTime) {
    const key = `${date.year}-${date.month}-${date.day}`;
    if (this.cache.date === key) return this.cache.eclipse;
    this.cache.date = key;
    this.cache.eclipse = this.build(date.midnight);
    this.cache.current = null;
    return this.cache.eclipse;
  }

  private current(date = new DateTime(Time.date)) {
    if (!this.enabled) return null;
    const eclipse = this.today(date);
    if (!eclipse) return null;
    const seconds = date.hour * 3600 + date.minute * 60 + date.second;
    if (seconds < eclipse.start || seconds > eclipse.end) return null;
    if (this.cache.current) return this.cache.current;
    const phase = (seconds - eclipse.start) / (eclipse.end - eclipse.start);
    this.cache.current = {
      phase,
      stageIndex: this.stage(phase)
    };
    return this.cache.current;
  }

  private stage(phase: number): StageIndex {
    const p = phase * 25;
    return p < 1 ? 0 : p < 4 ? 1 : p < 9 ? 2 : p < 16 ? 3 : p < 21 ? 4 : p < 24 ? 5 : 6;
  }

  private refresh(count = SolarEclipse.config.futureCount) {
    const now = new DateTime(Time.date);
    const state = this.state;
    const sort = (a: SolarEclipseStored, b: SolarEclipseStored) => a.year - b.year || a.month - b.month || a.day - b.day;
    state.stored = state.stored
      .filter(e => {
        const d = new DateTime(e.year, e.month, e.day);
        return d.timeStamp >= now.midnight.timeStamp;
      })
      .sort(sort)
      .slice(0, count);
    const known = new Set(state.stored.map(e => `${e.year}-${e.month}-${e.day}`));
    for (let d = now.midnight, i = 0; state.stored.length < count && i < SolarEclipse.config.searchDays; d = new DateTime(d).addDays(1), i++) {
      const eclipse = this.build(d);
      if (!eclipse) continue;
      const key = `${eclipse.year}-${eclipse.month}-${eclipse.day}`;
      if (!known.has(key)) {
        known.add(key);
        state.stored.push(eclipse);
      }
    }
    state.stored.sort(sort);
    this.cache.date = '';
  }
}

export default SolarEclipse;
