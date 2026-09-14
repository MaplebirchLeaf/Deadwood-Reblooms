import DeadwoodReblooms from './DeadwoodReblooms';
import MoreLoveInterestsAndNPCAvatars from './MoreLoveInterestsAndNPCAvatars';
import CelestialAnomalies from './CelestialAnomalies';
import NPCSidebarPortrait from './NPCSidebarPortrait';

(function (maplebirch): void {
  'use strict';

  if (maplebirch.get('DR')) DeadwoodReblooms(maplebirch);
  if (maplebirch.get('MLIANPCA')) MoreLoveInterestsAndNPCAvatars(maplebirch);
  if (maplebirch.get('LongerCombat')) maplebirch.tool.addTo('Options', 'Deadwood-Reblooms-LongerCombat-Options');
  if (maplebirch.get('CA')) CelestialAnomalies(maplebirch);
  if (maplebirch.get('NPCSidebarPortrait')) NPCSidebarPortrait(maplebirch);
})(maplebirch);
