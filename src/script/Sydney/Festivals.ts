// ./src/script/Sydney/Festivals.ts

export default function (maplebirch: typeof window.maplebirch) {
  // 原版的页面宏和时间推进分别调用宏与同名全局函数，两个入口都先运行原版日程。
  maplebirch.once(':storyready', () => {
    const schedule = window.sydneySchedule;
    if (typeof schedule !== 'function' || !maplebirch.tool.macro.Macro.has('sydneySchedule')) return;

    const adjustSydneySchedule = () => {
      if (!V.SydneyExpansion) return;
      const sydneyActive = maplebirch.get('Sydney')!.available;
      const halloweenNight = (Time.month === 10 && Time.monthDay === 31 && Time.hour >= 21) || (Time.month === 11 && Time.monthDay === 1 && Time.hour < 7);
      const festivalNight = sydneyActive && halloweenNight && V.SydneyExpansion.halloweenYear === Time.year && V.SydneyExpansion.sirrisHalloweenVisitYear !== Time.year;
      const sirrisMorning =
        sydneyActive &&
        V.SydneyExpansion.halloweenYear === Time.year &&
        V.SydneyExpansion.sirrisHalloweenVisitYear !== Time.year &&
        Time.month === 11 &&
        Time.monthDay === 1 &&
        Time.hour >= 7 &&
        Time.hour < 10;
      const christmasRest =
        V.SydneyExpansion.christmasRestYear === Time.year && ((Time.month === 12 && Time.monthDay === 25 && Time.hour >= 21) || (Time.month === 12 && Time.monthDay === 26 && Time.hour < 6));
      const estateVisit = (V.SydneyExpansion.estate.visitDay === Time.days && Time.hour >= 21) || (V.SydneyExpansion.estate.visitDay === Time.days - 1 && Time.hour < 6);

      if (sydneyActive && !V.replayScene) {
        // 原版周日 00:00 短暂标为祈祷，留宿日程将这一小时视为睡在神殿。
        if (T.sydney_location === 'temple' && Time.weekDay === 1 && Time.hour === 0 && V.sydney_templeWork === 'pray') {
          V.sydney_templeWork = 'sleep';
        }
        if (festivalNight || sirrisMorning || christmasRest) {
          T.sydney_location = 'temple';
          T.sydney_location_message = 'temple';
          V.sydney_templeWork = (festivalNight && V.SydneyExpansion.halloweenRestYear === Time.year) || christmasRest ? 'sleep' : 'pray';
        } else if (estateVisit && ['home', 'temple'].includes(T.sydney_location) && V.sydney_templeWork !== 'anguish') {
          T.sydney_location = 'home';
          T.sydney_location_message = 'home';
        }
      }

      // 页面只读取临时状态，每次原版日程更新后统一刷新。
      T.sydneyAvailable = sydneyActive && T.sydney_location === 'temple';
      T.festivalNight = festivalNight;
      T.sirrisMorning = sirrisMorning;
      T.dormAccess = sydneyActive && ['monk', 'priest'].includes(V.temple_rank) && V.sydney?.rank === 'monk' && V.sydneyromance === 1;
      T.christmasRest = christmasRest;
      // quarters 表示在宿舍区域做杂务，不能据此认定悉尼就在床铺旁。
      T.sydneyWorking = T.sydneyAvailable && V.sydney_templeWork === 'quarters';
      T.sydneyResting = T.sydneyAvailable && V.sydney_templeWork === 'sleep';
      T.shareSydneyBed = T.dormAccess && T.sydneyResting;
      T.minutesUntilSirris = Time.month === 10 ? 31 * 60 - (Time.hour * 60 + Time.minute) : Math.max(1, 7 * 60 - (Time.hour * 60 + Time.minute));
    };

    window.sydneySchedule = () => {
      schedule();
      adjustSydneySchedule();
    };
    maplebirch.tool.macro.define('sydneySchedule', () => {
      schedule();
      adjustSydneySchedule();
    });
  });

  maplebirch.tool.inject({
    locationPassage: {
      'Whitney Trick 1': [{ src: '<<set $location to "home">>', applyafter: '<<set $SydneyExpansion.whitneyHalloweenYear to Time.year>>', expected: 1 }]
    }
  });

  // 只在当前剧情的收尾页提供下一站入口，错过后不另设补看入口。
  maplebirch.tool.addTo('CustomLinkZone', { widget: [-1, 'deadwood-reblooms-sydney-christmas-link'], passage: 'Temple' });
  maplebirch.tool.addTo(
    'AfterLinkZone',
    { widget: 'deadwood-reblooms-halloween-robin-guide', passage: ['Robin Trick Hug', 'Robin Trick Talk', 'Robin Trick Kiss Finish'] },
    { widget: 'deadwood-reblooms-halloween-kylar-guide', passage: ['Whitney Trick 7', 'Whitney Trick Sex Finish'] },
    {
      widget: 'deadwood-reblooms-halloween-sydney-guide',
      passage: [
        'Kylar Halloween Town',
        'Kylar Halloween Sex Finish',
        'Kylar Halloween Alone',
        'Kylar Halloween Thank',
        'Kylar Halloween Whitney Kiss',
        'Kylar Halloween Whitney Apologise',
        'Kylar Halloween Whitney Silent',
        'Kylar Halloween Skulduggery Pull'
      ]
    },
    { widget: 'deadwood-reblooms-halloween-sydney-accompany-guide', passage: 'Kylar Halloween Accompany' }
  );
}
