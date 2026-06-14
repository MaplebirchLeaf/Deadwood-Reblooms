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

export interface CarryItemConfig {
  readonly id: string;
  readonly name: string;
  readonly cn_name?: string;
  readonly label?: string;
  readonly desc?: string;
  readonly icon?: string | readonly string[];
  readonly max?: number;
  readonly slots?: number;
}

export type AnyRecord = Record<string, any>;

/** 判断值是否是可写入字段的普通对象。 */
export function isRecord(value: unknown): value is AnyRecord {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

/** 创建格子里的图片层，所有格子都用 img 而不是 CSS background。 */
export function slotImage(className: string): HTMLImageElement {
  const image = new Image();
  image.className = className;
  image.draggable = false;
  image.alt = '';
  return image;
}

/** 通过 MapleBirch 的 loadImage 解析图片路径。 */
export function resolveImagePath(candidates: readonly string[]): string | undefined {
  for (const path of candidates) {
    if (typeof path !== 'string' || path.trim() === '') continue;
    const result = loadImage(path);
    if (result === path || result === true) return path;
    if (typeof result === 'string' && result.trim() !== '') return result;
  }
  return candidates.find(path => typeof path === 'string' && path.trim() !== '');
}
