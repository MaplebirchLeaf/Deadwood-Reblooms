// ./src/module/reblooms/solarEclipse.ts

import applySolarEclipseLayer from './solarEclipseLayer';

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

  public constructor(readonly core: typeof maplebirch) {
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

  public apply = applySolarEclipseLayer;

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

  public get active(): boolean {
    return !!this.current();
  }

  public get phase(): number {
    return this.current()?.phase ?? 0;
  }

  public get stageIndex(): EclipseStageIndex {
    return this.current()?.stageIndex ?? 0;
  }

  public get stored(): StoredEclipse[] {
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
