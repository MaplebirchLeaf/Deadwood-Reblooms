(function (maplebirch) {
  'use strict';

  maplebirch.npc.addSchedule('Sam', schedule =>
    schedule.when(
      () => C.npc?.Sam?.init === 1,
      () => (Time.hour >= 6 && Time.hour < 7 && Weather.precipitation === 'none' ? 'park' : ''),
      {
        id: 'deadwoodReblooms.sam.location'
      }
    )
  );
})(maplebirch);
