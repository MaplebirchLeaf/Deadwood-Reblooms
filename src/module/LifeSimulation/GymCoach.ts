// ./src/module/LifeSimulation/GymCoach.ts

import type { GymState } from '../constants';

type Training = Exclude<GymState['activity'], ''>;
type Routine = 'weights' | 'run' | 'stretch';

/** 教练身份和训练记录一起保存在原版持久 NPC 中，读档后继续使用。 */
export default class GymCoach {
  public get npc() {
    return V.per_npc?.deadwood_gym_coach;
  }

  public get canAdvise(): boolean {
    return (
      !!maplebirch.get('LifeSimulation')?.has &&
      Time.hour >= 6 &&
      Time.hour < 22 &&
      V.exposed <= 0 &&
      V.stress < V.stressmax &&
      !window.pcAreArmsBound('both') &&
      V.LifeSimulation.gym.sessions_today < 3 &&
      this.npc?.gym_advice_day !== Time.days
    );
  }

  /** 疲劳或疼痛时先舒缓，否则补足较少练习的项目。 */
  public get suggestion(): Routine {
    if (V.tiredness >= C.tiredness.max * 0.6 || V.pain >= 40 || Time.days - (this.npc?.gym_last_day ?? Time.days) >= 7) return 'stretch';
    const training = this.npc?.gym_training;
    if ((training?.weights ?? 0) > (training?.run ?? 0)) return 'run';
    return 'weights';
  }

  public advise(): boolean {
    if (!this.canAdvise || this.npc?.name_known !== 1) return false;
    this.npc.gym_plan = this.suggestion;
    this.npc.gym_advice_day = Time.days;
    return true;
  }

  /** 只在完成训练后调用。沿海跑步也计入跑步习惯，指导奖励每天只领取一次。 */
  public complete(activity: Training, day: number): boolean {
    const npc = this.npc;
    if (!npc || !['weights', 'run', 'stretch', 'deck-run'].includes(activity)) return false;
    const routine = activity === 'deck-run' ? 'run' : activity;
    npc.gym_training ??= { weights: 0, run: 0, stretch: 0 };
    npc.gym_training[routine]++;
    npc.gym_last_day = day;
    if (npc.gym_advice_day !== day || npc.gym_plan !== routine || npc.gym_guided_day === day) return false;
    npc.gym_guided_day = day;
    return true;
  }
}
