// ./src/script/Orchard.ts

import OrchardView from './Orchard/View';
import { species, type OrchardSpecies } from '../module/Orchard/Species';
import type { MacroDefinition } from 'twine-sugarcube';

export default function Orchard(maplebirch: typeof window.maplebirch): void {
  // 回执在本次页面显示完后清除，不能带进稍后的遭遇或下一次进园。
  maplebirch.on(':passagedisplay', () => {
    const orchard = maplebirch.get('Orchard');
    if (orchard) orchard.notice = undefined;
  });

  maplebirch.tool.addTo('BeforeLinkZone', { widget: "deadwood-orchard-entry 'temple'", passage: 'Temple Garden' }, { widget: "deadwood-orchard-entry 'farm'", passage: 'Farm Fields' });
  maplebirch.tool.addTo('BeforeLinkZone', { widget: 'deadwood-orchard-seed-shop', passage: 'Supermarket' }, { widget: 'deadwood-orchard-worker-recruitment', passage: 'Pub' });

  maplebirch.tool.macro.defineS('deadwood-orchard-worker-harvest', () => {
    const kept = maplebirch.get('Orchard')?.state.worker.report.kept;
    if (!kept) return;
    return Object.entries(kept)
      .filter(([, amount]) => amount && amount > 0)
      .map(([type, amount]) => {
        const data = species[type as OrchardSpecies];
        const name = type === 'blood_lemon' ? lanSwitch('Blood lemon', '血柠') : lanSwitch(data.name[0], data.name[1]);
        return `<<foodstufficon '${type}'>>${name} × ${amount}`;
      })
      .join(' / ');
  });

  maplebirch.tool.macro.defineS('deadwood-orchard-seed-shop', () => {
    const orchard = maplebirch.get('Orchard');
    // 收银区的正常出口必须存在，关店、夜间潜入和昏倒剧情不增加购物选项。
    if (!orchard || !orchard.canWork || Time.dayState === 'night' || Time.hour === 21 || !document.querySelector('#passage-content a[data-passage="Shopping Centre"]')) return;
    return (Object.keys(species) as OrchardSpecies[])
      .filter(key => species[key].seedSource === 'shop' && !orchard.state.known.includes(key) && setup.foodstuff[key])
      .map(key => {
        const data = species[key];
        const label = [`Buy ${data.name[0].toLowerCase()} seeds (£${data.seedPrice! / 100})`, `购买${data.name[1]}种子 (£${data.seedPrice! / 100})`];
        return `<<foodstufficon '${key}'>>${V.money >= data.seedPrice! ? `<<lanLink ${JSON.stringify(label)} 'Supermarket'>><<run maplebirch.get('Orchard').buySeed('${key}')>><</lanLink>>` : `<span class='red'>${lanSwitch(...label)}</span>`}<br>`;
      })
      .join('');
  });

  maplebirch.once(':storyready', () => {
    // 保留原版宏的参数、输出和逻辑，只在采摘成功或花园取得酸橙后检查种源。
    for (const name of ['tending_pick', 'wearProp'] as const) {
      const original = maplebirch.SugarCube.Macro.get(name) as MacroDefinition | undefined;
      if (!original) continue;
      maplebirch.tool.macro.define(
        name,
        function (this: any, type: string) {
          const before = V.foodstuff[type]?.amount ?? 0;
          original.handler.call(this);
          const orchard = maplebirch.get('Orchard');
          if (!orchard || typeof type !== 'string') return;
          const source = name === 'tending_pick' ? 'pick' : 'garden';
          if (source === 'pick' ? (V.foodstuff[type]?.amount ?? 0) <= before : type !== 'lime' || !maplebirch.passage.title.startsWith('Temple Garden')) return;
          if (!orchard.discover(type, source)) return;
          const data = species[type as OrchardSpecies];
          const text = document.createElement('span');
          text.className = 'gold';
          text.textContent = lanSwitch(` You save some ${data.name[0].toLowerCase()} seeds for the orchard.`, ` 你留下了一些${data.name[1]}种子，可以带去果园播种。`);
          this.output.append(text);
        },
        original.tags,
        original.skipArgs
      );
    }
  });

  // 由框架安排宏的安装时机，并把返回的地图节点插入输出。
  maplebirch.tool.macro.defineS('deadwood-orchard-map', () => {
    const orchard = maplebirch.get('Orchard');
    if (!orchard) return;
    const site = orchard.state.site;
    if (!['temple', 'farm'].includes(site) || !orchard.available(site)) return;
    orchard.advance();
    const root = document.createElement('div');
    new OrchardView(orchard, site, root);
    return root;
  });
}
