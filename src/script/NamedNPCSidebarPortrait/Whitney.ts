import type { MaplebirchCore } from '@scml-dol-maplebirch/types';
import type NPCSidebarPortrait from '../../module/NPCSidebarPortrait';
import { Clothing } from './Clothing';
import schoolUniforms from './SchoolUniform';

export default function (maplebirch: MaplebirchCore, colours: { school: Map<string, string>; schoolOutfit: Map<string, string>; outfit: Map<string, string>; clothes: Map<string, string> }): void {
  maplebirch.npc.addSchedule('Whitney', schedule =>
    schedule.when(() => C.npc?.Whitney?.init === 1, location, {
      id: 'whitney-location'
    })
  );

  maplebirch.tool.onInit(() => {
    maplebirch.on(':npcInject', data, 'Whitney data');

    function data(npcName: string): void {
      if (npcName !== 'Whitney') return;
      V.maplebirch.npc.whitney.tucked = [true, false];
      const npc = V.NPCName?.find((data: any) => data?.nam === 'Whitney');
      if (!npc) return;
      npc.hair_side_type = 'straight bob';
      npc.hair_fringe_type = 'emo left';
      npc.hairlength = 600;
    }

    const sidebar = maplebirch.get('NPCSidebarPortrait') as NPCSidebarPortrait;
    const wardrobe = maplebirch.npc.Clothes.wardrobe;
    const female = wardrobe.get('female_underwear') ?? {};
    const male = wardrobe.get('male_underwear') ?? {};

    // 基层内衣
    wardrobe.base('Whitney', (clothes, context) => {
      if (context.key === 'naked') return;
      const is_male = C.npc?.Whitney?.pronoun === 'm';
      for (const item of Object.values(is_male ? male : female)) {
        if (context.location === 'topless' && item.slot === 'under_upper') continue;
        sidebar.apply(clothes, item);
      }
      if (is_male) delete clothes.under_upper;
    });

    // 日常服装
    const casualLocations = ['home', 'topless', 'park', 'pub', 'adult_shop', 'forest_shop', 'street', 'skyscraper', 'abduction', 'pillory'];
    const normalOutfits = [
      ['leather_jacket_jeans', 2],
      ['sweater_sweatpants_sport', 1]
    ] as const;
    for (const [key] of normalOutfits) {
      wardrobe.wear('Whitney', casualLocations, key, () => {
        if (Time.season === 'winter' || Time.season === 'summer' || Weather.temperature > 24) return false;
        if (!colours.outfit.has('normal')) colours.outfit.set('normal', normalOutfits.map(([name]) => name).either(normalOutfits.map(([, weight]) => weight)) ?? normalOutfits[0][0]);
        return colours.outfit.get('normal') === key;
      });
    }
    wardrobe.wear('Whitney', casualLocations, 'tshirt_shorts', () => Time.season !== 'winter' && (Time.season === 'summer' || Weather.temperature > 24));
    wardrobe.wear('Whitney', casualLocations, 'hoodie_legwarmers', () => Time.season === 'winter');

    // 学校制服
    schoolUniforms(maplebirch, sidebar, 'Whitney', 'school', colours);

    // 基础校服配色
    wardrobe.modify('Whitney', (clothes, context) => {
      if (!['school_uniform_skirt', 'school_uniform_trousers'].includes(context.key)) return;
      if (context.key === 'school_uniform_skirt') sidebar.apply(clothes, Clothing.short_school_skirt);
      if (clothes.upper) clothes.upper.colour = 'yellow';
      if (context.key === 'school_uniform_skirt' && clothes.lower) clothes.lower.colour = 'teal';
    });

    // 泳装
    wardrobe.wear('Whitney', ['school_swim', 'beach'], 'school_swim_shorts', () => C.npc?.Whitney?.pronoun === 'm');
    wardrobe.wear('Whitney', ['school_swim', 'beach'], 'school_swimsuit', () => C.npc?.Whitney?.pronoun !== 'm');

    // 剧情服装
    wardrobe.wear('Whitney', 'naked', 'naked');
    wardrobe.wear('Whitney', 'halloween', 'rags');

    // 赤裸上身
    wardrobe.modify('Whitney', (clothes, context) => {
      if (context.location !== 'topless') return;
      delete clothes.upper;
      delete clothes.under_upper;
    });

    // 颈手枷暴露状态
    wardrobe.modify('Whitney', (clothes, context) => {
      if (context.location !== 'pillory') return;
      if (V.pillory?.tenant?.upperexposed) delete clothes.upper;
      if (V.pillory?.tenant?.lowerexposed) delete clothes.lower;
    });

    // 日常与泳装配色
    const colourRules: Record<string, { slots: string[]; weights: () => Record<string, number> }[]> = {
      leather_jacket_jeans: [
        {
          slots: ['upper'],
          weights: (): Record<string, number> =>
            C.npc?.Whitney?.pronoun === 'm' ? { 'blue steel': 6, blue: 5, teal: 3, black: 2, brown: 1 } : { white: 6, pink: 5, purple: 3, 'soft brown': 2, wine: 2, 'blue steel': 1 }
        },
        {
          slots: ['lower'],
          weights: (): Record<string, number> =>
            C.npc?.Whitney?.pronoun === 'm' ? { 'light blue': 6, denim: 5, 'blue steel': 4, black: 2 } : { 'light blue': 6, grey: 4, denim: 3, 'blue steel': 2, black: 1 }
        }
      ],
      sweater_sweatpants_sport: [
        {
          slots: ['lower'],
          weights: (): Record<string, number> =>
            C.npc?.Whitney?.pronoun === 'm'
              ? { 'light blue': 6, 'blue steel': 5, teal: 4, grey: 3, black: 2, white: 1 }
              : { 'light pink': 6, white: 5, pink: 5, 'light blue': 3, 'light green': 2, purple: 2 }
        }
      ],
      tshirt_shorts: [
        {
          slots: ['upper'],
          weights: (): Record<string, number> => (C.npc?.Whitney?.pronoun === 'm' ? { blue: 6, teal: 4, white: 3, green: 2, black: 1 } : { white: 6, pink: 5, purple: 3, teal: 2, blue: 1 })
        },
        {
          slots: ['lower'],
          weights: (): Record<string, number> => (C.npc?.Whitney?.pronoun === 'm' ? { blue: 6, teal: 3, black: 3, white: 2, green: 1 } : { white: 6, pink: 5, purple: 3, teal: 2, blue: 1 })
        }
      ],
      school_swim_shorts: [
        {
          slots: ['under_lower'],
          weights: () => ({ blue: 6, 'light blue': 5, teal: 3, white: 2, black: 1 })
        }
      ],
      school_swimsuit: [
        {
          slots: ['under_upper', 'under_lower'],
          weights: () => ({ white: 6, 'light pink': 6, pink: 5, 'light blue': 3, purple: 2, teal: 1 })
        }
      ],
      hoodie_legwarmers: [
        {
          slots: ['upper', 'lower', 'head'],
          weights: (): Record<string, number> =>
            C.npc?.Whitney?.pronoun === 'm'
              ? { 'light blue': 6, 'blue steel': 5, blue: 4, teal: 3, grey: 2, black: 1 }
              : { white: 6, 'light pink': 6, pink: 5, 'light blue': 3, 'light green': 2, purple: 2 }
        },
        {
          slots: ['legs', 'feet'],
          weights: (): Record<string, number> => (C.npc?.Whitney?.pronoun === 'm' ? { blue: 6, teal: 4, white: 3, black: 2, green: 1 } : { white: 6, pink: 5, purple: 3, teal: 2, blue: 1, red: 1 })
        }
      ]
    };
    wardrobe.modify('Whitney', (clothes, context) => {
      const rules = colourRules[context.key];
      if (!rules) return;
      for (const rule of rules) {
        const items = rule.slots.map(slot => clothes[slot]).filter(item => item?.index !== undefined);
        if (items.length !== rule.slots.length) continue;
        const optionSets = items.map(item => setup.clothes[item.slot]?.[item.index]?.colour_options as string[] | undefined);
        if (optionSets.some(options => !Array.isArray(options) || !options.length)) continue;
        const options = optionSets[0]!.filter(colour => optionSets.every(set => set!.includes(colour)));
        if (!options.length) continue;
        const cacheKey = `${context.key}.${rule.slots.join('.')}`;
        let colour = colours.clothes.get(cacheKey);
        if (!colour || !options.includes(colour)) {
          colour = sidebar.randomColour(options, rule.weights());
          colours.clothes.set(cacheKey, colour);
        }
        for (const item of items) item.colour = colour;
      }
    });
  });

  function location(): string {
    const title = maplebirch.passage.title;
    const whitney = C.npc?.Whitney;
    if (whitney?.init !== 1) return '';

    // 洗澡剧情
    if (title.startsWith('Whitney Home Dawn Shower')) return 'naked';

    // 反向抢劫剧情
    if (title.startsWith('Bully Rob Reversal') || title.startsWith('Bully Alley Rob') || title.startsWith('Bully Alley Sex') || title.startsWith('Bully No Alley Sex')) return 'naked';

    // 游泳剧情
    if (title.startsWith('School Pool')) return 'school_swim';
    if (title.startsWith('Whitney Beach')) return 'beach';

    // 万圣节剧情
    if (title.startsWith('Whitney Trick') || title.startsWith('Kylar Halloween')) return 'halloween';

    // 惠特尼家中剧情
    if (title.startsWith('Whitney Home')) {
      if (title.startsWith('Whitney Home Knock') && ['dusk', 'night'].includes(Time.dayState)) return '';
      if (Time.dayState === 'dawn' && (title.startsWith('Whitney Home Knock') || title.startsWith('Whitney Home Dawn'))) return 'topless';
      return 'home';
    }

    // 临时剧情地点
    if (title.startsWith('Adult Shop Whitney') || title.startsWith('Adult Shop Dildo Thief')) return 'adult_shop';
    if (title.startsWith('Forest Shop Familiar Whitney')) return 'forest_shop';
    if (title.startsWith('Skyscraper Whitney')) return 'skyscraper';
    if (title.startsWith('Whitney Pub')) return 'pub';
    if (title.startsWith('Whitney Abduction')) return 'abduction';

    // 非活动状态
    if (whitney.state === 'pillory') return 'pillory';
    if (whitney.state === 'dungeon' || !['active', 'rescued'].includes(whitney.state)) return '';

    // 上学日沿用校服
    if (Time.schoolDay) return 'school';

    // 私人日程
    if (Time.dayState === 'dawn' || Time.hour < 9) return 'topless';
    if (Time.weekDay === 1 && Time.hour >= 21) return 'pub';
    if (Time.dayState === 'day') return 'park';
    return '';
  }
}
