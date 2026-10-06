// ./src/module/constants/vanilla-plus.ts

import type { FinanceState } from '../VanillaPlus/Finance';
import { DEFAULT_FINANCE_STATE } from '../VanillaPlus/Finance';
import type { NPCDoublePenetrationData } from '../VanillaPlus/NPCDoublePenetration';
import type { RealEstateState } from '../VanillaPlus/RealEstate';
import { RealEstate } from '../VanillaPlus/RealEstate';

/** 六项可突破属性。锁与特质表都以此为准。 */
export type VanillaPlusAttribute = 'willpower' | 'physique' | 'beauty' | 'exhibitionism' | 'deviancy' | 'promiscuity';
/** 可解锁的特质：六项属性特质，外加全属性满值后的"不可救药"。 */
export type VanillaPlusTrait = VanillaPlusAttribute | 'incorrigible';

// 模块 VanillaPlus 的存档结构，对应 V.VanillaPlus。
export interface VanillaPlusState {
  /** 各属性的突破结算锁。为 true 表示该属性的突破已经结算过，不再重复触发。 */
  lock: Record<VanillaPlusAttribute, boolean>;
  /** 各属性特质是否已解锁，incorrigible 需六项属性全部满值后才置位。 */
  traits: Record<VanillaPlusTrait, boolean>;
  /** 美貌相关的一次性进度。 */
  beauty: {
    /** 是否已经历过"倾城"事件，该事件只发生一次。 */
    alluring: boolean;
  };
  /** 神圣转化加成与祈祷室的异常接触。 */
  divineTransformations: {
    /** 转化赋予的额外美貌上限加成，参与 normalCeiling 计算。 */
    beautyBonus: number;
    /** 本场遭遇是否已使用过“清除”。 */
    expungeUsed: boolean;
    /** 已亲历过的三种原版祈祷室接触，挣脱也计入。 */
    prayer: Record<'holy' | 'stone' | 'dark', boolean>;
    /** 是否获得“三位一体”，允许神圣转化共存。 */
    trinity: boolean;
    /** 当前接触的结算状态，避免重绘结果时重复施加变化。 */
    contact: 'none' | 'pending' | 'success' | 'failure' | 'escape';
    /** 接触入口使用原版意志检定得到的结果。 */
    contactHeld: boolean;
  };
  /** 银行、证券与市场的全部可变状态。 */
  finance: FinanceState;
  adrian: {
    last_offence: '' | 'pressure' | 'insult' | 'queue';
    lastVisit: number;
    visits: number;
    lastChat: number;
    accountDiscussed: boolean;
    homeDiscussed: boolean;
    career: number;
    careerReadyDay: number;
    businessDay: number;
    businessDays: number;
  };
  /** 房产产权、租约、拍卖与同住状态。 */
  real_estate: RealEstateState;
  /** 体格相关的一次性事件标记。 */
  physique: {
    /** 已触发过恐慌事件。 */
    panic: boolean;
    /** 已触发过英勇事件。 */
    heroic: boolean;
    /** 已解锁农场劳作路线。 */
    farm: boolean;
    /** 已遭遇过围栏/牢笼事件。 */
    pound: boolean;
    /** 本存档已用过一次"挣脱"，用后不再提供。 */
    breakUsed: boolean;
  };
  /** 露出癖相关的场景进度。 */
  exhibitionism: {
    /** 泳池露出场景已发生。 */
    swimming: boolean;
    /** 舞厅裸舞场景已发生。 */
    ballroom: boolean;
    /** 商业街裸奔（正式）已发生。 */
    highStreetRun: boolean;
    /** 商业街暴露（初次）已发生。 */
    highStreet: boolean;
    /** 五级突破事件已完成，用于避免重复触发。 */
    levelFive: number;
  };
  /** 异种癖相关进度与镜子出口坐标。 */
  deviancy: {
    /** 野性之歌前置已满足。 */
    wildsong: boolean;
    /** 仪式正在进行中，读档后据此恢复流程。 */
    conducting: boolean;
    /** 仪式已完成，上限已解锁。 */
    conducted: boolean;
    /** 五级突破事件已完成。 */
    levelFive: number;
    /** 本次爬镜的出发点类型，决定进入触手平原后返回哪里。 */
    mirror: string;
    /** 上次触发镜子事件的游戏日，防止同日重复。 */
    mirror_day: number;
    /** 选择"从房产镜子出去"时记录的目标房产 id。 */
    mirror_property: string | null;
    /** 各类镜面出口落在触手平原的随机坐标，键形如 'property:domus'。 */
    mirror_locations: Record<string, { north: number; east: number }>;
    /** 各处镜子是否已被发现，property 再按房产 id 细分。 */
    mirrors: {
      /** 孤儿院卧室的镜子。 */
      home: boolean;
      /** 各房产的镜子，按房产 id 记录。 */
      property: Record<string, boolean>;
      /** 农场的镜子。 */
      farm: boolean;
      /** 高塔的镜子。 */
      tower: boolean;
      /** 神殿宿舍的镜子。 */
      temple: boolean;
      /** 西里斯庄园的镜子。 */
      sirris: boolean;
      /** 凯拉尔庄园的镜子。 */
      kylar: boolean;
    };
  };
  /** 淫乱相关的场景进度。 */
  promiscuity: {
    /** 臀部引导动作的 NPC 目标，null 表示未占用。 */
    bottom_target: number | null;
    /** 五级突破事件已完成。 */
    levelFive: number;
  };
  /** 手部抓握开关状态，null 表示尚未选择。 */
  handGrip: {
    /** 左手是否启用抓握，null 为未设置。 */
    left: number | null;
    /** 右手是否启用抓握，null 为未设置。 */
    right: number | null;
  };
  /** 双人插入遭遇战的进行状态，不在遭遇战中时为 null。 */
  npcDoublePenetration: NPCDoublePenetrationData | null;
  /** 意志相关的一次性事件与痛苦护盾。 */
  willpower: {
    /** 亡魂事件已完成。 */
    wraith: boolean;
    /** 崩解事件已完成。 */
    schism: boolean;
    /** 守夜事件已完成。 */
    vigil: boolean;
    /** 痛苦护盾的当前状态。 */
    painShield: {
      /** 护盾剩余量，归零后失效。 */
      remaining: number;
      /** 护盾是否已就绪可再次使用。 */
      ready: boolean;
    };
  };
}

