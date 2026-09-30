// ./src/module/constants/sydney-expansion.ts

// Sydney 模块沿用 V.SydneyExpansion 存档字段，保留旧存档进度。
export interface SydneyExpansionState {
  /*
   * 年份与日期标记阻止节庆和日常对话重复触发；dormScene 只记录神殿宿舍当前入口。
   * 一律用 -1 表示"尚未发生"，避免与第 0 天混淆。
   */
  /** 罗宾万圣节剧情已推进到的年份。 */
  robinHalloweenYear: number;
  /** 惠特尼万圣节剧情已推进到的年份。 */
  whitneyHalloweenYear: number;
  /** 悉尼万圣节剧情已推进到的年份。 */
  halloweenYear: number;
  /** 圣诞节剧情已推进到的年份。 */
  christmasYear: number;
  /** 万圣节留宿已发生的年份。 */
  halloweenRestYear: number;
  /** 圣诞节留宿已发生的年份。 */
  christmasRestYear: number;
  /** 西里斯庄园万圣节探访已发生的年份。 */
  sirrisHalloweenVisitYear: number;
  /** 科学课提示是否已给出。 */
  scienceHint: boolean;
  /** 是否已收到神殿宿舍的邀请。 */
  dormInvited: boolean;
  /** 是否已到访过神殿宿舍。 */
  dormVisited: boolean;
  /** 神殿宿舍当前入口标识，决定从哪个场景进入。 */
  dormScene: string;
  /** 万圣节对话已推进到的年份。 */
  halloweenTalkYear: number;
  /** 圣诞节对话已推进到的年份。 */
  christmasTalkYear: number;
  /** 上次阅读事件的游戏日。 */
  readDay: number;
  /** 上次交谈事件的游戏日。 */
  talkDay: number;
  /** 上次调戏事件的游戏日。 */
  teaseDay: number;
  /** 上次衣柜事件的游戏日。 */
  wardrobeDay: number;
  /** 上次花园事件的游戏日。 */
  gardenDay: number;
  /** 上次宿舍事件的游戏日。 */
  quartersDay: number;
  /** 上次神殿沐浴事件的游戏日。 */
  templeBathDay: number;
  /** 沐浴后返回的地点标识。 */
  bathReturn: string;
  /** 上次试炼对话的游戏日。 */
  trialTalkDay: number;
  /** 上次触碰事件的游戏日。 */
  touchDay: number;
  /** 上次触碰的部位标识；空串表示未发生。 */
  touchPart: string;
  /** 神殿宿舍与西里斯庄园共用一次夜醒机会，故合并为一个游标。 */
  night_wake_day: number;
  /** 西里斯庄园的全部进度。 */
  estate: {
    /** 是否已受邀。 */
    invited: boolean;
    /** 是否已初访。 */
    visited: boolean;
    /** 上次到访的游戏日。 */
    visitDay: number;
    /** 上次家人对话的标识。 */
    familyTalk: string;
    /** 上次凯拉尔相关对话的标识。 */
    kylarTalk: string;
    /** 上次书房事件的游戏日。 */
    studyDay: number;
    /** 上次花园事件的游戏日。 */
    gardenDay: number;
    /** 上次厨房事件的游戏日。 */
    kitchenDay: number;
    /** 上次房间事件的游戏日。 */
    roomDay: number;
    /** 上次调戏事件的游戏日。 */
    teaseDay: number;
    /** 上次食谱事件的游戏日。 */
    recipe_day: number;
    /** 上次沐浴探访的游戏日。 */
    bathVisitDay: number;
    /** 上次沐浴时的访客标识；空串表示无人。 */
    bathVisitor: string;
  };
}

// 西里斯庄园的邀请、初访、童年对话和每日互动均属于当前存档，不从窗口或 Passage 历史推断。
export const DEFAULT_SYDNEY_EXPANSION_STATE: SydneyExpansionState = {
  robinHalloweenYear: 0,
  whitneyHalloweenYear: 0,
  halloweenYear: 0,
  christmasYear: 0,
  halloweenRestYear: 0,
  christmasRestYear: 0,
  sirrisHalloweenVisitYear: 0,
  scienceHint: false,
  dormInvited: false,
  dormVisited: false,
  dormScene: 'bed',
  halloweenTalkYear: 0,
  christmasTalkYear: 0,
  readDay: -1,
  talkDay: -1,
  teaseDay: -1,
  wardrobeDay: -1,
  gardenDay: -1,
  quartersDay: -1,
  templeBathDay: -1,
  bathReturn: 'temple',
  trialTalkDay: -1,
  touchDay: -1,
  touchPart: '',
  night_wake_day: -1,
  estate: {
    invited: false,
    visited: false,
    visitDay: -1,
    familyTalk: '',
    kylarTalk: '',
    studyDay: -1,
    gardenDay: -1,
    kitchenDay: -1,
    roomDay: -1,
    teaseDay: -1,
    recipe_day: -1,
    bathVisitDay: -1,
    bathVisitor: ''
  }
};
