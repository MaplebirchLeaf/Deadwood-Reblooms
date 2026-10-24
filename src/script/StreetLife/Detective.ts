// ./src/script/StreetLife/Detective.ts

import GrantPortrait from '../NamedNPCSidebarPortrait/Grant';

/** 格兰特只负责案件合作，通缉、判刑与减刑仍使用原版警方规则。 */
export default function Detective(maplebirch: typeof window.maplebirch): void {
  maplebirch.npc.add(
    {
      nam: 'Grant',
      fullDescription: 'Grant',
      adult: 1,
      teen: 0,
      age: 39,
      title: 'detective',
      description: 'detective',
      hairColour: 'black',
      eyeColour: 'hazel',
      hair_side_type: 'sleek',
      hair_fringe_type: 'thin flaps',
      hair_sides_length: 100,
      hair_fringe_length: 50
    },
    { love: { maxValue: 100 }, loveAlias: ['Trust', '信任'], loveInterest: false },
    { Grant: { EN: 'Grant', CN: '格兰特' }, detective: { EN: 'detective', CN: '警探' } }
  );

  maplebirch.tool.addTo('NPCinit', 'deadwood-grant-introduction');
  maplebirch.npc.addSchedule('Grant', schedule => {
    schedule.at(0, 'grant_home');
    schedule.when(date => date.hour >= 8 && date.hour < 18, 'police_station');
  });
  GrantPortrait(maplebirch);
}
