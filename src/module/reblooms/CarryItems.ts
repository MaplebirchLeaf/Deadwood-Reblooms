// ./src/module/reblooms/CarryItems.ts

import type DeadwoodReblooms from '../DeadwoodReblooms';
import BodyCarries from './BodyCarries';
import { isRecord, resolveImagePath, slotImage, type CarryItemConfig } from './CarryShared';

export type { CarryItemConfig } from './CarryShared';

interface CarrySlotSource {
  readonly itemId?: string;
  readonly label?: string;
}

export interface CarryItemsState {
  stacks: CarryItemStack[];
  selectedIndex?: number | null;
}

export class CarryItemStack {
  public constructor(
    public id = '',
    public count = 0
  ) {}

  /** 从存档里的未知值恢复成安全的物品堆。 */
  public static from(value: unknown): CarryItemStack {
    if (!isRecord(value)) return new CarryItemStack();
    const count = Number(value.count);
    if (typeof value.id !== 'string' || !Number.isFinite(count) || count <= 0) return new CarryItemStack();
    return new CarryItemStack(value.id, Math.floor(count));
  }
}

class CarryItems {
  private readonly baseSlots = 5;

  public constructor(private readonly manager: DeadwoodReblooms) {}

  /** 返回全物品配置表，统一放在 setup.DeadwoodReblooms.items。 */
  private get items(): Record<string, CarryItemConfig> {
    setup.DeadwoodReblooms ??= {};
    if (!isRecord(setup.DeadwoodReblooms.items)) setup.DeadwoodReblooms.items = {};
    return setup.DeadwoodReblooms.items as Record<string, CarryItemConfig>;
  }

  /** 渲染物品栏格子、容量文字和当前选中物品详情。 */
  public render() {
    const grid = document.getElementById('deadwood-reblooms-carry-items-grid');
    const info = document.getElementById('deadwood-reblooms-carry-items-info');
    const section = grid?.closest<HTMLElement>('.deadwood-reblooms-carry-items, .deadwood-reblooms-carry-items-section');
    if (!grid && !info) return;

    const state = this.state();
    const sources = this.slotSources();
    this.normalizeStacks(state, sources.length);

    const capacity = sources.length;
    const used = state.stacks.filter(stack => stack.count > 0).length;
    section?.classList.toggle('has-carry-item-slots', capacity > 0);
    section?.classList.toggle('is-empty-carry-items', capacity === 0);

    if (info) {
      info.textContent = capacity > 0 ? `${used} / ${capacity}` : '';
      info.title = this.manager.core.t('deadwoodReblooms.CarryItems.capacityTitle');
      info.setAttribute('aria-label', info.title);
    }

    if (!grid) return;
    grid.innerHTML = '';

    const columns = this.gridColumns(grid);
    const selected = this.selectedIndex(state, capacity);

    for (let index = 0; index < capacity; index++) {
      grid.appendChild(this.slotElement(index, state.stacks[index], sources[index]));
      const rowEnd = Math.min(capacity - 1, Math.ceil((index + 1) / columns) * columns - 1);
      if (selected != null && index === rowEnd) grid.appendChild(this.detailElement(state.stacks[selected], selected));
    }
  }

  /** 注册物品配置；可传单个配置或配置数组。 */
  public add(configs: CarryItemConfig | readonly CarryItemConfig[]) {
    for (const config of Array.isArray(configs) ? configs : [configs]) {
      if (!config?.id) continue;
      this.items[config.id] = { ...this.items[config.id], ...config };
    }
  }

  /** 返回完整物品配置表。 */
  public all(): Record<string, CarryItemConfig> {
    return this.items;
  }

  /** 读取单个物品配置。 */
  public config(itemId: string | null | undefined): CarryItemConfig | undefined {
    if (!itemId) return undefined;
    return this.items[itemId];
  }

