// ./src/script/Finance/CompanySuite.ts

export default function CompanySuite(maplebirch: typeof window.maplebirch): void {
  maplebirch.tool.addTo('CustomLinkZone', { widget: [-1, 'deadwood-company-suite-link'], passage: 'Office Lobby' });
  maplebirch.tool.addTo('Journal', 'deadwood-company-suite-journal');
}
