// ./src/script/LifeSimulation/Casino/Marlow.ts

import MarlowPortrait from '../../NamedNPCSidebarPortrait/Marlow';

export default function Marlow(maplebirch: typeof window.maplebirch): void {
  maplebirch.npc.add(
    {
      nam: 'Marlow',
      adult: 1,
      teen: 0,
      age: 36,
      title: 'card dealer',
      description: 'card dealer',
      hairColour: 'black',
      eyeColour: 'grey',
      hair_side_type: 'sleek',
      hair_fringe_type: 'thin flaps',
      hair_sides_length: 100,
      hair_fringe_length: 50
    },
    { love: { maxValue: 30 }, loveAlias: ['Trust', '信任'], rage: { name: 'Wariness', maxValue: 30 }, loveInterest: false },
    {
      Marlow: { EN: 'Marlow', CN: '马洛' },
      Wariness: { EN: 'Wariness', CN: '戒备' },
      'card dealer': { EN: 'card dealer', CN: '荷官' }
    }
  );

  maplebirch.tool.addTo('NPCinit', 'deadwood-marlow-introduction');

  maplebirch.npc.addSchedule('Marlow', schedule => {
    schedule.at(0, 'marlow_home');
    schedule.when(date => date.hour >= 18 || date.hour < 4, 'deadwood_casino');
  });

  MarlowPortrait(maplebirch);
}
