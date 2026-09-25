// ./src/script/NamedNPCSidebarPortrait/IvoryWraith.ts

import type { MaplebirchCore } from '@scml-dol-maplebirch/types';

const name = 'Ivory Wraith';
const slots = ['over_upper', 'over_lower', 'upper', 'lower', 'under_upper', 'under_lower', 'over_head', 'head', 'face', 'neck', 'hands', 'handheld', 'legs', 'feet', 'genitals'] as const;
const upper = ['over_upper', 'upper', 'under_upper'] as const;
const lower = ['over_lower', 'lower', 'under_lower', 'legs'] as const;

export function wraith(): Record<string, any> | undefined {
  return V.NPCList?.find((npc: any) => npc?.fullDescription === name);
}

function exposed(state: unknown): boolean {
  return state === 0 || (typeof state === 'string' && state !== '' && state !== 'clothed' && state !== 'none');
}

export function cycle(maplebirch: MaplebirchCore): boolean {
  const title = maplebirch.passage.title;
  // 1390 年的狱卒回忆：只有真结局分支在 Wraith / 2 明确显形，其他分支仅有声音或已附身、离去。
  return (title === 'Hopeless Cycle Wraith' || title === 'Hopeless Cycle Wraith 2') && !!V.hc?.trueEndAvailable;
}

export function present(maplebirch: MaplebirchCore): boolean {
  // 原版名单决定人物；附身和教会分裂中的 PC 演绎没有第二具怨灵身体。
  return !!V.npc?.includes(name) && !V.possessed && !/^Schism(?: |$)/.test(maplebirch.passage.title);
}

export default function (maplebirch: MaplebirchCore): void {
  let prisonIntro = false;
  const wardrobe = maplebirch.npc.Clothes.wardrobe;

  maplebirch.tool.onInit(() => {
    maplebirch.on(':npcInject', data, 'Ivory Wraith data');
    maplebirch.char.use(
      'pre',
      options => {
        for (const npc of [options.maplebirch?.nnpc, options.maplebirch?.previous]) if (npc?.name === name && !present(maplebirch)) npc.model = false;
      },
      'main'
    );
    maplebirch.on(
      ':passageinit',
      () => {
        // 该 passage 在首次分支中立即写入 $wraithIntro，先保留进入时的值以判断原文明写的裸体。
        prisonIntro = maplebirch.passage.title === 'Lake Ruin Prison Intro 2' && !V.wraithIntro;
      },
      'Ivory Wraith scene'
    );

    function data(npcName: string): void {
      if (npcName !== name) return;
      const npc = V.NPCName?.find((npc: any) => npc?.nam === name);
      if (!npc) return;
      npc.hair_side_type = 'ruffled';
      npc.hair_fringe_type = 'sideswept braid';
      npc.hair_sides_length = 800;
      npc.hair_fringe_length = 200;
    }

    wardrobe.wear(name, '*', 'ivory_robe');
    // Nightmare Wraith 2 的远处身影明确穿暗褐色长袍，3 延续同一身影。
    wardrobe.wear(name, '*', 'ivory_habit', () => ['Nightmare Wraith 2', 'Nightmare Wraith 3'].includes(maplebirch.passage.title));
    wardrobe.modify(name, clothes => {
      // 历史身影不读取现代战斗衣物及项链失窃记录。
      if (['Nightmare Wraith 2', 'Nightmare Wraith 3'].includes(maplebirch.passage.title)) {
        if (maplebirch.passage.title === 'Nightmare Wraith 3') wardrobe.strip(clothes, 'neck');
        return;
      }
      // 绝望轮回显形时穿主袍、戴项链，不使用现代战斗对象或失窃记录。
      if (cycle(maplebirch)) return;

      const npc = wraith();
      if (npc && V.npc?.includes(name)) {
        // 当前对象中有真实衣物资源的槽位，覆盖主袍的对应槽位及破损。
        for (const slot of slots) {
          const worn = npc.clothes?.[slot];
          const resource = worn && setup.clothes?.[slot]?.find((item: any) => item.name === worn.name);
          if (!resource) continue;
          clothes[slot] = { ...clone(resource), ...clone(worn) };
        }
        // 原版暴露标志优先于衣物名字；下身脱除包含袜子，手铐和项链保留。
        if (exposed(npc.chest)) wardrobe.strip(clothes, upper);
        if (exposed(npc.penis) || exposed(npc.vagina)) wardrobe.strip(clothes, lower);
      }
      const antique = V.museumAntiques?.antiques?.antiqueivorynecklace;
      const necklaceTaken = V.necklaceThief || (antique != null && antique !== 'notFound');
      if (necklaceTaken) wardrobe.strip(clothes, 'neck');

      // 首次监狱正常分支明确全身赤裸，只保留未被取走的项链。
      if (prisonIntro && V.wraith?.state !== 'haunt' && V.wraith?.state !== 'despair')
        wardrobe.strip(
          clothes,
          slots.filter(slot => slot !== 'neck')
        );
    });
  });
}
