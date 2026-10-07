// ./src/module/constants/bird-tower.ts

/**
 * 鹰崽的成长阶段。阶段只由年龄决定，换羽提示由独立的 grow 标记控制。
 * Hatchling 雏鸟（无羽）→ Nestling 雏鸟（绒羽）→ Fledgling 幼鸟（离巢）
 * → Subadult 亚成鸟（初次飞行）→ Immature 亚成鸟（初次狩猎）。
 */
export type BirdTowerStage = 'Hatchling' | 'Nestling' | 'Fledgling' | 'Subadult' | 'Immature' | 'ERROR';

/** 离巢后随机分配的性格，参考原版狐狸的性格特质。 */
export type BirdTowerTrait = 'clumsy' | 'sympathy' | 'clever' | 'dominant';

/** 每个阶段的起止年龄（天）。Immature 一直持续到 getChildDays 的上限 200 天。 */
export const BIRD_TOWER_STAGES: readonly { stage: BirdTowerStage; from: number; to: number }[] = [
  { stage: 'Hatchling', from: 0, to: 13 },
  { stage: 'Nestling', from: 14, to: 34 },
  { stage: 'Fledgling', from: 35, to: 64 },
  { stage: 'Subadult', from: 65, to: 89 },
  { stage: 'Immature', from: 90, to: 200 }
];

/** 进入对应阶段时写入的换羽提示标记，供成长事件消费一次。 */
export const BIRD_TOWER_HINTS: Partial<Record<BirdTowerStage, 'grow_hint_fledgling' | 'grow_hint_subadult' | 'grow_hint_immature'>> = {
  Fledgling: 'grow_hint_fledgling',
  Subadult: 'grow_hint_subadult',
  Immature: 'grow_hint_immature'
};

/** 每天最多计入两次主动喂食，幼年第二餐可积累体型成长，离巢后两餐折算一天的食量。 */
export const BIRD_TOWER_MEALS = 2;

// BirdTower 模块的存档结构，对应 V.BirdTower。鹰崽自身的成长数据仍存在原版
// child.development 上，随孩子一起保存，这里只放模块级的全局标记。
export interface BirdTowerState {
  /** 首次事件去重标记。 */
  seen: {
    /** 初次换羽。 */
    fledgling: boolean;
    /** 初次飞行。 */
    subadult: boolean;
    /** 初次狩猎。 */
    immature: boolean;
    /** 狩猎途中留巢雏鸟遇袭。 */
    nestling_danger: boolean;
    /** 大鹰第一次尝到熟鱼。 */
    cooked_fish: boolean;
    /** 遇见独居的孤儿鹰巢。 */
    orphan_nest: boolean;
    /** 给小鹰哺乳。 */
    milk: boolean;
  };
  /** 新巢。等级沿用原版 $bird.upgrades.otherNest，这里只记提示。 */
  nest: {
    /** 是否已经提示过可以建造新巢。 */
    hinted: boolean;
  };
  /** 孤儿小鹰的金戒指支线。 */
  ring: {
    /** 留给小鹰的戒指类型：0 无、1 普通金戒指、2 镶宝石的金戒指。 */
    kept: number;
    /** 刚拿到戒指时的提示状态：0 未触发，1 普通戒指，2 镶宝石的戒指。 */
    hint: number;
  };
  /** 跨日清空的每日标记。 */
  daily: {
    /** PC 今日是否踏足鹰塔。 */
    at_tower: boolean;
    /** 荒原遇见独自狩猎的小鹰是否已触发。 */
    moor_event: boolean;
    /** 独自狩猎时小鹰请求同行是否已触发。 */
    hunt_ask: boolean;
  };
  /** 跨段落成长事件：完整名单用于称呼，参与者在开场时随机选定。 */
  scene: {
    /** 当前事件位于新巢，跨页面喂食与荒原同行的对象。 */
    other_nest: boolean;
    feeding_id: number | null;
    moor_ids: number[];
    ids: number[];
    actors: number[];
  };
  /** 随行狩猎的队伍。队伍属于本模块，但方向与距离沿用原版 $bird.hunts。 */
  hunt: {
    /** 参与本次狩猎的鹰崽 ID。 */
    ids: number[];
    /** 领队 ID，未选出时为 null。 */
    leader: number | null;
    /** 四个方向的首次提示是否已经展示。 */
    shown: { north: boolean; east: boolean; south: boolean; west: boolean };
  };
}

export const DEFAULT_BIRD_TOWER_STATE: BirdTowerState = {
  seen: {
    fledgling: false,
    subadult: false,
    immature: false,
    nestling_danger: false,
    cooked_fish: false,
    orphan_nest: false,
    milk: false
  },
  nest: {
    hinted: false
  },
  ring: {
    kept: 0,
    hint: 0
  },
  daily: {
    at_tower: false,
    moor_event: false,
    hunt_ask: false
  },
  scene: {
    other_nest: false,
    feeding_id: null,
    moor_ids: [],
    ids: [],
    actors: []
  },
  hunt: {
    ids: [],
    leader: null,
    shown: { north: false, east: false, south: false, west: false }
  }
};
