import Module from './Module';
import AcademicHonours from './LifeSimulation/AcademicHonours';
import School from './LifeSimulation/School';
import { DEFAULT_LIFE_SIMULATION_STATE, type GymPlan } from './constants';

class LifeSimulation extends Module {
  public readonly exposed = true;
  public readonly academics = new AcademicHonours();
  public readonly school = new School(this.core);

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
