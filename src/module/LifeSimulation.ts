// ./src/module/LifeSimulation.ts

import Achievements from './Achievements';
import Module from './Module';
import AcademicHonours from './LifeSimulation/AcademicHonours';
import School from './LifeSimulation/School';
import Casino from './LifeSimulation/Casino';
import Weapons from './LifeSimulation/Weapons';
import Medicine from './LifeSimulation/Medicine';
import GymCoach from './LifeSimulation/GymCoach';
import PoolParty from './LifeSimulation/PoolParty';
import { DEFAULT_LIFE_SIMULATION_STATE, type BodyGrowthState, type GymPlan } from './constants';

class LifeSimulation extends Module {
  public readonly casino = new Casino(this.core);
  public readonly academics = new AcademicHonours();
  public readonly school = new School(this.core);
  public readonly weapons = new Weapons();
  public readonly medicine = new Medicine(this.core);
  public readonly coach = new GymCoach();
  public readonly pool_party = new PoolParty(this.core);

  public constructor(core: typeof maplebirch) {
    super(core, 'LifeSimulation', DEFAULT_LIFE_SIMULATION_STATE);
  }

  public override preInit(): void {
    this.core.on(':variable', () => {
      const npc = this.coach.npc;
      if (!npc) return;
      for (const key of ['gym_advice_day', 'gym_plan', 'gym_guided_day', 'gym_training', 'gym_last_day']) {
        const previous = key.replace(/_([a-z])/g, (_, letter: string) => letter.toUpperCase());
        if (!Object.hasOwn(npc, previous)) continue;
        if (Object.hasOwn(npc, key)) this.migration.utils.remove(npc, previous);
        else this.migration.utils.move(npc, previous, key);
      }
    });
    super.preInit();
    Achievements.add(this.core, 'LifeSimulation');
    this.pool_party.preInit();
    this.school.preInit();
    this.medicine.preInit();

    this.core.dynamic.regTimeEvent('onDay', ':deadwood-reblooms-body-growth', { exact: true, action: () => this.settleBodyGrowth() });
    // 只在原版确实跨日时清除到期卡，读档时直接按保存的到期时间判断入场资格。
    this.core.dynamic.regTimeEvent('onDay', ':deadwood-reblooms-gym-membership', {
      exact: true,
      action: () => {
        const gym = V.LifeSimulation.gym;
        gym.ticket_day = -1;
        gym.sessions_today = 0;
        gym.washed_today = false;
        if (gym.membership !== 'none' && gym.membership !== 'lifetime' && gym.expires_at <= Time.date.timeStamp) {
          gym.membership = 'none';
          gym.expires_at = 0;
        }
      }
    });
  }

  public get has(): boolean {
    const gym = V.LifeSimulation.gym;
    return gym.ticket_day === Time.days || gym.membership === 'lifetime' || (gym.membership !== 'none' && gym.expires_at > Time.date.timeStamp);
  }

  /** 多伦在工作日放学后、休息日白天才可能来训练。 */
  private get dorenCanVisit(): boolean {
    return C.npc.Doren?.init === 1 && C.npc.Doren.state === 'active' && Time.hour >= (Time.schoolDay ? 16 : 10) && Time.hour < 20;
  }

  /** 首次在合适时段进入训练区时决定当天是否遇见多伦。 */
  public rollDorenVisit(): void {
    const gym = V.LifeSimulation.gym;
    if (!this.has || !this.dorenCanVisit || gym.doren_checked_day === Time.days) return;
    gym.doren_checked_day = Time.days;
    gym.doren_present = Math.random() < 0.5;
  }

  public get dorenPresent(): boolean {
    const gym = V.LifeSimulation.gym;
    return this.has && this.dorenCanVisit && gym.doren_checked_day === Time.days && gym.doren_present;
  }

  /** 聊天与陪练共用每日次数，陪练也占用一次正常锻炼额度。 */
  public meetDoren(train: boolean): boolean {
    const gym = V.LifeSimulation.gym;
    if (!this.dorenPresent || gym.doren_interaction_day === Time.days || V.exposed > 0) return false;
    if (train && (!this.canTrainGrowth || gym.sessions_today >= 3 || window.pcAreArmsBound('both'))) return false;
    gym.doren_interaction_day = Time.days;
    if (train) gym.sessions_today++;
    return true;
  }

  public activate(plan: GymPlan): void {
    const gym = V.LifeSimulation.gym;
    if (plan === 'visit') {
      gym.ticket_day = Time.days;
      return;
    }
    gym.membership = plan;
    if (plan === 'lifetime') {
      gym.expires_at = 0;
      return;
    }
    const expiry = new DateTime(Time.date);
    if (plan === 'week') expiry.addDays(7);
    else if (plan === 'month') expiry.addMonths(1);
    else expiry.addYears(1);
    gym.expires_at = expiry.timeStamp;
  }

  public readonly clinicPrice = 500000;

