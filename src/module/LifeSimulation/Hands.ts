// ./src/module/LifeSimulation/Hands.ts

/** 第二个手持槽复用原版衣物对象、衣柜、暂存与脱衣流程。 */
export default class Hands {
  private readonly views = new WeakSet<string[]>();

  public constructor(private readonly core: typeof maplebirch) {}

  public setup(): void {
    if (!setup.clothes?.handheld) return;
    setup.clothes.handheld_left = setup.clothes.handheld.map((item: Record<string, any>) => Object.assign(this.core.utils.clone(item), { slot: 'handheld_left', holdPosition: undefined }));
    for (const slots of [setup.clothingLayer?.all, setup.clothingLayer?.body, setup.clothes_all_slots]) {
      if (slots && !slots.includes('handheld_left')) slots.push('handheld_left');
    }
    if (!V.worn) return;
    const empty = () => this.core.utils.clone(setup.clothes.handheld_left[0]);
    V.worn.handheld_left ??= empty();
    if (V.carried) V.carried.handheld_left ??= empty();
    if (V.store) V.store.handheld_left ??= [];
    V.wear_handheld_left ??= 'none';
    if (V.wardrobe) V.wardrobe.handheld_left ??= [];
    for (const wardrobe of Object.values(V.wardrobes ?? {}) as Record<string, any>[]) {
      if (wardrobe && typeof wardrobe === 'object' && Array.isArray(wardrobe.handheld)) wardrobe.handheld_left ??= [];
    }
    this.refresh();
  }

  public snapshot(): void {
    const tryOn = V.tryOn as Record<string, any> | undefined;
    if (!tryOn) return;
    const stored = (tryOn.ownedStored ??= {}) as Record<string, any>;
    const trying = (tryOn.tryingOn ??= {}) as Record<string, any>;
    for (const slot of setup.clothingLayer?.all ?? []) {
      if (trying[slot] === undefined) trying[slot] = null;
      if (stored[slot] !== undefined) continue;
      // 正在试穿的槽位里 $worn 已是新物品，此时只能记空物品，否则新买的会被当成旧的送进衣柜。
      const held = trying[slot] ? undefined : V.worn?.[slot];
      const item = held ?? setup.clothes?.[slot]?.[0];
      if (item !== undefined) stored[slot] = this.core.utils.clone(item);
    }
  }

  /** 只扩展原版的能力查询，索引、迭代、深拷贝和存档仍得到物品自己的类型。 */
  public refresh(): void {
    // 副手只提供持物功能，从原版暂存流程取回后也不改变模型姿势。
    if (V.worn?.handheld_left) V.worn.handheld_left.holdPosition = undefined;
    if (V.lastWardrobeSlot === 'handheld_left') V.lastWardrobeSlot = 'handheld';
    const types: string[] | undefined = V.worn?.handheld?.type;
    if (!types || this.views.has(types)) return;
    const capabilities = new Set(['bookbag', 'rainproof', 'shade', 'maid', 'fishing_rod']);
    const core = this.core;
    Object.defineProperty(types, 'includes', {
      configurable: true,
      writable: true,
      // 数组的索引和类型值保持原样，非枚举方法不进入 JSON 或结构化存档。
      value: function (this: string[], value: string, fromIndex?: number): boolean {
        const own = Array.prototype.includes.call(this, value, fromIndex);
        if (own || !capabilities.has(value) || V.worn?.handheld?.type !== this || !core.get('LifeSimulation')) return own;
        return Array.prototype.includes.call(V.worn.handheld_left?.type ?? [], value, fromIndex);
      }
    });
    this.views.add(types);
  }

  public get canSwap(): boolean {
    const item = V.worn?.handheld;
    const other = V.worn?.handheld_left;
    return !!item && (item.name !== 'naked' || other?.name !== 'naked') && !item.cursed && !!other && !other.cursed && !V.combat && !V.replayScene && !V.statFreeze && !window.pcAreArmsBound('any');
  }

  /** 原版装备前检查另一槽，衣柜选第二件时保留已持有的不同物品。 */
  public prepare(item: Record<string, any>, slot: string, keep = false): boolean {
    if (!['handheld', 'handheld_left'].includes(slot) || !item || item.name === 'naked') return true;
    const other = V.worn[slot === 'handheld' ? 'handheld_left' : 'handheld'];
    if (other.name !== 'naked' && other.name === item.name) return false;
    // 场合与外观标签不代表物品功能，查询原始 type，避免能力视图混入另一槽。
    const common = ['naked', 'normal', 'school', 'formal', 'costume', 'unstealthy'];
    if ((item.type ?? []).some((type: string) => !common.includes(type) && Array.prototype.includes.call(other.type ?? [], type))) return false;
    if (keep && other.name === 'naked' && V.worn[slot].name !== item.name && this.canSwap) this.swap();
    return true;
  }

  /** 转移的是同一件物品，不从目录生成副本。 */
  public swap(): boolean {
    if (!this.canSwap) return false;
    const right = V.worn.handheld;
    V.worn.handheld = Object.assign(V.worn.handheld_left, { slot: 'handheld', holdPosition: setup.clothes.handheld[V.worn.handheld_left.index].holdPosition });
    V.worn.handheld_left = Object.assign(right, { slot: 'handheld_left', holdPosition: undefined });
    this.refresh();
    return true;
  }

  public item(type: string) {
    return [V.worn?.handheld, V.worn?.handheld_left].find(item => item?.name !== 'naked' && Array.prototype.includes.call(item?.type ?? [], type));
  }
}
