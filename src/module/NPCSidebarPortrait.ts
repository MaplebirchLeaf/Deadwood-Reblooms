// ./src/module/NPCSidebarPortrait.ts

import type { MaplebirchCore } from '@scml-dol-maplebirch/types';

type Wardrobe = MaplebirchCore['npc']['Clothes']['wardrobe'];

export type WardrobeItem = ReturnType<Wardrobe['worn']>;

export interface ClothingItem {
  slot?: string;
  [key: string]: unknown;
}

class NPCSidebarPortrait {
  constructor(readonly core: typeof maplebirch) {}

  public randomColour(colours: readonly string[], weights: Readonly<Record<string, number>> = {}): string {
    const available = colours.filter(colour => colour !== 'custom');
    if (!available.length) throw new Error('没有可用颜色');
    return available.either(available.map(colour => weights[colour] ?? 0)) ?? available[0];
  }

  public apply(clothes: WardrobeItem, item: object, slot?: string): void {
    const itemSlot = slot ?? ('slot' in item && typeof item.slot === 'string' ? item.slot : undefined);
    if (!itemSlot) return;
    const clothing = { ...item } as Record<string, unknown>;
    delete clothing.slot;
    this.core.npc.Clothes.wardrobe.apply(clothes, itemSlot as keyof WardrobeItem, clothing);
  }
}

export default NPCSidebarPortrait;
