import type { MaplebirchCore } from '@scml-dol-maplebirch/types';
import type NPCSidebarPortrait from '../../module/NPCSidebarPortrait';
import { Clothing } from './Clothing';

type DailyCache = { outfit: Map<string, string> };

const nakedSlots = ['over_head', 'over_upper', 'over_lower', 'upper', 'lower', 'under_upper', 'under_lower', 'face', 'neck', 'hands', 'legs', 'feet', 'handheld'] as const;

export default function (maplebirch: MaplebirchCore, colours: DailyCache): void {
  // 原版 Gwylan 日程，不接入学校时间或校服逻辑
  maplebirch.npc.addSchedule('Gwylan', schedule =>
    schedule.when(() => C.npc?.Gwylan?.init === 1, location, {
      id: 'gwylan-location'
    })
  );

  maplebirch.tool.onInit(() => {
    maplebirch.on(':npcInject', data, 'Gwylan data');

    function data(npcName: string): void {
      if (npcName !== 'Gwylan') return;
      V.maplebirch.npc.gwylan.tucked = [false, true];
      const npc = V.NPCName?.find((data: any) => data?.nam === 'Gwylan');
      if (!npc) return;
      npc.hair_fringe_type = 'ruffled';
      npc.hair_side_type = 'ruffled';
      npc.hairlength = 600;
    }

    const sidebar = maplebirch.get('NPCSidebarPortrait') as NPCSidebarPortrait;
    const wardrobe = maplebirch.npc.Clothes.wardrobe;
    const female = wardrobe.get('female_underwear') ?? {};
    const male = wardrobe.get('male_underwear') ?? {};
    const hatlessLocations = new Set(['sleep', 'formal']);

    function applySignatureAccessories(clothes: Record<string, any>, location: string): void {
      if (!hatlessLocations.has(location)) sidebar.apply(clothes, Clothing.sage_witch_hat);
      sidebar.apply(clothes, Clothing.jasper_pendant);
      delete clothes.handheld;
    }

    // 基层内衣与常驻饰品：森林商店剧情不穿内衣
    wardrobe.base('Gwylan', (clothes, context) => {
      if (context.location === 'ritual_naked') {
        sidebar.apply(clothes, Clothing.sage_witch_hat);
        return;
      }
      if (context.location === 'naked' || context.key === 'naked') return;

      if (context.location !== 'shop') {
        const underwear = C.npc?.Gwylan?.pronoun === 'm' ? male : female;
        for (const item of Object.values(underwear)) sidebar.apply(clothes, item);
      }
      if (C.npc?.Gwylan?.pronoun === 'm') delete clothes.under_upper;
      applySignatureAccessories(clothes, context.location);
    });

    // 森林商店常服：暂用绿色露肩毛衣与束腰还原束腰外衣
    const tunicLocations = ['shop', 'garden', 'forest'];
    wardrobe.wear('Gwylan', tunicLocations, 'gwylan_tunic');

    // 原版有独立睡眠日程但没有专属睡衣套，使用现有睡衣补全狗床睡眠状态
    wardrobe.wear('Gwylan', 'sleep', 'pyjama');

    // 镇上日常服装：温和天气按日选择，炎热与冬季使用固定套装
    const townLocations = ['walking_to_cafe', 'cafe', 'cliff', 'pub', 'sulking', 'town'];
    const townOutfits = ['gwylan_tunic', 'turtleneck_slacks', 'flowy_layered'] as const;
    for (const key of townOutfits) {
      wardrobe.wear('Gwylan', townLocations, key, () => {
        if (Time.season === 'winter' || Weather.temperature > 24) return false;
        colours.outfit.set('town', colours.outfit.get('town') ?? townOutfits[Math.floor(Math.random() * townOutfits.length)]);
        return colours.outfit.get('town') === key;
      });
    }
    wardrobe.wear('Gwylan', townLocations, 'gwylan_tunic', () => Time.season !== 'winter' && Weather.temperature > 24);
    wardrobe.wear('Gwylan', townLocations, 'jacket_trousers', () => Time.season === 'winter');

    // 特殊剧情服装：复古正装、仪式长袍（暂用驱魔师套素材）与裸体状态
    wardrobe.wear('Gwylan', 'formal', 'vintage_pantsuit_formal', () => C.npc?.Gwylan?.pronoun === 'm');
    wardrobe.wear('Gwylan', 'formal', 'vintage_skirtsuit_formal', () => C.npc?.Gwylan?.pronoun !== 'm');
    wardrobe.wear('Gwylan', 'ritual', 'exorcist_cassock', () => C.npc?.Gwylan?.pronoun === 'm');
    wardrobe.wear('Gwylan', 'ritual', 'exorcist_habit', () => C.npc?.Gwylan?.pronoun !== 'm');
    wardrobe.wear('Gwylan', ['naked', 'ritual_naked'], 'naked');

    // 剧情脱衣与常驻帽子、吊坠
    wardrobe.modify('Gwylan', (clothes, context) => {
      if (context.location === 'ritual_naked') {
        for (const slot of nakedSlots) delete clothes[slot];
        sidebar.apply(clothes, Clothing.sage_witch_hat);
        return;
      }
      if (context.location === 'naked') {
        for (const slot of [...nakedSlots, 'head'] as const) delete clothes[slot];
        return;
      }

      if (context.key === 'gwylan_tunic') {
        const variants = ['standard', 'off_shoulder_sweater_dress'] as const;
        colours.outfit.set('gwylan_tunic.variant', colours.outfit.get('gwylan_tunic.variant') ?? variants[Math.floor(Math.random() * variants.length)]);
        if (colours.outfit.get('gwylan_tunic.variant') === 'off_shoulder_sweater_dress') {
          sidebar.apply(clothes, Clothing.off_shoulder_sweater_dress_upper);
          sidebar.apply(clothes, Clothing.off_shoulder_sweater_dress_lower);
        }
      }
      if (context.key === 'turtleneck_slacks') {
        const variants = ['standard', 'cable_knit_turtleneck'] as const;
        colours.outfit.set('turtleneck_slacks.variant', colours.outfit.get('turtleneck_slacks.variant') ?? variants[Math.floor(Math.random() * variants.length)]);
        if (colours.outfit.get('turtleneck_slacks.variant') === 'cable_knit_turtleneck') sidebar.apply(clothes, Clothing.cable_knit_turtleneck);
      }

      applySignatureAccessories(clothes, context.location);
    });
  });

  function location(): string {
    const title = maplebirch.passage.title;
    const gwylan = C.npc?.Gwylan;
    if (gwylan?.init !== 1) return '';

    // 仪式脱衣阶段优先于普通仪式服装：仪式开始、性爱与诱饵收尾时仅保留贤者巫师帽
    if (title === 'Gwylan Ritual Start Garden' || title.startsWith('Gwylan Ritual Sex') || title.startsWith('Gwylan Ritual Bait End')) return 'ritual_naked';

    // 明确的裸体剧情：奶油、渴望性爱与森林追逐中的性场景不叠加日常衣物或常驻饰品
    if (title.startsWith('Gwylan Cream') || title.startsWith('Gwylan Chef Cream')) return 'naked';
    if (title.startsWith('Gwylan Yearning Sex') && !title.startsWith('Gwylan Yearning Sex Finish')) return 'naked';
    if (title.startsWith('Gwylan Forest Run Clearing Mount Persist') || title.startsWith('Gwylan Forest Run Sex')) return 'naked';

    // 其余仪式段落穿仪式长袍；素材暂由男女驱魔师套提供，但 NPC outfit 统一记为 gwylan_ritual_robes
    if (title.startsWith('Gwylan Ritual') || title.startsWith('Forest Gwylan Ritual')) return 'ritual';

    // 厨师开场与渴望剧情的非性爱阶段穿复古正装
    if (title.startsWith('Chef Opening Gwylan') || title.startsWith('Gwylan Yearning')) return 'formal';

    // 剧情指定地点：酒吧消沉、海风散步、森林追逐分别覆盖接下来的时间表判断
    if (title.startsWith('Gwylan Pub Sulking')) return 'pub';
    if (title.startsWith('Gwylan Ocean Breeze') || title.startsWith('Gwylan Promenade')) return 'town';
    if (title.startsWith('Gwylan Forest Run')) return 'forest';

    // 森林商店内的特殊 passage：狗床使用睡衣，其余商店、委托、礼物、催眠与贞操剧情穿商店常服
    if (title === 'Forest Shop Dog Bed Sleep') return 'sleep';
    if (title.startsWith('Forest Shop') || title.startsWith('Gwylan Request') || title.startsWith('Gwylan Gifts') || title.startsWith('Gwylan Hypnosis') || title.startsWith('Gwylan Chastity'))
      return 'shop';

    // 暂时离场状态最高于常规日程，计时结束前不显示 Gwylan
    if ((V.gwylan?.timer?.nobody ?? -1) >= Time.date.timeStamp) return 'nowhere';

    // 被冷落后不再执行商店日程：满足渴望剧情条件的 17:00–23:59 前往酒吧，否则保持独自消沉
    if (gwylan.state === 'scorned') {
      if (Time.hour >= 17 && Time.hour <= 23 && !V.gwylanSeen?.includes('yearning_pub') && !V.yearningLetter && !V.daily.gwylan.preventProgress) return 'pub';
      return 'sulking';
    }

    // Robin 留在森林商店时，Gwylan 也固定显示在商店
    if (V.robin_in_forest_shop) return 'shop';

    // 每日清晨 05:00–06:44 在花园照料植物
    if (Time.hour === 5 || (Time.hour === 6 && Time.minute < 45)) return 'garden';

    // 未跳过咖啡馆行程时，07:00–07:19 在路上；厨师剧情 7–8 阶段改去悬崖
    if (!V.daily.gwylan.cafeSkip && Time.hour === 7 && Time.minute < 20 && !V.daily.gwylan.cafe) return V.chef_state >= 7 && V.chef_state <= 8 && V.chef_rework <= 30 ? 'cliff' : 'walking_to_cafe';

    // 07:20–09:20 留在咖啡馆；若当天已抵达则 07:00 起直接显示，厨师剧情期间同样改为悬崖
    if (!V.daily.gwylan.cafeSkip && ((Time.hour === 7 && (Time.minute >= 20 || V.daily.gwylan.cafe)) || Time.hour === 8 || (Time.hour === 9 && Time.minute <= 20))) {
      return V.chef_state >= 7 && V.chef_state <= 8 && V.chef_rework <= 30 ? 'cliff' : 'cafe';
    }

    // 非血月的 23:00–05:59 属于睡眠时段，但 05:00–05:59 已由上方花园日程优先覆盖；狩猎中仅当玩家回到森林商店时显示睡眠状态
    if (!Time.isBloodMoon() && (Time.hour >= 23 || Time.hour <= 5) && (!V.gwylan?.hunting || V.location === 'forest_shop')) return 'sleep';

    // 其余时间默认在森林商店，Gwylan 没有学校日程或校服分支
    return 'shop';
  }
}