  public get growth(): BodyGrowthState {
    return V.LifeSimulation.body_growth;
  }

  public get growthActive(): boolean {
    return this.growth.mode !== null;
  }

  public get growthDuration(): number {
    return this.growth.mode === 'clinic' ? 14 : 30;
  }

  public get growthRemaining(): number {
    return Math.max(0, this.growthDuration - this.growth.progress);
  }

  private get growthAvailable(): boolean {
    return V.id > 0 && V.combat !== 1 && V.exposed <= 0 && V.stress < V.stressmax;
  }

  public get canTrainGrowth(): boolean {
    return this.growthAvailable && V.location === 'deadwood_gym' && this.has && Time.hour >= 6 && Time.hour < 22;
  }

  public get canVisitClinic(): boolean {
    return this.growthAvailable && V.location === 'hospital';
  }

  public get canGrow(): boolean {
    return !this.growthActive && Number.isInteger(V.bodysize) && V.bodysize >= 0 && V.bodysize < 3;
  }

  public get canAffordClinic(): boolean {
    const finance = this.core.get('VanillaPlus')?.finance;
    return finance ? finance.canPay(this.clinicPrice, 'hospitalBodyGrowth') : V.money >= this.clinicPrice;
  }

  public startBodyGrowth(mode: 'gym' | 'clinic'): boolean {
    if (!this.canGrow || (mode !== 'gym' && mode !== 'clinic')) return false;
    if (mode === 'gym' ? !this.canTrainGrowth : !this.canVisitClinic || !this.canAffordClinic) return false;
    if (mode === 'clinic') this.core.SugarCube.Wikifier.wikifyEval(`<<money -${this.clinicPrice} 'hospitalBodyGrowth'>>`);
    Object.assign(this.growth, { mode, base: V.bodysize, progress: 0, settled_day: Time.days, notice: null });
    return true;
  }

  public stopBodyGrowth(): void {
    this.growth.mode = null;
    this.growth.progress = 0;
  }

  /** 只由成功完成的训练调用，同日多个项目或重进页面不能重复累计。 */
  public trainBodyGrowth(activity: string, day: number): void {
    // 入场资格在训练开始前检查，完成时不再用营业时间、到期卡或训练后的压力否定结果。
    if (this.growth.mode !== 'gym' || !['weights', 'run', 'deck-run'].includes(activity) || day <= this.growth.training_day) return;
    if (day !== Time.days && day !== Time.days - 1) return;
    this.growth.training_day = day;
    this.advanceBodyGrowth(1);
  }

  /** 医美按原版游戏日推进，保存游标使读档与同日事件保持幂等。 */
  public settleBodyGrowth(): void {
    if (this.growth.mode !== 'clinic' || Time.days <= this.growth.settled_day) return;
    const days = Time.days - this.growth.settled_day;
    this.growth.settled_day = Time.days;
    this.advanceBodyGrowth(days);
  }

  private advanceBodyGrowth(amount: number): void {
    // 原版事件或作弊已改变体型时，不把旧疗程的目标强行覆盖回去。
    if (V.bodysize !== this.growth.base) {
      this.stopBodyGrowth();
      this.growth.notice = 'interrupted';
      return;
    }
    this.growth.progress = Math.min(this.growthDuration, this.growth.progress + amount);
    if (this.growth.progress < this.growthDuration) return;
    // 复用原版开局的体型结算，不维护另一份上限表，找不到时保留进度。
    const calculation = this.core.SugarCube.Story.get('Widgets variablesStart2').text.match(/<<switch \$bodysize>>[\s\S]*?<<\/switch>>/)?.[0];
    if (!calculation) return;
    const oldMaximum = V.physiquesize;
    V.bodysize = this.growth.base + 1;
    this.core.SugarCube.Wikifier.wikifyEval(calculation);
    if (oldMaximum > 0) V.physique *= V.physiquesize / oldMaximum;
    this.stopBodyGrowth();
    this.growth.notice = 'grown';
  }

  public openGymLocker(): void {
    // 原版衣柜界面按 $wardrobe_location 读写衣物，健身房使用独立的储物柜。
    const wardrobes = V.wardrobes as Record<string, Record<string, unknown>>;
    wardrobes.deadwood_gym ??= {
      face: [],
      feet: [],
      hands: [],
      handheld: [],
      head: [],
      legs: [],
      lower: [],
      neck: [],
      over_head: [],
      over_lower: [],
      over_upper: [],
      genitals: [],
      under_lower: [],
      under_upper: [],
      upper: [],
      unlocked: true,
      shopSend: false,
      transfer: true,
      isolated: true,
      locationRequirement: [],
      space: 8,
      name: lanSwitch('Gym locker', '健身房储物柜')
    };
    V.wardrobe_location = 'deadwood_gym';
  }
}

declare module '@scml-dol-maplebirch/types' {
  interface Extensions {
    readonly LifeSimulation: LifeSimulation;
  }
}

export default LifeSimulation;
