// ./src/script/NamedNPCSidebarPortrait/NPCOutfitSets/Wren.ts

import type { MaplebirchCore } from '@scml-dol-maplebirch/types';
import { register } from './Clothes';

export default function (maplebirch: MaplebirchCore): void {
  register(maplebirch, 'Wren', ['leather_jacket_jeans', 'leather_jacket_skirt', 'catsuit', 'prison_jumpsuit'], { preserve: true });
}
