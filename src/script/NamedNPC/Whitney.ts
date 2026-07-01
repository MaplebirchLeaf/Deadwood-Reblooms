(function (maplebirch) {
  'use strict';

  maplebirch.npc.addSchedule('Whitney', schedule =>
    schedule.when(() => C.npc?.Whitney?.init === 1, whitneyLocation, {
      id: 'deadwoodReblooms.whitney.location'
    })
  );

  function whitneyLocation(): string {
    if (['dungeon', 'pillory'].includes(C.npc.Whitney.state)) return '';
    if (V.schoolstate === 'second' && ['active', 'seat'].includes(V.whitneymaths)) return 'mathsClassroom';
    if (V.schoolstate === 'afternoon' && V.bullytimer >= 1 && V.bullytimeroutside >= 1 && V.daily.whitney.bullyGate !== 1) return 'schoolFrontCourtyard';
    if (Time.schoolDay && Time.hour >= 7 && Time.hour <= 16) return 'school';

    if (
      ['active', 'rescued'].includes(C.npc.Whitney.state) &&
      Weather.precipitation !== 'none' &&
      Time.dayState === 'day' &&
      !Time.schoolTime &&
      V.daily.whitney.park === undefined &&
      V.pillory.tenant.special.name !== 'Whitney'
    ) {
      return 'park';
    }

    return '';
  }
})(maplebirch);
