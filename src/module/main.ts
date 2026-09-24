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

(function (maplebirch): void {
  'use strict';
  maplebirch.register('DR', Object.seal(new DeadwoodReblooms(maplebirch)), ['var']);
  maplebirch.register('UCACSD', Object.freeze(new UnLockCheatAndCombatStatusDisplay(maplebirch)), ['DR', 'tool']);
  maplebirch.register('LongerCombat', Object.seal(new LongerCombat(maplebirch)), ['DR', 'var']);
  maplebirch.register('MLIANPCA', Object.seal(new MoreLoveInterestsAndNPCAvatars(maplebirch)), ['DR', 'tool']);
  maplebirch.register('ICC', Object.seal(new IncantationCheatCollection(maplebirch)), ['DR']);
  maplebirch.register('CA', Object.seal(new CelestialAnomalies(maplebirch)), ['DR', 'var']);
  maplebirch.register('MoreTransformations', Object.seal(new MoreTransformations(maplebirch)), ['DR', 'char']);
  maplebirch.register('NPCSidebarPortrait', Object.freeze(new NPCSidebarPortrait(maplebirch)), ['DR', 'npc']);
  maplebirch.register('VP', Object.seal(new VanillaPlus(maplebirch)), ['DR', 'var', 'char']);
  maplebirch.register('DM', Object.seal(new DynamicMusic(maplebirch)), ['DR', 'audio']);
})(maplebirch);
