import Module from './Module';
import stages from '../assets/psyche.json';

/** 理智承受超自然经历，恐惧与入迷共用心绪，压力与创伤沿用原版。 */
export default class Psyche extends Module {
  public constructor(core: typeof maplebirch) {
    super(core, 'Psyche', {
      sanity: 1000,
      mood: 0,
      recovery: { day: -1, spent: 0 },
      cooldown_until: 0,
      episode: null as null | { passage: string; mood: number; needsEffects?: boolean }
    });
  }

  public get state() {
    return V.Psyche;
  }

  public get active(): boolean {
    return Boolean(this.core.get('Psyche') === this && this.state && !V.statFreeze && !V.frozenValues && !V.replayScene);
  }

  public get free(): boolean {
    return this.active && !V.combat && !V.possessed && !V.eventforced && !V.nextPassage && !V.nextPassageCheck && V.stress < V.stressmax;
  }

  public readonly stages = stages;

  public get stage() {
    return stages.reduce((current, stage) => (this.state.sanity >= stage.min ? stage : current), stages[0]);
  }

  public get learning(): number {
    return this.active ? this.stage.learning * (1 - 0.2 * this.distraction) : 1;
  }

  public get knowledge(): number {
    return this.active ? this.stage.judgement * (1 - 0.1 * this.distraction) : 1;
  }

  public get intensity(): number {
    return Math.abs(this.state.mood);
  }

  public get distraction(): number {
    return this.active ? Math.clamp((this.intensity - 200) / 800, 0, 1) : 0;
  }

  public get willpower(): number {
    return 1 - 0.25 * this.distraction;
  }

  public get stressGain(): number {
    return this.active ? 1 + 0.25 * Math.clamp((this.state.mood - 200) / 800, 0, 1) : 1;
  }

  /** 入迷只加快明确的异常研究，撤退倍率只用于真正的逃离选择。 */
  public get research(): number {
    return this.active ? 1 - 0.25 * Math.clamp((-this.state.mood - 200) / 800, 0, 1) : 1;
  }

  public get escape(): number {
    return this.active ? 1 - 0.1 * Math.clamp((this.state.mood - 200) / 800, 0, 1) : 1;
  }

  public get canCalm(): boolean {
    return this.free && this.intensity >= 400 && Time.date.timeStamp >= this.state.cooldown_until;
  }

  public get modifier(): number {
    return 1.25 - (this.state.sanity + 500) / 3000;
  }

  /** 恐惧为正，入迷为负，事件影响按当时理智缩放后相互抵消。 */
  public change(sanity = 0, mood = 0): void {
    if (!this.active || !Number.isFinite(sanity) || !Number.isFinite(mood)) return;
    this.state.mood = Math.clamp(this.state.mood + mood * this.modifier, -1000, 1000);
    this.state.sanity = Math.clamp(this.state.sanity + sanity, -500, 1000);
  }

  /** 日限额按基础点计入，高位恢复减半。心绪只向零平复，不占额度。 */
  public rest(sanity = 0, mood = 0): void {
    if (!this.active || !Number.isFinite(sanity) || sanity < 0 || !Number.isFinite(mood)) return;
    const day = Math.floor(Time.days);
    const recovery = (this.state.recovery ??= { day, spent: 0 });
    if (recovery.day !== day) Object.assign(recovery, { day, spent: 0 });
    const low = Math.max(0, 600 - this.state.sanity);
    const capacity = Math.max(0, low + 2 * (1000 - Math.max(600, this.state.sanity)));
    const base = Math.min(sanity, Math.max(0, 30 - recovery.spent), capacity);
    recovery.spent += base;
    this.change(Math.min(base, low) + Math.max(0, base - low) * 0.5);
    this.state.mood -= Math.sign(this.state.mood) * Math.min(this.intensity, Math.max(0, -mood));
  }
}

declare module '@scml-dol-maplebirch/types' {
  interface Extensions {
    readonly Psyche: Psyche;
  }
}
