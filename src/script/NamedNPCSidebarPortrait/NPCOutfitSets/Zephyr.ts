// ./src/script/NamedNPCSidebarPortrait/NPCOutfitSets/Zephyr.ts

import type { MaplebirchCore } from '@scml-dol-maplebirch/types';
import { register } from './Clothes';

export default function (maplebirch: MaplebirchCore): void {
  register(maplebirch, 'Zephyr', ['gothic_formal_suit'], { preserve: true });
}
