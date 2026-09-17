// ./src/script/NamedNPCSidebarPortrait/NPCOutfitSets/Remy.ts

import type { MaplebirchCore } from '@scml-dol-maplebirch/types';
import { register } from './Clothes';

export default function (maplebirch: MaplebirchCore): void {
  register(maplebirch, 'Remy', ['riding_formal'], { preserve: true });
}
