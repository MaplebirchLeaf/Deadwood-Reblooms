(function (maplebirch) {
  'use strict';

  const schoolLocations = ['library', 'science', 'class', 'canteen', 'rehearsal'];
  const sydneyOutfits = ['sydney_f_school_uniform', 'sydney_m_school_uniform', 'sydney_f_nun_habit', 'sydney_m_monk_habit', 'sydney_initiate_robes'];
  const sydneyCache = new WeakMap<object, any>();

  maplebirch.npc.addSchedule('Sydney', schedule =>
    schedule.when(() => C.npc?.Sydney?.init === 1, sydneyLocation, {
      id: 'deadwoodReblooms.sydney.location'
    })
  );

  maplebirch.tool.onInit(() => {
    maplebirch.on(':npcInject', sydneyData, 'Deadwood Reblooms Sydney data');

    schoolLocations.forEach(location => {
      maplebirch.npc.Clothes.wear('Sydney', location, 'sydney_f_school_uniform', () => C.npc?.Sydney?.pronoun === 'f');
      maplebirch.npc.Clothes.wear('Sydney', location, 'sydney_m_school_uniform', () => C.npc?.Sydney?.pronoun === 'm');
    });
    maplebirch.npc.Clothes.wear('Sydney', 'temple', 'sydney_f_nun_habit', () => C.npc?.Sydney?.pronoun === 'f' && V.sydney?.rank === 'monk');
    maplebirch.npc.Clothes.wear('Sydney', 'temple', 'sydney_m_monk_habit', () => C.npc?.Sydney?.pronoun === 'm' && V.sydney?.rank === 'monk');
    maplebirch.npc.Clothes.wear('Sydney', 'temple', 'sydney_initiate_robes', () => ['initiate', '见习教徒'].includes(V.sydney?.rank));
  });

  // npcInject 每次处理 Sydney 时同步发型、塞衣、见习教徒配件和眼镜状态。
  function sydneyData(npcName: string): void {
    if (npcName !== 'Sydney') return;
    V.maplebirch.npc.sydney.tucked = [true, false];
    const npc = V.NPCName?.find((data: any) => data?.nam === 'Sydney');
    if (!npc) return;
    const loose = V.sydney?.hair === 'loose';
    npc.hair_side_type = loose ? 'loose' : 'ponytail';
    npc.hair_fringe_type = loose ? 'loose' : 'straight tails';
    npc.hairlength = 400;

    // 动态调整所有 Sydney 服装
    sydneyOutfits.forEach(key => {
      const clothes = maplebirch.npc.Clothes.wardrobe[key];
      if (!clothes) return;

      // 首次缓存需要动态控制的槽位
      if (!sydneyCache.has(clothes)) sydneyCache.set(clothes, { face: clothes.face, head: clothes.head, under_upper: clothes.under_upper });
      const cached = sydneyCache.get(clothes);

      // 眼镜：contacts 时移除 face 槽，否则恢复
      clothes.face = V.sydney?.glasses === 'contacts' ? undefined : cached.face;

      // 见习教徒长袍：男性时移除发卡和胸罩，女性时还原
      if (key === 'sydney_initiate_robes') {
        if (C.npc?.Sydney?.pronoun === 'm') {
          delete clothes.head;
          delete clothes.under_upper;
        } else {
          clothes.head = cached.head;
          clothes.under_upper = cached.under_upper;
        }
      }
    });
  }

  // 按原版逻辑返回 Sydney 所在位置，供框架日程系统显示侧边栏位置。
  function sydneyLocation(): string {
    if (V.sydney_location_override && V.replayScene) return V.sydney_location_override;
    if (V.daily.sydney.punish === 1) return 'home';
    if (V.englishPlay === 'ongoing' && V.englishPlayDays === 0 && Time.hour >= 17 && Time.hour <= 20) return 'englishPlay';

    if (Time.weekDay === 1) return 'temple';
    if (Time.weekDay === 7) return V.adultshopopeningsydney === true && Time.hour < 21 ? 'shop' : Time.hour >= 6 ? 'temple' : 'home';
    if (Time.weekDay === 6 && Time.hour >= 16 && Time.hour <= 19) return V.adultshophelped === 1 ? 'temple' : 'shop';

    if (V.sydneySeen !== undefined && V.adultshopunlocked && C.npc.Sydney.corruption > 10 && Time.hour >= 16 && Time.hour <= 19) {
      if (V.adultshophelped === 1) return 'temple';
      if (C.npc.Sydney.corruption > 10 && Time.weekDay === 4) return 'shop';
      if (C.npc.Sydney.corruption > 20 && Time.weekDay === 5) return 'shop';
      if (C.npc.Sydney.corruption > 30 && Time.weekDay === 3 && V.sydney.rank === 'initiate') return 'shop';
      if (C.npc.Sydney.corruption > 40 && Time.weekDay === 2 && V.sydney.rank === 'initiate') return 'shop';
    }

    if (!Time.schoolTerm) return Time.hour >= 6 && Time.hour <= 22 ? 'temple' : 'home';
    if (!Time.schoolDay) return 'home';
    if (Time.hour <= 5) return 'home';
    if (Time.hour === 6) return 'temple';
    if (Time.hour === 7 || Time.hour === 8 || (Time.hour === 9 && V.sydneyScience !== 1)) return 'library';
    if (Time.hour === 9) return 'science';
    if (['second', 'third'].includes(V.schoolstate)) return 'class';
    if (V.schoolstate === 'lunch' && V.daily.school.lunchEaten !== 1 && Time.minute <= 15) return 'canteen';
    if (V.englishPlay === 'ongoing' && V.schoolstate === 'afternoon') return 'rehearsal';
    if (Time.hour <= 15 || (Time.hour === 16 && Time.minute <= 40)) return V.daily.sydney.templeSkip ? 'temple' : 'library';

    return Time.hour <= 22 ? 'temple' : 'home';
  }
})(maplebirch);
