// ./src/script/Transport.ts

import Catalog from '../module/Transport/Catalog';

export default function Transport(maplebirch: typeof window.maplebirch): void {
  maplebirch.tool.addTo('Footer', {
    widget: "dynamic 'deadwood-transport-entry' 'deadwood-transport-entry'",
    passage: [...Catalog.routes, ...Catalog.roads].map(route => route.passage).concat('Forest', 'Moor', 'Shopping Centre')
  });
  maplebirch.tool.addTo('BeforeLinkZone', { widget: 'deadwood-transport-places', passage: ['Harvest Street', 'Elk Street', 'Shopping Centre'] });
  maplebirch.tool.addTo('CustomLinkZone', { widget: [1, 'deadwood-transport-places 1'], passage: 'Harvest Street' });
  maplebirch.tool.addTo('Header', { widget: 'deadwood-transport-header', match: /^Deadwood Transport (?:Menu|Travel)$/ });
  maplebirch.tool.addTo('SkillsBox', 'deadwood-transport-skill');
  maplebirch.tool.addTo('Journal', 'deadwood-transport-journal');
}
