// ./src/script/NamedNPCSidebarPortrait/NPCOutfitSets/Quinn.ts

import type { MaplebirchCore } from '@scml-dol-maplebirch/types';
import { register } from './Clothes';

export default function (maplebirch: MaplebirchCore): void {
  register(maplebirch, 'Quinn', ['business_suit_male', 'business_suit_female', 'speedo', 'bikini'], { preserve: true });
}
