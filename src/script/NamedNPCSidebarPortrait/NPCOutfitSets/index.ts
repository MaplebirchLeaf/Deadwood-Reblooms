import type { MaplebirchCore } from '@scml-dol-maplebirch/types';
import Kylar from './Kylar';
import Robin from './Robin';
import Sydney from './Sydney';
import Whitney from './Whitney';

export default function (maplebirch: MaplebirchCore): void {
  Sydney(maplebirch);
  Kylar(maplebirch);
  Robin(maplebirch);
  Whitney(maplebirch);
}
