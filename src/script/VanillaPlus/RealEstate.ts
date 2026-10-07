// ./src/script/VanillaPlus/RealEstate.ts

export default function RealEstate(maplebirch: typeof window.maplebirch): void {
  const realEstate = maplebirch.get('VanillaPlus')!.realEstate;
  for (const property of realEstate.properties) {
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
          rainSplashEnabled: true,
          fogEnabled: true,
          groundBounds: { splashes: { top: 4, bottom: 0 }, fog: { top: 19, bottom: 0 } }
        }
      },
      { overwrite: true }
    );
  }
  maplebirch.tool.patch.location.configure('deadwood_home', {
    // current 沿用产权、出租和冻结判断，并在切换存档后读取当前房屋。
    customMapping: () => {
      const property = V.VanillaPlus?.real_estate ? realEstate.current : undefined;
      return property ? `deadwood_home_${property.id}` : 'home';
    }
  });

  maplebirch.tool.addTo('BeforeLinkZone', { widget: 'deadwood-reblooms-property-furnishings-link', passage: 'Furniture Shop' });
  // 这些原版 Passage 能与 NPC 当面交谈。课堂入口还需由原版出勤状态与考试阶段筛选。
  maplebirch.tool.addTo(
    'BeforeLinkZone',
    { widget: "deadwood-reblooms-property-invitation-link 'Robin' 'Deadwood Reblooms Property Invite Robin'", passage: 'Robin Options' },
    { widget: "deadwood-reblooms-property-invitation-link 'Whitney' 'Deadwood Reblooms Property Invite Whitney'", passage: 'Whitney Home Enter' },
    { widget: "deadwood-reblooms-property-invitation-link 'Kylar' 'Deadwood Reblooms Property Invite Kylar'", passage: 'Kylar Library' },
    { widget: "deadwood-reblooms-property-invitation-link 'Kylar' 'Deadwood Reblooms Property Invite Kylar Courtyard'", passage: 'Kylar Courtyard' },
    { widget: "deadwood-reblooms-property-invitation-link 'Kylar' 'Deadwood Reblooms Property Invite Kylar Park'", passage: 'Kylar Park' },
    { widget: "deadwood-reblooms-property-invitation-link 'Sydney' 'Deadwood Reblooms Property Invite Sydney'", passage: 'Temple Sydney' },
    { widget: "deadwood-reblooms-property-invitation-link 'Sydney' 'Deadwood Reblooms Property Invite Sydney Library'", passage: 'Library Rental Counter' },
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
            '<<elseif _robin_location is "sleep" and maplebirch.get("VanillaPlus").realEstate.residenceOf("Robin")>>\n' +
            '\t<<lanSwitch "Robin\'s room is empty. A note says Robin has gone home to you." "罗宾的房间空着。门上的纸条写着，罗宾今晚回你们的住处。">><br><br>\n' +
            '\t<<main_hall_icon>><<link [[Main hall (0:01)|Orphanage]]>><<pass 1>><</link>><br>\n',
          expected: 1
        }
      ],
      'Whitney Home Knock': [
        {
          src: '<<elseif Time.dayState is "dawn">>',
          applybefore:
            '<<elseif maplebirch.get("VanillaPlus").realEstate.residenceOf("Whitney")>>\n' +
            '\t<<lanSwitch "Whitney has moved in with you. The flat is quiet behind the door." "惠特尼已经搬去与你同住。房门后静悄悄的。">><br><br>\n' +
            '\t<<getouticon>><<link [[Leave (0:02)|Barb Street]]>><<pass 2>><</link>><br>\n',
          expected: 1
        }
      ]
    },
    widgetPassage: {
      'Widgets Wardrobe': [
        {
          src: '<<case "Farm Wardrobe">>',
          applybefore: '<<case "Deadwood Reblooms Property Wardrobe">>\n\t\t\t<<deadwood-reblooms-property-wardrobe-exit>>\n\t\t',
          expected: 1
        }
      ]
    }
  });
}
