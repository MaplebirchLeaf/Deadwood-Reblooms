(function (maplebirch) {
  'use strict';

  maplebirch.npc.addSchedule('Gwylan', schedule =>
    schedule.when(() => C.npc?.Gwylan?.init === 1, gwylanLocation, {
      id: 'deadwoodReblooms.gwylan.location'
    })
  );

  function gwylanLocation(): string {
    if (V.gwylan?.timer?.nobody >= Time.date.timeStamp) return 'nowhere';

    if (C.npc.Gwylan.state === 'scorned') {
      return Time.hour >= 17 && Time.hour <= 23 && !V.gwylanSeen?.includes('yearning_pub') && !V.yearningLetter && !V.daily.gwylan.preventProgress ? 'pub' : 'sulking';
    }

    if (V.robin_in_forest_shop) return 'shop';
    if (Time.hour === 5 || (Time.hour === 6 && Time.minute < 45)) return 'garden';
    if (!V.daily.gwylan.cafeSkip && Time.hour === 7 && Time.minute < 20 && !V.daily.gwylan.cafe) return 'walking_to_cafe';
    if (!V.daily.gwylan.cafeSkip && ((Time.hour === 7 && (Time.minute >= 20 || V.daily.gwylan.cafe)) || Time.hour === 8 || (Time.hour === 9 && Time.minute <= 20))) {
      return V.chef_state >= 7 && V.chef_state <= 8 && V.chef_rework <= 30 ? 'cliff' : 'cafe';
    }
    if (!Time.isBloodMoon() && (Time.hour >= 23 || Time.hour <= 5) && (!V.gwylan?.hunting || V.location === 'forest_shop')) return 'sleep';

    return 'shop';
  }
})(maplebirch);
