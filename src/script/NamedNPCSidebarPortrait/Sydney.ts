// ./src/script/NamedNPCSidebarPortrait/Sydney.ts

import type { MaplebirchCore } from '@scml-dol-maplebirch/types';
import type NPCSidebarPortrait from '../../module/NPCSidebarPortrait';
import { Clothing } from './Clothing';
import schoolSwim from './Common/SchoolSwim';
import { preferColours } from './Common/Preference';
import schoolUniforms, { schoolUniformKeys } from './Common/SchoolUniform';

export default function (maplebirch: MaplebirchCore, colours: { school: Map<string, string>; schoolOutfit: Map<string, string>; swim: Map<string, string>; cow?: string }) {
  'use strict';

  maplebirch.npc.addSchedule('Sydney', schedule =>
    schedule.when(() => C.npc?.Sydney?.init === 1, location, {
      id: 'sydney-location'
    })
  );

  maplebirch.tool.onInit(() => {
    maplebirch.on(':npcInject', data, 'Sydney data');

    function data(npcName: string): void {
      if (npcName !== 'Sydney') return;
      V.maplebirch.npc.sydney.tucked = [true, false];
      const npc = V.NPCName?.find((data: any) => data?.nam === 'Sydney');
      if (!npc) return;
      const loose = V.sydney?.hair === 'loose';
      npc.hair_side_type = loose ? 'loose' : 'ponytail';
      npc.hair_fringe_type = loose ? 'loose' : 'straight tails';
      if (npc.gender === 'm') {
        npc.hair_sides_length = 400;
        npc.hair_fringe_length = 200;
      } else {
        npc.hair_sides_length = 800;
        npc.hair_fringe_length = 400;
      }
    }

    const sidebar = maplebirch.get('NPCSidebarPortrait') as NPCSidebarPortrait;
    const wardrobe = maplebirch.npc.Clothes.wardrobe as typeof maplebirch.npc.Clothes.wardrobe & {
      layer(npcName: string, source: string | (() => string), cond?: () => boolean): void;
      put(clothes: Record<string, any>, key: string): void;
      strip(clothes: Record<string, any>, slot: string | readonly string[]): void;
    };

    // 基层内衣：腐化低于 10 时，男性使用男性内衣，其他性别使用女性内衣
    wardrobe.layer(
      'Sydney',
      () => (C.npc?.Sydney?.pronoun === 'm' ? 'male_underwear' : 'female_underwear'),
      () => (C.npc?.Sydney?.corruption ?? 0) < 10
    );

    // 基层饰品
    wardrobe.base('Sydney', clothes => {
      const is_male = C.npc?.Sydney?.pronoun === 'm';
      sidebar.apply(clothes, Clothing.holy_pendant);
      if (V.sydney?.glasses === 'contacts') wardrobe.strip(clothes, 'face');
      else sidebar.apply(clothes, Clothing.glasses);

      if (is_male) wardrobe.strip(clothes, 'head');
      else sidebar.apply(clothes, Clothing.hairpin);
    });

    // 贞操带：阴茎或阴道被贞操带锁住时显示
    wardrobe.modify('Sydney', clothes => {
      const chastity = C.npc?.Sydney?.chastity;
      if (chastity?.penis !== 'chastity belt' && chastity?.vagina !== 'chastity belt') return;
      wardrobe.put(clothes, 'chastity_belt');
    });

    // 学校制服
    const school = ['library', 'science', 'class', 'canteen', 'late'];
    schoolUniforms(maplebirch, sidebar, 'Sydney', school, colours);

    // 仅校服使用卷袖素材，神殿和其他剧情服装保持原始袖型
    wardrobe.modify('Sydney', (clothes, context) => {
      if (!(schoolUniformKeys as readonly string[]).includes(context.key)) return;
      const upper = clothes.upper;
      if (upper?.index === undefined || setup.clothes.upper?.[upper.index]?.altsleeve === undefined) return;
      upper.altsleeve = 'alt';
    });

    // 校服裙
    wardrobe.modify('Sydney', (clothes, context) => {
      if (!['school_uniform_skirt', 'classic_serafuku_short_skirt'].includes(context.key)) return;
      if ((C.npc?.Sydney?.corruption ?? 0) >= 10) sidebar.apply(clothes, Clothing.short_school_skirt);
      else if ((C.npc?.Sydney?.purity ?? 0) >= 50) sidebar.apply(clothes, Clothing.long_school_skirt);
    });

    // 奶牛套装配色
    wardrobe.modify('Sydney', (clothes, context) => {
      if (context.key !== 'cow_onesie') return;
      const hands = clothes.hands;
      const options = hands?.index === undefined ? undefined : (setup.clothes.hands?.[hands.index]?.accessory_colour_options as string[] | undefined);
      if (!options) return;
      const weights = Object.fromEntries(options.filter(colour => colour !== 'custom').map(colour => [colour, 1]));
      colours.cow ??= sidebar.randomColour(options, preferColours('Sydney', weights));
      for (const slot of ['upper', 'lower', 'under_upper', 'under_lower', 'head', 'hands', 'legs'] as const) {
        if (clothes[slot]) clothes[slot].accessory_colour = colours.cow;
      }
    });

    // 神殿基础服装：男性穿修士服，其他性别穿修女服，女性见习教徒穿见习修女服
    wardrobe.wear('Sydney', 'temple', 'nun_habit', () => C.npc?.Sydney?.pronoun !== 'm' && V.sydney?.rank === 'monk');
    wardrobe.wear('Sydney', 'temple', 'monk_habit', () => C.npc?.Sydney?.pronoun === 'm' && V.sydney?.rank === 'monk');
    wardrobe.wear('Sydney', 'temple', 'novice_nun_habit', () => C.npc?.Sydney?.pronoun !== 'm' && ['initiate', '见习教徒'].includes(V.sydney?.rank));
    wardrobe.wear('Sydney', 'temple', 'initiate_robes', () => C.npc?.Sydney?.pronoun === 'm' && ['initiate', '见习教徒'].includes(V.sydney?.rank));

    // 告解室：只在原版选中 Sydney 告解事件后换上对应性别的告解员服装
    wardrobe.wear('Sydney', 'confessional', 'confessor_robe', () => C.npc?.Sydney?.pronoun === 'm');
    wardrobe.wear('Sydney', 'confessional', 'confessor_habit', () => C.npc?.Sydney?.pronoun !== 'm');

    // 承诺仪式评估：女性换上宣誓修女服；正式仪式阶段仍按原剧情脱光
    wardrobe.wear('Sydney', 'promise', 'avowed_nun_habit', () => C.npc?.Sydney?.pronoun !== 'm');

    // 特殊修女服：满足恋爱、腐化和欲望条件时覆盖普通修女服
    wardrobe.wear(
      'Sydney',
      'temple',
      'sexy_nun_habit',
      () => C.npc?.Sydney?.pronoun !== 'm' && V.sydney?.rank === 'monk' && window.isLoveInterest('Sydney') && C.npc?.Sydney?.corruption >= 40 && C.npc?.Sydney?.lust >= 20
    );

    // 英语剧服装：根据 Sydney 的角色显示 Sterling 或 Cass 戏服
    wardrobe.wear('Sydney', ['englishPlay', 'rehearsal'], 'english_play_sterling', () => V.englishPlayRoles?.Sydney === 'Sterling');
    wardrobe.wear('Sydney', ['englishPlay', 'rehearsal'], 'english_play_cass', () => V.englishPlayRoles?.Sydney === 'Cass');

    // 废弃商店
    wardrobe.wear('Sydney', 'shop', 'waist_apron', () => V.adultshopprogress < 8 && C.npc?.Sydney?.corruption >= 10 && maplebirch.passage.title === 'Dilapidated Help');

    // 成人商店开业
    wardrobe.wear('Sydney', 'shopOpening', 'cow_onesie', () => C.npc?.Sydney?.purity < 50);
    wardrobe.wear('Sydney', 'shopOpening', 'babydoll_lingerie', () => C.npc?.Sydney?.corruption >= 10);

    // Sydney 泳装时刻
    wardrobe.wear('Sydney', 'swim', 'school_swim_shorts', () => C.npc?.Sydney?.pronoun === 'm' && V.sydney?.swim === 'school');
    wardrobe.wear('Sydney', 'swim', 'school_swimsuit', () => C.npc?.Sydney?.pronoun !== 'm' && V.sydney?.swim === 'school');
    wardrobe.wear('Sydney', 'swim', 'beach_shorts', () => C.npc?.Sydney?.pronoun === 'm' && V.sydney?.swim === 'normal');
    wardrobe.wear('Sydney', 'swim', 'bikini', () => C.npc?.Sydney?.pronoun !== 'm' && V.sydney?.swim === 'normal');
    wardrobe.wear('Sydney', 'swim', 'speedo', () => C.npc?.Sydney?.pronoun === 'm' && V.sydney?.swim === 'lewd');
    wardrobe.wear('Sydney', 'swim', 'microkini', () => C.npc?.Sydney?.pronoun !== 'm' && V.sydney?.swim === 'lewd');
    wardrobe.wear('Sydney', 'swim', 'bikini', () => C.npc?.Sydney?.pronoun === 'm' && V.sydney?.swim === 'crossdress');
    wardrobe.wear('Sydney', 'swim', 'beach_shorts', () => C.npc?.Sydney?.pronoun !== 'm' && V.sydney?.swim === 'crossdress');

    // 泳装配色
    schoolSwim(maplebirch, 'Sydney', colours.swim);
    wardrobe.modify('Sydney', (clothes, context) => {
      if (!['school_swim_shorts', 'school_swimsuit', 'beach_shorts', 'bikini', 'speedo', 'microkini'].includes(context.key)) return;
      const items = (
        [
          ['under_upper', clothes.under_upper],
          ['under_lower', clothes.under_lower]
        ] as const
      ).filter((entry): entry is ['under_upper' | 'under_lower', NonNullable<(typeof clothes)['under_upper']>] => Boolean(entry[1]?.index));
      const optionSets = items
        .map(([slot, item]) => (item.index === undefined ? undefined : (setup.clothes[slot]?.[item.index]?.colour_options as string[] | undefined)))
        .filter((options): options is string[] => Array.isArray(options) && options.length > 0);
      if (!optionSets.length || optionSets.length !== items.length) return;
      const options = optionSets[0].filter(colour => optionSets.every(set => set.includes(colour)));
      if (!options.length) return;
      let weights: Record<string, number>;
      if (context.key === 'school_swim_shorts') {
        weights = { blue: 6, teal: 4, black: 2, green: 1 };
      } else if (context.key === 'school_swimsuit') {
        weights = { white: 6, pink: 5, purple: 2, blue: 2, teal: 1 };
      } else if (context.key === 'beach_shorts') {
        weights = { blue: 6, teal: 4, 'pale white': 3, black: 2, green: 1 };
      } else if (context.key === 'speedo') {
        weights = { blue: 6, teal: 4, white: 3, black: 2, green: 1 };
      } else if (context.key === 'microkini') {
        weights = { white: 6, pink: 5, purple: 3, teal: 2, blue: 1, red: 1 };
      } else {
        weights = { white: 6, pink: 5, purple: 3, teal: 2, blue: 1, red: 1 };
      }
      let colour = colours.swim.get(context.key);
      if (!colour) {
        const femaleStyle = ['school_swimsuit', 'bikini', 'microkini'].includes(context.key);
        colour = sidebar.randomColour(options, preferColours('Sydney', weights, femaleStyle));
        colours.swim.set(context.key, colour);
      }
      if (clothes.under_upper) clothes.under_upper.colour = colour;
      if (clothes.under_lower) clothes.under_lower.colour = colour;
    });

    // 剧情脱衣
    wardrobe.modify('Sydney', clothes => {
      const title = maplebirch.passage.title;
      const all = ['over_head', 'over_upper', 'over_lower', 'upper', 'lower', 'under_upper', 'under_lower', 'head', 'face', 'neck', 'hands', 'legs', 'feet', 'handheld'];
      const naked =
        title === 'Sydney Temple Test' ||
        title === 'Sydney Temple Test 2' ||
        title === 'Sydney Temple Corrupt End' ||
        title.startsWith('Sydney Temple Pure Ritual') ||
        title === 'Sydney Temple Pure Pass' ||
        title.startsWith('Sydney Temple Pure Sex') ||
        title === 'Temple Vigil Undress' ||
        /^Temple Vigil (?:[5-9]|1[0-4])$/.test(title) ||
        title === 'Nightmare Corrupt Sydney 12' ||
        title.startsWith('Nightmare Corrupt Sydney Rape');

      if (naked) {
        wardrobe.strip(clothes, all);
        return;
      }

      if (title.startsWith('Dilapidated Paint')) {
        wardrobe.strip(clothes, all);
        return;
      }

      if (title === 'Sydney Canteen Encourage' || (title === 'Sydney Canteen Break' && (C.npc?.Sydney?.corruption ?? 0) >= 10)) {
        wardrobe.strip(clothes, 'lower');
        return;
      }

      if (title === 'Sydney Leighton Spank' || title === 'Sydney Leighton Spank 2') {
        wardrobe.strip(clothes, 'lower');
        if ((C.npc?.Sydney?.corruption ?? 0) >= 10 || (title.endsWith(' 2') && V.phase === 2)) wardrobe.strip(clothes, 'under_lower');
        return;
      }

      if (title === 'Sydney Beach Promenade Changing Rooms' && (C.npc?.Sydney?.corruption ?? 0) >= 10 && V.sydneyromance === 1) {
        wardrobe.strip(clothes, ['upper', 'lower']);
        return;
      }

      if (title === 'Sydney Shopping Swim Enter' || title === 'Sydney Shopping Lock') {
        if ((C.npc?.Sydney?.corruption ?? 0) >= 10 && V.sydneyromance === 1) {
          wardrobe.strip(clothes, all);
        } else if ((C.npc?.Sydney?.corruption ?? 0) >= 10) {
          wardrobe.strip(clothes, ['upper', 'under_upper']);
        } else {
          wardrobe.strip(clothes, ['upper', 'lower']);
        }
      }
    });

    // 海滨长廊湿度
    wardrobe.wet('Sydney', 'damp', () => maplebirch.passage.title.includes('Sydney Beach Promenade Move'));
    wardrobe.wet('Sydney', 'soaked', () => maplebirch.passage.title.includes('Sydney Beach Promenade Soak'));
  });

  function location(): string {
    const title = maplebirch.passage.title;
    // 回放场景强制位置
    if (V.sydney_location_override && V.replayScene) return V.sydney_location_override;

    // 英语剧排练
    if (title.startsWith('English Play Rehearse') && (title.includes('Sydney') || title.includes('Both'))) return 'rehearsal';

    // 腐化噩梦以神殿服装开始，后段由剧情脱衣规则清空
    if (title.startsWith('Nightmare Corrupt Sydney')) return 'temple';

    // 海滨长廊保留原服装
    if (title.startsWith('Sydney Beach Promenade') || title === 'Sydney Beach Start') return '';

    // 离开海滩时换回原服装
    if (title.startsWith('Sydney Beach Leave')) return V.exit === 'library' ? 'library' : 'temple';

    // 医院与车程保留剧情服装
    if (title === 'Ambulance Sydney' || title.startsWith('Hospital Sydney') || title.startsWith('Sydney Ride')) return '';

    // 成人商店开业
    if (title.startsWith('Adult Shop Opening')) {
      if (title === 'Adult Shop Opening Refuse 3') return 'temple';
      if (
        [
          'Adult Shop Opening',
          'Adult Shop Opening Walk',
          'Adult Shop Opening 2',
          'Adult Shop Opening Corrupt',
          'Adult Shop Opening Neutral',
          'Adult Shop Opening Pure',
          'Adult Shop Opening Refuse'
        ].includes(title)
      )
        return '';
      return 'shopOpening';
    }

    // 承诺仪式评估服装优先于普通神殿服装
    if (title.startsWith('Sydney Temple Pure')) return 'promise';

    // PC 作为忏悔者时，原版会在 Temple Confess Self 中把 $attendant 设为 Sydney。
    if (title.startsWith('Temple Confess Self') && V.attendant === 'Sydney') return 'confessional';

    // VanillaPlus 课堂互动始终使用科学教室状态；换班与神殿叫醒场景保留各自地点。
    if (['Deadwood Reblooms Sydney Science Study', 'Deadwood Reblooms Sydney Science Chat', 'Deadwood Reblooms Sydney Science Tease'].includes(title)) return 'science';

    // 明确剧情地点
    if (V.location === 'temple') return 'temple';
    if (title.startsWith('Sydney Library')) return 'library';
    if (title.startsWith('Sydney Canteen')) return 'canteen';
    if (V.location === 'adult_shop') return 'shop';

    // Sydney 泳装时刻
    if (title === 'Sydney Shopping Swim Enter' || title === 'Sydney Shopping Lock') return '';
    if (
      (title.includes('Sydney Beach') && title !== 'Sydney Beach Changing Room') ||
      (title.includes('Sydney Shopping Swim') && !['Sydney Shopping Swim', 'Sydney Shopping Swim Convince'].includes(title)) ||
      title.includes('Sydney Shopping Lock')
    ) {
      return 'swim';
    }

    // 购物与理发期间保持来时服装
    if (title.startsWith('Sydney Shopping') || title.startsWith('Sydney Hairdressers')) return V.exit === 'library' ? 'library' : 'temple';

    // 惩罚回家
    if (V.daily.sydney.punish === 1) return 'home';
    // 英语剧

    if (V.englishPlay === 'ongoing' && V.englishPlayDays === 0 && Time.hour >= 17 && Time.hour <= 20) return 'englishPlay';

    // 周一礼拜
    if (Time.weekDay === 1) return 'temple';

    // 周日
    if (Time.weekDay === 7) {
      if (V.adultshopopeningsydney === true && Time.hour < 21) return 'shop';
      return Time.hour >= 6 ? 'temple' : 'home';
    }
    // 周六下午商店

    if (Time.weekDay === 6 && Time.hour >= 16 && Time.hour <= 19) return V.adultshophelped === 1 ? 'temple' : 'shop';

    // 腐化后的商店事件
    if (V.sydneySeen !== undefined && V.adultshopunlocked && C.npc.Sydney.corruption > 10 && Time.hour >= 16 && Time.hour <= 19) {
      const corruption = C.npc.Sydney.corruption;
      if (V.adultshophelped === 1) return 'temple';
      if (corruption > 10 && Time.weekDay === 4) return 'shop';
      if (corruption > 20 && Time.weekDay === 5) return 'shop';
      if (corruption > 30 && Time.weekDay === 3 && V.sydney.rank === 'initiate') return 'shop';
      if (corruption > 40 && Time.weekDay === 2 && V.sydney.rank === 'initiate') return 'shop';
    }

    // 非学期
    if (!Time.schoolTerm) return Time.hour >= 6 && Time.hour <= 22 ? 'temple' : 'home';

    // 非上课日
    if (!Time.schoolDay) return 'home';

    // 深夜
    if (Time.hour <= 5) return 'home';

    // 迟到
    if (Time.hour >= 6 && Time.hour <= 9 && V.sydneyLate === 1) return 'late';

    // 早晨神殿
    if (Time.hour === 6) return 'temple';

    // 图书馆
    if (Time.hour === 7 || Time.hour === 8 || (Time.hour === 9 && V.sydneyScience !== 1)) return 'library';

    // 科学课
    if (Time.hour === 9) return 'science';

    // 正课
    if (['second', 'third'].includes(V.schoolstate)) return 'class';

    // 午餐
    if (V.schoolstate === 'lunch' && V.daily.school.lunchEaten !== 1 && Time.minute <= 15) return 'canteen';

    // 排练
    if (V.englishPlay === 'ongoing' && V.schoolstate === 'afternoon') return 'rehearsal';

    // 下午学习
    if (Time.hour <= 15 || (Time.hour === 16 && Time.minute <= 40)) return V.daily.sydney.templeSkip ? 'temple' : 'library';

    // 晚上神殿
    if (Time.hour <= 22) return 'temple';
    return 'home';
  }
}
