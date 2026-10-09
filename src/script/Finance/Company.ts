// ./src/script/Finance/Company.ts

import CompanyAvery from './CompanyAvery';
import CompanySuite from './CompanySuite';
import CompanyAscension from './CompanyAscension';

export default function Company(maplebirch: typeof window.maplebirch): void {
  CompanyAvery(maplebirch);
  CompanySuite(maplebirch);
  CompanyAscension(maplebirch);
  maplebirch.tool.addTo(
    'CustomLinkZone',
    { widget: [-1, 'deadwood-company-registration-link'], passage: 'Town Hall Wait' },
    { widget: [-1, 'deadwood-company-office-link'], passage: 'Office Lobby' },
    { widget: [-1, 'deadwood-shareholder-lobby-link'], passage: 'Office Lobby' }
  );
  maplebirch.tool.addTo('Journal', 'deadwood-company-journal');
  maplebirch.tool.patch.traits.add({
    title: 'Special Traits',
    name: () => maplebirch.t('deadwood-reblooms:finance:trait:partner:name'),
    colour: 'gold',
    has: () => !!V.Finance?.company && maplebirch.get('Finance')!.company.partner,
    text: () => maplebirch.t('deadwood-reblooms:finance:trait:partner:text')
  });
  maplebirch.tool.inject({
    widgetPassage: {
      Characteristics: [
        {
          src: '<<pcGender>>',
          applyafter: '<<deadwood-company-identity>>',
          expected: 1
        }
      ]
    }
  });
}
