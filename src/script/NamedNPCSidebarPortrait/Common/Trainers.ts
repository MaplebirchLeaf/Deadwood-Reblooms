// ./src/script/NamedNPCSidebarPortrait/Common/Trainers.ts

import type { MaplebirchCore } from '@scml-dol-maplebirch/types';
import type NPCSidebarPortrait from '../../../module/NPCSidebarPortrait';
import { Clothing } from '../Clothing';

export default function (maplebirch: MaplebirchCore, name: string, variants: Map<string, string>): void {
  const sidebar = maplebirch.get('NPCSidebarPortrait') as NPCSidebarPortrait;
  maplebirch.npc.Clothes.wardrobe.modify(name, (clothes, context) => {
    const feet = clothes.feet;
    if (C.npc?.[name]?.pronoun === 'm' || !feet?.name) return;
    if (!['trainers', 'ankle trainers', 'high top trainers', 'basketball sneakers'].includes(feet.name)) return;
    if (name === 'Doren' && context.key === 'tracksuit') {
      if (clothes.lower?.name === 'open-side skort') sidebar.apply(clothes, Clothing.floral_ribbon_trainers);
      return;
    }
    if (!variants.has('trainers')) variants.set('trainers', Math.random() < 0.5 ? 'original' : 'floral');
    if (variants.get('trainers') === 'floral') sidebar.apply(clothes, Clothing.floral_ribbon_trainers);
  });
}
