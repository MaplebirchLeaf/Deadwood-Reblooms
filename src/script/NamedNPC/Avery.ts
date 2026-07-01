(function (maplebirch) {
  'use strict';

  maplebirch.npc.addSchedule('Avery', schedule =>
    schedule.when(() => C.npc?.Avery?.init === 1 && C.npc.Avery.state !== 'dismissed', averyLocation, {
      id: 'deadwoodReblooms.avery.location'
    })
  );

  function averyLocation(): string {
    // 宅邸状态由原版维护，这里只读取。
    if (V.avery_mansion?.schedule) return V.avery_mansion.schedule;

    // 办公室：周日 7-16 点，周一到周五 7-20 点。
    if (V.averySeen?.includes('office') && !V.avery_injury && Time.weekDay !== 7 && Time.hour > 6 && Time.hour <= (Time.weekDay === 1 ? 16 : 20)) return 'office';

    // 放学接送：只标记地点，不消耗随机。
    if (C.npc.Avery.state === 'active' && !V.avery_injury && Time.schoolDay && Time.hour === 15 && V.exposed <= 0 && !V.averyschoolpickup) return 'pickup';

    // 未解锁办公室时的邀请/解锁地点。
    if (!V.averySeen?.includes('office') && Time.weekDay !== 7 && !V.avery_injury) {
      if (V.dateCount.Avery === 0 && Time.hour >= 8 && Time.hour < 10) return 'office invite';
      if (V.auriga_artefact && C.npc.Avery.rage <= 40 && Time.hour >= 8 && Time.hour < 15) return 'office unlock';
    }

    return V.averydate === 1 && Time.weekDay === 7 && Time.hour === 20 ? 'date' : '';
  }
})(maplebirch);
