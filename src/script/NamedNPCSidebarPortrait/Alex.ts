// ./src/script/NamedNPCSidebarPortrait/Alex.ts

import type { MaplebirchCore } from '@scml-dol-maplebirch/types';
import type NPCSidebarPortrait from '../../module/NPCSidebarPortrait';
import { Clothing } from './Clothing';

type DailyCache = { outfit: Map<string, string> };

export default function (maplebirch: MaplebirchCore, colours: DailyCache): void {
  maplebirch.npc.addSchedule('Alex', schedule =>
    schedule.when(() => C.npc?.Alex?.init === 1 && V.farm_stage !== undefined, location, {
      id: 'alex-location'
    })
  );

  maplebirch.tool.onInit(() => {
    maplebirch.on(':npcInject', data, 'Alex data');

    function data(npcName: string): void {
      if (npcName !== 'Alex') return;
      V.maplebirch.npc.alex.tucked = [true, true];
      const npc = V.NPCName?.find((data: any) => data?.nam === 'Alex');
      if (!npc) return;
      npc.hair_fringe_type = 'sweep';
      if (npc.gender !== 'm') {
        npc.hair_side_type = 'fluffy ponytail';
        npc.hair_sides_length = 600;
        npc.hair_fringe_length = 400;
      } else {
        npc.hair_side_type = 'ruffled';
        npc.hair_sides_length = 400;
        npc.hair_fringe_length = 200;
      }
    }

    const sidebar = maplebirch.get('NPCSidebarPortrait') as NPCSidebarPortrait;
    const wardrobe = maplebirch.npc.Clothes.wardrobe;
    const female = wardrobe.get('female_underwear') ?? {};

    // 日常保留女性胸罩和红黑条纹内裤；睡衣明确不穿胸罩
    wardrobe.base('Alex', (clothes, context) => {
      if (context.location === 'naked' || context.location === 'sleep_shirt_only') return;
      if (context.location !== 'sleep' && C.npc?.Alex?.pronoun !== 'm' && female.under_upper) sidebar.apply(clothes, female.under_upper);
      sidebar.apply(clothes, Clothing.striped_panties);
    });

    // 农场劳动、临时进城与小屋生活；原版没有校园日程
    wardrobe.wear('Alex', ['farm', 'woodland', 'admin', 'breakfast', 'town', 'summer', 'lower_removed'], 'wilds_flannel');
    wardrobe.wear('Alex', ['sleep', 'sleep_shirt_only'], 'pyjama');
    wardrobe.wear('Alex', 'naked', 'naked');

    wardrobe.modify('Alex', (clothes, context) => {
      if (context.key === 'wilds_flannel') {
        const options = C.npc?.Alex?.pronoun === 'm' ? ['jeans', 'denim_shorts'] : ['jeans', 'denim_shorts', 'checkered_skirt'];
        let lower = colours.outfit.get('farm.lower');
        if (!lower || !options.includes(lower)) {
          lower = weightedChoice(options, [4, 3, 2].slice(0, options.length));
          colours.outfit.set('farm.lower', lower);
        }
        if (lower === 'denim_shorts') sidebar.apply(clothes, Clothing.denim_shorts);
        if (lower === 'checkered_skirt') sidebar.apply(clothes, Clothing.checkered_skirt);

        if (clothes.upper) clothes.upper.altsleeve = 'alt';
        if (context.location === 'summer' && clothes.upper) clothes.upper.altposition = 'alt';
      }

      if (context.key === 'pyjama') {
        const tops = ['standard', 'band_t_shirt', 'boxy_t_shirt'];
        const top = cachedChoice('sleep.upper', tops, [4, 2, 2]);
        sidebar.apply(clothes, Clothing.t_shirt);
        if (top === 'band_t_shirt') sidebar.apply(clothes, Clothing.band_t_shirt);
        if (top === 'boxy_t_shirt') sidebar.apply(clothes, Clothing.boxy_t_shirt);
        delete clothes.lower;

        const shoes = cachedChoice('sleep.feet', ['animal_slippers', 'strawberry_slippers'], [4, 1]);
        if (shoes === 'strawberry_slippers') sidebar.apply(clothes, Clothing.strawberry_slippers);
      }

      if (context.location === 'lower_removed') delete clothes.lower;
      if (context.location === 'sleep_shirt_only') {
        delete clothes.under_upper;
        delete clothes.under_lower;
      }
    });

    function cachedChoice(key: string, options: string[], weights: number[]): string {
      let value = colours.outfit.get(key);
      if (!value || !options.includes(value)) {
        value = weightedChoice(options, weights);
        colours.outfit.set(key, value);
      }
      return value;
    }

    function weightedChoice(options: string[], weights: number[]): string {
      const total = weights.reduce((sum, weight) => sum + Math.max(0, weight), 0);
      if (total <= 0) return options[0];
      let roll = Math.random() * total;
      for (let index = 0; index < options.length; index++) {
        roll -= Math.max(0, weights[index] ?? 0);
        if (roll < 0) return options[index];
      }
      return options[0];
    }
  });

  function location(): string {
    const alex = C.npc?.Alex;
    const title = maplebirch.passage.title;
    if (alex?.init !== 1 || V.farm_stage === undefined) return '';

    // 户外淋浴与明确的全裸性行为优先于普通农场日程
    if (title === 'Farm Spy' || title === 'Farm Alex Tease Demand' || title.startsWith('Farm Alex Hungover Sex') || title.startsWith('Farm Tending Alex Sex')) return 'naked';

    // 猪扯掉裙子或短裤，只移除外层下装
    if (title.startsWith('Farm Pigs Alex Scold') || title.startsWith('Farm Pigs Alex Watch')) return 'lower_removed';

    // 卧室恶作剧与睡眠侵犯阶段保留 T 恤，移除内裤
    if (title === 'Farm Bedroom Revenge' || title === 'Farm Alex Tease' || title.startsWith('Farm Alex Somno 2') || title === 'Farm Alex Somno Orgasm') return 'sleep_shirt_only';
    if (title.startsWith('Farm Alex Somno Wake Sex')) return 'sleep_shirt_only';
    if (title.startsWith('Farm Alex Birth')) return 'sleep_shirt_only';

    // 噩梦从睡衣开始；只有高欲望分支自行脱去下装
    if (title === 'Nightmare Alex 2') return (alex.lust ?? 0) >= 60 ? 'sleep_shirt_only' : 'sleep';
    if (title.startsWith('Nightmare Alex Rape')) return (alex.lust ?? 0) >= 60 ? 'sleep_shirt_only' : 'sleep';
    if (title.startsWith('Nightmare Alex')) return 'sleep';

    // 归还内裤、醉酒卧床与其余卧室睡眠段落恢复完整睡衣
    if (title === 'Farm Alex Tease Give' || title.startsWith('Farm Alex Hungover') || title.startsWith('Farm Alex Somno') || title.startsWith('Farm Alex Bed')) return 'sleep';

    // 夏季劳作会解开法兰绒衬衫的纽扣
    if (title.startsWith('Farm Tending Alex Summer')) return 'summer';

    // 临时进城以当前实际地点覆盖农场时间表，不凭标题识别人物。
    if (['town', 'cafe', 'park', 'shopping_centre'].includes(V.location)) return 'town';

    if (Time.hour >= 21 || Time.hour <= 4) return 'sleep';
    if (Time.hour === 5) return 'breakfast';

    const work = V.farm_work?.alex;
    if (work === 'shower') return 'naked';
    if (work === 'woodland') return 'woodland';
    if (work === 'admin' || (work === 'clearing' && V.farm_stage === 12)) return 'admin';
    return 'farm';
  }
}
