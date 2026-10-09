// ./src/script/NamedNPCSidebarPortrait/Marlow.ts

import { register } from './NPCOutfitSets/Clothes';

export default function MarlowPortrait(core: typeof maplebirch): void {
  core.tool.onInit(() => {
    const wardrobe = core.npc.Clothes.wardrobe;
    wardrobe.base('Marlow', clothes => wardrobe.put(clothes, C.npc.Marlow?.gender === 'm' ? 'male_underwear' : 'female_underwear'));
    wardrobe.wear('Marlow', '*', 'dealer_uniform');
    core.get('MoreLoveInterestsAndNPCAvatars')?.add('Marlow', {
      folder: 'marlow',
      states: { default: 'default' },
      stateResolver: npc => {
        const casino = core.get('LifeSimulation')?.casino;
        const working = casino?.state.work_scenario != null;
        return `${npc.skincolour === 'black' ? 'dark-' : ''}${working ? 'working' : 'default'}`;
      }
    });
  });
  register(core, 'Marlow', ['dealer_uniform']);
}
