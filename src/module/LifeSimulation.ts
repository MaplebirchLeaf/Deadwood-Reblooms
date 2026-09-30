import Module from './Module';
import AcademicHonours from './LifeSimulation/AcademicHonours';
import School from './LifeSimulation/School';
import Weapons from './LifeSimulation/Weapons';
import { DEFAULT_LIFE_SIMULATION_STATE, type GymPlan } from './constants';

class LifeSimulation extends Module {
  public readonly academics = new AcademicHonours();
  public readonly school = new School(this.core);
  public readonly weapons = new Weapons();

  public constructor(core: typeof maplebirch) {
    super(core, 'LifeSimulation', DEFAULT_LIFE_SIMULATION_STATE);
  }

  public override preInit(): void {
    super.preInit();
    // 只在原版确实跨日时清除到期卡；读档时直接按保存的到期时间判断入场资格。
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

  /** 聊天与陪练共用每日次数；陪练也占用一次正常锻炼额度。 */
  public meetDoren(train: boolean): boolean {
    const gym = V.LifeSimulation.gym;
    if (!this.dorenPresent || gym.doren_interaction_day === Time.days || V.exposed > 0) return false;
    if (train && (gym.sessions_today >= 3 || window.pcAreArmsBound('both'))) return false;
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
    readonly LS: LifeSimulation;
  }
}

export default LifeSimulation;
