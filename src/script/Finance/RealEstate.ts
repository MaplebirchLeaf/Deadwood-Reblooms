// ./src/script/Finance/RealEstate.ts

import PropertySuite from './PropertySuite';

export default function RealEstate(maplebirch: typeof window.maplebirch): void {
  PropertySuite(maplebirch);
  const realEstate = maplebirch.get('Finance')!.realEstate;
  for (const property of realEstate.properties) {
    if (property.location) continue;
    maplebirch.tool.patch.location.configure(
      `deadwood_home_${property.id}`,
      {
        folder: `property-${property.id}`,
        base: {
          default: { condition: () => !Weather.isSnow && !Weather.lightsOn, image: 'base.png' },
          snow: { condition: () => Weather.isSnow && !Weather.lightsOn, image: 'snow.png' },
          night: { condition: () => !Weather.isSnow && Weather.lightsOn, image: 'base-night.png' },
          snowNight: { condition: () => Weather.isSnow && Weather.lightsOn, image: 'snow-night.png' }
        },
        emissive: { image: 'emissive.png', condition: () => Weather.lightsOn, color: '#fbff86dd', size: 4, intensity: 0.8 },
        weather: {
          fogDistributionCurve: 1,
          rainSplashEnabled: property.id !== 'penthouse',
          fogEnabled: property.id !== 'penthouse',
          groundBounds: { splashes: { top: 4, bottom: 0 }, fog: { top: 19, bottom: 0 } }
        }
      },
      { overwrite: true }
    );
  }
  maplebirch.tool.patch.location.configure('deadwood_home', {
    // current 沿用产权、出租和冻结判断，并在切换存档后读取当前房屋。
    customMapping: () => {
      const property = V.Finance?.real_estate ? realEstate.current : undefined;
      return property ? (property.location ?? `deadwood_home_${property.id}`) : 'home';
    }
  });

  maplebirch.tool.addTo('CustomLinkZone', { widget: [-1, 'deadwood-reblooms-property-furnishings-link'], passage: 'Furniture Shop' });
  // 这些原版 Passage 能与 NPC 当面交谈。课堂入口还需由原版出勤状态与考试阶段筛选。
  maplebirch.tool.addTo(
    'BeforeLinkZone',
    { widget: "deadwood-reblooms-property-invitation-link 'Whitney' 'Deadwood Reblooms Property Invite Whitney Maths'", passage: 'Maths Lesson' },
    { widget: "deadwood-reblooms-property-invitation-link 'Kylar' 'Deadwood Reblooms Property Invite Kylar Lesson'", passage: 'English Lesson' },
    { widget: "deadwood-reblooms-property-invitation-link 'Sydney' 'Deadwood Reblooms Property Invite Sydney Science'", passage: 'Science Lesson' },
    { widget: "deadwood-reblooms-property-invitation-link 'Robin' 'Deadwood Reblooms Property Invite Robin Lesson'", passage: 'History Lesson' },
    { widget: "deadwood-reblooms-property-invitation-link 'Robin' 'Deadwood Reblooms Property Invite Robin History'", passage: 'History Classroom' },
    { widget: "deadwood-reblooms-property-invitation-link 'Kylar' 'Deadwood Reblooms Property Invite Kylar English'", passage: 'English Classroom' },
    { widget: "deadwood-reblooms-property-invitation-link 'Sydney' 'Deadwood Reblooms Property Invite Sydney English'", passage: 'English Classroom' }
  );
  maplebirch.tool.inject({
    // 原版的普通地点列表都在各街道事件分支内。把入口放在该列表的首个固定图标前，
    // 自然继承过桥、遭遇战和其他特殊事件的排除条件。五个锚点在英中原版各出现一次。
    locationPassage: {
      'Domus Street': [{ src: '<<homeicon>>', applybefore: '<<deadwood-reblooms-property-street>>\n\t\t\t', expected: 1 }],
      'Barb Street': [{ src: '<<if Time.openingHours(1)>>', applybefore: '<<deadwood-reblooms-property-street>>\n\t\t', expected: 1 }],
      'High Street': [{ src: '<<if Time.dayState is "night" and Time.hour isnot 21>>', applybefore: '<<deadwood-reblooms-property-street>>\n\t\t', expected: 1 }],
      'Cliff Street': [
        {
          src: '<<if $scienceproject is "ongoing" and $scienceprojectdays is 0 and Time.dayState is "day" and $exposed lte 0>>',
          applybefore: '<<deadwood-reblooms-property-street>>\n\t\t',
          expected: 1
        }
      ],
      'Danube Street': [
        // DoLP 的精品店复用同一条件。只在温泉图标前插入住宅入口。
        {
          srcmatch: /<<if \$exposed lte 0 and Time\.openingHours\(2\)>>(?=\s*<<spaicon>>)/,
          applybefore: '<<deadwood-reblooms-property-street>>\n\t\t',
          expected: 1
        }
      ],
      "Robin's Room Entrance": [
        {
          src: '<<elseif _robin_location is "sleep">>',
          applybefore:
            '<<elseif _robin_location is "sleep" and maplebirch.get("Finance").realEstate.residenceOf("Robin")>>\n' +
            '\t<<lanSwitch "Robin\'s room is empty. A note says Robin has gone home to you." "罗宾的房间空着。门上的纸条写着，罗宾今晚回你们的住处。">><br><br>\n' +
            '\t<<main_hall_icon>><<lanLink ["Main hall (0:01)", "大厅 (0:01)"] "Orphanage">><<pass 1>><</lanLink>><br>\n',
          expected: 1
        }
      ],
      'Whitney Home Knock': [
        {
          src: '<<elseif Time.dayState is "dawn">>',
          applybefore:
            '<<elseif maplebirch.get("Finance").realEstate.residenceOf("Whitney")>>\n' +
            '\t<<lanSwitch "Whitney has moved in with you. The flat is quiet behind the door." "惠特尼已经搬去与你同住。房门后静悄悄的。">><br><br>\n' +
            '\t<<getouticon>><<lanLink ["Leave (0:02)", "离开 (0:02)"] "Barb Street">><<pass 2>><</lanLink>><br>\n',
          expected: 1
        }
      ]
    },
    widgetPassage: {
      'Widgets Kylar': [{ src: '<<if _lewdIdea>>', applybefore: '<<deadwood-reblooms-property-invitation-menu>>\n\t\t', expected: 1 }],
      'Widgets Whitney': [{ src: '<<if !_noOptions>>', applyafter: '\n\t\t\t<<deadwood-reblooms-property-invitation-menu>>', expected: 1 }],
      'Widgets Sydney': [{ src: '<<widget "sydneyOptionsTalk">>', applyafter: '\n\t<<deadwood-reblooms-property-invitation-menu>>', expected: 1 }],
      'Widgets Robin': [
        // 只扩展原版普通交谈菜单，覆盖初次进房和游戏、拥抱等互动后的返回。
        {
          src: '<<robinbully>>',
          applybefore: "<<deadwood-reblooms-property-invitation-link 'Robin' 'Deadwood Reblooms Property Invite Robin'>>\n\t\t",
          expected: 1
        }
      ],
      'Widgets Wardrobe': [
        {
          src: '<<case "Farm Wardrobe">>',
          applybefore: '<<case "Deadwood Reblooms Property Wardrobe" "Deadwood Reblooms Company Suite Storage">>\n\t\t\t<<deadwood-reblooms-property-wardrobe-exit>>\n\t\t',
          expected: 1
        }
      ]
    }
  });
}
