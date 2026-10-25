// ./src/script/Whitney.ts

export default function (maplebirch: typeof window.maplebirch): void {
  maplebirch.tool.addTo(
    'BeforeLinkZone',
    { widget: 'deadwood-whitney-pier-link', passage: 'Docks' },
    { widget: 'deadwood-whitney-flats-link', passage: 'Whitney Home Knock' },
    { widget: 'deadwood-whitney-school-link', passage: 'School Rear Courtyard' }
  );
  // 原版开锁选项按巧手显示，最后一个链接始终是返回牢房。
  maplebirch.tool.addTo('CustomLinkZone', { widget: [-1, 'deadwood-whitney-cell-link'], passage: 'Underground Cell Lock' });

  maplebirch.tool.inject({
    locationPassage: {
      // 只接在公寓闲聊的普通菜单前，项链事件仍必须先处理。
      'Whitney Chat': [{ srcmatch: /<<\/switch>>\s*(?:<br\s*\/?>\s*){2}(?=<<whitney[Oo]ptions>>\s*<<else>>)/, applyafter: '\n\t<<deadwood-whitney-music-link>>\n', expected: 1 }],
      'School Front Courtyard': [{ src: '<<schoolicon "courtyard">>', applybefore: '<<deadwood-whitney-aftercare-link>>\n\t\t\t', expected: 1 }]
    },
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
