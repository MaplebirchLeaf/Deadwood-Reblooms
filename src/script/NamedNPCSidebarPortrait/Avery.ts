// ./src/script/NamedNPCSidebarPortrait/Avery.ts

import type { MaplebirchCore } from '@scml-dol-maplebirch/types';
import type NPCSidebarPortrait from '../../module/NPCSidebarPortrait';
import { Clothing } from './Clothing';

type DailyCache = { outfit: Map<string, string> };

export default function (maplebirch: MaplebirchCore, colours: DailyCache): void {
  maplebirch.npc.addSchedule('Avery', schedule =>
    schedule.when(() => C.npc?.Avery?.init === 1 && C.npc?.Avery?.state !== 'dismissed', location, {
      id: 'avery-location'
    })
  );

  maplebirch.tool.onInit(() => {
    maplebirch.on(':npcInject', data, 'Avery data');

    function data(npcName: string): void {
      if (npcName !== 'Avery') return;
      V.maplebirch.npc.avery.tucked = [false, true];
      const npc = V.NPCName?.find((data: any) => data?.nam === 'Avery');
      if (!npc) return;
      npc.hair_fringe_type = 'swept back';
      if (npc.gender !== 'm') {
        npc.hair_side_type = 'princess wave';
        npc.hair_sides_length = 600;
        npc.hair_fringe_length = 400;
      } else {
        npc.hair_side_type = 'neat';
        npc.hair_sides_length = 0;
        npc.hair_fringe_length = 0;
      }
    }

    const sidebar = maplebirch.get('NPCSidebarPortrait') as NPCSidebarPortrait;
    const wardrobe = maplebirch.npc.Clothes.wardrobe;
    const femaleBusiness = wardrobe.get('business_suit_female') ?? {};
    const noUnderwear = new Set(['naked', 'towel', 'bathrobe']);

    wardrobe.base('Avery', (clothes, context) => {
      if (noUnderwear.has(context.location)) return;
      if (C.npc?.Avery?.pronoun === 'm') {
        sidebar.apply(clothes, Clothing.briefs);
        delete clothes.under_upper;
      } else {
        sidebar.apply(clothes, Clothing.lace_bra);
        sidebar.apply(clothes, Clothing.lace_panties);
      }
    });

    // 日常商务、正式场合和庄园生活服装；艾弗里没有学生或校服分支
    wardrobe.wear('Avery', 'business', 'business_suit_male', () => C.npc?.Avery?.pronoun === 'm');
    wardrobe.wear('Avery', 'business', 'business_suit_female', () => C.npc?.Avery?.pronoun !== 'm');
    wardrobe.wear('Avery', 'formal', 'tuxedo_formal', () => C.npc?.Avery?.pronoun === 'm');
    wardrobe.wear('Avery', 'formal', 'evening_gown', () => C.npc?.Avery?.pronoun !== 'm');
    wardrobe.wear('Avery', 'sleep', 'pyjama');
    wardrobe.wear('Avery', 'towel', 'towel_wrap');
    wardrobe.wear('Avery', 'bathrobe', 'bathrobe');
    wardrobe.wear('Avery', 'underwear', 'naked');
    wardrobe.wear('Avery', 'naked', 'naked');

    wardrobe.modify('Avery', (clothes, context) => {
      if (context.key === 'evening_gown' && femaleBusiness.feet) {
        sidebar.apply(clothes, femaleBusiness.feet);
      }
    });
  });

  function location(): string {
    const avery = C.npc?.Avery;
    const title = maplebirch.passage.title;
    if (avery?.init !== 1 || avery.state === 'dismissed') return '';

    // Spa：进场时解开毛巾并全裸，结束或拒绝后重新裹上毛巾
    if (title.startsWith('Avery Spa End') || title === 'Avery Spa Refuse' || title === 'Avery Spa Oral Finish' || title === 'Avery Spa Rape Finish') return 'towel';
    if (title.startsWith('Avery Spa')) return 'naked';

    // 庄园洗浴、换衣与泳池剧情优先于普通庄园日程
    if (title.startsWith('Mansion Bathroom Avery Drying')) return 'towel';
    if (title.startsWith('Mansion Bathroom Avery')) return 'naked';
    if (title === 'Mansion Bedroom Avery Dress') return 'bathrobe';
    if (title.startsWith('Mansion Bedroom Avery Dress')) return 'business';
    if (title.startsWith('Mansion Pool Swim Avery')) return 'naked';

    // 酒店热水池全裸；过夜前艾弗里只穿内衣，性爱阶段不保留内衣
    if (title.startsWith('Avery Hotel Bath') || title === 'Avery Hotel 4' || title === 'Avery Hotel 5' || title.startsWith('Avery Hotel Sex')) return 'naked';
    if (title === 'Avery Hotel Stay' || title === 'Avery Hotel Pajamas' || title === 'Avery Hotel Lingerie' || title.startsWith('Avery Hotel No ')) return 'underwear';
    if (V.location === 'hotel') return 'formal';

    // 情人节先穿正式服，进卧室后显示内衣，实际性交与共同洗澡时全裸
    if (title === 'Avery Valentines Sex' || title === 'Avery Valentines Sex 2') return 'underwear';
    if (title.startsWith('Avery Valentines Sex') || title.startsWith('Avery Valentines Rape')) return 'naked';
    if (title.startsWith('Avery Valentines')) return 'formal';

    // 约会、宴会与摩天楼仪式穿正式服；失火破损服装按用户决定暂不单独表现
    if (title.startsWith('Avery Date') || title.startsWith('Skyscraper Party') || title.startsWith('Skyscraper Save') || title.startsWith('Skyscraper Kick')) return 'formal';

    // 办公室、接送、直升机及学校活动均是成年人的商务场景，不生成校园日程
    if (title.startsWith('Avery Office') || title.startsWith('Avery School Pickup') || title.startsWith('Avery Helicopter')) return 'business';

    const mansion = V.avery_mansion;
    if (!mansion) {
      if (Time.weekDay === 7 && Time.hour === 20 && V.averydate === 1) return 'formal';
      const workHours = Time.weekDay !== 7 && Time.hour > 6 && Time.hour <= (Time.weekDay === 1 ? 16 : 20);
      if (workHours && V.averySeen?.includes('office') && !V.avery_injury) return 'business';
      // 没有明确日程衣装时保留上一套；此值不控制侧边栏在场判断。
      return 'nowhere';
    }

    // 原版庄园 schedule 已负责处理星期、离场、伤病、晚宴与返回逻辑
    switch (mansion.schedule) {
      case 'away':
        return 'nowhere';
      case 'sleep':
        return 'sleep';
      case 'bath':
      case 'pool':
        return 'naked';
      case 'dressing':
        return 'bathrobe';
      case 'party_prepare':
      case 'party':
      case 'date':
        return 'formal';
      case 'work':
        return 'business';
      default:
        return Time.hour >= 18 ? 'formal' : 'business';
    }
  }
}