  /** 返回当前语言下的物品名。 */
  public name(itemId: string): string {
    const config = this.config(itemId);
    if (!config) return itemId;
    return maplebirch.Language === 'CN' && config.cn_name ? config.cn_name : config.name;
  }

  /** 返回物品 icon 路径数组。 */
  public icons(itemId: string): readonly string[] {
    const icon = this.config(itemId)?.icon;
    if (typeof icon === 'string' && icon.trim()) return [icon];
    if (!Array.isArray(icon)) return [];
    return icon.filter((value): value is string => typeof value === 'string' && value.trim() !== '');
  }

  /** 返回单格最大堆叠数。 */
  public max(itemId: string): number {
    const max = Number(this.config(itemId)?.max);
    return Number.isFinite(max) ? Math.max(1, Math.floor(max)) : 1;
  }

  /** 返回装备物品能提供的额外物品栏格数。 */
  public carrySlots(itemId: string): number {
    const slots = Number(this.config(itemId)?.slots);
    return Number.isFinite(slots) ? Math.max(0, Math.floor(slots)) : 0;
  }

  /** 返回物品的提示色标签。 */
  public label(itemId: string): string | undefined {
    const label = this.config(itemId)?.label;
    return typeof label === 'string' && /^[a-zA-Z0-9_-]+$/.test(label) ? label : undefined;
  }

  /** 返回物品详情描述。 */
  public desc(itemId: string): string {
    const desc = this.config(itemId)?.desc;
    return typeof desc === 'string' ? desc : '';
  }

  /** 直接设置某个物品栏格子。 */
  public setStack(index: number, itemId: string, count = 1): boolean {
    const state = this.state();
    const capacity = this.slotSources().length;
    this.normalizeStacks(state, capacity);
    if (!this.isIndex(capacity, index)) return false;

    state.stacks[index] = new CarryItemStack(itemId, Math.max(1, Math.min(this.max(itemId), Math.floor(count))));
    return true;
  }

  /** 清空某个物品栏格子。 */
  public clearStack(index: number): boolean {
    const state = this.state();
    const capacity = this.slotSources().length;
    this.normalizeStacks(state, capacity);
    if (!this.isIndex(capacity, index)) return false;

    state.stacks[index] = new CarryItemStack();
    if (state.selectedIndex === index) state.selectedIndex = null;
    return true;
  }

  /** 添加物品，优先堆叠到已有同类物品，再放入空格。 */
  public addItem(itemId: string, count = 1): boolean {
    const state = this.state();
    const capacity = this.slotSources().length;
    this.normalizeStacks(state, capacity);

    let remaining = Math.max(1, Math.floor(count));
    for (const stack of state.stacks) {
      if (stack.id !== itemId || stack.count >= this.max(itemId)) continue;
      const added = Math.min(remaining, this.max(itemId) - stack.count);
      stack.count += added;
      remaining -= added;
      if (remaining <= 0) return true;
    }

    for (const stack of state.stacks) {
      if (stack.count > 0) continue;
      const added = Math.min(remaining, this.max(itemId));
      stack.id = itemId;
      stack.count = added;
      remaining -= added;
      if (remaining <= 0) return true;
    }

    return false;
  }

  /** 读取某个物品栏格子。 */
  public getStack(index: number): CarryItemStack | null {
    const state = this.state();
    const capacity = this.slotSources().length;
    this.normalizeStacks(state, capacity);
    return this.isIndex(capacity, index) ? (state.stacks[index] ?? null) : null;
  }

