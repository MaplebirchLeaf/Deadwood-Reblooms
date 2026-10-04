// ./src/script/Robin.ts

export default function (maplebirch: typeof window.maplebirch): void {
  // 饮品店使用独立地点，开店前查看空铺时仍显示原版街景。
  maplebirch.tool.patch.location.configure(
    'deadwood_robin_shop',
    {
      folder: 'robin-shop',
      customMapping: () => (V.RobinExpansion?.shop ? 'deadwood_robin_shop' : 'town'),
      base: {
        default: { condition: () => !Weather.isSnow && !Weather.lightsOn, image: 'base.png' },
        snow: { condition: () => Weather.isSnow && !Weather.lightsOn, image: 'snow.png' },
        night: { condition: () => !Weather.isSnow && Weather.lightsOn, image: 'base-night.png' },
        snowNight: { condition: () => Weather.isSnow && Weather.lightsOn, image: 'snow-night.png' }
      },
      // 原版按底部对齐：32×32 灯光层相对 32×38 底图上移 6 像素。
      emissive: {
        image: 'emissive.png',
        condition: () => Weather.lightsOn,
        color: '#fbff86dd',
        size: 4,
        intensity: 0.8
      },
      weather: {
        fogDistributionCurve: 1,
        rainSplashEnabled: true,
        fogEnabled: true,
        groundBounds: { splashes: { top: 4, bottom: 0 }, fog: { top: 19, bottom: 0 } }
      }
    },
    { overwrite: true }
  );

  maplebirch.tool.onInit(() => {
    for (const [id, difficulty] of [
      ['Deadwood Robin Independent', 2],
      ['Deadwood Robin Together', 3],
      ['Deadwood Robin Free', 3],
      ['Deadwood Robin Shop Open', 3]
    ] as const) {
      setup.feats[id] ??= {
        get title() {
          return maplebirch.t(`deadwood-reblooms:robin:feat:${id}:name`);
        },
        get desc() {
          return maplebirch.t(`deadwood-reblooms:robin:feat:${id}:text`);
        },
        difficulty,
        series: '',
        filter: ['All', 'Social']
      };
    }
  });

  maplebirch.tool.patch.traits.add(
    {
      title: 'Special Traits',
      name: () => maplebirch.t('deadwood-reblooms:robin:trait:solidarity:name'),
      colour: 'green',
      has: () => Boolean(V.RobinExpansion?.selfRent && !V.RobinExpansion.bothRent && !V.RobinExpansion.baileyDefeated),
      text: () => maplebirch.t('deadwood-reblooms:robin:trait:solidarity:text')
    },
    {
      title: 'Special Traits',
      name: () => maplebirch.t('deadwood-reblooms:robin:trait:protected:name'),
      colour: 'gold',
      has: () => Boolean(V.RobinExpansion?.bothRent && !V.RobinExpansion.baileyDefeated),
      text: () => maplebirch.t('deadwood-reblooms:robin:trait:protected:text')
    },
    {
      title: 'Special Traits',
      name: () => maplebirch.t('deadwood-reblooms:robin:trait:free:name'),
      colour: 'def',
      has: () => Boolean(V.RobinExpansion?.baileyDefeated),
      text: () => maplebirch.t('deadwood-reblooms:robin:trait:free:text')
    }
  );

  // 原版这些页面的可见链接数量会随日程和剧情变化，放在首个操作链接前，保留末尾的离开/返回链接。
  // CustomLinkZone 使用固定可见链接序号，不适合这些动态页面。
  maplebirch.tool.addTo(
    'BeforeLinkZone',
    { widget: 'deadwood-robin-room-links', passage: 'Robin Options' },
    { widget: 'deadwood-robin-lemonade-links', passage: "Robin's Lemonade" },
    { widget: 'deadwood-robin-beach-links', passage: "Robin's Lemonade" },
    { widget: 'deadwood-robin-fishing-wait', passage: 'Fishing Beach Wait' },
    { widget: 'deadwood-robin-fishing-return', passage: 'Beach' },
    { widget: 'deadwood-robin-chocolate-links', passage: 'Robin Chocolate' },
    { widget: 'deadwood-robin-balloon-links', passage: 'Balloon Stand' },
    { widget: 'deadwood-robin-shop-link', passage: 'Cliff Street' },
    { widget: 'deadwood-robin-shop-permit-link', passage: 'Town Hall Wait' },
    { widget: 'deadwood-robin-night-link', passage: "Robin's Room Entrance" },
    { widget: 'deadwood-robin-tutor-link', passage: 'Danube Street' },
    { widget: 'deadwood-robin-asylum-links', passage: 'Asylum' },
    { widget: 'deadwood-robin-tentacle-plains-link', passage: 'Tentacle Plains' },
    { widget: 'deadwood-robin-tutor-clue', passage: 'Orphanage' },
    { widget: 'deadwood-robin-meteor-hall-link', passage: 'Orphanage' }
  );

  maplebirch.tool.inject({
    widgetPassage: {
      'Widgets Journal': [
        // 原版先列房租，DoLP 先列押金。在共同房租分支前追加罗宾日志。
        {
          src: '<<if !_avery_pay>>',
          applybefore: `<<deadwood-robin-journal>>
            <<if $RobinExpansion.baileyDefeated>>
              <li><span class='green'><<lanSwitch 'Bailey no longer collects rent from you or Robin.' '贝利不再向你和罗宾收租。'>></span></li>
            <</if>>
            `,
          expected: 1
        },
        // 逼退贝利后不再显示原版欠租说明，其余日志结构照常保留。
        {
          src: '!_avery_pay',
          applyafter: ' and !$RobinExpansion.baileyDefeated',
          expected: 1
        }
      ],
      'Widgets Rent': [
        {
          src: '<<if $robinpaid is 1>>',
          to: '<<if $robinpaid is 1 and !$RobinExpansion.selfRent>>',
          expected: 1
        },
        {
          src: '<<set $renttime to 7>><<set $rentday to Time.weekDay>>\n<</widget>>\n\n<<widget "rentnopay">>',
          applybefore: '<<deadwood-robin-rent-links>>\n\t',
          expected: 1
        }
      ],
      'Asylum Widgets': [
        {
          src: '<<set $robinReunionScene to "asylum">>',
          applyafter: "\n\t<<if $RobinExpansion.asylum.status is 'admitted'>><<unset $robinReunionScene>><</if>>",
          expected: 1
        }
      ],
      'Widgets School Events': [
        // 原版位置函数返回字符串，不接受地点参数。非空的 asylum 也会被误判为真。
        {
          src: 'getRobinLocation("school")',
          to: 'getRobinLocation() is "school"',
          expected: 1
        }
      ],
      Pregnancy2: [
        {
          src: 'C.npc.Robin.init is 1',
          applyafter: " and $RobinExpansion.asylum.status isnot 'admitted'",
          expected: 1
        }
      ]
    },
    locationPassage: {
      // 保留原版探望、援助条件，仅排除本模组收容中的罗宾。
      'School Infirmary Wakeup': [
        {
          src: 'C.npc.Robin.init is 1',
          applyafter: " and $RobinExpansion.asylum.status isnot 'admitted'",
          expected: 1
        }
      ],
      'Canteen Lunch Whitney Milking Strip Finish': [
        {
          src: 'C.npc.Robin.init is 1',
          applyafter: " and $RobinExpansion.asylum.status isnot 'admitted'",
          expected: 1
        }
      ],
      'Canteen Kylar Whitney Intervene': [
        {
          src: 'C.npc.Robin.init is 1',
          applyafter: " and $RobinExpansion.asylum.status isnot 'admitted'",
          expected: 1
        }
      ],
      'Canteen Kylar Whitney Intervene Finish': [
        {
          src: 'C.npc.Robin.init is 1',
          applyafter: " and $RobinExpansion.asylum.status isnot 'admitted'",
          expected: 1
        }
      ],
      Sleep: [
        {
          src: '<<set $wardrobe_location to "wardrobe">>',
          applybefore: '<<deadwood-robin-school-wake>>\n\t\t',
          expected: 1
        }
      ],
      "Bailey's Office Robin 2": [
        {
          src: '<<set $rentmoney *= 2>>',
          to: '<<if !$RobinExpansion.selfRent>><<set $rentmoney *= 2>><</if>>',
          expected: 1
        }
      ],
      Bedroom: [
        // 将独立交租纸条放在原版纸条分支前，不重写后续条件。
        {
          src: '<<if $robinpaid is 1 and $robinmissing is 0 and $robinnote isnot 1 and C.npc.Robin.lust gte 10 and C.npc.Robin.love gte 60 and C.npc.Robin.trauma lt 10>>',
          applybefore: '<<deadwood-robin-independent-note-link>>\n',
          expected: 1
        },
        // 独立交租后排除原版代交租纸条，保留其他判定。
        {
          src: '$robinpaid is 1',
          applyafter: ' and !$RobinExpansion.selfRent',
          expected: 1
        }
      ],
      "Robin's Room Entrance": [
        {
          src: '<<elseif $robinmissing isnot 0>>',
          applybefore: `<<elseif $RobinExpansion.asylum.status is 'admitted'>>
  <<npc Robin>><<person1>>
  <span class='red'><<lanSwitch "Robin has not come home." '罗宾还没有回来。'>></span><br><br>
  <<lanSwitch "The note says Robin became overwhelmed after several difficult days. Staff took Robin to the hospital; the hospital then transferred Robin to the asylum in the forest. No one has given you a date for Robin's return." '纸条写着，罗宾连着几天状态很差，最后在院里崩溃了。工作人员先送罗宾去了医院，医院随后将罗宾转到森林里的精神病院。没人告诉你罗宾什么时候能回来。'>>
  <br><br>
  <<main_hall_icon>><<lanLink '返回孤儿院' 'Orphanage'>><<pass 1>><</lanLink>>
<<elseif _robin_location is 'tutor'>>
  <<lanSwitch "Robin's note says the tutoring lesson will finish this evening." '罗宾的纸条上写着，家教课今晚才结束。'>>
  <br><br>
  <<main_hall_icon>><<lanLink '返回孤儿院' 'Orphanage'>><<pass 1>><</lanLink>>
<<elseif _robin_location is 'shop'>>
  <<lanSwitch "Robin is minding your shop on Cliff Street." '罗宾正在峭壁街照看你们的店。'>>
  <br><br>
  <<main_hall_icon>><<lanLink '返回孤儿院' 'Orphanage'>><<pass 1>><</lanLink>>
`,
          expected: 1
        }
      ],
      'Rent Robin Fight': [
        {
          src: '<<stateman>>',
          applybefore: '<<deadwood-robin-combat-turn>>\n',
          expected: 1
        }
      ],
      'Rent Robin Fight Finish': [
        {
          src: '<<set _robin to statusCheck("Robin")>>',
          applyafter: "\n<<run maplebirch.get('Robin').combatFinish()>>",
          expected: 1
        }
      ]
    }
  });
}
