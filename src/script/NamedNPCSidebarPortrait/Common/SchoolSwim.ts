// ./src/script/NamedNPCSidebarPortrait/Common/SchoolSwim.ts

import type { MaplebirchCore } from '@scml-dol-maplebirch/types';

export default function (maplebirch: MaplebirchCore, name: string, variants: Map<string, string>): void {
  const wardrobe = maplebirch.npc.Clothes.wardrobe;
  wardrobe.modify(name, (clothes, context) => {
    if (context.key !== 'school_swimsuit' || C.npc?.[name]?.pronoun === 'm') return;
    if (!variants.has('school.swim')) variants.set('school.swim', Math.random() < 0.75 ? 'two_piece' : 'one_piece');
    if (variants.get('school.swim') !== 'two_piece') return;
    wardrobe.put(clothes, 'school_swim_two_piece');
  });
}