  /** 创建物品栏格子按钮。 */
  private slotElement(index: number, stack: CarryItemStack | undefined, source?: CarrySlotSource): HTMLButtonElement {
    const slot = document.createElement('button');
    slot.type = 'button';
    slot.className = 'deadwood-reblooms-carry-item-slot';
    slot.dataset.slotIndex = String(index);
    slot.draggable = true;
    if (source?.itemId) slot.dataset.sourceItem = source.itemId;
    if (source?.label) slot.classList.add(`deadwood-reblooms-carry-label-${source.label}`);

    const hint = document.createElement('span');
    hint.className = 'deadwood-reblooms-slot-hint';
    hint.setAttribute('aria-hidden', 'true');
    const content = slotImage('deadwood-reblooms-slot-content');
    const count = document.createElement('span');
    count.className = 'deadwood-reblooms-slot-count';
    const hover = document.createElement('span');
    hover.className = 'deadwood-reblooms-slot-hover';
    hover.setAttribute('aria-hidden', 'true');
    const frame = slotImage('deadwood-reblooms-slot-frame');
    frame.src = resolveImagePath(['img/deadwood-reblooms/ui/slot-frame.png', 'img/deadwood-reblooms/slot-frame.png']) ?? '';

    const hasItem = Boolean(stack?.id && stack.count > 0);
    const label = `${this.manager.core.t('deadwoodReblooms.CarryItems.slot.label')} ${index + 1}`;
    const separator = this.manager.core.t('deadwoodReblooms.separator');
    const ariaLabel = hasItem ? `${label}${separator}${this.name(stack!.id)} x${stack!.count}` : `${label}${separator}${this.manager.core.t('deadwoodReblooms.empty')}`;

    slot.classList.add(hasItem ? 'has-item' : 'is-empty');
    content.src = hasItem ? (this.iconPath(stack!.id) ?? '') : (resolveImagePath(['img/deadwood-reblooms/empty-carry-item.png']) ?? '');
    count.textContent = hasItem && stack!.count > 1 ? String(stack!.count) : '';
    slot.title = ariaLabel;
    slot.setAttribute('aria-label', ariaLabel);
    slot.append(hint, content, count, hover, frame);

    slot.addEventListener('click', () => this.selectSlot(index));
    slot.addEventListener('dragstart', event => {
      slot.classList.add('is-dragging');
      event.dataTransfer?.setData('text/plain', String(index));
      if (event.dataTransfer) event.dataTransfer.effectAllowed = 'move';
    });
    slot.addEventListener('dragend', () => slot.classList.remove('is-dragging'));
    slot.addEventListener('dragover', event => {
      event.preventDefault();
      slot.classList.add('is-drop-target');
    });
    slot.addEventListener('dragleave', () => slot.classList.remove('is-drop-target'));
    slot.addEventListener('drop', event => this.drop(event, index, slot));
    return slot;
  }

  /** 创建当前选中物品的详情块。 */
  private detailElement(stack: CarryItemStack, index: number): HTMLElement {
    const detail = document.createElement('div');
    detail.className = 'deadwood-reblooms-carry-item-detail';
    detail.dataset.slotIndex = String(index);
    if (!stack?.id || stack.count <= 0) return detail;

    const icon = slotImage('deadwood-reblooms-carry-item-detail-icon');
    icon.src = this.iconPath(stack.id) ?? '';
    const text = document.createElement('div');
    text.className = 'deadwood-reblooms-carry-item-detail-text';
    const name = document.createElement('div');
    name.className = 'deadwood-reblooms-carry-item-detail-name';
    name.textContent = this.name(stack.id);
    const meta = document.createElement('div');
    meta.className = 'deadwood-reblooms-carry-item-detail-meta';
    meta.textContent = `${this.manager.core.t('deadwoodReblooms.CarryItems.detail.count')}${this.manager.core.t('deadwoodReblooms.separator')}${stack.count} / ${this.max(stack.id)}`;
    const desc = document.createElement('div');
    desc.className = 'deadwood-reblooms-carry-item-detail-desc';
    desc.textContent = this.desc(stack.id);

    text.append(name, meta);
    if (desc.textContent) text.appendChild(desc);
    detail.append(icon, text);
    return detail;
  }

  /** 点击格子时切换详情显示。 */
  private selectSlot(index: number) {
    const state = this.state();
    const stack = this.getStack(index);
    state.selectedIndex = stack?.id ? (state.selectedIndex === index ? null : index) : null;
    this.render();
  }

