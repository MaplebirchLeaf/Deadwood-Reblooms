// ./src/script/NamedNPCSidebarPortrait/Robin.ts

import type { MaplebirchCore } from '@scml-dol-maplebirch/types';
import type NPCSidebarPortrait from '../../module/NPCSidebarPortrait';
import { Clothing } from './Clothing';
import schoolSwim from './Common/SchoolSwim';
import hoodie from './Common/Hoodie';
import trainers from './Common/Trainers';
import { preferColours } from './Common/Preference';
import schoolUniforms from './Common/SchoolUniform';

export default function (
  maplebirch: MaplebirchCore,
  colours: { school: Map<string, string>; schoolOutfit: Map<string, string>; outfit: Map<string, string>; clothes: Map<string, string>; christmas: Map<string, string> }
): void {
  maplebirch.npc.addSchedule('Robin', schedule =>
    schedule.when(() => C.npc?.Robin?.init === 1, location, {
      id: 'robin-location'
    })
  );

  maplebirch.tool.onInit(() => {
    maplebirch.on(':npcInject', data, 'Robin data');

    function data(npcName: string): void {
      if (npcName !== 'Robin') return;
      V.maplebirch.npc.robin.tucked = [false, false];
      const npc = V.NPCName?.find((data: any) => data?.nam === 'Robin');
      if (!npc) return;
      npc.hair_fringe_type = 'framed';
      if (npc.gender === 'm') {
        npc.hair_side_type = 'messy';
        npc.hair_sides_length = 200;
        npc.hair_fringe_length = 0;
      } else {
        npc.hair_side_type = 'ruffled';
        npc.hair_sides_length = 600;
        npc.hair_fringe_length = 600;
      }
    }

    const sidebar = maplebirch.get('NPCSidebarPortrait') as NPCSidebarPortrait;
    const wardrobe = maplebirch.npc.Clothes.wardrobe;

    // 基层内衣：男性使用男性内衣，其他性别使用女性内衣
    wardrobe.base('Robin', (clothes, context) => {
      const is_male = C.npc?.Robin?.pronoun === 'm';
      if (context.key !== 'naked') {
        wardrobe.put(clothes, is_male ? 'male_underwear' : 'female_underwear');
        if (is_male) delete clothes.under_upper;
      }

      // 基层发饰：佩戴花环
      if (context.key !== 'naked') sidebar.apply(clothes, Clothing.flower_crown);

      // 神殿贞操器具和剧情里的实际穿戴状态一致。
      const chastity = C.npc?.Robin?.chastity;
      if (maplebirch.get('RobinTemple') && (chastity?.penis === 'chastity belt' || chastity?.vagina === 'chastity belt')) wardrobe.put(clothes, 'chastity_belt');
    });

    // 学校制服
    schoolUniforms(maplebirch, sidebar, 'Robin', 'school', colours);

    // 基础校服配色
    wardrobe.modify('Robin', (clothes, context) => {
      if (!['school_uniform_trousers', 'school_uniform_skirt'].includes(context.key)) return;
      if (context.key === 'school_uniform_skirt' && Time.season === 'winter') sidebar.apply(clothes, Clothing.long_school_skirt);
      if (context.key === 'school_uniform_skirt' && Time.season === 'summer') sidebar.apply(clothes, Clothing.short_school_skirt);
      if (clothes.upper) clothes.upper.colour = 'brown';
      if (clothes.lower) clothes.lower.colour = 'black';
    });

    // 日常便服
    wardrobe.wear('Robin', 'orphanage', 'tshirt_shorts', () => C.npc?.Robin?.pronoun === 'm');
    wardrobe.wear('Robin', 'orphanage', 'summer_sundress', () => C.npc?.Robin?.pronoun !== 'm');
    wardrobe.wear('Robin', 'garden', 'tshirt_shorts', () => C.npc?.Robin?.pronoun === 'm' && Time.season !== 'winter');
    wardrobe.wear('Robin', 'garden', 'summer_sundress', () => C.npc?.Robin?.pronoun !== 'm' && Time.season !== 'winter');

    // 夏日连衣裙：普通、碎花、荷叶边与露背款按日选择
    const sundressVariants = {
      floral: [Clothing.floral_sundress_upper, Clothing.floral_sundress_lower],
      frilled: [Clothing.frilled_sundress_upper, Clothing.frilled_sundress_lower],
      halter: [Clothing.halter_sundress_upper, Clothing.halter_sundress_lower]
    } as const;
    wardrobe.modify('Robin', (clothes, context) => {
      if (context.key !== 'summer_sundress') return;
      const options = ['standard', ...Object.keys(sundressVariants)];
      colours.outfit.set('sundress', colours.outfit.get('sundress') ?? options.either() ?? 'standard');
      const variant = sundressVariants[colours.outfit.get('sundress') as keyof typeof sundressVariants];
      if (!variant) return;
      for (const item of variant) sidebar.apply(clothes, item);
    });

    // T恤短裤：男性款 T 恤和中性牛仔短裤按日选择
    wardrobe.modify('Robin', (clothes, context) => {
      if (context.key !== 'tshirt_shorts') return;
      const upperOptions = C.npc?.Robin?.pronoun === 'm' ? ['standard', 'band_t_shirt', 'boxy_t_shirt'] : ['standard'];
      let upper = colours.outfit.get('tshirt_shorts.upper');
      if (!upper || !upperOptions.includes(upper)) {
        upper = upperOptions[Math.floor(Math.random() * upperOptions.length)];
        colours.outfit.set('tshirt_shorts.upper', upper);
      }
      if (upper === 'band_t_shirt') sidebar.apply(clothes, Clothing.band_t_shirt);
      if (upper === 'boxy_t_shirt') sidebar.apply(clothes, Clothing.boxy_t_shirt);

      const lowerOptions = ['standard', 'denim_shorts'];
      let lower = colours.outfit.get('tshirt_shorts.lower');
      if (!lower || !lowerOptions.includes(lower)) {
        lower = lowerOptions[Math.floor(Math.random() * lowerOptions.length)];
        colours.outfit.set('tshirt_shorts.lower', lower);
      }
      if (lower === 'denim_shorts') sidebar.apply(clothes, Clothing.denim_shorts);
    });

    // 浴室服装
    wardrobe.wear('Robin', 'bath', 'towel_wrap');

    // 剧情服装
    wardrobe.wear('Robin', ['naked', 'docks', 'dinner', 'underground'], 'naked');
    wardrobe.wear('Robin', 'mist', 'rags');
    wardrobe.wear('Robin', 'giftWrap', 'gift_wrap');
    wardrobe.wear('Robin', 'historyDive', 'diving_suit');

    // 寒冷服装
    const coldOutfits = [
      ['puffer_slacks', 4],
      ['hoodie_legwarmers', 3],
      ['sweater_sweatpants_sport', 2],
      ['leather_jacket_jeans', 1]
    ] as const;
    for (const key of coldOutfits.map(([name]) => name)) {
      wardrobe.wear('Robin', ['garden', 'park'], key, () => {
        if (Time.season !== 'winter') return false;
        if (!colours.outfit.has('cold')) colours.outfit.set('cold', coldOutfits.map(([name]) => name).either(coldOutfits.map(([, weight]) => weight)) ?? coldOutfits[0][0]);
        return colours.outfit.get('cold') === key;
      });
    }

    // 沙滩
    const beachOutfits = [
      ['tshirt_shorts', 3, 'm'],
      ['school_swim_shorts', 2, 'm'],
      ['summer_sundress', 3, 'f'],
      ['school_swimsuit', 2, 'f']
    ] as const;
    for (const [key, weight, gender] of beachOutfits) {
      wardrobe.wear('Robin', 'beach', key, () => {
        const robinGender = C.npc?.Robin?.pronoun === 'm' ? 'm' : 'f';
        if (gender !== robinGender) return false;
        const cacheKey = `beach.${robinGender}`;
        const options = beachOutfits.filter(([, , optionGender]) => optionGender === robinGender);
        if (!colours.outfit.has(cacheKey)) colours.outfit.set(cacheKey, options.map(([name]) => name).either(options.map(([, optionWeight]) => optionWeight)) ?? key);
        return colours.outfit.get(cacheKey) === key && weight > 0;
      });
    }

    hoodie(maplebirch, 'Robin', colours.outfit);

    // 日常服装配色
    schoolSwim(maplebirch, 'Robin', colours.outfit);
    const colourRules: Record<string, { slots: string[]; weights: Record<string, number> | (() => Record<string, number>) }[]> = {
      tshirt_shorts: [
        { slots: ['upper'], weights: { blue: 6, teal: 4, white: 3, green: 2, black: 1 } },
        { slots: ['lower'], weights: { blue: 6, teal: 3, black: 3, white: 2, green: 1 } }
      ],
      summer_sundress: [{ slots: ['upper', 'lower'], weights: { white: 6, pink: 5, purple: 2, teal: 2, blue: 1, red: 1 } }],
      puffer_slacks: [
        {
          slots: ['upper'],
          weights: (): Record<string, number> => (C.npc?.Robin?.pronoun === 'm' ? { blue: 6, teal: 4, white: 3, green: 2, black: 1 } : { white: 6, pink: 5, purple: 2, teal: 2, blue: 1 })
        },
        {
          slots: ['lower'],
          weights: (): Record<string, number> => (C.npc?.Robin?.pronoun === 'm' ? { blue: 6, teal: 3, black: 3, white: 2, green: 1 } : { white: 6, pink: 5, purple: 2, teal: 2, blue: 1 })
        }
      ],
      hoodie_legwarmers: [
        {
          slots: ['upper', 'lower', 'head'],
          weights: (): Record<string, number> =>
            C.npc?.Robin?.pronoun === 'm'
              ? { 'light blue': 6, 'blue steel': 5, teal: 4, grey: 3, white: 2, black: 1 }
              : { white: 6, 'light pink': 6, pink: 5, 'light blue': 3, 'light green': 2, purple: 2 }
        }
      ],
      sweater_sweatpants_sport: [
        {
          slots: ['lower'],
          weights: (): Record<string, number> =>
            C.npc?.Robin?.pronoun === 'm'
              ? { 'light blue': 6, 'blue steel': 5, teal: 4, grey: 3, black: 2, white: 1 }
              : { 'light pink': 6, white: 5, pink: 5, 'light blue': 3, 'light green': 2, purple: 2 }
        }
      ],
      leather_jacket_jeans: [
        {
          slots: ['upper'],
          weights: (): Record<string, number> =>
            C.npc?.Robin?.pronoun === 'm' ? { 'blue steel': 6, blue: 5, teal: 3, black: 2, brown: 1 } : { white: 6, pink: 5, purple: 3, 'soft brown': 2, wine: 2, 'blue steel': 1 }
        },
        {
          slots: ['lower'],
          weights: (): Record<string, number> =>
            C.npc?.Robin?.pronoun === 'm' ? { 'light blue': 6, denim: 5, 'blue steel': 4, black: 2 } : { 'light blue': 6, grey: 4, denim: 3, 'blue steel': 2, black: 1 }
        }
      ],
      school_swim_shorts: [{ slots: ['under_upper', 'under_lower'], weights: { blue: 6, teal: 4, black: 2, green: 1 } }],
      school_swimsuit: [{ slots: ['under_upper', 'under_lower'], weights: { white: 6, pink: 5, purple: 2, blue: 2, teal: 1 } }]
    };
    wardrobe.modify('Robin', (clothes, context) => {
      const rules = colourRules[context.key];
      if (!rules) return;
      for (const rule of rules) {
        const items = rule.slots.map(slot => ({ slot, item: clothes[slot as keyof typeof clothes] })).filter(entry => entry.item?.index);
        const optionSets = items
          .map(({ slot, item }) => (item?.index === undefined ? undefined : (setup.clothes[slot as keyof typeof setup.clothes]?.[item.index]?.colour_options as string[] | undefined)))
          .filter((options): options is string[] => Array.isArray(options) && options.length > 0);
        if (!optionSets.length || optionSets.length !== items.length) continue;
        const options = optionSets[0].filter(colour => optionSets.every(set => set.includes(colour)));
        if (!options.length) continue;
        const cacheKey = `${context.key}.${rule.slots.join('.')}`;
        let colour = colours.clothes.get(cacheKey);
        if (!colour || !options.includes(colour)) {
          colour = sidebar.randomColour(options, preferColours('Robin', typeof rule.weights === 'function' ? rule.weights() : rule.weights, C.npc?.Robin?.pronoun !== 'm'));
          colours.clothes.set(cacheKey, colour);
        }
        for (const { item } of items) if (item) item.colour = colour;
      }
    });

    // 颈手枷脱衣状态
    wardrobe.modify('Robin', (clothes, context) => {
      if (context.location !== 'pillory') return;
      const danger = V.robinPillory?.danger ?? 0;
      if (danger < 4) return;
      delete clothes.lower;
      if (danger <= 5) return;
      delete clothes.under_lower;
      if (C.npc?.Robin?.breastsize >= 1) {
        delete clothes.upper;
        delete clothes.under_upper;
      }
    });

    // 睡觉：睡衣
    wardrobe.wear('Robin', 'sleep', 'pyjama');

    // 归途之书的神殿值班与留宿，未启用神殿路线时不改变原版衣装。
    const temple = () => Boolean(maplebirch.get('RobinTemple'));
    wardrobe.wear('Robin', 'temple', 'initiate_robes', () => temple() && C.npc?.Robin?.pronoun === 'm');
    wardrobe.wear('Robin', 'temple', 'novice_nun_habit', () => temple() && C.npc?.Robin?.pronoun !== 'm');
    wardrobe.wear('Robin', 'temple', 'monk_habit', () => temple() && V.RobinTemple?.vigil_result === 'passed' && C.npc?.Robin?.pronoun === 'm');
    wardrobe.wear('Robin', 'temple', 'nun_habit', () => temple() && V.RobinTemple?.vigil_result === 'passed' && C.npc?.Robin?.pronoun !== 'm');
    wardrobe.wear('Robin', 'temple', 'pyjama', () => temple() && (Time.hour >= 21 || Time.hour < 7) && /^RobinTemple (?:Bunk|Bed|Sleep|Night Wake)(?: |$)/.test(maplebirch.passage.title));
    wardrobe.wear('Robin', 'temple', 'naked', () => temple() && ['RobinTemple Promise Altar', 'RobinTemple Promise End'].includes(maplebirch.passage.title));
    wardrobe.modify('Robin', (clothes, context) => {
      if (context.location !== 'temple' || !temple()) return;
      // 神殿服装使用自身头饰，避免把便服花环叠在兜帽上。
      if (clothes.head?.name === Clothing.flower_crown.name) delete clothes.head;
    });

    // 英语剧：罗宾扮演圣诞树，原版没有圣诞树服装，没招
    wardrobe.wear('Robin', 'englishPlay', 'naked');

    // 万圣节
    wardrobe.wear('Robin', 'halloween', 'witch', () => V.halloween_robin_costume === 'witch');
    wardrobe.wear('Robin', 'halloween', 'classy_vampire_formal', () => V.halloween_robin_costume === 'vampire');
    wardrobe.wear('Robin', 'halloween', 'ghost_sheet', () => V.halloween_robin_costume === 'ghost');

    // 圣诞礼物服装
    wardrobe.wear('Robin', 'christmas', 'tshirt_shorts', () => V.christmas_gift_robin === 'shirt');
    wardrobe.wear('Robin', 'christmas', 'summer_sundress', () => V.christmas_gift_robin === 'sundress');
    wardrobe.wear('Robin', 'christmas', 'kimono', () => V.christmas_gift_robin === 'kimono');
    wardrobe.wear('Robin', 'christmas', 'tuxedo_formal', () => V.christmas_gift_robin === 'tuxedo');
    wardrobe.wear('Robin', 'christmas', 'gothic_rose_gown', () => V.christmas_gift_robin === 'gothic gown');
    wardrobe.wear('Robin', 'christmas', 'christmas', () => V.christmas_gift_robin === 'christmas' && C.npc?.Robin?.pronoun === 'm');
    for (const key of ['christmas_dress', 'jingle_bell_christmas_dress'] as const) {
      wardrobe.wear('Robin', 'christmas', key, () => {
        if (V.christmas_gift_robin !== 'christmas' || C.npc?.Robin?.pronoun === 'm') return false;
        if (!colours.christmas.has('outfit')) colours.christmas.set('outfit', ['christmas_dress', 'jingle_bell_christmas_dress'].either() ?? 'christmas_dress');
        return colours.christmas.get('outfit') === key;
      });
    }
    wardrobe.modify('Robin', (clothes, context) => {
      if (context.location !== 'christmas' || V.christmas_gift_robin !== 'christmas' || C.npc?.Robin?.pronoun === 'm') return;
      if (!colours.christmas.has('head')) colours.christmas.set('head', ['christmas_hat', 'mini_snowman'].either() ?? 'christmas_hat');
      if (colours.christmas.get('head') === 'mini_snowman') sidebar.apply(clothes, Clothing.mini_snowman);
    });
    trainers(maplebirch, 'Robin', colours.outfit);
  });

  function location(): string {
    const title = maplebirch.passage.title;
    // 未解锁 Robin，不参与日程
    if (C.npc?.Robin?.init !== 1) return '';

    // 历史项目湖底勘察
    if (title.startsWith('Deadwood Reblooms History Project Lake') && V.LifeSimulation?.historyProject?.assistant) return 'historyDive';

    // 强制位置覆盖（剧情回放等）
    if (V.robinlocationoverride && V.robinlocationoverride.during.includes(Time.hour)) return V.robinlocationoverride.location;

    // 仅接管神殿内的当前剧情，邀请和回家页面沿用原版地点。
    if (maplebirch.get('RobinTemple') && V.location === 'temple' && title.startsWith('RobinTemple ')) return 'temple';

    // 迷雾营救：Rescue 2 中途从垃圾堆找到破衣，后续返程继续穿着。
    if (['Robin Mist Rescue 2', 'Robin Mist Walk', 'Robin Mist Abandon'].includes(title)) return 'mist';
    if (['Robin Mist Intro', 'Robin Mist Fight', 'Robin Mist Fight Finish', 'Robin Mist Rescue', 'Robin Mist Forgive', 'Robin Mist Silence'].includes(title)) return 'naked';

    // 剧情裸体
    if (
      ['Robin Hospital Watch', 'Robin Hospital 2', 'Docks_Robin', 'Underground Robin Hunt Intro'].some(prefix => title.startsWith(prefix)) ||
      (title.startsWith('Robin Unwrap') && !title.startsWith('Robin Unwrap No')) ||
      title.startsWith('Canteen Robin Sex') ||
      ['Robin Forest Vore Comfort 2', 'Robin Forest Vore Tasty 2', 'Robin Forest Vore Tasty 3'].some(prefix => title.startsWith(prefix))
    )
      return 'naked';

    // 圣诞礼物包装
    if (title.startsWith('Robin Unwrap No') || (title === "Robin's Room Entrance" && V.christmas_robin_lewd === 1)) return 'giftWrap';

    // 浴室内裸体，离开时裹毛巾
    if (['Robin Bath Join', 'Robin Bath Watch', 'Bath Robin Join'].some(prefix => title.startsWith(prefix))) return 'naked';

    // 恋爱后低创伤时裸体同睡
    if (title === 'Robin Bed') return V.robinromance === 1 && C.npc.Robin.trauma <= 20 ? 'naked' : 'sleep';

    // Robin 特殊失踪状态
    if (V.robinmissing === 'pillory' && (V.robinPillory?.naked || V.robinPillory?.danger >= 8)) return 'naked';
    if (['docks', 'landfill', 'dinner', 'pillory', 'mansion'].includes(V.robinmissing)) return V.robinmissing;

    // 颈手枷获救后保持裸体
    if (title.startsWith('Robin Pillory Escape Orphanage') && V.robinPillory?.naked) return 'naked';

    // 浴室剧情
    if (title.startsWith('Robin Bath')) return 'bath';

    // 万圣节剧情
    if (title.startsWith('Robin Trick')) return 'halloween';

    // 圣诞礼物服装
    if (V.christmas === 1 && Time.monthDay === 25 && V.christmas_gift_robin_given === true && Time.dayState !== 'night') return 'christmas';

    // 夜间休息时间
    if (Time.hour < 7 || Time.hour > 20) return 'sleep';

    // 学校时间
    if (Time.schoolDay && Time.hour >= 8 && Time.hour <= 15) return 'school';

    // 自动浇花
    if (
      V.robin.autoWater &&
      C.npc.Robin.trauma < 50 &&
      Weather.precipitation !== 'rain' &&
      (Weather.precipitation !== 'snow' || V.alex_greenhouse >= 3) &&
      ((Time.hour === 16 && Time.minute >= 30) || (Time.hour === 17 && Time.minute <= 29)) &&
      orphanagePlotsPlanted()
    ) {
      // 下午浇花
      if (Time.hour === 16 && Time.minute >= 30 && !orphanagePlotsWatered()) return 'garden';
      // 浇水后洗澡
      if (Time.hour === 17 && Time.minute <= 29 && !V.daily.robin.bath) return 'bath';
      // 洗澡完成返回孤儿院
      return 'orphanage';
    }

    // 普通下午洗澡时间
    if (Time.hour === 16 && Time.minute >= 30) return V.daily.robin.bath ? 'orphanage' : 'bath';

    // 万圣节活动
    if ((V.halloween === 1 && Time.monthDay === 31 && Time.hour >= 16 && Time.hour <= 18) || (title.includes('Robin Forest Costume') && !title.includes('Intro'))) return 'halloween';

    // 周末外出
    // 冬天去公园，其它季节去海滩
    if (Time.isWeekEnd() && Time.hour >= 9 && Time.hour <= 16 && Weather.precipitation !== 'rain' && C.npc.Robin.trauma < 80) return Time.season === 'winter' ? 'park' : 'beach';

    // 英语剧
    if (V.englishPlay === 'ongoing' && V.englishPlayDays === 0 && Time.hour >= 17 && Time.hour < 21) return 'englishPlay';

    // 上学日沿用校服
    if (Time.schoolDay) return 'school';

    // 默认孤儿院
    return 'orphanage';
  }
}
