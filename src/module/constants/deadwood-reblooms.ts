// ./src/module/constants/deadwood-reblooms.ts

export const version = maplebirch.modUtils.getMod('deadwood-reblooms')!.version;

/** 本模组随机数发生器的存档状态，直接取自 maplebirch 的 rand 工具，避免手写重复结构。 */
export type RandomState = ReturnType<typeof maplebirch.tool.rand.create>['state'];

// 模块本体 DeadwoodReblooms 的存档结构，对应 V.DeadwoodReblooms。
export interface DeadwoodRebloomsState {
  /** 本模组自带的随机数发生器状态，用于替换原版 Math.random 的调用点。 */
  rand: RandomState;
  /** 贝利房租债务，单位便士。与房贷分开计息，由每周房租事件单独结算。 */
  baileyRentDebt: number;
  /** 衣柜界面搜索框的内容，仅用于恢复上次输入的筛选词。 */
  wardrobeSearch: string;
  /** 提示面板上次停留的标签页名称。 */
  activeTab: string;
}

export const defaults: DeadwoodRebloomsState = {
  rand: {
    /** 尚未播种，首次取用随机数时才生成种子。 */
    seed: null,
    /** 已产出的随机数历史，供回退/前进按钮复用。 */
    history: [],
    /** 历史游标，读档后从该位置继续，保证同一种子结果可复现。 */
    index: 0
  },
  baileyRentDebt: 0,
  wardrobeSearch: '',
  activeTab: 'Hint'
};
