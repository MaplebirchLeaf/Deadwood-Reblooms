// ./src/script/Sydney/Baths.ts

export default function Baths(maplebirch: typeof window.maplebirch): void {
  maplebirch.tool.addTo('BeforeLinkZone', {
    widget: 'deadwood-reblooms-sydney-temple-shower-link',
    passage: 'Temple Cloister Showers'
  });
}
