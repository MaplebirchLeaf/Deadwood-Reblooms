export default function (maplebirch: typeof window.maplebirch) {
  maplebirch.tool.onInit(() => {
    setup.feats['Four Halloween Visits'] ??= {
      get title() {
        return maplebirch.t('deadwood-reblooms:sydney:halloween:feat:title');
      },
      get desc() {
        return maplebirch.t('deadwood-reblooms:sydney:halloween:feat:description');
      },
      difficulty: 3,
      series: '',
      filter: ['All', 'General']
    };
  });

  // 原版的页面宏和时间推进分别调用宏与同名全局函数；两个入口都先运行原版日程。
  maplebirch.once(':storyready', () => {
    const schedule = window.sydneySchedule;
    if (typeof schedule !== 'function' || !maplebirch.tool.macro.Macro.has('sydneySchedule')) return;

    const keepSydneyAtTemple = () => {
      if (!V.SydneyExpansion || V.replayScene) return;
      const sydneyActive = C.npc.Sydney.init === 1 && C.npc.Sydney.state !== 'prison' && C.npc.Sydney.state !== 'dungeon' && V.daily.sydney?.punish !== 1;
      if (!sydneyActive) return;

      const halloweenNight =
        V.SydneyExpansion.sirrisHalloweenVisitYear !== Time.year &&
        V.SydneyExpansion.halloweenYear === Time.year &&
        ((Time.month === 10 && Time.monthDay === 31 && Time.hour >= 21) || (Time.month === 11 && Time.monthDay === 1 && Time.hour < 7));
      const sirrisMorning =
        V.SydneyExpansion.sirrisHalloweenVisitYear !== Time.year && V.SydneyExpansion.halloweenYear === Time.year && Time.month === 11 && Time.monthDay === 1 && Time.hour >= 7 && Time.hour < 10;
      const christmasRest =
        V.SydneyExpansion.christmasRestYear === Time.year && ((Time.month === 12 && Time.monthDay === 25 && Time.hour >= 21) || (Time.month === 12 && Time.monthDay === 26 && Time.hour < 6));
      if (!halloweenNight && !sirrisMorning && !christmasRest) return;

      T.sydney_location = 'temple';
      T.sydney_location_message = 'temple';
      V.sydney_templeWork = (halloweenNight && V.SydneyExpansion.halloweenRestYear === Time.year) || christmasRest ? 'sleep' : 'pray';
    };

    window.sydneySchedule = () => {
      schedule();
      keepSydneyAtTemple();
    };
    maplebirch.tool.macro.define('sydneySchedule', () => {
      schedule();
      keepSydneyAtTemple();
    });
  });

  maplebirch.tool.inject({
    locationPassage: {
      'Whitney Trick 1': [{ src: '<<set $location to "home">>', applyafter: '<<set $SydneyExpansion.whitneyHalloweenYear to Time.year>>', expected: 1 }]
    }
  });

  // 只在当前剧情的收尾页提供下一站入口，错过后不另设补看入口。
  maplebirch.tool.addTo(
    'AfterLinkZone',
    { widget: 'deadwood-reblooms-sydney-christmas-link', passage: 'Temple' },
    { widget: 'deadwood-reblooms-halloween-robin-guide', passage: 'Robin Trick Hug' },
    { widget: 'deadwood-reblooms-halloween-robin-guide', passage: 'Robin Trick Talk' },
    { widget: 'deadwood-reblooms-halloween-robin-guide', passage: 'Robin Trick Kiss Finish' },
    { widget: 'deadwood-reblooms-halloween-kylar-guide', passage: 'Whitney Trick 7' },
    { widget: 'deadwood-reblooms-halloween-kylar-guide', passage: 'Whitney Trick Sex Finish' },
    { widget: 'deadwood-reblooms-halloween-sydney-guide', passage: 'Kylar Halloween Town' },
    { widget: 'deadwood-reblooms-halloween-sydney-guide', passage: 'Kylar Halloween Sex Finish' },
    { widget: 'deadwood-reblooms-halloween-sydney-guide', passage: 'Kylar Halloween Alone' },
    { widget: 'deadwood-reblooms-halloween-sydney-guide', passage: 'Kylar Halloween Thank' },
    { widget: 'deadwood-reblooms-halloween-sydney-guide', passage: 'Kylar Halloween Whitney Kiss' },
    { widget: 'deadwood-reblooms-halloween-sydney-guide', passage: 'Kylar Halloween Whitney Apologise' },
    { widget: 'deadwood-reblooms-halloween-sydney-guide', passage: 'Kylar Halloween Whitney Silent' },
    { widget: 'deadwood-reblooms-halloween-sydney-guide', passage: 'Kylar Halloween Skulduggery Pull' },
    { widget: 'deadwood-reblooms-halloween-sydney-accompany-guide', passage: 'Kylar Halloween Accompany' }
  );
}
