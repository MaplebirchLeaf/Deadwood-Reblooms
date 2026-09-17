// ./src/script/NamedNPCSidebarPortrait/NPCOutfitSets/Winter.ts

import type { MaplebirchCore } from '@scml-dol-maplebirch/types';
import { register } from './Clothes';

export default function (maplebirch: MaplebirchCore): void {
  register(maplebirch, 'Winter', ['vintage_pantsuit_formal', 'vintage_skirtsuit_formal'], { type: 'teacher' });
}
