// ./src/script/NamedNPCSidebarPortrait/Common/Hoodie.ts

import type { MaplebirchCore } from '@scml-dol-maplebirch/types';
import type NPCSidebarPortrait from '../../../module/NPCSidebarPortrait';
import { Clothing } from '../Clothing';

export default function (maplebirch: MaplebirchCore, name: string, variants: Map<string, string>): void {
  const sidebar = maplebirch.get('NPCSidebarPortrait') as NPCSidebarPortrait;
  maplebirch.npc.Clothes.wardrobe.modify(name, (clothes, context) => {
    if (context.key !== 'hoodie_legwarmers') return;
    const options = ['standard', 'monster', 'oversized'] as const;
    if (!variants.has('hoodie.variant')) variants.set('hoodie.variant', options[Math.floor(Math.random() * options.length)]);
    const variant = variants.get('hoodie.variant');
    if (variant === 'monster') {
      for (const item of [Clothing.monster_hoodie, Clothing.monster_skirt, Clothing.monster_hood]) sidebar.apply(clothes, item);
    } else if (variant === 'oversized') {
      delete clothes.lower;
      for (const item of [Clothing.oversized_hoodie, Clothing.oversized_hood]) sidebar.apply(clothes, item);
    }
  });
}
