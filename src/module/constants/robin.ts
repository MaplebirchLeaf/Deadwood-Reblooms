// ./src/module/constants/robin-expansion.ts

/** 气球摊位的走向，resolved 表示该支线已经收束。 */
export type BalloonRoute = 'none' | 'cooperate' | 'compete' | 'resolved';
/** 收容所（精神病院）路线状态。 */
export type AsylumStatus = 'home' | 'admitted' | 'recovering';
/** 罗宾店铺的开办阶段。 */
export type ShopStage = 'none' | 'planning' | 'applied' | 'site' | 'inspected' | 'permitted';

// Robin 模块沿用 V.RobinExpansion 存档字段，保留旧存档进度。
export interface RobinExpansionState {
  /** 柠檬水摊位的改造等级。 */
  lemonade: number;
  /** 巧克力摊位的改造等级。 */
  chocolate: number;
  /** 家教业务是否已开办。 */
  tutor: boolean;
  /** 店铺是否已开张。 */
  shop: boolean;
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
  shopStage: ShopStage;
  /** 提交开店申请的游戏日。 */
  shopApplicationDay: number;
  /** 店铺验收的游戏日。 */
  shopInspectionDay: number;
  /** 银行是否已提供开店支持。 */
  shopBankSupported: boolean;
  /** 玩家为摊位或店铺垫付的借款（英镑），PC 的 $money 使用便士。 */
  pcLoan: number;
  /** 店铺库存量。 */
  shopStock: number;
  /** 店铺雇员数。 */
  shopStaff: number;
  /** 店铺是否经营鲜花。 */
  shopFlowers: boolean;
  /** 各花种的库存，按花名计数。 */
  flowerStock: Record<string, number>;
  /** 店铺是否经营爆米花。 */
  shopPopcorn: boolean;
  /** 店铺是否经营气球。 */
  shopBalloons: boolean;
  /** 气球支线当前走向。 */
  balloon: BalloonRoute;
  /** 气球小游戏累计胜场。 */
  balloonWins: number;
  /** 上次气球小游戏发生的游戏日。 */
  balloonDay: number;
  /** 罗宾的储备金（英镑），不计入原版 $robinmoney。 */
  reserve: number;
  /** 关怀基金余额（便士），由玩家存入供罗宾使用。 */
  careFund: number;
  /** 本周收入快照（英镑）。 */
  weeklyIncome: number;
  /** 罗宾是否已经和 PC 试做过鲜鱼料理。 */
  fishCooked: boolean;
  /** 柠檬水摊是否添置了便携烤架，店铺使用自身的厨房设备。 */
  fishGrill: boolean;
  /** 当日鲜鱼售出数量，供摊位与店铺共用。 */
  fishSoldDay: number;
  fishSoldToday: number;
  /** 当日烤鱼销售中罗宾的净收入，单位英镑。 */
  fishEarningsToday: number;
  /** 本次交付的鱼种、数量与返回地点。 */
  fishSelection: string;
  fishAmount: number;
  fishReturn: 'stall' | 'shop';
  /** 和罗宾在海滩钓鱼的游戏日、进行状态及开始时的累计渔获。 */
  fishDateDay: number;
  fishDateActive: boolean;
  fishDateCatchStart: number;
  /** 上次结算所在的周序号，-1 表示尚未结算。 */
  week: number;
  /** 罗宾是否开始自己付房租。 */
  selfRent: boolean;
  /** 房租是否已与玩家分开结算。 */
  rentSeparated: boolean;
  /** 是否由双方共同承担房租。 */
  bothRent: boolean;
  /** 是否已进入反抗贝利的路线。 */
  rebellion: boolean;
  /** 反抗路线累计胜场。 */
  victories: number;
  /** 与贝利冲突的结算游戏日。 */
  fightResolutionDay: number;
  /** 是否已结成同盟。 */
  allies: boolean;
  /** 是否已达成团结结局线。 */
  solidarity: boolean;
  /** 贝利是否已被击败。 */
  baileyDefeated: boolean;
  /** 流星雨支线触发的游戏日。 */
  meteorDay: number;
  /**
   * 亲密场景的返回目标。
   * 场景入口跨越遭遇战回合后仍要知道该回到哪处摊位或约会地点。
   */
  intimacySite: 'shop' | 'lemonade' | 'chocolate' | 'meteor' | null;
  /** 流星雨场景结束后返回的 Passage 名。 */
  meteorReturn: string;
  /** 上次游泳事件的游戏日。 */
  swimDay: number;
  /** 上次家教课的游戏日。 */
  tutorDay: number;
  /** 家教累计课时。 */
  tutorLessons: number;
  /** 当前家教科目索引。 */
  tutorSubject: number;
  /** 上次集市的游戏日。 */
  marketDay: number;
  /** 上次集市售出数量。 */
  marketSales: number;
  /** 上次看店的游戏日。 */
  shopDay: number;
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
  nightDay: number;
  /** 上次夜间事件结算的游戏日。 */
  nightOutcomeDay: number;
  /** 收容所路线的全部进度。 */
  asylum: {
    /** 当前收容所状态。 */
    status: AsylumStatus;
    /** 上次检查罗宾状态的游戏日。 */
    checkedDay: number;
    /** 连续处于严重状态的日数，累计到阈值才送医。 */
    severeDays: number;
    /** 入院游戏日。 */
    admittedDay: number;
    /** 已被收容的天数。 */
    daysConfined: number;
    /** 是否已在收容所探视过。 */
    met: boolean;
    /** 解救计划进度。 */
    plan: number;
    /** 计划推进所在游戏日。 */
    planDay: number;
    /** 上次探视的游戏日。 */
    visitDay: number;
    /** 上次预警的游戏日。 */
    warningDay: number;
    /** 上次预警探视的游戏日。 */
    warningVisitDay: number;
    /** 为解救垫付的债务（便士）。 */
    savedDebt: number;
  };
}

