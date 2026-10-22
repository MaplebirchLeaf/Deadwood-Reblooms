// ./src/script/main.ts

import DoLP from '../compat/DoLP';
import DoLX from '../compat/DoLX';
import NewWorld from '../compat/NewWorld';
import DeadwoodReblooms from './DeadwoodReblooms';
import MoreLoveInterestsAndNPCAvatars from './MoreLoveInterestsAndNPCAvatars';
import CelestialAnomalies from './CelestialAnomalies';
import DynamicMusic from './DynamicMusic';
import MoreTransformations from './MoreTransformations';
import NPCTransformations from './NPCTransformations';
import NPCSidebarPortrait from './NPCSidebarPortrait';
import VanillaPlus from './VanillaPlus';
import Finance from './Finance';
import LifeSimulation from './LifeSimulation';
import Orchard from './Orchard';
import Sydney from './Sydney';
import Robin from './Robin';
import Whitney from './Whitney';
import Kylar from './Kylar';
import BirdTower from './BirdTower';
import Transport from './Transport';
import StreetLife from './StreetLife';

(function (maplebirch): void {
  'use strict';

  if (maplebirch.get('DeadwoodReblooms')) DeadwoodReblooms(maplebirch);
  if (maplebirch.get('MoreLoveInterestsAndNPCAvatars')) MoreLoveInterestsAndNPCAvatars(maplebirch);
  if (maplebirch.get('LongerCombat')) maplebirch.tool.addTo('Options', 'Deadwood-Reblooms-LongerCombat-Options');
  if (maplebirch.get('CelestialAnomalies')) CelestialAnomalies(maplebirch);
  if (maplebirch.get('DynamicMusic')) DynamicMusic(maplebirch);
  if (maplebirch.get('MoreTransformations')) MoreTransformations(maplebirch);
  if (maplebirch.get('NPCTransformations')) NPCTransformations(maplebirch);
  if (maplebirch.get('NPCSidebarPortrait')) NPCSidebarPortrait(maplebirch);
  if (maplebirch.get('Finance')) Finance(maplebirch);
  if (maplebirch.get('VanillaPlus')) VanillaPlus(maplebirch);
  if (maplebirch.get('Sydney')) Sydney(maplebirch);
  if (maplebirch.get('Robin')) Robin(maplebirch);
  if (maplebirch.get('Whitney')) Whitney(maplebirch);
  if (maplebirch.get('Kylar')) Kylar(maplebirch);
  if (maplebirch.get('BirdTower')) BirdTower(maplebirch);
  if (maplebirch.get('LifeSimulation')) LifeSimulation(maplebirch);
  if (maplebirch.get('Orchard')) Orchard(maplebirch);
  if (maplebirch.get('Transport')) Transport(maplebirch);
  StreetLife(maplebirch);

  // 各模块的普通注入登记完后，再按当前原版源码选择对应兼容规则。
  DoLP(maplebirch);
  DoLX(maplebirch);
  NewWorld(maplebirch);
})(maplebirch);
