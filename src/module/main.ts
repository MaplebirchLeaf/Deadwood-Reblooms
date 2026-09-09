import DeadwoodReblooms from './DeadwoodReblooms';
import UnLockCheatAndCombatStatusDisplay from './UnLockCheatAndCombatStatusDisplay';
import LongerCombat from './LongerCombat';
import MoreLoveInterestsAndNPCAvatars from './MoreLoveInterestsAndNPCAvatars';
import IncantationCheatCollection from './IncantationCheatCollection';
import CelestialAnomalies from './CelestialAnomalies';
import MoreTransformations from './MoreTransformations';

(function (maplebirch): void {
  'use strict';
  maplebirch.register('DR', Object.seal(new DeadwoodReblooms(maplebirch)), ['var']);
  maplebirch.register('UCACSD', Object.freeze(new UnLockCheatAndCombatStatusDisplay(maplebirch)), ['tool']);
  maplebirch.register('LongerCombat', Object.seal(new LongerCombat(maplebirch)), ['var']);
  maplebirch.register('MLIANPCA', Object.seal(new MoreLoveInterestsAndNPCAvatars(maplebirch)), ['tool']);
  maplebirch.register('ICC', Object.seal(new IncantationCheatCollection(maplebirch)), ['DR']);
  maplebirch.register('CA', Object.seal(new CelestialAnomalies(maplebirch)), ['var']);
  maplebirch.register('MoreTransformations', Object.seal(new MoreTransformations(maplebirch)), ['char']);
})(maplebirch);
