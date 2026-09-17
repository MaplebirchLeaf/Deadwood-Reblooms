// ./src/script/NamedNPCSidebarPortrait/NPCOutfitSets/Niki.ts

import type { MaplebirchCore } from '@scml-dol-maplebirch/types';
import { register } from './Clothes';

export default function (maplebirch: MaplebirchCore): void {
  register(maplebirch, 'Niki', ['turtleneck_jeans']);
}
