// ./src/script/Sydney/SydneyDorm.ts

export default function (maplebirch: typeof window.maplebirch) {
  // 普通宿舍菜单的最后一项是下楼，不依赖打扫、床铺与找书选项的数量。
  maplebirch.tool.addTo(
    'CustomLinkZone',
    { widget: [-1, 'deadwood-reblooms-sydney-dorm-link'], passage: 'Temple Quarters' },
    { widget: [-1, 'deadwood-reblooms-sydney-dorm-sirris-link'], passage: 'Temple Quarters' }
  );
}
