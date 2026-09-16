import type { MaplebirchCore } from '@scml-dol-maplebirch/types';

export default function (maplebirch: MaplebirchCore): void {
  maplebirch.tool.onInit(() => {
    const wardrobe = maplebirch.npc.Clothes.wardrobe;
    const naked = { name: 'naked', integrity_max: 100, word: 'n', action: 'none', desc: '裸体' };
    const hunting = wardrobe.get('eden_hunting');
    if (!hunting) return;

    const upper = hunting.upper ?? naked;
    const lower = hunting.lower ?? naked;
    const outfitNames: string[] = [];

    function addSet(name: string, setUpper: Record<string, any>, setLower: Record<string, any>): void {
      outfitNames.push(name);
      maplebirch.npc.addClothes({
        name,
        type: 'custom',
        gender: setUpper.gender === setLower.gender ? setUpper.gender : 'n',
        upper: {
          name: setUpper.name,
          integrity_max: setUpper.integrity ?? setUpper.integrity_max ?? 100,
          action: setUpper.name === 'naked' ? 'none' : 'unbutton',
          word: setUpper.plural ? 'n' : 'a',
          desc: setUpper.cn_name_cap ?? setUpper.name
        },
        lower: {
          name: setLower.name,
          integrity_max: setLower.integrity ?? setLower.integrity_max ?? 100,
          action: setLower.name === 'naked' ? 'none' : 'pull',
          word: setLower.plural ? 'n' : 'a',
          desc: setLower.cn_name_cap ?? setLower.name
        },
        desc: `${setUpper.cn_name_cap ?? setUpper.name}和${setLower.cn_name_cap ?? setLower.name}`
      });
    }

    addSet('eden_hunting', upper, lower);
    addSet('eden_upper_removed', naked, lower);
    addSet('eden_lower_removed', upper, naked);

    function sync(worn: Record<string, any>, key: string, location: string): void {
      const npc = C.npc?.Eden;
      if (!npc) return;
      const setName = key === 'naked' ? 'naked' : location === 'upper_removed' ? 'eden_upper_removed' : location === 'lower_removed' ? 'eden_lower_removed' : 'eden_hunting';
      const wornUpper = key === 'naked' ? naked : (worn.upper ?? worn.under_upper ?? naked);
      const wornLower = key === 'naked' ? naked : (worn.lower ?? worn.under_lower ?? naked);
      const set = setup.npcClothesSets?.find((item: any) => item.name === setName);
      if (set) {
        for (const [slot, item] of [
          ['upper', wornUpper],
          ['lower', wornLower]
        ] as const) {
          set.clothes[slot].name = item.name;
          set.clothes[slot].integrity_max = item.integrity_max ?? item.integrity ?? 100;
          set.clothes[slot].desc = item.cn_name_cap ?? item.name;
        }
        set.desc = `${wornUpper.cn_name_cap ?? wornUpper.name}和${wornLower.cn_name_cap ?? wornLower.name}`;
      }
      npc.clothes = {
        set: setName,
        upper: { name: wornUpper.name, integrity: wornUpper.integrity ?? wornUpper.integrity_max ?? 100 },
        lower: { name: wornLower.name, integrity: wornLower.integrity ?? wornLower.integrity_max ?? 100 }
      };
      if (npc.penis !== 'none') npc.penis = wornLower.name === 'naked' ? 0 : 'clothed';
      if (npc.vagina !== 'none') npc.vagina = wornLower.name === 'naked' ? 0 : 'clothed';
      npc.chest = wornUpper.name === 'naked' ? 0 : 'clothed';
    }

    wardrobe.modify('Eden', (clothes, context) => sync(clothes, context.key, context.location));
    const refresh = () => void wardrobe.worn('Eden');

    maplebirch.on(
      ':npcInit',
      (npcName: string) => {
        if (npcName !== 'Eden') return;
        const npc = C.npc?.Eden;
        if (!npc) return;
        npc.outfits = ['naked', ...outfitNames];
        refresh();
      },
      'Eden outfit sets'
    );
    maplebirch.on(':passageinit', refresh, 'Eden current clothes');
  });
}
