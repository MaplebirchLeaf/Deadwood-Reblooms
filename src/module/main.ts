import DeadwoodReblooms from './DeadwoodReblooms';
import UnLockCheatAndCombatStatusDisplay from './UnLockCheatAndCombatStatusDisplay';
import './LongerCombat';
import './StatChange';

(function (maplebirch): void {
  'use strict';
  maplebirch.register('rebloom', Object.seal(new DeadwoodReblooms(maplebirch)), ['combat']);
  maplebirch.register('UCACSD', Object.freeze(new UnLockCheatAndCombatStatusDisplay(maplebirch)), ['rebloom']);
})(maplebirch);

export { DeadwoodReblooms };