  /** 处理拖拽放下时的格子交换。 */
  private drop(event: DragEvent, toIndex: number, slot: HTMLElement) {
    event.preventDefault();
    slot.classList.remove('is-drop-target');
    const fromIndex = Number(event.dataTransfer?.getData('text/plain'));
    if (!Number.isInteger(fromIndex) || fromIndex === toIndex) return;

    const state = this.state();
    const capacity = this.slotSources().length;
    this.normalizeStacks(state, capacity);
    if (!this.isIndex(capacity, fromIndex) || !this.isIndex(capacity, toIndex)) return;

    [state.stacks[fromIndex], state.stacks[toIndex]] = [state.stacks[toIndex], state.stacks[fromIndex]];
    if (state.selectedIndex === fromIndex) state.selectedIndex = toIndex;
    else if (state.selectedIndex === toIndex) state.selectedIndex = fromIndex;
    this.render();
  }

  /** 计算当前容量来源：基础 5 格 + 背包/容器/特殊装备扩展格。 */
  private slotSources(): CarrySlotSource[] {
    const carries = BodyCarries.State;
    const hasWaistBag = Boolean(carries.bag[1]);
    const equipped = [...carries.bag, ...(hasWaistBag ? carries.container : []), ...carries.special].filter((itemId): itemId is string => typeof itemId === 'string' && itemId !== '');
    const sources: CarrySlotSource[] = Array.from({ length: this.baseSlots }, () => ({}));

    for (const itemId of equipped) {
      for (let index = 0; index < this.carrySlots(itemId); index++) {
        sources.push({ itemId, label: this.label(itemId) });
      }
    }

    return sources;
  }

  /** 读取并修正物品栏存档。 */
  private state(): CarryItemsState {
    const root = V.DeadwoodReblooms as Record<string, any>;
    if (!isRecord(root.carries)) root.carries = {};
    if (!isRecord(root.carries.items)) root.carries.items = {};
    if (!Array.isArray(root.carries.items.stacks)) root.carries.items.stacks = [];
    return root.carries.items as CarryItemsState;
  }

  /** 根据当前容量修正 stacks 长度，并限制每堆数量不超过物品 max。 */
  private normalizeStacks(state: CarryItemsState, capacity: number) {
    state.stacks.length = capacity;
    for (let index = 0; index < capacity; index++) {
      const stack = CarryItemStack.from(state.stacks[index]);
      state.stacks[index] = stack.id ? new CarryItemStack(stack.id, Math.min(this.max(stack.id), stack.count)) : new CarryItemStack();
    }
  }

  /** 取物品第一张可用 icon，并交给 loadImage 解析。 */
  private iconPath(itemId: string): string | undefined {
    return resolveImagePath(this.icons(itemId));
  }

  /** 根据 grid 宽度估算每行格子数，用于把详情插到正确行下面。 */
  private gridColumns(grid: HTMLElement): number {
    const style = getComputedStyle(grid);
    const slotSize = Number.parseFloat(style.getPropertyValue('--deadwood-reblooms-slot-size')) || 32;
    const gap = Number.parseFloat(style.columnGap) || 4;
    return Math.max(1, Math.floor((grid.clientWidth + gap) / (slotSize + gap)));
  }

  /** 返回当前有效选中格；空格或越界时不显示详情。 */
  private selectedIndex(state: CarryItemsState, capacity: number): number | null {
    const index = Number(state.selectedIndex);
    if (!this.isIndex(capacity, index)) return null;
    const stack = state.stacks[index];
    return stack?.id && stack.count > 0 ? index : null;
  }

  /** 判断格子下标是否在当前容量范围内。 */
  private isIndex(capacity: number, index: number): boolean {
    return Number.isInteger(index) && index >= 0 && index < capacity;
  }
}

export default CarryItems;
