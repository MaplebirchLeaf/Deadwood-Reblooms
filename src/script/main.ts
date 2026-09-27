import DeadwoodReblooms from './DeadwoodReblooms';
import MoreLoveInterestsAndNPCAvatars from './MoreLoveInterestsAndNPCAvatars';
import CelestialAnomalies from './CelestialAnomalies';
import DynamicMusic from './DynamicMusic';
import MoreTransformations from './MoreTransformations';
import NPCSidebarPortrait from './NPCSidebarPortrait';
import VanillaPlus from './VanillaPlus';
import LifeSimulation from './LifeSimulation';
import SydneyExpansion from './SydneyExpansion';
import RobinExpansion from './RobinExpansion';

(function (maplebirch): void {
  'use strict';

  if (maplebirch.get('DR')) DeadwoodReblooms(maplebirch);
  if (maplebirch.get('MLIANPCA')) MoreLoveInterestsAndNPCAvatars(maplebirch);
  if (maplebirch.get('LongerCombat')) maplebirch.tool.addTo('Options', 'Deadwood-Reblooms-LongerCombat-Options');
  if (maplebirch.get('CA')) CelestialAnomalies(maplebirch);
  if (maplebirch.get('DM')) DynamicMusic(maplebirch);
  if (maplebirch.get('MoreTransformations')) MoreTransformations(maplebirch);
  if (maplebirch.get('NPCSidebarPortrait')) NPCSidebarPortrait(maplebirch);
  if (maplebirch.get('VP')) VanillaPlus(maplebirch);
  if (maplebirch.get('SydneyExpansion')) SydneyExpansion(maplebirch);
  if (maplebirch.get('RobinExpansion')) RobinExpansion(maplebirch);
  if (maplebirch.get('LS')) LifeSimulation(maplebirch);
})(maplebirch);
