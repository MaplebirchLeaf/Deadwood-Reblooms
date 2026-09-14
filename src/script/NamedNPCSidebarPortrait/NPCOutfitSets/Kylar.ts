import type { MaplebirchCore } from '@scml-dol-maplebirch/types';
import { schoolUniformKeys } from '../SchoolUniform';

const wardrobeKeys = [
  ...schoolUniformKeys,
  'hoodie_legwarmers',
  'english_play_sterling',
  'english_play_taylor',
  'vintage_pantsuit_formal',
  'vintage_skirtsuit_formal',
  'gothic_formal_suit',
  'gothic_rose_gown',
  'rose_wedding_suit',
  'rose_wedding_dress',
  'beach_shorts',
  'bikini',
  'christmas',
  'christmas_dress',
  'jingle_bell_christmas_dress',
  'mummy',
  'prison_jumpsuit'
] as const;

export default function (maplebirch: MaplebirchCore): void {
  maplebirch.tool.onInit(() => {
    const wardrobe = maplebirch.npc.Clothes.wardrobe;
    const naked = { name: 'naked', integrity_max: 100, word: 'n', action: 'none', desc: '裸体' };
    const outfitNames: string[] = [];
    for (const key of wardrobeKeys) {
      const template = wardrobe.get(key);
      if (!template) continue;
      const upper = template.upper ?? template.under_upper ?? naked;
      const lower = template.lower ?? template.under_lower ?? naked;
      const name = `kylar_${key}`;
      outfitNames.push(name);
      maplebirch.npc.addClothes({
        name,
        type: key === 'prison_jumpsuit' ? 'prison' : upper.type?.includes('school') || lower.type?.includes('school') ? 'school' : 'custom',
        gender: upper.gender === lower.gender ? upper.gender : 'n',
        upper: {
          name: upper.name,
          integrity_max: upper.integrity,
          action: upper.name === 'naked' ? 'none' : 'lift',
          word: upper.plural ? 'n' : 'a',
          desc: upper.cn_name_cap ?? upper.name
        },
        lower: {
          name: lower.name,
          integrity_max: lower.integrity,
          action: lower.name === 'naked' ? 'none' : lower.skirt_down ? 'lift' : 'pull',
          word: lower.plural ? 'n' : 'a',
          desc: lower.cn_name_cap ?? lower.name
        },
        desc: `${upper.cn_name_cap ?? upper.name}和${lower.cn_name_cap ?? lower.name}`
      });
    }

    function sync(worn: Record<string, any>, key: string): void {
      const npc = C.npc?.Kylar;
      if (!npc) return;
      const setName = key === 'naked' ? 'naked' : `kylar_${key}`;
      const set = setup.npcClothesSets?.find((item: any) => item.name === setName);
      if (!set) return;
      const upper = key === 'naked' ? naked : (worn.upper ?? worn.under_upper ?? naked);
      const lower = key === 'naked' ? naked : (worn.lower ?? worn.under_lower ?? naked);
      for (const [slot, item] of [
        ['upper', upper],
        ['lower', lower]
      ] as const) {
        set.clothes[slot].name = item.name;
        set.clothes[slot].integrity_max = item.integrity ?? item.integrity_max ?? 100;
        set.clothes[slot].desc = item.cn_name_cap ?? item.name;
      }
      set.desc = `${upper.cn_name_cap ?? upper.name}和${lower.cn_name_cap ?? lower.name}`;
      npc.clothes = {
        set: setName,
        upper: { name: upper.name, integrity: upper.integrity ?? upper.integrity_max ?? 100 },
        lower: { name: lower.name, integrity: lower.integrity ?? lower.integrity_max ?? 100 }
      };
      if (npc.penis !== 'none') npc.penis = lower.name === 'naked' ? 0 : 'clothed';
      if (npc.vagina !== 'none') npc.vagina = lower.name === 'naked' ? 0 : 'clothed';
      npc.chest = upper.name === 'naked' ? 0 : 'clothed';
    }

    wardrobe.modify('Kylar', (clothes, context) => sync(clothes, context.key));
    const refresh = () => void wardrobe.worn('Kylar');

    maplebirch.on(
      ':npcInit',
      (npcName: string) => {
        if (npcName !== 'Kylar') return;
        const npc = C.npc?.Kylar;
        if (!npc) return;
        npc.outfits = ['naked', ...outfitNames];
        refresh();
      },
      'Kylar outfit sets'
    );
    maplebirch.on(':passageinit', refresh, 'Kylar current clothes');
  });
}
