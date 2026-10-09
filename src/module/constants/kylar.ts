// ./src/module/constants/kylar.ts

// Kylar 模块沿用 V.KylarExpansion 存档字段。
export interface KylarExpansionState {
  /** 是否已接受庄园留宿邀请。 */
  stay_invited: boolean;
  /** 上次浴室事件的游戏日，-1 表示尚未发生。 */
  bath_day: number;
  /** 当天浴室相处是否仍可触发。 */
  bath_encounter: boolean;
  /** 上次游戏厅事件的游戏日。 */
  game_day: number;
  /** 上次茶会事件的游戏日。 */
  tea_day: number;
  /** 上次整理笔记的游戏日。 */
  notes_day: number;
  /** 被涂写的课本页是否已经补好。 */
  notes_repaired: boolean;
  /** 上次夜间事件的游戏日。 */
  night_day: number;
  /** 夜间事件的结算结果标识，空串表示尚未结算。 */
  night_scene: string;
  /** 上次在后院遇见凯拉尔的游戏日，-1 表示尚未发生。 */
  yard_day: number;
  /** 上次在公园谈及凯拉尔素描的游戏日。 */
  sketch_day: number;
  /** 上次查看素描本时的回应。 */
  sketch_response: '' | 'wait' | 'praise' | 'leave';
}

export const DEFAULT_KYLAR_EXPANSION_STATE: KylarExpansionState = {
  stay_invited: false,
  bath_day: -1,
  bath_encounter: false,
  game_day: -1,
  tea_day: -1,
  notes_day: -1,
  notes_repaired: false,
  night_day: -1,
  night_scene: '',
  yard_day: -1,
  sketch_day: -1,
  sketch_response: ''
};
