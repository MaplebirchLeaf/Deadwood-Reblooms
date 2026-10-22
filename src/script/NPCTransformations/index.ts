// ./src/script/NPCTransformations/index.ts

import type { MaplebirchCore } from '@scml-dol-maplebirch/types';
import Gwylan from './Gwylan';
import Sydney from './Sydney';

export default function NPCTransformations(maplebirch: MaplebirchCore): void {
  Gwylan(maplebirch);
  Sydney(maplebirch);
}
