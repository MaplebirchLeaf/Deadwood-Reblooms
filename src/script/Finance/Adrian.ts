// ./src/script/Finance/Adrian.ts

import AdrianPortrait from '../NamedNPCSidebarPortrait/Adrian';

export default function Adrian(maplebirch: typeof window.maplebirch): void {
  maplebirch.npc.add(
    {
      nam: 'Adrian',
      adult: 1,
      teen: 0,
      age: 28,
      title: 'bank clerk',
      description: 'bank clerk',
      hairColour: 'brown',
      eyeColour: 'grey',
      hair_side_type: 'sleek',
      hair_fringe_type: 'thin flaps',
      hair_sides_length: 200,
      hair_fringe_length: 200
    },
    { love: { maxValue: 50 }, loveAlias: ['Familiarity', '熟悉'], rage: { name: 'Displeasure', maxValue: 30 }, loveInterest: false },
    {
      Adrian: { EN: 'Adrian', CN: '阿德里安' },
      Displeasure: { EN: 'Displeasure', CN: '不满' },
      'bank clerk': { EN: 'bank clerk', CN: '银行职员' },
      'senior bank clerk': { EN: 'senior clerk', CN: '资深柜员' },
      'bank manager': { EN: 'bank manager', CN: '银行经理' }
    }
  );

  maplebirch.tool.addTo('NPCinit', 'deadwood-adrian-introduction');

  maplebirch.npc.addSchedule('Adrian', schedule => {
    schedule.at(0, 'adrian_home');
    schedule.when(
      date => date.weekDay >= 2 && date.weekDay <= 6 && date.hour >= 9 && date.hour < 17,
      date => {
        if (date.hour === 11) return 'financial_centre_property';
        if (date.hour === 12) return 'financial_centre_break';
        if (date.hour === 15) return 'financial_centre_securities';
        return 'financial_centre';
      }
    );
  });

  maplebirch.tool.addTo(
    'CustomLinkZone',
    {
      widget: [-1, 'deadwood-reblooms-adrian-counter-link'],
      passage: [
        'Deadwood Reblooms Financial Centre Bank',
        'Deadwood Reblooms Property Office',
        'Deadwood Reblooms Financial Centre Securities',
        'Deadwood Reblooms Financial Centre Securities Account',
        'Deadwood Reblooms Financial Centre Securities Trading',
        'Deadwood Reblooms Financial Centre Margin',
        'Deadwood Reblooms Business Loan',
        'Deadwood Reblooms Shop Investment',
        'Deadwood Reblooms Property Manager',
        'Deadwood Reblooms Property Collateral'
      ]
    },
    { widget: [-1, 'deadwood-reblooms-adrian-break-link'], passage: 'Deadwood Reblooms Financial Centre' }
  );

  AdrianPortrait(maplebirch);
  // 财务系统只接收优惠比例，不认识人物或剧情阶段。
  maplebirch.get('Finance')!.loanDiscount = () => {
    const { adrian, bank, collection } = V.Finance;
    return adrian.career === 5 && bank.credit_missed_payments === 0 && bank.loan_missed_payments === 0 && collection.amount === 0 ? 0.1 : 0;
  };
}
