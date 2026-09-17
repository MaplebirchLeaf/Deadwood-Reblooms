// ./src/script/NamedNPCSidebarPortrait/NPCOutfitSets/River.ts

import type { MaplebirchCore } from '@scml-dol-maplebirch/types';
import { register } from './Clothes';

export default function (maplebirch: MaplebirchCore): void {
  register(maplebirch, 'River', ['business_suit_male', 'business_suit_female', 'shirt_khakis']);
}
