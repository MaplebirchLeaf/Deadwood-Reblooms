(function (maplebirch) {
  'use strict';

  maplebirch.npc.addSchedule('Robin', schedule =>
    schedule.when(() => C.npc?.Robin?.init === 1, robinLocation, {
      id: 'deadwoodReblooms.robin.location'
    })
  );

  function robinLocation(): string {
    if (V.robinlocationoverride && V.robinlocationoverride.during.includes(Time.hour)) return V.robinlocationoverride.location;
    if (['docks', 'landfill', 'dinner', 'pillory', 'mansion'].includes(V.robinmissing)) return V.robinmissing;
    if (Time.hour < 7 || Time.hour > 20) return 'sleep';

    // 咖啡馆同行剧情原版暂未返回 cafe，这里维持孤儿院。
    if (
      V.gwylanSeen?.includes('cafe_walk_robin') &&
      V.robin.timer.hurt === 0 &&
      V.daily.robin_in_cafe &&
      (V.chef_state < 7 || V.chef_state > 8) &&
      Time.schoolDay &&
      Time.hour === 8 &&
      Time.minute < 50
    ) {
      return 'orphanage';
    }

    if (Time.schoolDay && Time.hour >= 8 && Time.hour <= 15) return 'school';

    // 16:30-17:29 自动浇水/洗澡。
    if (
      V.robin.autoWater &&
      C.npc.Robin.trauma < 50 &&
      Weather.precipitation !== 'rain' &&
      (Weather.precipitation !== 'snow' || V.alex_greenhouse >= 3) &&
      ((Time.hour === 16 && Time.minute >= 30) || (Time.hour === 17 && Time.minute <= 29)) &&
      orphanagePlotsPlanted()
    ) {
      if (Time.hour === 16 && !orphanagePlotsWatered()) return 'garden';
      return V.daily.robin.bath ? 'orphanage' : 'bath';
    }

    if (Time.hour === 16 && Time.minute >= 30) return V.daily.robin.bath ? 'orphanage' : 'bath';
    if (V.halloween === 1 && Time.hour >= 16 && Time.hour <= 18 && Time.monthDay === 31) return 'halloween';
    if (Time.isWeekEnd() && Time.hour >= 9 && Time.hour <= 16 && C.npc.Robin.trauma < 80) return Time.season === 'winter' ? 'park' : 'beach';
    if (V.englishPlay === 'ongoing' && V.englishPlayDays === 0 && Time.hour >= 17 && Time.hour < 21) return 'englishPlay';

    return 'orphanage';
  }
})(maplebirch);
