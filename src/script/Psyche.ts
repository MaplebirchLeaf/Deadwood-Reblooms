/** 遭遇与噩梦沿用原版结算，完整休息与药柜复用原有入口。 */
export default function Psyche(maplebirch: typeof window.maplebirch): void {
  const psyche = maplebirch.get('Psyche');
  if (!psyche) return;
  const { macro } = maplebirch.tool;
  // 与原版相同，重复符号只表示提示幅度，不承担属性结算。
  for (const stat of ['sanity', 'fear'] as const) {
    for (const amount of [-3, -2, -1, 1, 2, 3]) {
      macro.create(`${(amount < 0 ? 'l' : 'g').repeat(Math.abs(amount))}${stat}`, (show = true) =>
        macro.statChange(
          stat === 'sanity' ? lanSwitch('Sanity', '理智') : lanSwitch('Fear', '恐惧'),
          amount,
          amount > 0 === (stat === 'sanity') ? 'green' : 'red',
          () => psyche.active && Boolean(show)
        )
      );
    }
  }
  maplebirch.tool.addTo('DegreesBox', 'psyche-attribute');
  maplebirch.tool.addTo('DegreesBonusDisplay', 'psyche-willpower');
  maplebirch.tool.addTo('StatusBar', 'psyche-status');
  maplebirch.tool.addTo('MobileStats', 'psyche-mobile-status');
  maplebirch.tool.addTo('Statistics', 'psyche-statistics');
  maplebirch.tool.addTo('Journal', 'psyche-journal');
  maplebirch.once(':storyready', () => {
    for (const pill of setup.pills) {
      if (!['harper', 'asylum'].includes(pill.type)) continue;
      pill.effects.push(`<<run maplebirch.get("Psyche")?.change(0, ${pill.type === 'asylum' ? -200 : -100})>>`);
    }
  });
  const passages = [
    'Bedroom',
    'Temple',
    'Temple Garden',
    'School Library',
    'Park',
    'High Street',
    'Wolf Street',
    'Harvest Street',
    'Residential Alleyways',
    'Lake Shore',
    'Pirate Deck',
    'Deadwood Reblooms Property Home'
  ];
  // 原版地点与强制事件先执行，玩家可在正常行动菜单中停下来平复恐惧。
  maplebirch.tool.addTo('BeforeLinkZone', { widget: 'psyche-calm', passage: passages });
  maplebirch.tool.inject({
    widgetPassage: {
      Widgets: [
        {
          // 在四科与分支版本完成原有学习修正后，只缩放正收益一次。
          src: '<<set V[$_subject + "_exam"] to Math.clamp(',
          applybefore: '<<if $_gain gt 0>><<set $_gain *= maplebirch.get("Psyche")?.learning ?? 1>><</if>>',
          expected: 1
        }
      ],
      'Widgets Sleep': [
        {
          // 只有完整睡过一小时才恢复，保留中途惊醒与噩梦结算。
          src: '<<set Weather.BodyTemperature.addActivity("sleep")>>',
          applyafter: '<<run maplebirch.get("Psyche")?.rest(1, -80)>>',
          expected: 1
        },
        { src: '<<set $wraith.nightmare to 2>>', applyafter: '<<run maplebirch.get("Psyche")?.change(-30, 200)>>', expected: 1 }
      ],
      'Widgets Temple': [
        {
          // 只在原版救赎祈祷的一小时实际结束后结算，独自或与悉尼祈祷共用。
          src: '<<pass 60>><<set $phase to 2>>',
          applyafter: '<<run maplebirch.get("Psyche")?.rest(10, -100)>>',
          expected: 1
        }
      ],
      'Widgets Nightmares': [
        {
          // 现实状态恢复后只结算一次醒后的余悸，梦中演绎不会改动现实理智。
          src: '<<unset $activeNightmare>>',
          applyafter: '<<run maplebirch.get("Psyche")?.change(-10, 120)>>',
          expected: 1
        }
      ],
      'Widgets End Combat': [
        {
          // 沿用本场实际创伤记录，清理战斗前结算一次余悸，不影响原版治疗与特质。
          src: '<<unset $enemytype>>',
          applybefore: '<<psyche-combat-end>>',
          expected: 1
        }
      ]
    },
    locationPassage: {
      'Orphanage Loft Reading Nook': [
        {
          // 沿用原版每日阅读角次数和二十分钟耗时，手工的原版治疗仍独立结算。
          src: '<<set $phase to "write">><<pass 20>>',
          applyafter: '<<run maplebirch.get("Psyche")?.rest(5, -60)>>',
          expected: 1
        }
      ]
    }
  });
}
