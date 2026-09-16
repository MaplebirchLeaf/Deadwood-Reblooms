import type { MaplebirchCore } from '@scml-dol-maplebirch/types';
import { Clothing } from '../Clothing';

const wardrobeKeys = ['business_suit_male', 'business_suit_female', 'formal_suit', 'evening_gown', 'pyjama', 'towel_wrap', 'bathrobe'] as const;

export default function (maplebirch: MaplebirchCore): void {
  maplebirch.tool.onInit(() => {
    const wardrobe = maplebirch.npc.Clothes.wardrobe;
    const naked = { name: 'naked', integrity_max: 100, word: 'n', action: 'none', desc: '裸体' };
    const outfitNames: string[] = [];

    function addOutfit(key: string): void {
      const template = wardrobe.get(key);
      if (!template) return;
      addSet(`avery_${key}`, template.upper ?? template.under_upper ?? naked, template.lower ?? template.under_lower ?? naked);
    }

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

    for (const key of wardrobeKeys) addOutfit(key);

    function sync(worn: Record<string, any>, key: string, location: string): void {
      const npc = C.npc?.Avery;
      if (!npc) return;
      const setName = key === 'naked' ? (location === 'underwear' ? 'avery_underwear' : 'naked') : `avery_${key}`;
      const upper = key === 'naked' && location !== 'underwear' ? naked : (worn.upper ?? worn.under_upper ?? naked);
      const lower = key === 'naked' && location !== 'underwear' ? naked : (worn.lower ?? worn.under_lower ?? naked);
      const set = setup.npcClothesSets?.find((item: any) => item.name === setName);
      if (set) {
        for (const [slot, item] of [
          ['upper', upper],
          ['lower', lower]
        ] as const) {
          set.clothes[slot].name = item.name;
          set.clothes[slot].integrity_max = item.integrity ?? item.integrity_max ?? 100;
          set.clothes[slot].desc = item.cn_name_cap ?? item.name;
        }
        set.desc = `${upper.cn_name_cap ?? upper.name}和${lower.cn_name_cap ?? lower.name}`;
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

    wardrobe.modify('Avery', (clothes, context) => sync(clothes, context.key, context.location));
    const refresh = () => void wardrobe.worn('Avery');

    maplebirch.on(
      ':npcInit',
      (npcName: string) => {
        if (npcName !== 'Avery') return;
        const npc = C.npc?.Avery;
        if (!npc) return;
        if (npc.pronoun === 'm') addSet('avery_underwear', naked, Clothing.briefs);
        else addSet('avery_underwear', Clothing.lace_bra, Clothing.lace_panties);
        npc.outfits = ['naked', ...outfitNames];
        refresh();
      },
      'Avery outfit sets'
    );
    maplebirch.on(':passageinit', refresh, 'Avery current clothes');
  });
}
