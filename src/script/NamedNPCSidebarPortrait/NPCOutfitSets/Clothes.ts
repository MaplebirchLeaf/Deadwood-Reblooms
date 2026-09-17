// ./src/script/NamedNPCSidebarPortrait/NPCOutfitSets/Clothes.ts

import type { MaplebirchCore } from '@scml-dol-maplebirch/types';
import inject from './Inject';

type Item = Record<string, any>;
interface SetOptions {
  type?: string;
  gender?: string;
  outfit?: number;
  upperAction?: string;
  lowerAction?: string;
}

export const naked = { name: 'naked', integrity_max: 100, word: 'n', action: 'none', desc: '裸体' };

// 裸体外层是有效对象，不能用 ?? 判断是否还穿着内衣。
export function parts(clothes: Item): [Item, Item] {
  return ['upper', 'lower'].map(slot => {
    const outer = clothes[slot];
    const inner = clothes[`under_${slot}`];
    if (outer?.name && outer.name !== 'naked') return outer;
    if (inner?.name && inner.name !== 'naked') return inner;
    return outer ?? inner ?? naked;
  }) as [Item, Item];
}

function describe(item: Item, slot: 'upper' | 'lower', options: SetOptions) {
  return {
    name: item.name,
    integrity_max: item.integrity_max ?? item.integrity ?? 100,
    action: item.name === 'naked' ? 'none' : slot === 'upper' ? (options.upperAction ?? 'lift') : (options.lowerAction ?? (item.skirt_down ? 'lift' : 'pull')),
    word: item.name === 'naked' || item.plural ? 'n' : 'a',
    desc: item.cn_name_cap ?? item.desc ?? item.name
  };
}

export function addSet(core: MaplebirchCore, names: string[], name: string, clothes: Item, options: SetOptions = {}): void {
  if (names.includes(name)) return;
  const [upper, lower] = parts(clothes);
  core.npc.addClothes({
    name,
    type: options.type ?? (upper.type?.includes('school') || lower.type?.includes('school') ? 'school' : 'custom'),
    gender: options.gender ?? (upper.gender === lower.gender ? upper.gender : 'n'),
    outfit: options.outfit ?? 0,
    upper: describe(upper, 'upper', options),
    lower: describe(lower, 'lower', options),
    desc: `${upper.cn_name_cap ?? upper.desc ?? upper.name}和${lower.cn_name_cap ?? lower.desc ?? lower.name}`
  });
  names.push(name);
}

export function sync(npcName: string, name: string, clothes: Item, options: SetOptions = {}): void {
  const npc = C.npc?.[npcName];
  if (!npc) return;
  const set = setup.npcClothesSets?.find((item: any) => item.name === name);
  if (name !== 'naked' && !set) return;
  const [upper, lower] = parts(clothes);
  // 只更新该 NPC 的套装；共享的原版 naked 配置保持原样。
  if (name !== 'naked') {
    Object.assign(set.clothes.upper, describe(upper, 'upper', options));
    Object.assign(set.clothes.lower, describe(lower, 'lower', options));
    set.desc = `${set.clothes.upper.desc}和${set.clothes.lower.desc}`;
  }
  npc.clothes = {
    set: name,
    upper: { name: upper.name, integrity: upper.integrity ?? upper.integrity_max ?? 100 },
    lower: { name: lower.name, integrity: lower.integrity ?? lower.integrity_max ?? 100 }
  };
  npc.chest = upper.name === 'naked' ? 0 : 'clothed';
  for (const part of ['penis', 'vagina']) if (npc[part] !== 'none') npc[part] = lower.name === 'naked' ? 0 : 'clothed';
}

// 同一套注册、同步与初始生成流程；剧情专用流程仍保留在各 NPC 文件。
export function register(core: MaplebirchCore, npcName: string, keys: string[], config: SetOptions & { preserve?: boolean } = {}): void {
  core.tool.onInit(() => {
    const wardrobe = core.npc.Clothes.wardrobe;
    const names: string[] = [];
    const options = { upperAction: 'unbutton', lowerAction: 'pull', ...config };
    const prefix = npcName.toLowerCase();
    for (const key of keys) {
      const template = wardrobe.get(key);
      if (template) addSet(core, names, `${prefix}_${key}`, template, options);
    }
    wardrobe.modify(npcName, (clothes, context) => {
      const name = `${prefix}_${context.key}`;
      if (names.includes(name)) sync(npcName, name, clothes, options);
    });
    core.on(
      ':npcInject',
      (name: string, npcno: number) => {
        if (name !== npcName) return;
        const npc = C.npc?.[npcName];
        if (!npc) return;
        npc.outfits = config.preserve ? [...new Set([...(npc.outfits ?? ['naked']), ...names])] : ['naked', ...names];
        wardrobe.worn(npcName);
        inject(name, npcno, npc.clothes, npc);
      },
      `${npcName} outfit sets`
    );
  });
}
