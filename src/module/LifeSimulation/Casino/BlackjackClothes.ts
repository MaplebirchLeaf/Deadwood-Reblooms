// ./src/module/LifeSimulation/Casino/BlackjackClothes.ts

import type { WardrobeItem } from '../../NPCSidebarPortrait';

export type BlackjackSeat = 'player' | 'dealer' | 'partner';

interface ClothingItem {
  name?: string;
  type?: readonly string[];
  cursed?: number;
  outfitPrimary?: Readonly<Partial<Record<string, string>>>;
  outfitSecondary?: readonly string[];
}

type ClothingMap = Readonly<Partial<Record<string, ClothingItem>>>;

interface NpcClothingState {
  snapshot: WardrobeItem;
  groups: string[][];
  removed: string[];
}

export interface BlackjackClothesState {
  player_stored: boolean;
  companion: string;
  partner: string | null;
  npcs: Record<string, NpcClothingState>;
}

const storeLocation = 'Deadwood Blackjack';
// 赌注只用上装、下装和两层内衣，顺序沿用伦恩牌局“由外至内”。原版还会先赌 over_upper／over_lower，
// 但 Named NPC 的衣物没有这两层，只有 PC 存在，家局不为 NPC 凭空增加栏位，也不收走衣物，离桌时穿回。
const slots = ['upper', 'lower', 'under_upper', 'under_lower'] as const;
const passages = ['Deadwood Reblooms Life Simulation Blackjack', 'Deadwood Reblooms Life Simulation Blackjack Rules'];

/** 连衣服及其附属部分只算一件，任何相连的锁定衣物都会保护整件。 */
function clothingGroups(clothes: ClothingMap): string[][] {
  const groups: string[][] = slots.filter(slot => clothes[slot]?.name && clothes[slot]?.name !== 'naked').map(slot => [slot]);
  const join = (first: string, second: string) => {
    const left = groups.find(group => group.includes(first));
    const right = groups.find(group => group.includes(second));
    if (!left || !right || left === right) return;
    left.push(...right);
    groups.splice(groups.indexOf(right), 1);
  };
  for (const slot of slots) {
    const item = clothes[slot];
    if (!item) continue;
    const secondary = item.outfitSecondary;
    if (secondary && clothes[secondary[0]]?.name === secondary[1]) join(slot, secondary[0]);
    for (const [part, name] of Object.entries(item.outfitPrimary ?? {})) if (clothes[part]?.name === name) join(slot, part);
  }
  const removable = groups.filter(group =>
    group.every(slot => {
      const item = clothes[slot];
      if (item?.cursed === 1 || item?.name?.includes('chastity') || item?.type?.some(type => type.includes('chastity'))) return false;
      const secondary = item?.outfitSecondary;
      if (secondary && clothes[secondary[0]]?.name === secondary[1] && !group.includes(secondary[0])) return false;
      // 不拆开与外套或配饰相连的整套衣物，避免原版宏一并脱下未参与赌注的栏位。
      return Object.entries(item?.outfitPrimary ?? {}).every(([part, name]) => clothes[part]?.name !== name || group.includes(part));
    })
  );
  return removable.filter(group =>
    (['upper', 'lower'] as const).every(outer => {
      const inner = outer === 'upper' ? 'under_upper' : 'under_lower';
      return !group.includes(inner) || !clothes[outer]?.name || clothes[outer]?.name === 'naked' || removable.some(candidate => candidate.includes(outer));
    })
  );
}

export default class BlackjackClothes {
  public constructor(
    private readonly core: typeof maplebirch,
    private readonly getState: () => BlackjackClothesState | null
  ) {}

