// ./src/script/NamedNPCSidebarPortrait/NPCOutfitSets/Leighton.ts

import type { MaplebirchCore } from '@scml-dol-maplebirch/types';
import { register } from './Clothes';

export default function (maplebirch: MaplebirchCore): void {
  register(maplebirch, 'Leighton', ['business_suit_male', 'business_suit_female'], { type: 'teacher' });
}
