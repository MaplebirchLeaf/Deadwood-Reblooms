// ./src/script/DarkfeatherShrine/Tsukihan.ts

import TsukihanPortrait from '../NamedNPCSidebarPortrait/Tsukihan';

export default function Tsukihan(maplebirch: typeof window.maplebirch): void {
  maplebirch.npc.add(
    {
      nam: 'Tsukihan',
      adult: 0,
      teen: 1,
      age: 19,
      title: 'shrine attendant',
      description: 'shrine attendant',
      hairColour: 'black',
      eyeColour: 'red',
      hair_side_type: 'neat',
      hair_fringe_type: 'middlepart',
      hair_sides_length: 600,
      hair_fringe_length: 200
    },
    {
      love: { maxValue: 100 },
      dom: { name: 'Wilfulness', maxValue: 100, activeIcon: 'img/ui/sym-wilfulness.png', inactiveIcon: 'img/ui/sym-wilfulness-empty.png', color: 'purple' },
      lust: { maxValue: 100 },
      important: true,
      loveInterest: true,
      romance: [() => C.npc.Tsukihan?.init === 1 && C.npc.Tsukihan.state === 'active']
    },
    {
      Tsukihan: { EN: 'Tsukihan', CN: '月羽' },
      Wilfulness: { EN: 'Wilfulness', CN: '任性' },
      'shrine attendant': { EN: 'shrine attendant', CN: '神社侍者' },
      'shrine maiden': { EN: 'shrine maiden', CN: '神社巫女' },
      'shrine priest': { EN: 'shrine priest', CN: '神社神官' }
    }
  );

  maplebirch.tool.addTo('NPCinit', 'deadwood-tsukihan-introduction');

  maplebirch.on(':npcInit', (name: string) => {
    if (name === 'Tsukihan') {
      C.npc.Tsukihan.dom = 10;
      C.npc.Tsukihan.lust = 0;
    }
  });

  maplebirch.on(':npcInject', (name: string) => {
    if (name !== 'Tsukihan') return;
    const npc = C.npc.Tsukihan;
    npc.title = npc.pronoun === 'm' ? 'shrine priest' : npc.pronoun === 'f' ? 'shrine maiden' : 'shrine attendant';
  });

  maplebirch.npc.addSchedule('Tsukihan', schedule => {
    schedule.at(0, 'raven_shrine_house');
    schedule.when(date => date.hour >= 9 && date.hour < 18, 'forest_raven_shrine');
  });

  TsukihanPortrait(maplebirch);
}
