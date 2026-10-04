// ./src/script/LifeSimulation/Casino/Marlow.ts

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
    { love: { maxValue: 30 }, loveInterest: false },
    {
      Marlow: { EN: 'Marlow', CN: '马洛' },
      'card dealer': { EN: 'card dealer', CN: '荷官' }
    }
  );

  maplebirch.npc.addSchedule('Marlow', schedule => {
    schedule.at(0, 'marlow_home');
    schedule.when(date => date.hour >= 18 || date.hour < 4, 'deadwood_casino');
  });

  maplebirch.tool.onInit(() => {
    if (maplebirch.get('NPCSidebarPortrait')) {
      const wardrobe = maplebirch.npc.Clothes.wardrobe;
      wardrobe.wear('Marlow', '*', 'business_suit_male', () => C.npc.Marlow?.gender === 'm');
      wardrobe.wear('Marlow', '*', 'business_suit_female', () => C.npc.Marlow?.gender !== 'm');
      wardrobe.modify('Marlow', clothes => {
        for (const slot of ['upper', 'lower'] as const) if (clothes[slot]) clothes[slot].colour = 'black';
      });
    }
    maplebirch.get('MoreLoveInterestsAndNPCAvatars')?.add('Marlow', {
      folder: 'marlow',
      states: { default: 'default' },
      stateResolver: npc => {
        const working = maplebirch.get('LifeSimulation')?.casino.state.work_scenario;
        const state = working != null ? 'working' : 'default';
        return `${npc.skincolour === 'black' ? 'dark-' : ''}${state}`;
      }
    });
  });
}
