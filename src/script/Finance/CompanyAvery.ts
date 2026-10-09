// ./src/script/Finance/CompanyAvery.ts

export default function CompanyAvery(maplebirch: typeof window.maplebirch): void {
  maplebirch.tool.addTo(
    'BeforeLinkZone',
    { widget: 'deadwood-avery-site-link', passage: 'Skyscraper' },
    { widget: 'deadwood-avery-ceremony-link', passage: 'Skyscraper Party 11' },
    { widget: 'deadwood-avery-dinner-link', passage: ['Avery Date Order', 'Avery Date Cheap', 'Avery Date Expensive'] }
  );
  maplebirch.tool.addTo('Journal', 'deadwood-avery-journal');
}
