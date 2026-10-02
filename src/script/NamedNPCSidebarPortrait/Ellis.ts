// ./src/script/NamedNPCSidebarPortrait/Ellis.ts

/** 立绘沿用框架服装图层，小头像使用社交模块的 PNG 资料。 */
export default function EllisPortrait(core: typeof maplebirch): void {
  core.tool.onInit(() => {
    if (core.get('NPCSidebarPortrait')) {
      const wardrobe = core.npc.Clothes.wardrobe;
      wardrobe.wear('Ellis', '*', 'business_suit_male', () => C.npc.Ellis?.gender === 'm');
      wardrobe.wear('Ellis', '*', 'business_suit_female', () => C.npc.Ellis?.gender !== 'm');
      wardrobe.modify('Ellis', clothes => {
        for (const slot of ['upper', 'lower'] as const) if (clothes[slot]) clothes[slot].colour = 'blue';
      });
    }

    core.get('MoreLoveInterestsAndNPCAvatars')?.add('Ellis', {
      folder: 'ellis',
      states: { default: 'default' },
      stateResolver: npc => (npc.skincolour === 'black' ? 'dark' : 'default')
    });
  });
}
