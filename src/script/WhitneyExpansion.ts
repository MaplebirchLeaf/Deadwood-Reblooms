export default function (maplebirch: typeof window.maplebirch): void {
  maplebirch.tool.onInit(() => {
    setup.feats['Deadwood Whitney Rescued'] ??= {
      get title() {
        return maplebirch.t('deadwood-reblooms:whitney:feat:rescued:name');
      },
      get desc() {
        return maplebirch.t('deadwood-reblooms:whitney:feat:rescued:text');
      },
      difficulty: 3,
      series: '',
      filter: ['All', 'Social']
    };
  });

  maplebirch.tool.inject({
    widgetPassage: {
      'Widgets Underground': [
        {
          // 原版只看恋爱标记。惠特尼仍被关着时，PC 独自逃脱不应触发她在学校迎接 PC。
          src: '<<if $whitneyromance is 1>>',
          to: '<<if $whitneyromance is 1 and C.npc.Whitney.state isnot "dungeon">>',
          expected: 1
        }
      ]
    },
    locationPassage: {
      'Underground Cell Lock': [
        {
          // 锚点在英中原版一致，保留原版的高巧手开锁与返回牢房选项。
          src: '<<set $undergroundbrothel.timepass to false>>',
          applybefore: '<<deadwood-whitney-cell-link>>\n',
          expected: 1
        }
      ],
      'School Front Courtyard': [
        {
          // 作为正常庭院事件的一个分支，不在学校的强制事件或危险状态叠加链接。
          src: '<<elseif $adultshopintro is undefined and $adultshopunlocked is undefined and $adultshopintrosirris is undefined and $schoolstate is "afternoon" and Time.weekDay is 6 and $exposed lte 0>>',
          applybefore: `<<elseif $WhitneyExpansion?.rescued and !$WhitneyExpansion.reunionSeen and C.npc.Whitney.state is "active" and Time.schoolDay and !["early", "late", "earlynoschool", "latenoschool", "daynoschool"].includes($schoolstate) and Time.hour gte 7 and Time.hour lt 18 and $exposed lte 0>>
  <<deadwood-whitney-reunion-intro>>
`,
          expected: 1
        }
      ]
    }
  });
}
