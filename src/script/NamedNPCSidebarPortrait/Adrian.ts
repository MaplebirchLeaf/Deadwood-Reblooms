// ./src/script/NamedNPCSidebarPortrait/Adrian.ts

import { register } from './NPCOutfitSets/Clothes';

export default function AdrianPortrait(core: typeof maplebirch): void {
  core.tool.onInit(() => {
    const wardrobe = core.npc.Clothes.wardrobe;
    wardrobe.base('Adrian', clothes => wardrobe.put(clothes, C.npc.Adrian?.gender === 'm' ? 'male_underwear' : 'female_underwear'));
    wardrobe.wear('Adrian', '*', 'business_suit_male', () => C.npc.Adrian?.gender === 'm');
    wardrobe.wear('Adrian', '*', 'business_suit_female', () => C.npc.Adrian?.gender !== 'm');
    wardrobe.modify('Adrian', clothes => {
      for (const slot of ['upper', 'lower'] as const) if (clothes[slot]) clothes[slot].colour = 'navy blue';
    });

    core.get('MoreLoveInterestsAndNPCAvatars')?.add('Adrian', {
      folder: 'adrian',
      states: { default: 'default' },
      stateResolver: npc => (npc.skincolour === 'black' ? 'dark' : 'default')
    });
  });
  register(core, 'Adrian', ['business_suit_male', 'business_suit_female']);
}
