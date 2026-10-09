// ./src/script/Finance/CompanyAscension.ts

export default function CompanyAscension(maplebirch: typeof window.maplebirch): void {
  maplebirch.tool.addTo(
    'BeforeLinkZone',
    { widget: 'deadwood-ascension-proposal-link', passage: 'Skyscraper Party 11' },
    { widget: 'deadwood-ascension-dream', passage: 'Skyscraper Dream 4' },
    { widget: 'deadwood-ascension-awakening', passage: 'Skyscraper Ascend' },
    { widget: 'deadwood-ascension-gwylan', passage: 'Gwylan Talk Struggles Lust' }
  );
  maplebirch.tool.addTo('CustomLinkZone', { widget: [-1, 'deadwood-ascension-audience-link'], passage: 'Office Lobby' }, { widget: [-1, 'deadwood-ascension-jordan-link'], passage: 'Temple Jordan' });
  maplebirch.tool.addTo('Journal', 'deadwood-ascension-journal');
  maplebirch.tool.patch.traits.add({
    title: 'Special Traits',
    name: () => maplebirch.t('deadwood-reblooms:finance:trait:ascended:name'),
    colour: 'purple',
    has: () => !!V.Finance?.company && maplebirch.get('Finance')!.company.ascension.active,
    text: () => maplebirch.t('deadwood-reblooms:finance:trait:ascended:text')
  });
}
