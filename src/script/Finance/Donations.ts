// ./src/script/Finance/Donations.ts

export default function Donations(maplebirch: typeof window.maplebirch): void {
  maplebirch.tool.addTo('CustomLinkZone', { widget: [-1, 'deadwood-finance-donations-link'], passage: 'Town Hall Wait' });
}
