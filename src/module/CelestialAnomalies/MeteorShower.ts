import apply from './MeteorShowerLayer';

interface MeteorDate {
  year: number;
  month: number;
  day: number;
  midnight: number;
}

export interface MeteorShowerStored {
  date: MeteorDate;
  start: number;
  end: number;
}

interface MeteorShowerState {
  seed: number;
  stored: MeteorShowerStored[];
}

const trigger = 45;
const secondsPerHour = 3600;

function hash(seed: number, date: MeteorDate, salt: number): number {
  return (seed + date.year * salt + date.month * 131 + date.day * 17) >>> 0;
}

function predict(seed: number, date: MeteorDate): MeteorShowerStored | null {
  // 存档种子与日期共同决定是否发生，读档后不会因为重新掷随机数改变预报。
  if (hash(seed, date, 1543) % trigger !== 0) return null;

  const timing = hash(seed, date, 619);
  const startHour = 20 + (timing % 3);
  const durationHours = 5 + (hash(seed, date, 887) % 3);
  const start = date.midnight + startHour * secondsPerHour;

  return {
    date: { ...date },
    start,
    end: start + durationHours * secondsPerHour
  };
}

function strength(phase: number): number {
  const progress = Math.min(1, Math.max(0, phase));
  if (progress < 0.2) return progress / 0.2;
  if (progress > 0.8) return (1 - progress) / 0.2;
  return 1;
}

class MeteorShower {
  private static readonly config = {
    futureCount: 4,
    searchDays: 400
  };

  public constructor(readonly core: typeof maplebirch) {}

  public preInit(): void {
    this.core.on(':variable', () => this.refresh(), 'Meteor Shower');
    this.core.dynamic.regTimeEvent('onDay', ':deadwood-reblooms-meteor-shower', {
      action: () => this.refresh(),
      cond: () => this.enabled,
      exact: true
    });
  }

  public apply = apply;

  private get state(): MeteorShowerState {
    const state = ((V.CelestialAnomalies ??= {}).meteorShower ??= {
      seed: 0,
      stored: []
    });
    // 种子属于当前 V，首次生成后固定，不能在重新载入同一存档时重掷。
    if (state.seed === 0) {
      state.seed = this.seed() || 1;
      state.stored = [];
    }
    return state;
  }

  private get enabled(): boolean {
    return V.options?.maplebirch?.CelestialAnomalies?.MeteorShower === true;
  }

  public get active(): boolean {
    return this.current() !== null;
  }

  public get phase(): number {
    return this.current()?.phase ?? 0;
  }

  public get strength(): number {
    return strength(this.phase);
  }

  public get stored(): MeteorShowerStored[] {
    return this.state.stored;
  }

  private seed(): number {
    const date = new DateTime(Time.date);
    return (date.year * 10000 + date.month * 100 + date.day + Math.random() * 0xffffffff) >>> 0;
  }

  private date(date: DateTime): MeteorDate {
    return {
      year: date.year,
      month: date.month,
      day: date.day,
      midnight: date.midnight.timeStamp
    };
  }

  private build(date: DateTime): MeteorShowerStored | null {
    return predict(this.state.seed, this.date(date));
  }

  private current(date = new DateTime(Time.date)) {
    if (!this.enabled) return null;

    // 流星雨可能在午夜后继续，所以当前日与前一日都要查。
    const previous = new DateTime(date.midnight).addDays(-1);
    const event = [this.build(previous), this.build(date.midnight)].find(item => item && date.timeStamp >= item.start && date.timeStamp <= item.end);
    if (!event) return null;

    return {
      event,
      phase: Math.clamp((date.timeStamp - event.start) / (event.end - event.start), 0, 1)
    };
  }

  private refresh(count = MeteorShower.config.futureCount): void {
    const now = new DateTime(Time.date);
    const state = this.state;
    state.stored = state.stored
      .filter(event => event.end >= now.timeStamp)
      .sort((a, b) => a.start - b.start)
      .slice(0, count);

    // 仅保存将来的几场预报，且用开始时间去重，避免多次跨日刷新重复写入存档。
    const known = new Set(state.stored.map(event => event.start));
    for (let date = now.midnight, searched = 0; state.stored.length < count && searched < MeteorShower.config.searchDays; date = new DateTime(date).addDays(1), searched++) {
      const event = this.build(date);
      if (!event || known.has(event.start)) continue;
      known.add(event.start);
      state.stored.push(event);
    }
    state.stored.sort((a, b) => a.start - b.start);
  }
}

export default MeteorShower;
