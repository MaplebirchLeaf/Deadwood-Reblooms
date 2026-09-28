import Module from './Module';
import AcademicHonours from './LifeSimulation/AcademicHonours';
import School, { DEFAULT_SCHOOL_STATE } from './LifeSimulation/School';

type GymPlan = 'visit' | 'week' | 'month' | 'year' | 'lifetime';

const DEFAULT_HISTORY_PROJECT_STATE = {
  // 项目进度和证据结果都写入 V.LifeSimulation；重新读档后直接恢复当前阶段。
  status: 'none' as 'none' | 'ongoing' | 'done' | 'won',
  source: 'none' as 'none' | 'paintingward' | 'paintingsnake',
  availableDay: 0,
  deadline: 0,
  assistant: false,
  kylar: 'none' as 'none' | 'help' | 'sabotage',
  kylarStreet: false,
  kylarPrepared: false,
  archive: 0,
  museum: 0,
  recovery: 'none' as 'none' | 'recorded' | 'rushed',
  ruin: 0,
  draft: 0,
  final: 0
};

class LifeSimulation extends Module {
  static readonly variables = {
    historyProject: DEFAULT_HISTORY_PROJECT_STATE,
    school: DEFAULT_SCHOOL_STATE,
    gym: {
      ticket_day: -1,
      membership: 'none' as Exclude<GymPlan, 'visit'> | 'none',
      expires_at: 0,
      sessions_today: 0,
      washed_today: false,
      activity: '' as '' | 'weights' | 'run' | 'stretch' | 'deck-run'
    }
  };

  public readonly exposed = true;
  public readonly academics = new AcademicHonours();
  public readonly school = new School(this.core);

  public constructor(core: typeof maplebirch) {
    super(core, 'LifeSimulation', LifeSimulation.variables);
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
