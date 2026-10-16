// ./src/script/Finance/Company.ts

import CompanyAvery from './CompanyAvery';
import CompanyAscension from './CompanyAscension';

export default function Company(maplebirch: typeof window.maplebirch): void {
  CompanyAvery(maplebirch);
  CompanyAscension(maplebirch);
  maplebirch.tool.addTo(
    'CustomLinkZone',
    { widget: [-1, 'deadwood-company-registration-link'], passage: 'Town Hall Wait' },
    { widget: [-1, 'deadwood-company-office-link'], passage: 'Office Lobby' },
    { widget: [-1, 'deadwood-shareholder-lobby-link'], passage: 'Office Lobby' }
  );
  maplebirch.tool.addTo('Journal', 'deadwood-company-journal');
  maplebirch.tool.patch.traits.add(
    {
      title: 'NPC Traits',
      name: () => maplebirch.t('deadwood-reblooms:finance:trait:partner:name'),
      colour: 'gold',
      has: () => !!V.Finance?.company && maplebirch.get('Finance')!.company.partner,
      text: () => maplebirch.t('deadwood-reblooms:finance:trait:partner:text')
    },
    {
      title: 'NPC Traits',
      name: () => maplebirch.t(`deadwood-reblooms:finance:trait:${maplebirch.get('Finance')!.company.shareholders.controller ? 'controller' : 'board'}:name`),
      colour: () => (maplebirch.get('Finance')!.company.shareholders.controller ? 'green' : 'teal'),
      has: () => !!V.Finance?.company && (maplebirch.get('Finance')!.company.shareholders.controller || maplebirch.get('Finance')!.company.shareholders.director),
      text: () => maplebirch.t(`deadwood-reblooms:finance:trait:${maplebirch.get('Finance')!.company.shareholders.controller ? 'controller' : 'board'}:text`)
    }
  );
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
