import type { MaplebirchCore } from '@scml-dol-maplebirch/types';
import Alex from './Alex';
import Avery from './Avery';
import Eden from './Eden';
import Kylar from './Kylar';
import Gwylan from './Gwylan';
import Robin from './Robin';
import Sydney from './Sydney';
import Whitney from './Whitney';

export default function (maplebirch: MaplebirchCore): void {
  Sydney(maplebirch);
  Kylar(maplebirch);
  Robin(maplebirch);
  Whitney(maplebirch);
  Gwylan(maplebirch);
  Avery(maplebirch);
  Alex(maplebirch);
  Eden(maplebirch);
}
