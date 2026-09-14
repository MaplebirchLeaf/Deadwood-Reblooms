// ./src/script/NamedNPCSidebarPortrait/Kylar.ts

import type { MaplebirchCore } from '@scml-dol-maplebirch/types';
import type NPCSidebarPortrait from '../../module/NPCSidebarPortrait';
import { Clothing } from './Clothing';
import schoolUniforms from './SchoolUniform';

export default function (
  maplebirch: MaplebirchCore,
  colours: { school: Map<string, string>; schoolOutfit: Map<string, string>; clothes: Map<string, string>; christmas: Map<string, string>; roseEyepatch?: 'none' | 'alt' }
): void {
  maplebirch.npc.addSchedule('Kylar', schedule =>
    schedule.when(() => C.npc?.Kylar?.init === 1, location, {
      id: 'kylar-location'
    })
  );

  maplebirch.tool.onInit(() => {
    maplebirch.on(':npcInject', data, 'Kylar data');

    function data(npcName: string): void {
      if (npcName !== 'Kylar') return;
      V.maplebirch.npc.kylar.tucked = [false, false];
      const npc = V.NPCName?.find((data: any) => data?.nam === 'Kylar');
      if (!npc) return;
      npc.hair_fringe_type = 'framed';
      npc.hair_side_type = 'ruffled';
      if (npc.gender !== 'm') {
        npc.hairlength = 800;
      } else {
        npc.hairlength = 400;
      }
    }

    const sidebar = maplebirch.get('NPCSidebarPortrait') as NPCSidebarPortrait;
    const wardrobe = maplebirch.npc.Clothes.wardrobe;
    const female = wardrobe.get('female_underwear') ?? {};
    const male = wardrobe.get('male_underwear') ?? {};

    // 基层内衣：不穿内裤时仅保留女性上身内衣
    wardrobe.base('Kylar', (clothes, context) => {
      if (context.key === 'naked') return;
      const is_male = C.npc?.Kylar?.pronoun === 'm';
      const commando = V.kylarSeen?.includes('commando') || V.daily?.kylar?.undies === true;
      for (const item of Object.values(is_male ? male : female)) {
        if (commando && item.slot === 'under_lower') continue;
        sidebar.apply(clothes, item);
      }
      if (is_male) delete clothes.under_upper;
      else sidebar.apply(clothes, Clothing.hairpin);
    });

    // 剧情脱衣
    wardrobe.wear('Kylar', 'naked', 'naked');
    wardrobe.wear('Kylar', 'underwear', 'female_underwear', () => C.npc?.Kylar?.pronoun !== 'm');
    wardrobe.wear('Kylar', 'underwear', 'male_underwear', () => C.npc?.Kylar?.pronoun === 'm');

    // 学校制服
    const school = ['school', 'class', 'english', 'canteen', 'rear_courtyard', 'library'];
    schoolUniforms(maplebirch, sidebar, 'Kylar', school, colours);

    // 基础校服配色
    wardrobe.modify('Kylar', (clothes, context) => {
      if (!['school_uniform_skirt', 'school_uniform_trousers'].includes(context.key)) return;
      if (context.key === 'school_uniform_skirt') sidebar.apply(clothes, Clothing.short_school_skirt);
      if (clothes.upper) clothes.upper.colour = 'green';
      if (context.key === 'school_uniform_skirt' && clothes.lower) clothes.lower.colour = 'white';
    });

    // 日常服装
    wardrobe.wear('Kylar', ['manor_bedroom', 'park', 'arcade', 'abduction'], 'hoodie_legwarmers');
    wardrobe.modify('Kylar', (clothes, context) => {
      if (context.key !== 'hoodie_legwarmers') return;
      const is_male = C.npc?.Kylar?.pronoun === 'm';
      const groups: Array<{ key: string; slots: string[]; weights: Record<string, number> }> = [
        {
          key: `hoodie.main.${is_male ? 'male' : 'female'}`,
          slots: ['upper', 'lower', 'head'],
          weights: is_male ? { 'light blue': 6, 'blue steel': 5, teal: 4, grey: 3, white: 2, black: 1 } : { white: 6, 'light pink': 6, pink: 5, 'light blue': 3, 'light green': 2, purple: 2 }
        },
        {
          key: `hoodie.accent.${is_male ? 'male' : 'female'}`,
          slots: ['legs', 'feet'],
          weights: is_male ? { blue: 6, teal: 4, white: 3, black: 2, green: 1 } : { white: 6, pink: 5, purple: 3, teal: 2, blue: 1, red: 1 }
        }
      ];
      for (const group of groups) {
        const items = group.slots.map(slot => clothes[slot]).filter(item => item?.index !== undefined);
        if (items.length !== group.slots.length) continue;
        const optionSets = items.map(item => setup.clothes[item.slot]?.[item.index]?.colour_options as string[] | undefined);
        if (optionSets.some(options => !Array.isArray(options) || !options.length)) continue;
        const options = optionSets[0]!.filter(colour => optionSets.every(set => set!.includes(colour)));
        if (!options.length) continue;
        let colour = colours.clothes.get(group.key);
        if (!colour || !options.includes(colour)) {
          colour = sidebar.randomColour(options, group.weights);
          colours.clothes.set(group.key, colour);
        }
        for (const item of items) item.colour = colour;
      }
    });

    // 英语剧服装
    wardrobe.wear('Kylar', ['englishPlay', 'rehearsal'], 'english_play_sterling', () => V.englishPlayRoles?.Kylar === 'Sterling');
    wardrobe.wear('Kylar', ['englishPlay', 'rehearsal'], 'english_play_taylor', () => V.englishPlayRoles?.Kylar === 'Taylor');

    // 绑架剧情服装
    wardrobe.wear('Kylar', 'abduction_formal', 'vintage_pantsuit_formal', () => C.npc?.Kylar?.pronoun === 'm');
    wardrobe.wear('Kylar', 'abduction_formal', 'vintage_skirtsuit_formal', () => C.npc?.Kylar?.pronoun !== 'm');
    wardrobe.wear('Kylar', 'abduction_goth', 'gothic_formal_suit', () => C.npc?.Kylar?.pronoun === 'm');
    wardrobe.wear('Kylar', 'abduction_goth', 'gothic_rose_gown', () => C.npc?.Kylar?.pronoun !== 'm');
    wardrobe.wear('Kylar', 'abduction_swim', 'beach_shorts', () => C.npc?.Kylar?.pronoun === 'm');
    wardrobe.wear('Kylar', 'abduction_swim', 'bikini', () => C.npc?.Kylar?.pronoun !== 'm');

    // 地下室婚礼
    wardrobe.wear('Kylar', 'wedding', 'rose_wedding_suit', () => C.npc?.Kylar?.pronoun === 'm');
    wardrobe.wear('Kylar', 'wedding', 'rose_wedding_dress', () => C.npc?.Kylar?.pronoun !== 'm');
    wardrobe.modify('Kylar', (clothes, context) => {
      if (!['rose_wedding_suit', 'rose_wedding_dress'].includes(context.key)) return;
      colours.roseEyepatch ??= Math.random() < 0.5 ? 'none' : 'alt';
      sidebar.apply(clothes, { ...Clothing.rose_eyepatch, altposition: colours.roseEyepatch });
    });

    // 节日服装
    wardrobe.wear('Kylar', 'halloween', 'mummy');
    wardrobe.wear('Kylar', 'christmas', 'christmas', () => C.npc?.Kylar?.pronoun === 'm');
    const femaleChristmas = ['christmas_dress', 'jingle_bell_christmas_dress'] as const;
    for (const key of femaleChristmas) {
      wardrobe.wear('Kylar', 'christmas', key, () => {
        if (C.npc?.Kylar?.pronoun === 'm') return false;
        if (!colours.christmas.has('female')) colours.christmas.set('female', femaleChristmas[Math.floor(Math.random() * femaleChristmas.length)]);
        return colours.christmas.get('female') === key;
      });
    }

    // 监狱服装
    wardrobe.wear('Kylar', 'prison', 'prison_jumpsuit');
  });

  function location(): string {
    const title = maplebirch.passage.title;

    // 英语剧排练
    if (title.startsWith('English Play Rehearse') && (title.includes('Kylar') || title.includes('Both'))) return 'rehearsal';

    // 监狱剧情
    if (title.startsWith('Prison Kylar') || C.npc?.Kylar?.state === 'prison') return 'prison';

    // 绑架剧情
    if (title.startsWith('Kylar Abduction')) {
      if (V.kylar_clothes === 'formal') return 'abduction_formal';
      if (V.kylar_clothes === 'goth') return 'abduction_goth';
      if (V.kylar_clothes === 'swimsuit') return 'abduction_swim';
      return 'abduction';
    }

    // 浴室剧情
    if (['Kylar Bath Help', 'Kylar Bath Sex', 'Kylar Bath Watch', 'Kylar Bath Shove', 'Kylar Bath End'].some(prefix => title.startsWith(prefix))) return 'naked';

    // 公园交出衣服
    if (title.startsWith('Park Streak Kylar 2') || title.startsWith('Park Streak Kylar Seduce Sex Finish')) return V.kylarSeen?.includes('commando') ? 'naked' : 'underwear';
    if (title === 'Park Streak Kylar' && V.phase === 1 && C.npc?.Kylar?.love >= 50) return V.kylarSeen?.includes('commando') ? 'naked' : 'underwear';

    // 节日剧情
    if (title.startsWith('Kylar Halloween')) return 'halloween';
    if (/^Kylar Christmas (?:3|4|5)(?:\b|$)/.test(title)) return 'naked';
    if (title.startsWith('Kylar Christmas')) return 'christmas';

    // 地下室婚礼
    if (['Kylar Basement 4', 'Kylar Basement Protest', 'Kylar Basement Silent', 'Kylar Basement Police'].some(prefix => title.startsWith(prefix))) return 'wedding';

    // 换装前的剧情过渡
    if (title.startsWith('Kylar Bath') || title.startsWith('Kylar Basement')) return '';

    // 非活动状态
    if (C.npc?.Kylar?.state !== 'active') return C.npc?.Kylar?.state === '' ? 'inactive' : '';

    // 英语剧演出
    if (V.englishPlay === 'ongoing' && V.englishPlayDays === 0 && Time.hour >= 17 && Time.hour <= 20) return 'englishPlay';

    // 英语剧排练
    if (V.schoolstate === 'afternoon' && V.englishPlay === 'ongoing' && V.englishPlayRoles?.Kylar !== 'none') {
      const doubleRehearsal = V.englishPlayReadiness >= 56 && V.englishPlayRoles?.SydneyKnown && V.englishPlayRoles?.KylarKnown && !V.englishPlayDoubleRehearsal;
      if (doubleRehearsal) return 'rehearsal';
      if (!V.englishPlayRoles?.KylarKnown) return 'english';
      return 'rehearsal';
    }

    // 学校日程
    if (Time.schoolTime) {
      if (V.schoolstate === 'third') return 'english';
      if (V.schoolstate !== 'lunch') return 'class';

      // 午餐
      if (!V.daily.school.lunchEaten) return 'canteen';
      return Weather.precipitation === 'none' ? 'rear_courtyard' : 'library';
    }

    // 上学日沿用校服
    if (Time.schoolDay) return 'school';

    // 私人日程
    if (Time.hour < 7) return 'manor_bedroom';
    if (Time.hour >= 9 && Time.hour < 18) return Weather.precipitation === 'none' ? 'park' : 'arcade';
    return '';
  }
}
