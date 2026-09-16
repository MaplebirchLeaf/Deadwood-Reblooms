import type { MaplebirchCore } from '@scml-dol-maplebirch/types';
import { Clothing } from '../Clothing';

export default function (maplebirch: MaplebirchCore): void {
  maplebirch.tool.onInit(() => {
    const wardrobe = maplebirch.npc.Clothes.wardrobe;
    const naked = { name: 'naked', integrity_max: 100, word: 'n', action: 'none', desc: '裸体' };
    const outfitNames: string[] = [];

    function addSet(name: string, upper: Record<string, any>, lower: Record<string, any>): void {
      if (outfitNames.includes(name)) return;
      outfitNames.push(name);
      maplebirch.npc.addClothes({
        name,
        type: 'custom',
        gender: upper.gender === lower.gender ? upper.gender : 'n',
        upper: {
          name: upper.name,
          integrity_max: upper.integrity ?? upper.integrity_max ?? 100,
          action: upper.name === 'naked' ? 'none' : 'lift',
          word: upper.plural ? 'n' : 'a',
          desc: upper.cn_name_cap ?? upper.name
        },
        lower: {
          name: lower.name,
          integrity_max: lower.integrity ?? lower.integrity_max ?? 100,
          action: lower.name === 'naked' ? 'none' : lower.skirt_down ? 'lift' : 'pull',
          word: lower.plural ? 'n' : 'a',
          desc: lower.cn_name_cap ?? lower.name
        },
        desc: `${upper.cn_name_cap ?? upper.name}和${lower.cn_name_cap ?? lower.name}`
      });
    }

    const farm = wardrobe.get('wilds_flannel');
    if (farm) addSet('alex_lower_removed', farm.upper ?? farm.under_upper ?? naked, Clothing.striped_panties);
    if (farm) addSet('wilds_flannel', farm.upper ?? farm.under_upper ?? naked, farm.lower ?? farm.under_lower ?? naked);
    addSet('alex_sleep', Clothing.t_shirt, Clothing.striped_panties);
    addSet('alex_sleep_shirt_only', Clothing.t_shirt, naked);

    function sync(worn: Record<string, any>, key: string, location: string): void {
      const npc = C.npc?.Alex;
      if (!npc) return;
      const upper = key === 'naked' ? naked : (worn.upper ?? worn.under_upper ?? naked);
      const lower = key === 'naked' ? naked : (worn.lower ?? worn.under_lower ?? naked);
      const setName =
        key === 'naked' ? 'naked' : location === 'lower_removed' ? 'alex_lower_removed' : location === 'sleep_shirt_only' ? 'alex_sleep_shirt_only' : key === 'pyjama' ? 'alex_sleep' : key;

      if (setName !== 'naked') {
        const current = setup.npcClothesSets?.find((item: any) => item.name === setName);
        if (current) {
          for (const [slot, item] of [
            ['upper', upper],
            ['lower', lower]
          ] as const) {
            current.clothes[slot].name = item.name;
            current.clothes[slot].integrity_max = item.integrity ?? item.integrity_max ?? 100;
            current.clothes[slot].desc = item.cn_name_cap ?? item.name;
          }
          current.desc = `${upper.cn_name_cap ?? upper.name}和${lower.cn_name_cap ?? lower.name}`;
        }
      }

      npc.clothes = {
        set: setName,
        upper: { name: upper.name, integrity: upper.integrity ?? upper.integrity_max ?? 100 },
        lower: { name: lower.name, integrity: lower.integrity ?? lower.integrity_max ?? 100 }
      };
      if (npc.penis !== 'none') npc.penis = lower.name === 'naked' ? 0 : 'clothed';
      if (npc.vagina !== 'none') npc.vagina = lower.name === 'naked' ? 0 : 'clothed';
      npc.chest = upper.name === 'naked' ? 0 : 'clothed';
    }

    wardrobe.modify('Alex', (clothes, context) => sync(clothes, context.key, context.location));
    const refresh = () => void wardrobe.worn('Alex');

    maplebirch.on(
      ':npcInit',
      (npcName: string) => {
        if (npcName !== 'Alex') return;
        const npc = C.npc?.Alex;
        if (!npc) return;
        npc.outfits = ['naked', ...outfitNames];
        refresh();
      },
      'Alex outfit sets'
    );
    maplebirch.on(':passageinit', refresh, 'Alex current clothes');
  });
}
