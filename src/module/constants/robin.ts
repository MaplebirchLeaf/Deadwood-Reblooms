// ./src/module/constants/robin.ts

import investmentTerms from '../../assets/finance/shop-investment.json';

/** 气球摊位的走向，resolved 表示该支线已经收束。 */
export type BalloonRoute = 'none' | 'cooperate' | 'compete' | 'resolved';
/** 收容所（精神病院）路线状态。 */
export type AsylumStatus = 'home' | 'admitted' | 'recovering';
/** 罗宾店铺的开办阶段。 */
export type ShopStage = 'none' | 'planning' | 'applied' | 'site' | 'inspected' | 'permitted';

// Robin 模块沿用 V.RobinExpansion 存档字段。
export interface RobinExpansionState {
  /** 柠檬水摊位的改造等级。 */
  lemonade: number;
  /** 巧克力摊位的改造等级。 */
  chocolate: number;
  /** 家教业务是否已开办。 */
  tutor: boolean;
  /** 店铺是否已开张。 */
  shop: boolean;
  investment: {
    agreed: boolean;
    share: number;
    valuation: number;
    invested_total: number;
    returned_total: number;
    dividends_total: number;
    last_day: number;
    next_settlement: number;
    exit_day: number;
    report: { day: number; event: 'quiet' | 'busy' | 'loss' | 'closed'; profit: number; dividend: number } | null;
  };
  /**
   * 摊位与店铺的线索进度。
   * 线索先在对应场景出现，再把话题带回罗宾房间，摊位用等级记录每次改造后的下一条线索。
   */
  topics: {
    /** 柠檬水摊位的线索等级。 */
    lemonade: number;
    /** 巧克力摊位的线索等级。 */
    chocolate: number;
    /** 家教线索是否已获得。 */
    tutor: boolean;
    /** 店铺线索是否已获得。 */
    shop: boolean;
  };
  /** 店铺开办所处的阶段。 */
  shop_stage: ShopStage;
  /** 提交开店申请的游戏日。 */
  shop_application_day: number;
  /** 店铺验收的游戏日。 */
  shop_inspection_day: number;
  /** 银行是否已提供开店支持。 */
  shop_bank_supported: boolean;
  /** 玩家为摊位或店铺垫付的借款（英镑），PC 的 $money 使用便士。 */
  pc_loan: number;
  /** 店铺库存量。 */
  shop_stock: number;
  /** 店铺雇员数。 */
  shop_staff: number;
  /** 当前查看的应聘来源，孤儿院应聘者与外来店员分别保存。 */
  shop_applicant: 'adult' | 'orphan';
  /** 已聘人员的持久 NPC 键，按聘用顺序保存。 */
  shop_roster: string[];
  /** 店铺是否经营鲜花。 */
  shop_flowers: boolean;
  /** 各花种的库存，按花名计数。 */
  flower_stock: Record<string, number>;
  /** 店铺是否经营爆米花。 */
  shop_popcorn: boolean;
  /** 店铺是否经营气球。 */
  shop_balloons: boolean;
  /** 气球支线当前走向。 */
  balloon: BalloonRoute;
  /** 气球小游戏累计胜场。 */
  balloon_wins: number;
  /** 上次气球小游戏发生的游戏日。 */
  balloon_day: number;
  /** 罗宾的储备金（英镑），不计入原版 $robinmoney。 */
  reserve: number;
  /** 关怀基金余额（便士），由玩家存入供罗宾使用。 */
  care_fund: number;
  /** 本周收入快照（英镑）。 */
  weekly_income: number;
  /** 罗宾是否已经和 PC 试做过鲜鱼料理。 */
  fish_cooked: boolean;
  /** 柠檬水摊是否添置了便携烤架，店铺使用自身的厨房设备。 */
  fish_grill: boolean;
  /** 当日鲜鱼售出数量，供摊位与店铺共用。 */
  fish_sold_day: number;
  fish_sold_today: number;
  /** 当日烤鱼销售中罗宾的净收入，单位英镑。 */
  fish_earnings_today: number;
  /** 本次交付的鱼种、数量与返回地点。 */
  fish_selection: string;
  /** 鲜花摊当前选中的花种，与 fish_selection 同构，供店铺进货使用。 */
  flower_selection: string;
  fish_amount: number;
  fish_return: 'stall' | 'shop';
  /** 和罗宾在海滩钓鱼的游戏日、进行状态及开始时的累计渔获。 */
  fish_date_day: number;
  fish_date_active: boolean;
  fish_date_catch_start: number;
  /** 上次结算所在的周序号，-1 表示尚未结算。 */
  week: number;
  /** 罗宾是否开始自己付房租。 */
  self_rent: boolean;
  /** 房租是否已与玩家分开结算。 */
  rent_separated: boolean;
  /** 是否由双方共同承担房租。 */
  both_rent: boolean;
  /** 是否已进入反抗贝利的路线。 */
  rebellion: boolean;
  /** 反抗路线累计胜场。 */
  victories: number;
  /** 与贝利冲突的结算游戏日。 */
  fight_resolution_day: number;
  /** 是否已结成同盟。 */
  allies: boolean;
  /** 是否已达成团结结局线。 */
  solidarity: boolean;
  /** 贝利是否已被击败。 */
  bailey_defeated: boolean;
  /** 流星雨支线触发的游戏日。 */
  meteor_day: number;
  /**
   * 亲密场景的返回目标。
   * 场景入口跨越遭遇战回合后仍要知道该回到哪处摊位或约会地点。
   */
  intimacy_site: 'shop' | 'lemonade' | 'chocolate' | 'meteor' | null;
  /** 流星雨场景结束后返回的 Passage 名。 */
  meteor_return: string;
  /** 上次游泳事件的游戏日。 */
  swim_day: number;
  /** 上次家教课的游戏日。 */
  tutor_day: number;
  /** 家教累计课时。 */
  tutor_lessons: number;
  /** 当前家教科目索引。 */
  tutor_subject: number;
  /** 上次集市的游戏日。 */
  market_day: number;
  /** 上次集市售出数量。 */
  market_sales: number;
  /** 上次看店的游戏日。 */
  shop_day: number;
  /*
   * 摊位、店铺与校园各自限一次，日期标记由当前存档保存，不占用原版 $daily。
   */
  /** 上次摊位试吃的游戏日。 */
  stall_taste_day: number;
  /** 上次店铺试吃的游戏日。 */
  shop_taste_day: number;
  /** 上次促销活动的游戏日。 */
  sale_event_day: number;
  /** 上次校园饮品事件的游戏日。 */
  school_drinks_day: number;
  /** 上次校园叫醒事件的游戏日。 */
  school_wake_day: number;
  /** 上次夜间事件的游戏日。 */
  night_day: number;
  /** 上次夜间事件结算的游戏日。 */
  night_outcome_day: number;
  /** 收容所路线的全部进度。 */
  asylum: {
    /** 当前收容所状态。 */
    status: AsylumStatus;
    /** 上次检查罗宾状态的游戏日。 */
    checked_day: number;
    /** 连续处于严重状态的日数，累计到阈值才送医。 */
    severe_days: number;
    /** 入院游戏日。 */
    admitted_day: number;
    /** 已被收容的天数。 */
    days_confined: number;
    /** 是否已在收容所探视过。 */
    met: boolean;
    /** 解救计划进度。 */
    plan: number;
    /** 计划推进所在游戏日。 */
    plan_day: number;
    /** 上次探视的游戏日。 */
    visit_day: number;
    /** 上次预警的游戏日。 */
    warning_day: number;
    /** 上次预警探视的游戏日。 */
    warning_visit_day: number;
    /** 入院前的原版罗宾债务状态，离院后恢复。 */
    saved_debt: number;
    /** 上次从触手平原寻找罗宾的游戏日，用于限制每天一次。 */
    tentacle_day: number;
    /** 触手平原路线失败的累计次数，用于文案与日志。 */
    tentacle_failures: number;
    /** 已度过的触手遭遇次数，用于区分第一场与之后。 */
    tentacle_wave: number;
    /** 本次平原探索的步数与伏击判定。 */
    tentacle_steps: number;
    tentacle_ambush: boolean;
    /** 本次寻找期间已经安慰罗宾的次数，每次遭遇后限一次。 */
    tentacle_close: number;
  };
}

