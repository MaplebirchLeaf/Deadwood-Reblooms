// ./src/module/constants/whitney-expansion.ts

// 模块 WhitneyExpansion 的存档结构，对应 V.WhitneyExpansion。
export interface WhitneyExpansionState {
  /**
   * 是否已完成地下营救。
   * 地下营救与巷子里的原版营救是两件独立的事，不能共用 $whitneyrescued。
   */
  rescued: boolean;
  /** 重逢场景是否已播放；只播一次。 */
  reunionSeen: boolean;
  /** 上次进行善后对话的游戏日，用于限制每日一次。 */
  aftercare_day: number;
}

export const DEFAULT_WHITNEY_EXPANSION_STATE: WhitneyExpansionState = {
  rescued: false,
  reunionSeen: false,
  aftercare_day: -1
};
