// ./src/script/Whitney.ts

export default function (maplebirch: typeof window.maplebirch): void {
  maplebirch.tool.addTo(
    'BeforeLinkZone',
    { widget: 'deadwood-whitney-aftercare-link', passage: 'School Front Courtyard' },
    { widget: 'deadwood-whitney-pier-link', passage: 'Docks' },
    { widget: 'deadwood-whitney-flats-link', passage: 'Whitney Home Knock' },
    { widget: 'deadwood-whitney-music-link', passage: 'Whitney Chat' }
  );
  // 原版开锁选项按巧手显示，最后一个链接始终是返回牢房。
  maplebirch.tool.addTo('CustomLinkZone', { widget: [-1, 'deadwood-whitney-cell-link'], passage: 'Underground Cell Lock' });

  maplebirch.tool.inject({
    widgetPassage: {
      'Widgets Underground': [
        // 原版只看恋爱标记。惠特尼仍被关着时，PC 独自逃脱不应触发她在学校迎接 PC。
        {
          srcmatch: /<<if \$whitneyromance is 1(?=(?: and [^>]+)?>>)/,
          applyafter: ' and C.npc.Whitney.state isnot "dungeon"',
          expected: 1
        }
      ]
    }
  });
}
