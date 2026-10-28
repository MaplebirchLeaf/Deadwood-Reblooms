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
      mirror: false,
      insight: -1,
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
    return this.active ? this.stage.learning : 1;
  }

  public get knowledge(): number {
    return this.active ? this.stage.judgement : 1;
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

  public get alertness(): number {
    return this.active ? Math.clamp((this.state.mood - 200) / 800, 0, 1) : 0;
  }

  public get stressGain(): number {
    return 1 + 0.25 * this.alertness;
  }

  /** 入迷只加快明确的异常研究。 */
  public get research(): number {
    return this.active ? 1 - 0.25 * Math.clamp((-this.state.mood - 200) / 800, 0, 1) : 1;
  }

  public get escape(): number {
    return 1 - 0.25 * this.alertness;
  }

  public get canCalm(): boolean {
    return this.free && this.intensity >= 400 && Time.date.timeStamp >= this.state.cooldown_until;
  }

  private get ascended(): boolean {
    return Boolean(this.core.get('Finance')?.company.ascension.active);
  }

  /** 三位一体减轻四分之一，飞升减半，取较强一项而不叠加。 */
  private get resistance(): number {
    if (this.ascended) return 0.5;
    return this.core.get('VanillaPlus')?.divineTransformations.trinity ? 0.75 : 1;
  }

  private get sensitivity(): number {
    return 1.25 - (this.state.sanity + 500) / 3000;
  }

  public get modifier(): number {
    return this.sensitivity * this.resistance;
  }

  /** 先按当时理智抵消已有心绪，抗性只减轻新增负担，不削弱平复与恢复。 */
  public change(sanity = 0, mood = 0): void {
    if (!this.active || !Number.isFinite(sanity) || !Number.isFinite(mood)) return;
    const resistance = this.resistance;
    const incoming = mood * this.sensitivity;
    const cancelled = this.state.mood * incoming < 0 ? Math.min(this.intensity, Math.abs(incoming)) : 0;
    this.state.mood = Math.clamp(this.state.mood + Math.sign(incoming) * (cancelled + (Math.abs(incoming) - cancelled) * resistance), -1000, 1000);
    this.state.sanity = Math.clamp(this.state.sanity + sanity * (sanity < 0 ? resistance : 1), -500, 1000);
  }

  /** 日常恢复共用每日额度，心绪只向零平复，不占额度。 */
  public rest(sanity = 0, mood = 0): void {
    if (!this.active || !Number.isFinite(sanity) || sanity < 0 || !Number.isFinite(mood)) return;
    const day = Math.floor(Time.days);
    const recovery = (this.state.recovery ??= { day, spent: 0 });
    if (recovery.day !== day) Object.assign(recovery, { day, spent: 0 });
    const base = Math.min(sanity, Math.max(0, (this.ascended ? 60 : 30) - recovery.spent), 1000 - this.state.sanity);
    recovery.spent += base;
    this.change(base);
    this.state.mood -= Math.sign(this.state.mood) * Math.min(this.intensity, Math.max(0, -mood));
  }
}

declare module '@scml-dol-maplebirch/types' {
  interface Extensions {
    readonly Psyche: Psyche;
  }
}
