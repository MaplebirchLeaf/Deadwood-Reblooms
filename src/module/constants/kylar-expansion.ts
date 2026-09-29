// ./src/module/constants/kylar-expansion.ts

// 模块 KylarExpansion 的存档结构，对应 V.KylarExpansion。
export interface KylarExpansionState {
  /** 是否已接受庄园留宿邀请。 */
  stay_invited: boolean;
  /** 上次澡堂事件的游戏日；-1 表示尚未发生。 */
  bathDay: number;
  /** 澡堂遭遇是否已触发，避免重复播放。 */
  bathEncounter: boolean;
  /** 上次游戏厅事件的游戏日。 */
  game_day: number;
  /** 上次茶会事件的游戏日。 */
  tea_day: number;
  /** 上次递纸条事件的游戏日。 */
  notes_day: number;
  /** 上次夜间事件的游戏日。 */
  night_day: number;
  /** 夜间事件的结算结果标识；空串表示尚未结算。 */
  night_scene: string;
  /** 上次在后院遇见凯拉尔的游戏日；-1 表示尚未发生。 */
  yard_day: number;
  /** 上次在公园谈及凯拉尔素描的游戏日。 */
  sketch_day: number;
}

export const DEFAULT_KYLAR_EXPANSION_STATE: KylarExpansionState = {
  stay_invited: false,
  bathDay: -1,
  bathEncounter: false,
  game_day: -1,
  tea_day: -1,
  notes_day: -1,
  night_day: -1,
  night_scene: '',
  yard_day: -1,
  sketch_day: -1
};
