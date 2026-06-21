// ./src/module/reblooms/CarryShared.ts

export type BodySlotType = 'hand' | 'bag' | 'accessory' | 'container' | 'special';
export type BodySlotIndex = 0 | 1;
export type BodyCarryItemId = string | null;

export interface BodyCarriesState {
  hand: BodyCarryItemId[];
  bag: BodyCarryItemId[];
  accessory: BodyCarryItemId[];
  container: BodyCarryItemId[];
  special: BodyCarryItemId[];
}

/** 使用物品后对玩家状态产生的数值变化。 */
export interface CarryItemEffects {
  readonly [key: string]: number | undefined;
  readonly satiety?: number;
  readonly hydration?: number;
}

export interface CarryItemConfig {
  readonly id: string;
  readonly name: string;
  readonly cn_name?: string;
  /** 可装备或放置到哪些身体区块。 */
  readonly type?: readonly BodySlotType[];
  /** 物品类别，例如 tool、medical、food、water。 */
  readonly kind?: readonly string[];
  /** 格子的提示样式 class。 */
  readonly class?: string;
  readonly desc?: string;
  readonly cn_desc?: string;
  /** 图像路径；数组用于空/满、开/关等特殊状态。 */
  readonly icon?: string | readonly string[];
  /** 单格最大堆叠数。 */
  readonly max?: number;
  /** 仅 bag / special 类型物品有效：装备后提供物品栏格子。 */
  readonly slots?: number;
  /** 容器允许存放哪些 kind。 */
  readonly accepts?: readonly string[];
  /** 使用物品后恢复或扣除的玩家状态。 */
  readonly effects?: CarryItemEffects;
}

export type AnyRecord = Record<string, any>;

/** 判断值是否是可写入字段的普通对象。 */
export function isRecord(value: unknown): value is AnyRecord {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

/** 创建格子里的图片层，所有格子都使用 img，避免 CSS 背景图路径变复杂。 */
export function slotImage(className: string): HTMLImageElement {
  const image = new Image();
  image.className = className;
  image.draggable = false;
  image.alt = '';
  return image;
}

export function resolveImagePath(candidates: readonly string[]): string | undefined {
  for (const path of candidates) {
    if (typeof path !== 'string' || path.trim() === '') continue;
    const result = loadImage(path);
    if (result === path || result === true) return path;
    if (typeof result === 'string' && result.trim() !== '') return result;
  }
  return candidates.find(path => typeof path === 'string' && path.trim() !== '');
}
