export default function (maplebirch: typeof window.maplebirch) {
  // 床铺后的可见链接索引通常为 1，打扫选项出现时移到 2，两处只显示其一。
  maplebirch.tool.addTo(
    'CustomLinkZone',
    { widget: [1, 'deadwood-reblooms-sydney-dorm-link 1'], passage: 'Temple Quarters' },
    { widget: [2, 'deadwood-reblooms-sydney-dorm-link 2'], passage: 'Temple Quarters' }
  );
  maplebirch.tool.addTo('AfterLinkZone', { widget: 'deadwood-reblooms-sydney-dorm-sirris-link', passage: 'Temple Quarters' });
}
