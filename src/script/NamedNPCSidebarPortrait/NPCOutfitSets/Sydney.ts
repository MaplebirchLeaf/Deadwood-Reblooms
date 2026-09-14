import type { MaplebirchCore } from '@scml-dol-maplebirch/types';
import { Clothing } from '../Clothing';
import { schoolUniformKeys } from '../SchoolUniform';

const wardrobeKeys = [
  ...schoolUniformKeys,
  'nun_habit',
  'monk_habit',
  'initiate_robes',
  'sexy_nun_habit',
  'english_play_sterling',
  'english_play_cass',
  'cow_onesie',
  'babydoll_lingerie',
  'school_swim_shorts',
  'school_swimsuit',
  'beach_shorts',
  'bikini',
  'speedo',
  'microkini'
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
      const name = `sydney_${key}`;
      outfitNames.push(name);
      maplebirch.npc.addClothes({
        name,
        type: ['nun_habit', 'monk_habit', 'initiate_robes', 'sexy_nun_habit'].includes(key) ? 'temple' : upper.type?.includes('school') || lower.type?.includes('school') ? 'school' : 'custom',
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

    const schoolUniform = wardrobe.get('school_uniform_skirt');
    if (schoolUniform?.upper) {
      for (const lower of [Clothing.long_school_skirt, Clothing.short_school_skirt]) {
        const name = `sydney_school_uniform_${lower.name === 'long school skirt' ? 'long' : 'short'}_skirt`;
        outfitNames.push(name);
        maplebirch.npc.addClothes({
          name,
          type: 'school',
          gender: 'f',
          upper: {
            name: schoolUniform.upper.name,
            integrity_max: schoolUniform.upper.integrity,
            action: 'lift',
            word: 'a',
            desc: schoolUniform.upper.cn_name_cap ?? schoolUniform.upper.name
          },
          lower: {
            name: lower.name,
            integrity_max: lower.integrity as number,
            action: 'lift',
            word: 'a',
            desc: (lower.cn_name_cap as string) ?? lower.name
          },
          desc: `${schoolUniform.upper.cn_name_cap ?? schoolUniform.upper.name}和${(lower.cn_name_cap as string) ?? lower.name}`
        });
      }
    }

    function sync(worn: Record<string, any>, key: string): void {
      const npc = C.npc?.Sydney;
      if (!npc) return;
      const setName = key === 'naked' ? 'naked' : `sydney_${key}`;
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

    wardrobe.modify('Sydney', (clothes, context) => sync(clothes, context.key));
    const refresh = () => void wardrobe.worn('Sydney');

    maplebirch.on(
      ':npcInit',
      (npcName: string) => {
        if (npcName !== 'Sydney') return;
        const npc = C.npc?.Sydney;
        if (!npc) return;
        npc.outfits = ['naked', ...outfitNames];
        refresh();
      },
      'Sydney outfit sets'
    );
    maplebirch.on(':passageinit', refresh, 'Sydney current clothes');
  });
}
