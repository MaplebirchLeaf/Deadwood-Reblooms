// ./src/script/Sydney/Work.ts

export default function (maplebirch: typeof window.maplebirch): void {
  // 花园同行入口紧跟原版干活；宿舍同行选项放在普通杂务选项之前。
  maplebirch.tool.addTo('CustomLinkZone', {
    widget: [1, 'deadwood-reblooms-sydney-garden-work-link'],
    passage: 'Temple Garden'
  });
  maplebirch.tool.addTo('BeforeLinkZone', { widget: 'deadwood-reblooms-sydney-quarters-work-link', passage: 'Temple Quarters' });
  // 只在神殿普通离开选项前补充悉尼入口，强制剧情不经过这个锚点。
  maplebirch.tool.inject({
    locationPassage: {
      Temple: [
        {
          srcmatch: /<<wolficon>>(?=\s*<<link\s+\[\[[^\]\r\n]*\|Wolf Street\]\]>>)/,
          applybefore: '<<deadwood-reblooms-sydney-science-late-intro>><<deadwood-reblooms-sydney-trial-talk-link>><<deadwood-reblooms-sydney-christmas-link>>\n\t',
          expected: 1
        }
      ]
    }
  });
}