export const DEFAULT_ROBIN_EXPANSION_STATE: RobinExpansionState = {
  lemonade: 0,
  chocolate: 0,
  tutor: false,
  shop: false,
  investment: {
    agreed: false,
    share: 0,
    valuation: investmentTerms.initialValue,
    invested_total: 0,
    returned_total: 0,
    dividends_total: 0,
    last_day: -1,
    next_settlement: -1,
    exit_day: -1,
    report: null
  },
  topics: {
    lemonade: 0,
    chocolate: 0,
    tutor: false,
    shop: false
  },
  shop_stage: 'none',
  shop_application_day: -1,
  shop_inspection_day: -1,
  shop_bank_supported: false,
  pc_loan: 0,
  shop_stock: 0,
  shop_staff: 0,
  shop_applicant: 'adult',
  shop_roster: [],
  shop_flowers: false,
  flower_stock: {},
  shop_popcorn: false,
  shop_balloons: false,
  balloon: 'none',
  balloon_wins: 0,
  balloon_day: -1,
  reserve: 0,
  care_fund: 0,
  weekly_income: 0,
  fish_cooked: false,
  fish_grill: false,
  fish_sold_day: -1,
  fish_sold_today: 0,
  fish_earnings_today: 0,
  fish_selection: '',
  flower_selection: '',
  fish_amount: 1,
  fish_return: 'stall',
  fish_date_day: -1,
  fish_date_active: false,
  fish_date_catch_start: 0,
  week: -1,
  self_rent: false,
  rent_separated: false,
  both_rent: false,
  rebellion: false,
  victories: 0,
  fight_resolution_day: -1,
  allies: false,
  solidarity: false,
  bailey_defeated: false,
  meteor_day: -1,
  intimacy_site: null,
  meteor_return: 'Orphanage',
  swim_day: -1,
  tutor_day: -1,
  tutor_lessons: 0,
  tutor_subject: 0,
  market_day: -1,
  market_sales: 0,
  shop_day: -1,
  stall_taste_day: -1,
  shop_taste_day: -1,
  sale_event_day: -1,
  school_drinks_day: -1,
  school_wake_day: -1,
  night_day: -1,
  night_outcome_day: -1,
  asylum: {
    status: 'home',
    checked_day: -1,
    severe_days: 0,
    admitted_day: -1,
    days_confined: 0,
    met: false,
    plan: 0,
    plan_day: -1,
    visit_day: -1,
    warning_day: -1,
    warning_visit_day: -1,
    saved_debt: 0,
    tentacle_day: -1,
    tentacle_failures: 0,
    tentacle_wave: 0,
    tentacle_steps: 0,
    tentacle_ambush: false,
    tentacle_close: 0
  }
};
