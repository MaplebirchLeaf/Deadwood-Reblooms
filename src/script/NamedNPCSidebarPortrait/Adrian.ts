// ./src/script/NamedNPCSidebarPortrait/Adrian.ts

/** 立绘沿用框架服装图层，小头像使用社交模块的 PNG 资料。 */
export default function AdrianPortrait(core: typeof maplebirch): void {
  core.tool.onInit(() => {
    if (core.get('NPCSidebarPortrait')) {
      const wardrobe = core.npc.Clothes.wardrobe;
      wardrobe.wear('Adrian', '*', 'business_suit_male', () => C.npc.Adrian?.gender === 'm');
      wardrobe.wear('Adrian', '*', 'business_suit_female', () => C.npc.Adrian?.gender !== 'm');
      wardrobe.modify('Adrian', clothes => {
        for (const slot of ['upper', 'lower'] as const) if (clothes[slot]) clothes[slot].colour = 'blue';
      });
    }

    core.get('MoreLoveInterestsAndNPCAvatars')?.add('Adrian', {
      folder: 'adrian',
      states: { default: 'default' },
      stateResolver: npc => (npc.skincolour === 'black' ? 'dark' : 'default')
    });
  });
}
