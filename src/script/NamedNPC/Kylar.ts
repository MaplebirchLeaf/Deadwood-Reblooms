(function (maplebirch) {
  'use strict';

  maplebirch.npc.addSchedule('Kylar', schedule =>
    schedule.when(() => C.npc?.Kylar?.init === 1, kylarLocation, {
      id: 'deadwoodReblooms.kylar.location'
    })
  );

  function kylarLocation(): string {
    if (C.npc.Kylar.state !== 'active') return '';

    // 英语剧排练：优先返回真实活动地点。
    if (V.schoolstate === 'afternoon' && V.englishPlay === 'ongoing' && V.englishPlayRoles.Kylar !== 'none') {
      if (V.englishPlayRoles.KylarKnown) return Weather.precipitation !== 'none' ? 'library' : 'rear_courtyard';
      return 'english';
    }

    // 上学时间：只保留对服装显示有意义的地点。
    if (Time.schoolTime) {
      if (V.schoolstate === 'third') return 'english';
      if (V.schoolstate === 'lunch') {
        if (!V.daily.school.lunchEaten) return 'canteen';
        return Weather.precipitation === 'none' ? 'rear_courtyard' : 'library';
      }
      return 'school';
    }

    if (Time.hour < 7) return 'manor_bedroom';
    if (Time.hour >= 9 && Time.hour < 18) return Weather.precipitation !== 'none' ? 'arcade' : 'park';

    return '';
  }
})(maplebirch);
