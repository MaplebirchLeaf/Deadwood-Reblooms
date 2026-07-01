import DeadwoodReblooms from './DeadwoodReblooms';
import UnLockCheatAndCombatStatusDisplay from './UnLockCheatAndCombatStatusDisplay';
import MoreLoveInterestsAndNPCAvatars from './MoreLoveInterestsAndNPCAvatars';
import './LongerCombat';
import './StatChange';

(function (maplebirch): void {
  'use strict';
  maplebirch.register('rebloom', Object.seal(new DeadwoodReblooms(maplebirch)), ['combat', 'npc']);
  maplebirch.register('UCACSD', Object.freeze(new UnLockCheatAndCombatStatusDisplay(maplebirch)), ['rebloom']);
  maplebirch.register('MLIANPCA', Object.freeze(new MoreLoveInterestsAndNPCAvatars(maplebirch)), ['rebloom']);
})(maplebirch);

export { DeadwoodReblooms };