export const DEFAULT_ROBIN_EXPANSION_STATE: RobinExpansionState = {
  lemonade: 0,
  chocolate: 0,
  tutor: false,
  shop: false,
  topics: {
    lemonade: 0,
    chocolate: 0,
    tutor: false,
    shop: false
  },
  shopStage: 'none',
  shopApplicationDay: -1,
  shopInspectionDay: -1,
  shopBankSupported: false,
  pcLoan: 0,
  shopStock: 0,
  shopStaff: 0,
  shopFlowers: false,
  flowerStock: {},
  shopPopcorn: false,
  shopBalloons: false,
  balloon: 'none',
  balloonWins: 0,
  balloonDay: -1,
  reserve: 0,
  careFund: 0,
  weeklyIncome: 0,
  fishCooked: false,
  fishGrill: false,
  fishSoldDay: -1,
  fishSoldToday: 0,
  fishEarningsToday: 0,
  fishSelection: '',
  fishAmount: 1,
  fishReturn: 'stall',
  fishDateDay: -1,
  fishDateActive: false,
  fishDateCatchStart: 0,
  week: -1,
  selfRent: false,
  rentSeparated: false,
  bothRent: false,
  rebellion: false,
  victories: 0,
  fightResolutionDay: -1,
  allies: false,
  solidarity: false,
  baileyDefeated: false,
  meteorDay: -1,
  intimacySite: null,
  meteorReturn: 'Orphanage',
  swimDay: -1,
  tutorDay: -1,
  tutorLessons: 0,
  tutorSubject: 0,
  marketDay: -1,
  marketSales: 0,
  shopDay: -1,
  stall_taste_day: -1,
  shop_taste_day: -1,
  sale_event_day: -1,
  school_drinks_day: -1,
  school_wake_day: -1,
  nightDay: -1,
  nightOutcomeDay: -1,
  asylum: {
    status: 'home',
    checkedDay: -1,
    severeDays: 0,
    admittedDay: -1,
    daysConfined: 0,
    met: false,
    plan: 0,
    planDay: -1,
    visitDay: -1,
    warningDay: -1,
    warningVisitDay: -1,
    savedDebt: 0
  }
};
