export default function (maplebirch: typeof window.maplebirch): void {
  // 花园同行入口紧跟原版干活，宿舍选项数量会变，所以放在原版选项之前。
  // 长椅谈话同样排在离开神殿之前，均不改写原版事件。
  maplebirch.tool.addTo('CustomLinkZone', {
    widget: [1, 'deadwood-reblooms-sydney-garden-work-link'],
    passage: 'Temple Garden'
  });
  maplebirch.tool.addTo(
    'BeforeLinkZone',
    { widget: 'deadwood-reblooms-sydney-quarters-work-link', passage: 'Temple Quarters' },
    { widget: 'deadwood-reblooms-sydney-trial-talk-link', passage: 'Temple' }
  );
}
