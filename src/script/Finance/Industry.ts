// ./src/script/Finance/Industry.ts

import RowanPortrait from '../NamedNPCSidebarPortrait/Rowan';

export default function Industry(maplebirch: typeof window.maplebirch): void {
  maplebirch.tool.inject({
    locationPassage: {
      'Elk Street': [
        {
          src: '<<if $trash_unlocked is 1>>',
          applybefore: '<<deadwood-industry-street>>\n\t\t',
          expected: 1
        }
      ]
    }
  });
  maplebirch.tool.addTo('Journal', 'deadwood-industry-journal');
  maplebirch.tool.addTo('BeforeLinkZone', {
    widget: 'deadwood-laboratory-contact',
    passage: ['Riding School', "Doctor Harper's Office Exam"]
  });
  maplebirch.tool.addTo('CustomLinkZone', {
    widget: [-1, 'deadwood-laboratory-contact'],
    passage: ['Farm Still', 'Adult Shop Approach Sirris', 'Adult Shop Approach Sydney']
  });
  maplebirch.npc.add(
    {
      nam: 'Rowan',
      adult: 1,
      teen: 0,
      age: 42,
      title: 'factory supervisor',
      description: 'factory supervisor',
      hairColour: 'auburn',
      eyeColour: 'brown',
      hair_side_type: 'short',
      hair_fringe_type: 'messy',
      hair_sides_length: 80,
      hair_fringe_length: 80
    },
    { love: { maxValue: 50 }, loveAlias: ['Trust', '信任'], loveInterest: false },
    { Rowan: { EN: 'Rowan', CN: '罗文' }, 'factory supervisor': { EN: 'factory supervisor', CN: '工厂领班' } }
  );
  maplebirch.tool.addTo('NPCinit', 'deadwood-rowan-introduction');

  maplebirch.npc.addSchedule('Rowan', schedule => {
    schedule.at(0, 'rowan_home');
    schedule.when(date => date.hour >= 8 && date.hour < 18, 'deadwood_factory');
  });
  RowanPortrait(maplebirch);
}