export const DEFAULT_VANILLA_PLUS_STATE: VanillaPlusState = {
  adrian: { last_offence: '', lastVisit: -1, visits: 0, lastChat: -1, accountDiscussed: false, homeDiscussed: false, career: 0, careerReadyDay: 0, businessDay: -1, businessDays: 0 },
  lock: {
    physique: false,
    willpower: false,
    beauty: false,
    promiscuity: false,
    exhibitionism: false,
    deviancy: false
  },
  traits: {
    willpower: false,
    physique: false,
    beauty: false,
    exhibitionism: false,
    deviancy: false,
    promiscuity: false,
    incorrigible: false
  },
  beauty: {
    alluring: false
  },
  divineTransformations: {
    beautyBonus: 0,
    expungeUsed: false,
    prayer: { holy: false, stone: false, dark: false },
    trinity: false,
    contact: 'none',
    contactHeld: false
  },
  finance: DEFAULT_FINANCE_STATE,
  real_estate: RealEstate.defaults,
  physique: {
    panic: false,
    heroic: false,
    farm: false,
    pound: false,
    breakUsed: false
  },
  exhibitionism: {
    swimming: false,
    ballroom: false,
    highStreetRun: false,
    highStreet: false,
    levelFive: 0
  },
  deviancy: {
    wildsong: false,
    conducting: false,
    conducted: false,
    levelFive: 0,
    mirror: '',
    mirror_day: -1,
    mirror_property: null,
    mirror_locations: {},
    mirrors: {
      home: false,
      property: {},
      farm: false,
      tower: false,
      temple: false,
      sirris: false,
      kylar: false
    }
  },
  promiscuity: {
    bottom_target: null,
    levelFive: 0
  },
  handGrip: {
    left: null,
    right: null
  },
  npcDoublePenetration: null,
  willpower: {
    wraith: false,
    schism: false,
    vigil: false,
    painShield: {
      remaining: 0,
      ready: true
    }
  }
};
