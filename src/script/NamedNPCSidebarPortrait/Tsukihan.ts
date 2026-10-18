// ./src/script/NamedNPCSidebarPortrait/Tsukihan.ts

import { register } from './NPCOutfitSets/Clothes';

export default function TsukihanPortrait(maplebirch: typeof window.maplebirch): void {
  maplebirch.tool.onInit(() => {
    const wardrobe = maplebirch.npc.Clothes.wardrobe;
    const robe = wardrobe.get('kimono')!;
    robe.upper!.colour = 'white';
    robe.upper!.accessory_colour = 'red';
    robe.lower!.colour = 'red';
    wardrobe.put(robe, 'ivory_robe', 'legs');
    robe.legs!.colour = 'white';
    wardrobe.set('tsukihan_robe', robe);
    wardrobe.base('Tsukihan', clothes => wardrobe.put(clothes, C.npc.Tsukihan?.gender === 'm' ? 'male_underwear' : 'female_underwear'));
    wardrobe.wear('Tsukihan', '*', 'tsukihan_robe');
    wardrobe.wear('Tsukihan', 'raven_shrine_house', 'pyjama', () => Time.hour >= 22 || Time.hour < 7);

    maplebirch.get('MoreLoveInterestsAndNPCAvatars')?.add('Tsukihan', {
      folder: 'tsukihan',
      states: { default: 'default' },
      stateResolver: () => 'default'
    });
  });

  register(maplebirch, 'Tsukihan', ['tsukihan_robe', 'pyjama']);
}
