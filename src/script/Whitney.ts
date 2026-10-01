export default function (maplebirch: typeof window.maplebirch): void {
  maplebirch.tool.addTo('BeforeLinkZone', {
    widget: 'deadwood-whitney-aftercare-link',
    passage: 'School Front Courtyard'
  });
  maplebirch.tool.addTo('BeforeLinkZone', {
    widget: 'deadwood-whitney-pier-link',
    passage: 'Docks'
  });
  maplebirch.tool.addTo('BeforeLinkZone', {
    widget: 'deadwood-whitney-flats-link',
    passage: 'Whitney Home Knock'
  });
  maplebirch.tool.addTo('BeforeLinkZone', {
    widget: 'deadwood-whitney-music-link',
    passage: 'Whitney Chat'
  });
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
          srcmatch: /<<if \$whitneyromance is 1(?=(?: and [^>]+)?>>)/,
          applyafter: ' and C.npc.Whitney.state isnot "dungeon"',
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
      ]
    }
  });
}
