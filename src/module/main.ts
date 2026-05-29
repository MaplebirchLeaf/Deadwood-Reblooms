import DeadwoodReblooms from './DeadwoodReblooms';
import UnLockCheatAndCombatStatusDisplay from './UnLockCheatAndCombatStatusDisplay';
import './LongerCombat';

(function (maplebirch): void {
  'use strict';
  maplebirch.register('rebloom', Object.seal(new DeadwoodReblooms(maplebirch)), ['combat']);
  maplebirch.register('UCACSD', Object.freeze(new UnLockCheatAndCombatStatusDisplay(maplebirch)), ['rebloom']);
})(maplebirch);

export { DeadwoodReblooms };
