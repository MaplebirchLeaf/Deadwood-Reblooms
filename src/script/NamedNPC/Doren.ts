(function (maplebirch) {
  'use strict';

  maplebirch.npc.addSchedule('Doren', schedule =>
    schedule.when(
      () => C.npc?.Doren?.init === 1,
      () => (Time.hour >= 9 && Time.hour <= 15 && Time.weekDay === 7 ? 'park' : ''),
      {
        id: 'deadwoodReblooms.doren.location'
      }
    )
  );
})(maplebirch);
