// ./src/script/NamedNPCSidebarPortrait/NPCOutfitSets/Sirris.ts

import type { MaplebirchCore } from '@scml-dol-maplebirch/types';
import { register } from './Clothes';

export default function (maplebirch: MaplebirchCore): void {
  register(maplebirch, 'Sirris', ['business_suit_male', 'turtleneck_jeans', 'shirt_khakis'], { gender: 'n' });
}
