/** 遭遇与噩梦沿用原版结算，完整休息与药柜复用原有入口。 */
export default function Psyche(maplebirch: typeof window.maplebirch): void {
  const psyche = maplebirch.get('Psyche');
  const { macro } = maplebirch.tool;
  macro.define('sanity', (amount: number = 0) => psyche?.change(amount));
  for (const [name, direction] of [
    ['dread', 1],
    ['fascination', -1]
  ] as const) {
    macro.define(name, (amount: number = 0) => {
      if (amount > 0) psyche?.change(0, amount * direction);
      else if (amount < 0 && psyche?.active && psyche.state.mood * direction > 0) psyche.rest(0, amount);
    });
  }
  macro.define('psyche-rest', (sanity: number = 0, relief: number = 0) => psyche?.rest(sanity, -relief));
  // 与原版相同，重复符号只表示提示幅度，不承担属性结算。
  for (const stat of ['sanity', 'dread', 'fascination'] as const) {
    for (const amount of [-3, -2, -1, 1, 2, 3]) {
      macro.create(`${(amount < 0 ? 'l' : 'g').repeat(Math.abs(amount))}${stat}`, (show = true) =>
        macro.statChange(
          stat === 'sanity' ? lanSwitch('Sanity', '理智') : stat === 'dread' ? lanSwitch('Dread', '恐惧') : lanSwitch('Fascination', '入迷'),
          amount,
          amount > 0 === (stat === 'sanity') ? 'green' : 'red',
          () => !!psyche?.active && Boolean(show)
        )
      );
    }
  }
  if (!psyche) return;
  maplebirch.tool.addTo('DegreesBox', 'psyche-attribute');
  maplebirch.tool.addTo('DegreesBonusDisplay', 'psyche-willpower');
  maplebirch.tool.addTo('SubjectBoxBonusDisplay', 'psyche-subjects');
  maplebirch.tool.addTo('SkillsBonusDisplay', 'psyche-skills');
  maplebirch.tool.addTo('StatusBar', 'psyche-status');
  maplebirch.tool.addTo('MobileStats', 'psyche-mobile-status');
  maplebirch.tool.addTo('Statistics', 'psyche-statistics');
  maplebirch.tool.addTo('Journal', 'psyche-journal');
  maplebirch.once(':storyready', () => {
    for (const pill of setup.pills) {
      if (!['harper', 'asylum'].includes(pill.type)) continue;
      pill.effects.push(`<<psyche-rest 0 ${pill.type === 'asylum' ? 200 : 100}>>`);
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
          applyafter: '<<psyche-sleep>>',
          expected: 1
        },
        { src: '<<set $wraith.nightmare to 2>>', applyafter: '<<dread 200>><<sanity -30>>', expected: 1 }
      ],
      'Widgets Temple': [
        {
          // 只在原版救赎祈祷的一小时实际结束后结算，独自或与悉尼祈祷共用。
          src: '<<pass 60>><<set $phase to 2>>',
          applyafter: '<<psyche-rest 10 100>>',
          expected: 1
        }
      ],
      'Widgets Nightmares': [
        {
          // 现实状态恢复后只结算一次余悸，普通噩梦不扣超自然理智。
          src: '<<unset $activeNightmare>>',
          applyafter: '<<dread `maplebirch.get("LostLamb")?.reward ? 90 : 120`>>',
          expected: 1
        }
      ],
      'Widgets Wraith': [
        {
          // 沿用原版猎杀从零开始的结算点，伊甸的警告在 Twee 中排除。
          srcmatch: /<<set \$wraith.hunt to 1>>/g,
          applybefore: '<<psyche-wraith _args[0]>>',
          expected: 5
        },
        {
          // 在原版清零前读取旧追猎状态，重复清理不再平复。
          src: '<<widget "clearWraith">>',
          applyafter: '<<psyche-wraith "clear">>',
          expected: 1
        }
      ]
    },
    locationPassage: {
      'Tentacle Plains': [
        {
          // 红光的原版一次性选择先结算入迷，喷雾容量、补充与次数标记保持原顺序。
          srcmatch: /(<<link \[\[[^\]]+\|Tentacle Plains Spray\]\]>>)(<<set \$spraymax \+= 1>><<set \$tentspray to 1>><<spray 5>>)(<<\/link>><<gspraymax>>)/,
          to: '$1<<psyche-redlight>>$2$3<<gfascination>>',
          expected: 1
        }
      ],
      'Asylum Depths Mirror 4 Willpower': [
        {
          // 沿用原版意志结果与选择文字，在离开清醒结局时结算。
          srcmatch: /<<link \[\[[^|]+\|Asylum Depths Mirror 4 3\]\]>><<endevent>><<\/link>>/,
          to: '<<lanLink ["Next", "继续"] "Asylum Depths Mirror 4 3">><<psyche-mirror>><<endevent>><</lanLink>><<if maplebirch.get("Psyche")?.active and !$Psyche.mirror>><<if $Psyche.sanity lt 1000>><<gsanity>><</if>><<ggdread>><</if>>',
          expected: 1
        }
      ],
      'Asylum Depths Mirror 4 Dance': [
        {
          srcmatch: /<<link \[\[[^|]+\|Asylum Depths Mirror 4 3\]\]>><<endevent>><<\/link>>/,
          to: '<<lanLink ["Next", "继续"] "Asylum Depths Mirror 4 3">><<psyche-mirror>><<endevent>><</lanLink>><<if maplebirch.get("Psyche")?.active and !$Psyche.mirror>><<lsanity>><<ggfascination>><</if>>',
          expected: 1
        }
      ],
      'Gwylan Hypnosis Insight Wake': [
        {
          // 共用洞察各条支线的实际完成入口，重绘与读档不触发恢复。
          srcmatch: /<<link \[\[[^|]+\|Gwylan Hypnosis End\]\]>><<endevent>><<\/link>>/,
          to: '<<lanLink ["Go back in the shop", "回商店里"] "Gwylan Hypnosis End">><<psyche-insight>><<endevent>><</lanLink>><<if maplebirch.get("Psyche")?.active and $Psyche.insight isnot Time.date.timeStamp>><<if $Psyche.mood gt 0>><<llldread>><<elseif $Psyche.mood lt 0>><<lllfascination>><</if>><</if>>',
          expected: 1
        }
      ],
      'Orphanage Loft Reading Nook': [
        {
          // 沿用原版每日阅读角次数和二十分钟耗时，手工的原版治疗仍独立结算。
          src: '<<set $phase to "write">><<pass 20>>',
          applyafter: '<<psyche-rest 5 60>>',
          expected: 1
        }
      ]
    }
  });
}