  /** 原版上下装是肖像模块关闭时的真实衣物来源。 */
  private nativeClothes(name: string): WardrobeItem {
    const native = C.npc?.[name]?.clothes as { set?: string; upper?: { name?: string }; lower?: { name?: string } } | undefined;
    const snapshot: WardrobeItem = {};
    for (const slot of ['upper', 'lower'] as const) {
      const part = native?.[slot];
      if (!part?.name || part.name === 'naked') continue;
      const resource = setup.clothes[slot].find((item: ClothingItem) => item.name === part.name);
      snapshot[slot] = clone(resource ?? { name: part.name });
    }
    const set = setup.npcClothesSets?.find((item: { name: string }) => item.name === native?.set) as { outfit?: number } | undefined;
    if (set?.outfit && snapshot.upper?.name && snapshot.lower?.name) {
      snapshot.upper.outfitPrimary = { lower: snapshot.lower.name };
      snapshot.lower.outfitSecondary = ['upper', snapshot.upper.name];
    }
    return snapshot;
  }

  private npcClothes(name: string): WardrobeItem {
    if (this.core.get('NPCSidebarPortrait')) return clone(this.core.npc.Clothes.wardrobe.worn(name));
    return this.nativeClothes(name);
  }

  public canPrepare(companion: string, partner: string | null): boolean {
    const names = partner ? [companion, partner] : [companion];
    return clothingGroups(V.worn as ClothingMap).length > 0 && names.every(name => clothingGroups(this.npcClothes(name)).length > 0);
  }

  public prepare(companion: string, partner: string | null): BlackjackClothesState | null {
    if (!clothingGroups(V.worn as ClothingMap).length) return null;
    const npcs: BlackjackClothesState['npcs'] = {};
    for (const name of partner ? [companion, partner] : [companion]) {
      const snapshot = this.npcClothes(name);
      const groups = clothingGroups(snapshot);
      if (!groups.length) return null;
      npcs[name] = { snapshot, groups, removed: [] };
    }
    return { player_stored: false, companion, partner, npcs };
  }

  private npcSeat(seat: BlackjackSeat): NpcClothingState | undefined {
    const state = this.getState();
    const name = seat === 'dealer' ? state?.companion : seat === 'partner' ? state?.partner : null;
    return name ? state?.npcs[name] : undefined;
  }

  public remaining(seat: BlackjackSeat): number {
    if (!this.getState()) return 0;
    return seat === 'player' ? clothingGroups(V.worn as ClothingMap).length : (this.npcSeat(seat)?.groups.length ?? 0);
  }

  public remove(seat: BlackjackSeat): boolean {
    const state = this.getState();
    if (!state) return false;
    if (seat !== 'player') {
      const npc = this.npcSeat(seat);
      const group = npc?.groups.shift();
      if (!npc || !group) return false;
      npc.removed.push(...group);
      return true;
    }
    const clothes = V.worn as ClothingMap;
    const group = clothingGroups(clothes)[0];
    if (!group) return false;
    const slot = group.find(part => !clothes[part]?.outfitSecondary || !group.includes(clothes[part]!.outfitSecondary![0])) ?? group[0];
    this.core.get('Finance')?.realEstate.openWardrobe();
    // 每轮仅存一件，清掉原版批量脱衣宏留下的临时跳过标记。
    this.core.SugarCube.Wikifier.wikifyEval(`<<unset _storeItemSkip>><<generalUndress '${storeLocation}' '${slot}'>><<exposure>>`);
    const removed = group.some(part => V.worn[part]?.name === 'naked');
    if (removed) state.player_stored = true;
    return removed;
  }

  public restore(): void {
    if (!this.getState()?.player_stored) return;
    this.core.get('Finance')?.realEstate.openWardrobe();
    this.core.SugarCube.Wikifier.wikifyEval(`<<storeon '${storeLocation}'>><<exposure>>`);
  }

  /** getState 只向本类提供家局脱衣模式，其他页面仍使用角色正常衣柜。 */
  public apply(name: string, clothes: WardrobeItem): void {
    if (!passages.includes(this.core.passage.title)) return;
    const npc = this.getState()?.npcs[name];
    if (!npc) return;
    for (const slot of Object.keys(clothes) as (keyof WardrobeItem)[]) delete clothes[slot];
    Object.assign(clothes, clone(npc.snapshot));
    this.core.npc.Clothes.wardrobe.strip(clothes, npc.removed as (keyof WardrobeItem)[]);
  }
}
