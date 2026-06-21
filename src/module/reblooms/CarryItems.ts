// ./src/module/reblooms/CarryItems.ts

import type DeadwoodReblooms from '../DeadwoodReblooms';
import BodyCarries from './BodyCarries';
import { isRecord, resolveImagePath, slotImage, type CarryItemConfig } from './CarryShared';

export type { CarryItemConfig, CarryItemEffects } from './CarryShared';

interface CarrySlotSource {
  readonly itemId?: string;
  readonly className?: string;
}

export interface CarryItemsState {
  stacks: CarryItemStack[];
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
  private selected: number | null = null;

  public constructor(private readonly manager: DeadwoodReblooms) {}

  /** 返回全物品配置表，统一存放在 setup.DeadwoodReblooms.items。 */
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

    if (info) info.textContent = capacity > 0 ? `${used} / ${capacity}` : '';

    if (!grid) return;
    grid.innerHTML = '';

    const columns = this.gridColumns(grid);
    const selected = this.selectedIndex(state, capacity);
    const selectedRowEnd = selected == null ? null : Math.min(capacity - 1, (Math.floor(selected / columns) + 1) * columns - 1);

    for (let index = 0; index < capacity; index++) {
      const slot = this.slotElement(index, state.stacks[index], sources[index]);
      if (index === selected) slot.classList.add('is-selected');
      grid.appendChild(slot);
      if (selected != null && index === selectedRowEnd) grid.appendChild(this.detailElement(state.stacks[selected], selected));
    }
  }

  /** 注册物品配置；可传单个配置或配置数组。 */
  public add(configs: CarryItemConfig | readonly CarryItemConfig[]) {
    for (const config of Array.isArray(configs) ? configs : [configs]) {
      if (!config?.id) continue;
      this.items[config.id] = { ...this.items[config.id], ...config };
    }
  }

  /** 从指定模组压缩包读取 JSON/YAML，并注册到 setup.DeadwoodReblooms.items。 */
  public async loadFiles(modName: string, paths: readonly string[]): Promise<void> {
    const zip = this.manager.core.modUtils.getModZip(modName)?.zip;
    if (!zip) return this.manager.log(`找不到物品配置模组：${modName}`, 'ERROR');
    for (const path of paths) {
      try {
        const file = zip.file(path);
        if (!file) continue;
        const parsed = this.manager.core.yaml.load(await file.async('string'));
        const values = Array.isArray(parsed) ? parsed : isRecord(parsed) ? Object.entries(parsed).map(([id, config]) => (isRecord(config) ? { id, ...config } : config)) : [];
        const configs: CarryItemConfig[] = [];
        for (const config of values) {
          if (!isRecord(config) || typeof config.id !== 'string' || typeof config.name !== 'string') continue;
          configs.push({ ...config, id: config.id, name: config.name });
        }
        this.add(configs);
      } catch (error) {
        this.manager.log(`物品配置读取失败：${modName}/${path}`, 'ERROR', error);
      }
    }
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
    const config = this.config(itemId);
    if (!config?.type?.some(type => type === 'bag' || type === 'special')) return 0;
    const slots = Number(config.slots);
    return Number.isFinite(slots) ? Math.max(0, Math.floor(slots)) : 0;
  }

  /** 返回物品栏格子的提示样式 class。 */
  public itemClass(itemId: string): string | undefined {
    const className = this.config(itemId)?.class;
    return typeof className === 'string' && /^[a-zA-Z0-9_-]+$/.test(className) ? className : undefined;
  }

  /** 返回当前语言下的物品详情描述。 */
  public desc(itemId: string): string {
    const config = this.config(itemId);
    const desc = maplebirch.Language === 'CN' && config?.cn_desc ? config.cn_desc : config?.desc;
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
    if (this.selected === index) this.selected = null;
    return true;
  }

  /** 添加物品；优先堆叠到已有同类物品，再放入空格。 */
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
    if (source?.className) slot.classList.add(`deadwood-reblooms-carry-class-${source.className}`);

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
    frame.src = resolveImagePath(['img/deadwood-reblooms/slot-frame.png']) ?? '';

    const hasItem = Boolean(stack?.id && stack.count > 0);
    slot.classList.add(hasItem ? 'has-item' : 'is-empty');
    content.src = hasItem ? (resolveImagePath(this.icons(stack!.id)) ?? '') : (resolveImagePath(['img/deadwood-reblooms/empty-carry-item.png']) ?? '');
    count.textContent = hasItem && stack!.count > 1 ? String(stack!.count) : '';
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
    icon.src = resolveImagePath(this.icons(stack.id)) ?? '';
    const text = document.createElement('div');
    text.className = 'deadwood-reblooms-carry-item-detail-text';
    const name = document.createElement('div');
    name.className = 'deadwood-reblooms-carry-item-detail-name';
    name.textContent = this.name(stack.id);
    const effects = this.config(stack.id)?.effects;
    const effectList = document.createElement('div');
    effectList.className = 'deadwood-reblooms-carry-item-detail-effects';
    for (const [key, value] of Object.entries(effects ?? {})) {
      if (!Number.isFinite(value)) continue;
      const effect = document.createElement('span');
      effect.className = Number(value) > 0 ? 'green' : Number(value) < 0 ? 'red' : 'meek';
      effect.textContent = `${this.manager.core.t(`deadwoodReblooms.CarryItems.detail.${key}`)}: ${Number(value) > 0 ? '+' : ''}${value}`;
      effectList.append(effect);
    }
    const meta = document.createElement('div');
    meta.className = 'deadwood-reblooms-carry-item-detail-meta';
    meta.textContent = `${this.manager.core.t('deadwoodReblooms.CarryItems.detail.count')}: ${stack.count} / ${this.max(stack.id)}`;
    const desc = document.createElement('div');
    desc.className = 'deadwood-reblooms-carry-item-detail-desc';
    desc.textContent = this.desc(stack.id);

    text.append(name);
    if (effectList.childElementCount > 0) text.append(effectList);
    if (desc.textContent) text.appendChild(desc);
    const actions = document.createElement('div');
    actions.className = 'deadwood-reblooms-carry-item-detail-actions';
    actions.append(meta);
    if (effects && Object.values(effects).some(value => Number.isFinite(value))) {
      const use = document.createElement('a');
      use.href = '#';
      use.className = 'link-internal deadwood-reblooms-carry-item-use';
      use.textContent = this.manager.core.t('deadwoodReblooms.CarryItems.detail.use');
      use.addEventListener('click', event => {
        event.preventDefault();
        this.useItem(index);
      });
      actions.append(use);
    }
    detail.append(icon, text, actions);
    return detail;
  }

  /** 点击格子时切换详情显示。 */
  private selectSlot(index: number) {
    const stack = this.getStack(index);
    const grid = document.getElementById('deadwood-reblooms-carry-items-grid');
    if (!grid) return;

    const selected = this.selected;
    grid.querySelector('.deadwood-reblooms-carry-item-detail')?.remove();
    grid.querySelector('.deadwood-reblooms-carry-item-slot.is-selected')?.classList.remove('is-selected');
    if (!stack?.id || selected === index) {
      this.selected = null;
      return;
    }

    this.selected = index;
    const slots = Array.from(grid.querySelectorAll<HTMLElement>(':scope > .deadwood-reblooms-carry-item-slot'));
    const slot = slots[index];
    if (!slot) return;
    slot.classList.add('is-selected');
    const columns = this.gridColumns(grid);
    const rowEnd = Math.min(slots.length - 1, (Math.floor(index / columns) + 1) * columns - 1);
    slots[rowEnd].after(this.detailElement(stack, index));
  }

  /** 使用物品效果并消耗当前格中的一个物品。 */
  private useItem(index: number) {
    const stack = this.getStack(index);
    if (!stack?.id) return;
    const effects = this.config(stack.id)?.effects;
    if (!effects) return;

    for (const [key, value] of Object.entries(effects)) if (Number.isFinite(value) && Number.isFinite(C.DeadwoodReblooms[key])) C.DeadwoodReblooms[key] += Number(value);
    const status = wikifier('deadwood-reblooms-characteristics-status-bar');
    for (const id of ['satietycaption', 'hydrationcaption']) {
      const current = document.getElementById(id);
      const updated = status.querySelector(`#${id}`);
      if (current && updated) current.replaceWith(updated);
    }
    stack.count -= 1;

    const grid = document.getElementById('deadwood-reblooms-carry-items-grid');
    const slot = grid?.querySelector<HTMLElement>(`.deadwood-reblooms-carry-item-slot[data-slot-index='${index}']`);
    const detail = grid?.querySelector<HTMLElement>('.deadwood-reblooms-carry-item-detail');
    if (stack.count <= 0) {
      this.clearStack(index);
      slot?.replaceWith(this.slotElement(index, this.getStack(index) ?? undefined, this.slotSources()[index]));
      detail?.remove();
      return;
    }

    const count = slot?.querySelector<HTMLElement>('.deadwood-reblooms-slot-count');
    if (count) count.textContent = stack.count > 1 ? String(stack.count) : '';
    detail?.replaceWith(this.detailElement(stack, index));
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
    if (this.selected === fromIndex) this.selected = toIndex;
    else if (this.selected === toIndex) this.selected = fromIndex;
    this.render();
  }

  /** 计算当前容量来源：基础 5 格 + 背包/容器/特殊装备扩展格。 */
  private slotSources(): CarrySlotSource[] {
    const carries = BodyCarries.State;
    const hasWaistBag = Boolean(carries.bag[1]);
    const equipped = [...carries.bag, ...(hasWaistBag ? carries.container : []), ...carries.special].filter((itemId): itemId is string => typeof itemId === 'string' && itemId !== '');
    const sources: CarrySlotSource[] = Array.from({ length: this.baseSlots }, () => ({}));
    for (const itemId of equipped) for (let index = 0; index < this.carrySlots(itemId); index++) sources.push({ itemId, className: this.itemClass(itemId) });
    return sources;
  }

  /** 读取并修正物品栏存档。 */
  private state(): CarryItemsState {
    const root = V.DeadwoodReblooms as Record<string, any>;
    if (!isRecord(root.carries)) root.carries = {};
    if (!isRecord(root.carries.items)) root.carries.items = {};
    if (!Array.isArray(root.carries.items.stacks)) root.carries.items.stacks = [];
    delete root.carries.items.selectedIndex;
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

  /** 根据 grid 宽度估算每行格子数，用于把详情插到正确行下面。 */
  private gridColumns(grid: HTMLElement): number {
    const style = getComputedStyle(grid);
    const slotSize = Number.parseFloat(style.getPropertyValue('--deadwood-reblooms-slot-size')) || 32;
    const gap = Number.parseFloat(style.columnGap) || 4;
    return Math.max(1, Math.floor((grid.clientWidth + gap) / (slotSize + gap)));
  }

  /** 返回当前有效选中格；空格或越界时不显示详情。 */
  private selectedIndex(state: CarryItemsState, capacity: number): number | null {
    if (this.selected == null) return null;
    const index = this.selected;
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
