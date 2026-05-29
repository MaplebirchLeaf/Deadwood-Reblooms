import DeadwoodReblooms from './DeadwoodReblooms';

(function (maplebirch): void {
  'use strict';
  maplebirch.register('rebloom', Object.seal(new DeadwoodReblooms(maplebirch)), ['combat']);
})(maplebirch);

export { DeadwoodReblooms };
