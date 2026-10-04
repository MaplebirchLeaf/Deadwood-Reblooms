// ./src/script/main.ts

import DeadwoodReblooms from './DeadwoodReblooms';
import MoreLoveInterestsAndNPCAvatars from './MoreLoveInterestsAndNPCAvatars';
import CelestialAnomalies from './CelestialAnomalies';
import DynamicMusic from './DynamicMusic';
import MoreTransformations from './MoreTransformations';
import NPCSidebarPortrait from './NPCSidebarPortrait';
import VanillaPlus from './VanillaPlus';
import LifeSimulation from './LifeSimulation';
import Orchard from './Orchard';
import Sydney from './Sydney';
import Robin from './Robin';
import Whitney from './Whitney';
import Kylar from './Kylar';

(function (maplebirch): void {
  'use strict';

  if (maplebirch.get('DeadwoodReblooms')) DeadwoodReblooms(maplebirch);
  if (maplebirch.get('MoreLoveInterestsAndNPCAvatars')) MoreLoveInterestsAndNPCAvatars(maplebirch);
  if (maplebirch.get('LongerCombat')) maplebirch.tool.addTo('Options', 'Deadwood-Reblooms-LongerCombat-Options');
  if (maplebirch.get('CelestialAnomalies')) CelestialAnomalies(maplebirch);
  if (maplebirch.get('DynamicMusic')) DynamicMusic(maplebirch);
  if (maplebirch.get('MoreTransformations')) MoreTransformations(maplebirch);
  if (maplebirch.get('NPCSidebarPortrait')) NPCSidebarPortrait(maplebirch);
  if (maplebirch.get('VanillaPlus')) VanillaPlus(maplebirch);
  if (maplebirch.get('Sydney')) Sydney(maplebirch);
  if (maplebirch.get('Robin')) Robin(maplebirch);
  if (maplebirch.get('Whitney')) Whitney(maplebirch);
  if (maplebirch.get('Kylar')) Kylar(maplebirch);
  if (maplebirch.get('LifeSimulation')) LifeSimulation(maplebirch);
  if (maplebirch.get('Orchard')) Orchard(maplebirch);
})(maplebirch);
