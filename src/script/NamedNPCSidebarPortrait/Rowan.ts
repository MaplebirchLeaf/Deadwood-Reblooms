// ./src/script/NamedNPCSidebarPortrait/Rowan.ts

import { register } from './NPCOutfitSets/Clothes';

export default function RowanPortrait(core: typeof maplebirch): void {
  core.tool.onInit(() => {
    const wardrobe = core.npc.Clothes.wardrobe;
    wardrobe.base('Rowan', clothes => wardrobe.put(clothes, C.npc.Rowan?.gender === 'm' ? 'male_underwear' : 'female_underwear'));
    wardrobe.wear('Rowan', '*', 'wilds_flannel');
    core.get('MoreLoveInterestsAndNPCAvatars')?.add('Rowan', {
      folder: 'rowan',
      states: { default: 'default' },
      stateResolver: npc => (npc.skincolour === 'black' ? 'dark' : 'default')
    });
  });
  register(core, 'Rowan', ['wilds_flannel'], { type: 'worker', gender: 'n' });
}
