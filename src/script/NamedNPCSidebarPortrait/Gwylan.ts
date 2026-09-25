// ./src/script/NamedNPCSidebarPortrait/Gwylan.ts

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
      if (npc.gender === 'm') {
        npc.hair_sides_length = 400;
        npc.hair_fringe_length = 200;
      } else {
        npc.hair_sides_length = 800;
        npc.hair_fringe_length = 400;
      }
    }

    const sidebar = maplebirch.get('NPCSidebarPortrait') as NPCSidebarPortrait;
    const wardrobe = maplebirch.npc.Clothes.wardrobe;
    const hatlessLocations = new Set(['sleep', 'formal']);

    function applySignatureAccessories(clothes: Record<string, any>, location: string): void {
      if (location === 'brown_fox' || location === 'brown_fox_unmasked') {
        delete clothes.neck;
        delete clothes.handheld;
        return;
      }
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
        wardrobe.put(clothes, C.npc?.Gwylan?.pronoun === 'm' ? 'male_underwear' : 'female_underwear');
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
    wardrobe.wear('Gwylan', ['brown_fox', 'brown_fox_unmasked'], 'brown_fox');
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
      if (context.location === 'brown_fox_unmasked') delete clothes.face;
    });
  });

  function location(): string {
    const title = maplebirch.passage.title;
    const gwylan = C.npc?.Gwylan;
    if (gwylan?.init !== 1) return '';

    // summon_brown_fox 生成的仍是 Gwylan；酒吧、庄园行动和救援明写绿色兜帽斗篷与狐狸面具。
    // Mansion Piano Fox 2 的面具放在旁边座位上，身份已揭露也不等于自动摘面具。
    if (title === 'Mansion Piano Fox 2') return 'brown_fox_unmasked';
    if (/^(?:Pub Brown Fox(?: |$)|Mansion Brown Fox(?: |$)|Mansion Fox Heist(?: |$)|Mansion Piano Fox$|Mansion Party Remy Brown Fox(?: |$))/.test(title)) return 'brown_fox';
    if (['Mansion Mickey Interrupt', 'Skyscraper Save Rescue', 'Skyscraper Save Rescue 3', 'Skyscraper Run Rescue'].includes(title)) return 'brown_fox';

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

    // 实际地点优先于日程；狗床睡眠是原版未写入持续服装状态的例外。
    if (title === 'Forest Shop Dog Bed Sleep') return 'sleep';
    const places: Record<string, string> = { pub: 'pub', promenade: 'town', park: 'town', forest: 'forest', forest_shop: 'shop', forest_shop_garden: 'shop' };
    if (places[V.location]) return places[V.location];

    // 无人计时和被冷落状态优先于普通日程，不影响原版在场名单。
    if ((V.gwylan?.timer?.nobody ?? -1) >= Time.date.timeStamp) return 'nowhere';
    if (gwylan.state === 'scorned') {
      if (Time.hour >= 17 && Time.hour <= 23 && !V.gwylanSeen?.includes('yearning_pub') && !V.yearningLetter && !V.daily.gwylan.preventProgress) return 'pub';
      return 'sulking';
    }
    if (V.robin_in_forest_shop) return 'shop';

    // 05:00–06:44 照料花园；07:00–09:20 前往咖啡馆并停留，厨师剧情改去悬崖。
    if (Time.hour === 5 || (Time.hour === 6 && Time.minute < 45)) return 'garden';
    if (!V.daily.gwylan.cafeSkip) {
      const cliff = V.chef_state >= 7 && V.chef_state <= 8 && V.chef_rework <= 30;
      if (Time.hour === 7 && Time.minute < 20 && !V.daily.gwylan.cafe) return cliff ? 'cliff' : 'walking_to_cafe';
      if (Time.hour === 7 || Time.hour === 8 || (Time.hour === 9 && Time.minute <= 20)) return cliff ? 'cliff' : 'cafe';
    }

    // 非血月 23:00–05:59 睡眠；清晨花园已优先处理，狩猎期间仅在商店选择睡衣。
    if (!Time.isBloodMoon() && (Time.hour >= 23 || Time.hour <= 5) && (!V.gwylan?.hunting || V.location === 'forest_shop')) return 'sleep';
    return 'shop';
  }
}
