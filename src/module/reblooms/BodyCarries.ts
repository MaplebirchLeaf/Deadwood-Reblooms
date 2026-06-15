import type DeadwoodReblooms from '../DeadwoodReblooms';
import { isRecord, resolveImagePath, slotImage, type BodyCarriesState, type BodyCarryItemId, type BodySlotIndex, type BodySlotType, type CarryItemConfig } from './CarryShared';

export type { BodyCarriesState, BodyCarryItemId, BodySlotIndex, BodySlotType } from './CarryShared';

interface BodyCarrySlotConfig {
  readonly type: BodySlotType;
  readonly index: BodySlotIndex;
  readonly labelKey: string;
}

interface BodyCarryRowConfig {
  readonly type: BodySlotType;
  readonly labelKey: string;
  readonly slots: readonly [BodyCarrySlotConfig, BodyCarrySlotConfig];
}

const BODY_SLOT_TYPES: readonly BodySlotType[] = ['hand', 'bag', 'accessory', 'container', 'special'];

const BODY_ROWS: readonly BodyCarryRowConfig[] = [
  {
    type: 'hand',
    labelKey: 'deadwoodReblooms.BodyCarries.hand',
    slots: [
      { type: 'hand', index: 0, labelKey: 'deadwoodReblooms.BodyCarries.slot.leftHand' },
      { type: 'hand', index: 1, labelKey: 'deadwoodReblooms.BodyCarries.slot.rightHand' }
    ]
  },
  {
    type: 'bag',
    labelKey: 'deadwoodReblooms.BodyCarries.carry',
    slots: [
      { type: 'bag', index: 0, labelKey: 'deadwoodReblooms.BodyCarries.slot.backpack' },
      { type: 'bag', index: 1, labelKey: 'deadwoodReblooms.BodyCarries.slot.waistBag' }
    ]
  },
  {
    type: 'accessory',
    labelKey: 'deadwoodReblooms.BodyCarries.accessory',
    slots: [
      { type: 'accessory', index: 0, labelKey: 'deadwoodReblooms.BodyCarries.slot.accessoryA' },
      { type: 'accessory', index: 1, labelKey: 'deadwoodReblooms.BodyCarries.slot.accessoryB' }
    ]
  },
  {
    type: 'container',
    labelKey: 'deadwoodReblooms.BodyCarries.container',
    slots: [
      { type: 'container', index: 0, labelKey: 'deadwoodReblooms.BodyCarries.slot.containerA' },
      { type: 'container', index: 1, labelKey: 'deadwoodReblooms.BodyCarries.slot.containerB' }
    ]
  },
  {
    type: 'special',
    labelKey: 'deadwoodReblooms.BodyCarries.special',
    slots: [
      { type: 'special', index: 0, labelKey: 'deadwoodReblooms.BodyCarries.slot.specialA' },
      { type: 'special', index: 1, labelKey: 'deadwoodReblooms.BodyCarries.slot.specialB' }
    ]
  }
];

class BodyCarries {
  /** 渲染身体携具固定格子，并根据腰包状态显示或隐藏容器行。 */
  public static render(manager: DeadwoodReblooms) {
    const container = document.getElementById('deadwood-reblooms-body-carries-list');
    if (!container) return;

    const state = BodyCarries.state();
    container.closest<HTMLElement>('.deadwood-reblooms-panel')?.classList.toggle('has-waist-bag', Boolean(state.bag[1]));
    container.innerHTML = '';

    for (const rowConfig of BODY_ROWS) {
      const row = document.createElement('div');
      row.className = 'deadwood-reblooms-slot';
      row.dataset.slotType = rowConfig.type;

      const label = document.createElement('div');
      label.className = 'deadwood-reblooms-slot-label';
      label.textContent = manager.core.t(rowConfig.labelKey);

      const grid = document.createElement('div');
      grid.className = 'deadwood-reblooms-slot-grid';
      for (const slotConfig of rowConfig.slots) grid.appendChild(BodyCarries.slotElement(manager, slotConfig, state[slotConfig.type][slotConfig.index]));

      row.append(label, grid);
      container.appendChild(row);
    }
  }

  /** 返回身体携具存档对象，供物品栏计算容量。 */
  public static get State(): BodyCarriesState {
    return BodyCarries.state();
  }

  /** 读取指定身体格子的 itemId。 */
  public static getSlot(type: BodySlotType, index: BodySlotIndex): BodyCarryItemId {
    return BodyCarries.state()[type][index] ?? null;
  }

  /** 写入指定身体格子的 itemId；F12 调试装备时也走这里。 */
  public static setSlot(type: BodySlotType, index: BodySlotIndex, itemId: BodyCarryItemId): boolean {
    const state = BodyCarries.state();
    if (!Array.isArray(state[type]) || index < 0 || index > 1) return false;
    if (itemId && !BodyCarries.canPlace(type, itemId)) return false;
    state[type][index] = itemId;
    return true;
  }

  /** 清空指定身体格子。 */
  public static clearSlot(type: BodySlotType, index: BodySlotIndex): boolean {
    return BodyCarries.setSlot(type, index, null);
  }

  /** 创建身体格子按钮：空格显示虚影图，有物品显示物品 icon。 */
  private static slotElement(manager: DeadwoodReblooms, config: BodyCarrySlotConfig, itemId: BodyCarryItemId): HTMLButtonElement {
    const slot = document.createElement('button');
    slot.type = 'button';
    slot.className = 'deadwood-reblooms-body-slot';
    slot.dataset.slotType = config.type;
    slot.dataset.slotIndex = String(config.index);

    const content = slotImage('deadwood-reblooms-slot-content');
    const hover = document.createElement('span');
    hover.className = 'deadwood-reblooms-slot-hover';
    hover.setAttribute('aria-hidden', 'true');
    const frame = slotImage('deadwood-reblooms-slot-frame');
    frame.src = resolveImagePath(['img/deadwood-reblooms/slot-frame.png']) ?? '';

    slot.classList.add(itemId ? 'has-item' : 'is-empty');
    content.src = itemId ? (resolveImagePath(manager.carryItems.icons(itemId)) ?? '') : (resolveImagePath([`img/deadwood-reblooms/empty-${config.type}-${config.index}.png`]) ?? '');
    slot.append(content, hover, frame);

    return slot;
  }

  /** 读取并修正身体携具存档。 */
  private static state(): BodyCarriesState {
    const carries = V.DeadwoodReblooms.carries as Record<string, any>;
    if (!isRecord(carries.body)) carries.body = {};
    for (const type of BODY_SLOT_TYPES) BodyCarries.ensurePair(carries.body, type);
    return carries.body as BodyCarriesState;
  }

  /** 确保每类身体携具固定为两个格子。 */
  private static ensurePair(root: Record<string, any>, type: BodySlotType) {
    if (!Array.isArray(root[type])) root[type] = [];
    root[type].length = 2;
    for (let index = 0; index < 2; index++) if (typeof root[type][index] !== 'string') root[type][index] = null;
  }

  /** 校验物品配置里的 type；未填写 type 时暂时视为不限制位置。 */
  private static canPlace(type: BodySlotType, itemId: string): boolean {
    const items = setup.DeadwoodReblooms?.items;
    if (!isRecord(items)) return true;
    const table = items as Record<string, CarryItemConfig>;
    const config = table[itemId];
    return !Array.isArray(config?.type) || config.type.includes(type);
  }
}

export default BodyCarries;
