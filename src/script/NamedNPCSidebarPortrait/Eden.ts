// ./src/script/NamedNPCSidebarPortrait/Eden.ts

import type { MaplebirchCore } from '@scml-dol-maplebirch/types';
import type NPCSidebarPortrait from '../../module/NPCSidebarPortrait';
import { Clothing } from './Clothing';

const nakedSlots = ['over_head', 'over_upper', 'over_lower', 'upper', 'lower', 'under_upper', 'under_lower', 'head', 'face', 'neck', 'hands', 'legs', 'feet', 'handheld'] as const;

export default function (maplebirch: MaplebirchCore): void {
  // 原版森林小屋日程；Eden 不是学生，不接入校园或校服逻辑。
  maplebirch.npc.addSchedule('Eden', schedule =>
    schedule.when(() => C.npc?.Eden?.init === 1, location, {
      id: 'eden-location'
    })
  );

  maplebirch.tool.onInit(() => {
    maplebirch.on(':npcInject', data, 'Eden data');

    function data(npcName: string): void {
      if (npcName !== 'Eden') return;
      V.maplebirch.npc.eden.tucked = [false, false];
      const npc = V.NPCName?.find((data: any) => data?.nam === 'Eden');
      if (!npc) return;
      npc.hair_fringe_type = 'bedhead';
      npc.hair_side_type = 'bedhead';
      npc.hair_sides_length = npc.gender === 'm' ? 400 : 600;
      npc.hair_fringe_length = npc.gender === 'm' ? 200 : 400;
    }

    const sidebar = maplebirch.get('NPCSidebarPortrait') as NPCSidebarPortrait;
    const wardrobe = maplebirch.npc.Clothes.wardrobe;
    const female = wardrobe.get('female_underwear') ?? {};
    const male = wardrobe.get('male_underwear') ?? {};

    // 原版没有专属内衣描述；日常使用性别对应基础内衣，裸体和剧情脱除状态不补回对应层。
    wardrobe.base('Eden', (clothes, context) => {
      if (context.key === 'naked') return;
      const underwear = C.npc?.Eden?.pronoun === 'm' ? male : female;
      for (const item of Object.values(underwear)) {
        if (context.location === 'upper_removed' && item.slot === 'under_upper') continue;
        if (context.location === 'lower_removed' && item.slot === 'under_lower') continue;
        sidebar.apply(clothes, item);
      }
      if (C.npc?.Eden?.pronoun === 'm') delete clothes.under_upper;
    });

    // 小屋生活、照料庄稼、狩猎、劈柴与进城都沿用原版唯一的狩猎服。
    wardrobe.wear('Eden', ['cabin', 'garden', 'hunting', 'firewood', 'town', 'upper_removed', 'lower_removed'], 'eden_hunting');
    wardrobe.wear('Eden', ['sleep', 'naked'], 'naked');

    wardrobe.modify('Eden', (clothes, context) => {
      // 原版旧外套显示磨损，猎裤显示撕裂；礼物狩猎夹克只在出猎时替换旧外套。
      if (context.key === 'eden_hunting') {
        if (clothes.upper) {
          clothes.upper.integrity_max ??= clothes.upper.integrity ?? 200;
          clothes.upper.integrity = context.location === 'hunting' && V.edencoatjacket === 1 ? clothes.upper.integrity_max : Math.floor(clothes.upper.integrity_max * 0.8);
        }
        if (clothes.lower) {
          clothes.lower.integrity_max ??= clothes.lower.integrity ?? 200;
          clothes.lower.integrity = Math.floor(clothes.lower.integrity_max * 0.5);
        }
      }

      // 手工围巾只在冬季出猎时离开衣帽架；圣诞狩猎夹克由当前狩猎外套占位素材表现。
      if (context.location === 'hunting' && Time.season === 'winter' && V.edenscarf === 1) sidebar.apply(clothes, Clothing.scarf);

      // 狼伤处理掀掉上衣；森林陷阱口交褪下长裤和内裤。
      if (context.location === 'upper_removed') {
        delete clothes.upper;
        delete clothes.under_upper;
      }
      if (context.location === 'lower_removed') {
        delete clothes.lower;
        delete clothes.under_lower;
      }
      if (context.key === 'naked') for (const slot of nakedSlots) delete clothes[slot];
    });
  });

  function location(): string {
    const title = maplebirch.passage.title;
    if (C.npc?.Eden?.init !== 1) return '';

    // 浴缸、泉水和情人节共浴均明确写出双方脱光衣服。
    if (title.startsWith('Eden Bath') || title.startsWith('Eden Spring') || title.startsWith('Clearing Spring') || title.startsWith('Eden Valentines Bath')) return 'naked';

    // Eden 睡前会脱掉衣服；普通噩梦、超自然噩梦和睡眠侵犯都从床上裸体状态开始。
    if (title.startsWith('Nightmare Eden') || title.startsWith('Eden Nightmare') || title.startsWith('Eden Sleep') || title === 'Street Eden Worried Go To Cabin 2') return 'sleep';

    // 狼伤包扎期间剥去浸透的上衣；拒绝治疗的 Nod 分支没有进入脱衣步骤。
    if (title.startsWith('Eden Wounds') && title !== 'Eden Wounds Nod') return 'upper_removed';

    // 森林陷阱口交明确将破损长裤褪到脚踝。
    if (title.startsWith('Forest Eden Snare Oral')) return 'lower_removed';

    // 临时进城、购物和公园剧情没有新增衣装描述，继续穿狩猎服。
    if (['town', 'park', 'cafe', 'shopping_centre', 'adult_shop'].includes(V.location)) return 'town';

    // 00:00–06:59 睡觉；07:00–08:59 在小屋；09:00–10:59 照料庄稼。
    if (Time.hour <= 6) return 'sleep';
    if (Time.hour <= 8) return 'cabin';
    if (Time.hour <= 10) return 'garden';

    // 11:00–14:59 出猎；15:00 处理猎物或负伤归来；16:00 劈柴；17:00 后回屋。
    if (Time.hour <= 14) return 'hunting';
    if (Time.hour === 16) return 'firewood';
    return 'cabin';
  }
}
