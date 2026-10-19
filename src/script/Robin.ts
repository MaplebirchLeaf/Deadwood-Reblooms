// ./src/script/Robin.ts

export default function (maplebirch: typeof window.maplebirch): void {
  maplebirch.tool.addTo('Journal', 'deadwood-robin-shop-journal', 'deadwood-robin-asylum-journal');
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

  maplebirch.tool.patch.traits.add(
    {
      title: 'NPC Traits',
      name: () => maplebirch.t('deadwood-reblooms:robin:trait:solidarity:name'),
      colour: 'green',
      has: () => Boolean(V.RobinExpansion?.self_rent && !V.RobinExpansion.both_rent && !V.RobinExpansion.bailey_defeated),
      text: () => maplebirch.t('deadwood-reblooms:robin:trait:solidarity:text')
    },
    {
      title: 'NPC Traits',
      name: () => maplebirch.t('deadwood-reblooms:robin:trait:protected:name'),
      colour: 'teal',
      has: () => Boolean(V.RobinExpansion?.both_rent && !V.RobinExpansion.bailey_defeated),
      text: () => maplebirch.t('deadwood-reblooms:robin:trait:protected:text')
    },
    {
      title: 'NPC Traits',
      name: () => maplebirch.t('deadwood-reblooms:robin:trait:free:name'),
      colour: 'def',
      has: () => Boolean(V.RobinExpansion?.bailey_defeated),
      text: () => maplebirch.t('deadwood-reblooms:robin:trait:free:text')
    }
  );

  // 这些入口补充当前场景，各 widget 按人物日程和剧情状态限制显示。
  maplebirch.tool.addTo(
    'BeforeLinkZone',
    { widget: 'deadwood-robin-lemonade-links', passage: "Robin's Lemonade" },
    { widget: 'deadwood-robin-beach-links', passage: "Robin's Lemonade" },
    { widget: 'deadwood-robin-chocolate-links', passage: 'Robin Chocolate' },
    { widget: 'deadwood-robin-balloon-links', passage: 'Balloon Stand' },
    { widget: 'deadwood-robin-shop-permit-link', passage: 'Town Hall Wait' },
    { widget: 'deadwood-robin-night-link', passage: "Robin's Room Entrance" },
    { widget: 'deadwood-robin-tentacle-plains-link', passage: 'Tentacle Plains' },
    { widget: 'deadwood-robin-pregnancy-link', passage: 'Robin Options' }
  );
  maplebirch.tool.addTo('CustomLinkZone', { widget: [-1, 'deadwood-robin-asylum-links'], passage: 'Asylum' });

  maplebirch.tool.inject({
    widgetPassage: {
      'Widgets Robin': [
        // 各房间页面共用普通菜单，上学、就寝和剧情分支不会经过这里。
        { src: '<<robinbully>>', applybefore: '<<deadwood-robin-room-links>>\n\t\t', expected: 1 }
      ],
      'Widgets Journal': [
        // 原版先列房租，DoLP 先列押金。在共同房租分支前追加罗宾日志。
        {
          src: '<<if !_avery_pay>>',
          applybefore: `<<deadwood-robin-journal>>
            <<if $RobinExpansion.bailey_defeated>>
              <li><span class='green'><<lanSwitch 'Bailey no longer collects rent from you or Robin.' '贝利不再向你和罗宾收租。'>></span></li>
            <</if>>
            `,
          expected: 1
        },
        // 逼退贝利后不再显示原版欠租说明，其余日志结构照常保留。
        {
          src: '!_avery_pay',
          applyafter: ' and !$RobinExpansion.bailey_defeated and !maplebirch.get("Finance")?.orphanage.pcFree',
          expected: 1
        }
      ],
      'Widgets Rent': [
        {
          srcmatch: /<<if \$robinpaid is 1(?=>>)/,
          applyafter: ' and !$RobinExpansion.self_rent',
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
      // 只跟随普通地点菜单，街道事件和孤儿院强制剧情不会经过这些锚点。
      'Cliff Street': [{ src: '<<beachicon>>', applybefore: '<<deadwood-robin-shop-link>>\n\t\t', expected: 1 }],
      'Danube Street': [
        {
          srcmatch: /<<if \$exposed lte 0 and Time\.openingHours\(2\)>>(?=\s*<<spaicon>>)/,
          applybefore: '<<deadwood-robin-tutor-link>>\n\t\t',
          expected: 1
        }
      ],
      Orphanage: [{ src: '<<gardenicon>>', applybefore: '<<deadwood-robin-tutor-clue>><<deadwood-robin-meteor-hall-link>>\n\t', expected: 1 }],
      // 钓鱼陪伴只接普通等待分支，约会结算只接海滩普通菜单。
      'Fishing Beach Wait': [{ src: '<<fishingBeachWaitAmbient>>', applyafter: '<<deadwood-robin-fishing-wait>>', expected: 1 }],
      Beach: [{ src: '<<if Time.weekDay is 1 and Time.hour is 9 and !Weather.isOvercast>>', applybefore: '<<deadwood-robin-fishing-return>>\n\t\t', expected: 1 }],
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
          to: '<<if !$RobinExpansion.self_rent>><<set $rentmoney *= 2>><</if>>',
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
          applyafter: ' and !$RobinExpansion.self_rent',
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
  <<main_hall_icon>><<lanLink ['Return to the orphanage', '返回孤儿院'] 'Orphanage'>><<pass 1>><</lanLink>>
<<elseif _robin_location is 'tutor'>>
  <<lanSwitch "Robin's note says the tutoring lesson will finish this evening." '罗宾的纸条上写着，家教课今晚才结束。'>>
  <br><br>
  <<main_hall_icon>><<lanLink ['Return to the orphanage', '返回孤儿院'] 'Orphanage'>><<pass 1>><</lanLink>>
<<elseif _robin_location is 'shop'>>
  <<lanSwitch "Robin is minding your shop on Cliff Street." '罗宾正在峭壁街照看你们的店。'>>
  <br><br>
  <<main_hall_icon>><<lanLink ['Return to the orphanage', '返回孤儿院'] 'Orphanage'>><<pass 1>><</lanLink>>
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
          applyafter: "\n<<run maplebirch.get('Robin').rent.combatFinish()>>",
          expected: 1
        }
      ]
    }
  });
}
