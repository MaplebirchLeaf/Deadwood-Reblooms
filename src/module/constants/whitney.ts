// ./src/module/constants/whitney.ts

// Whitney 模块沿用 V.WhitneyExpansion 存档字段。
export interface WhitneyExpansionState {
  /**
   * 是否已完成地下营救。
   * 地下营救与巷子里的原版营救是两件独立的事，不能共用 $whitneyrescued。
   */
  rescued: boolean;
  /** 上次进行善后对话的游戏日，用于限制每日一次。 */
  aftercare_day: number;
  /** 上次在码头遇见惠特尼的游戏日。 */
  pier_day: number;
  /** 上次在公寓门口遇见惠特尼的游戏日。 */
  flats_day: number;
  /** 上次在公寓里与惠特尼听音乐的游戏日。 */
  music_day: number;
}

export const DEFAULT_WHITNEY_EXPANSION_STATE: WhitneyExpansionState = {
  rescued: false,
  aftercare_day: -1,
  pier_day: -1,
  flats_day: -1,
  music_day: -1
};
