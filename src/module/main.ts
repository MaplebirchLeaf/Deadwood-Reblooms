import DeadwoodReblooms from './DeadwoodReblooms';
import UnLockCheatAndCombatStatusDisplay from './UnLockCheatAndCombatStatusDisplay';
import LongerCombat from './LongerCombat';
import MoreLoveInterestsAndNPCAvatars from './MoreLoveInterestsAndNPCAvatars';
import IncantationCheatCollection from './IncantationCheatCollection';
import CelestialAnomalies from './CelestialAnomalies';
import MoreTransformations from './MoreTransformations';
import NPCSidebarPortrait from './NPCSidebarPortrait';
import VanillaPlus from './VanillaPlus';
import DynamicMusic from './DynamicMusic';
import LifeSimulation from './LifeSimulation';
import SydneyExpansion from './SydneyExpansion';

(function (maplebirch): void {
  'use strict';
  maplebirch.define('DR', new DeadwoodReblooms(maplebirch), ['var']);
  maplebirch.define('UCACSD', new UnLockCheatAndCombatStatusDisplay(maplebirch), ['DR', 'tool']);
  maplebirch.define('LongerCombat', new LongerCombat(maplebirch), ['DR', 'var']);
  maplebirch.define('MLIANPCA', new MoreLoveInterestsAndNPCAvatars(maplebirch), ['DR', 'tool']);
  maplebirch.define('ICC', new IncantationCheatCollection(maplebirch), ['DR']);
  maplebirch.define('CA', new CelestialAnomalies(maplebirch), ['DR', 'var']);
  maplebirch.define('MoreTransformations', new MoreTransformations(maplebirch), ['DR', 'char']);
  maplebirch.define('NPCSidebarPortrait', new NPCSidebarPortrait(maplebirch), ['DR', 'npc']);
  maplebirch.define('VP', new VanillaPlus(maplebirch), ['DR', 'var', 'char']);
  maplebirch.define('SydneyExpansion', new SydneyExpansion(maplebirch), ['DR', 'var']);
  maplebirch.define('LS', new LifeSimulation(maplebirch), ['DR', 'var']);
  maplebirch.define('DM', new DynamicMusic(maplebirch), ['DR', 'audio']);
})(maplebirch);
