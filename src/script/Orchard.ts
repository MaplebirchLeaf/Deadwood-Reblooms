// ./src/script/Orchard.ts

import OrchardView from './Orchard/View';
import Remy from './Orchard/Remy';
import { species, type OrchardSpecies } from '../module/Orchard/Species';

export default function Orchard(maplebirch: typeof window.maplebirch): void {
  Remy(maplebirch);
  maplebirch.tool.addTo(
    'BeforeLinkZone',
    { widget: 'deadwood-farm-projects-link', passage: 'Farm Upgrades' },
    { widget: 'deadwood-farm-partnership-link', passage: ['Farm Upgrades', 'Farm Stock'] },
    { widget: 'deadwood-remy-school-link', passage: 'Riding School' },
    { widget: 'deadwood-remy-captivity', passage: 'Livestock Cell Remy' },
    { widget: 'deadwood-remy-estate-link', passage: 'Estate Approach' },
    { widget: 'deadwood-alex-gift-response', passage: 'Alex Gifts' }
  );
  maplebirch.tool.addTo(
    'BeforeLinkZone',
    { widget: 'deadwood-remy-birth-reflection', passage: 'Pregnancy Birth Hospital 4' },
    { widget: 'deadwood-remy-paternity-link', passage: 'Hospital Paternity Test' }
  );
  maplebirch.tool.addTo('Journal', 'deadwood-orchard-staff-journal', 'deadwood-orchard-orders-journal', 'deadwood-orchard-winery-journal', 'deadwood-farm-partnership-journal');
  maplebirch.tool.patch.traits.add({
    title: 'Special Traits',
    name: () => maplebirch.t('deadwood-reblooms:orchard:trait:supplier:name'),
    colour: 'green',
    has: () => !!V.Orchard && V.Orchard.orders_completed >= 3 && V.Orchard.contracts_completed >= 3,
    text: () => maplebirch.t('deadwood-reblooms:orchard:trait:supplier:text')
  });
  maplebirch.tool.patch.traits.add({
    title: 'Special Traits',
    name: () => maplebirch.t('deadwood-reblooms:orchard:trait:winemaker:name'),
    colour: 'green',
    has: () => !!maplebirch.get('Orchard')?.winery.skilled,
    text: () => maplebirch.t('deadwood-reblooms:orchard:trait:winemaker:text')
  });

  maplebirch.tool.addTo(
    'CustomLinkZone',
    { widget: 'deadwood-alex-break-link', passage: ['Farm Cottage', 'Farm Rest'] },
    { widget: [-1, 'deadwood-orchard-staff-link'], passage: 'Farm Still' },
    { widget: [-1, 'deadwood-orchard-worker-recruitment'], passage: 'Pub' },
    { widget: [-1, 'deadwood-orchard-regular-link'], passage: 'Stall Manage' }
  );

  // 回执在本次页面显示完后清除，不能带进稍后的遭遇或下一次进园。
  maplebirch.on(':passagedisplay', () => {
    const orchard = maplebirch.get('Orchard');
    if (orchard) orchard.notice = undefined;
  });

  // 在原版普通菜单分支调用入口，昏倒、袭击和强制剧情不会执行这些宏。
  maplebirch.tool.inject({
    locationPassage: {
      'Temple Garden': [
        // 在神殿花园的普通离开选项前追加果园入口。
        {
          srcmatch: /<<wolficon>>(?=\s*<<link\s+\[\[[^\]\r\n]*\|Temple\]\]>>)/,
          applybefore: "<<deadwood-orchard-entry 'temple'>>",
          expected: 1
        }
      ],
      'Farm Fields': [
        // 原版农田说明结束后才显示果园入口，与农田的耕作信息分开。
        {
          srcmatch: /<<getouticon>>(?=\s*<<link\s+\[\[[^\]\r\n]*\|Farm Work\]\]>>)/,
          applybefore: "<<deadwood-orchard-entry 'farm'>>",
          expected: 1
        }
      ],
      Supermarket: [
        // 在原版货架前追加已解锁种子的购买选项。
        {
          src: '<<supermarketDisplay "supermarket">>',
          applybefore: '<<deadwood-orchard-seed-shop>>',
          expected: 1
        }
      ]
    },
    widgetPassage: {
      'Farm Widgets': [
        // 只扩展返回条件，保留原版 widget、农田返回链接和事件清理。
        {
          src: '<<if $bus is "farm_fields">>',
          to: '<<if $bus is "deadwood_orchard">><<deadwood-orchard-event-return>><<elseif $bus is "farm_fields">>',
          expected: 1
        }
      ]
    }
  });

  // 保留原版宏的参数、输出和逻辑，只在采摘成功或花园取得酸橙后检查种源。
  for (const name of ['tending_pick', 'wearProp'] as const) {
    maplebirch.tool.macro.wrap(name, function (next) {
      const type = this.args[0];
      const before = V.foodstuff[type]?.amount ?? 0;
      const result = next();
      const orchard = maplebirch.get('Orchard');
      if (!orchard || typeof type !== 'string') return result;
      const source = name === 'tending_pick' ? 'pick' : 'garden';
      if (source === 'pick' ? (V.foodstuff[type]?.amount ?? 0) <= before : type !== 'lime' || !maplebirch.passage.title.startsWith('Temple Garden')) return result;
      if (!orchard.discover(type, source)) return result;
      const data = species[type as OrchardSpecies];
      const text = document.createElement('span');
      text.className = 'gold';
      text.textContent = lanSwitch(` You save some ${data.name[0].toLowerCase()} seeds for the orchard.`, ` 你留下了一些${data.name[1]}种子，可以带去果园播种。`);
      this.output.append(text);
      return result;
    });
  }

  // 由框架安排宏的安装时机，并把返回的地图节点插入输出。
  maplebirch.tool.macro.defineS('deadwood-orchard-map', () => {
    const orchard = maplebirch.get('Orchard');
    if (!orchard) return;
    const site = orchard.state.site;
    if (!['temple', 'farm', 'shrine'].includes(site) || !orchard.available(site)) return;
    orchard.advance();
    const root = document.createElement('div');
    new OrchardView(orchard, site, root);
    return root;
  });
}
