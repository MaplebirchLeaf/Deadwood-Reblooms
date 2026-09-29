// ./src/script/NamedNPCSidebarPortrait/NPCOutfitSets/Doren.ts

import type { MaplebirchCore } from '@scml-dol-maplebirch/types';
import inject from './Inject';
import { addSet, sync } from './Clothes';

export default function (maplebirch: MaplebirchCore): void {
  maplebirch.tool.onInit(() => {
    const wardrobe = maplebirch.npc.Clothes.wardrobe;
    const names: string[] = [];
    const options = { upperAction: 'unbutton', lowerAction: 'pull' };
    for (const key of ['tracksuit']) {
      const template = wardrobe.get(key);
      if (template) addSet(maplebirch, names, `doren_${key}`, template, options);
    }
    wardrobe.modify('Doren', (clothes, context) => {
      const name = `doren_${context.key}`;
      if (names.includes(name)) sync('Doren', name, clothes, options);
    });
    maplebirch.on(
      ':npcInject',
      (npcName: string, npcno: number) => {
        if (npcName !== 'Doren') return;
        const npc = C.npc?.Doren;
        if (!npc) return;
        npc.outfits = [...new Set([...(npc.outfits ?? ['naked']), ...names])];
        if (maplebirch.passage.title !== 'Doren Jog' && !maplebirch.passage.title.startsWith('Deadwood Reblooms Life Simulation Gym Doren')) return;
        wardrobe.worn('Doren');
        inject(npcName, npcno, npc.clothes, npc);
      },
      'Doren outfit sets'
    );
  });
}
