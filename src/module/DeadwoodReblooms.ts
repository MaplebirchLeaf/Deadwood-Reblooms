// ./src/module/DeadwoodReblooms.ts
import Hint_CN from '@/assets/hint/CN/Index.md';
import Hint_EN from '@/assets/hint/EN/Index.md';
import Hint_DR_CN from '@/assets/hint/CN/DR.md';
import Hint_DR_EN from '@/assets/hint/EN/DR.md';
import Hint_UCACSD_CN from '@/assets/hint/CN/UCACSD.md';
import Hint_UCACSD_EN from '@/assets/hint/EN/UCACSD.md';
import Hint_LongerCombat_CN from '@/assets/hint/CN/LongerCombat.md';
import Hint_LongerCombat_EN from '@/assets/hint/EN/LongerCombat.md';
import Hint_MLIANPCA_CN from '@/assets/hint/CN/MLIANPCA.md';
import Hint_MLIANPCA_EN from '@/assets/hint/EN/MLIANPCA.md';
import Hint_ICC_CN from '@/assets/hint/CN/ICC.md';
import Hint_ICC_EN from '@/assets/hint/EN/ICC.md';
import Hint_CA_CN from '@/assets/hint/CN/CA.md';
import Hint_CA_EN from '@/assets/hint/EN/CA.md';
import Hint_MoreTransformations_CN from '@/assets/hint/CN/MoreTransformations.md';
import Hint_MoreTransformations_EN from '@/assets/hint/EN/MoreTransformations.md';
import Hint_NPCSidebarPortrait_CN from '@/assets/hint/CN/NPCSidebarPortrait.md';
import Hint_NPCSidebarPortrait_EN from '@/assets/hint/EN/NPCSidebarPortrait.md';
import Hint_VP_CN from '@/assets/hint/CN/VP.md';
import Hint_VP_EN from '@/assets/hint/EN/VP.md';
import Hint_SydneyExpansion_CN from '@/assets/hint/CN/SydneyExpansion.md';
import Hint_SydneyExpansion_EN from '@/assets/hint/EN/SydneyExpansion.md';
import Hint_RobinExpansion_CN from '@/assets/hint/CN/RobinExpansion.md';
import Hint_RobinExpansion_EN from '@/assets/hint/EN/RobinExpansion.md';
import Hint_WhitneyExpansion_CN from '@/assets/hint/CN/WhitneyExpansion.md';
import Hint_WhitneyExpansion_EN from '@/assets/hint/EN/WhitneyExpansion.md';
import Hint_KylarExpansion_CN from '@/assets/hint/CN/KylarExpansion.md';
import Hint_KylarExpansion_EN from '@/assets/hint/EN/KylarExpansion.md';
import Hint_LS_CN from '@/assets/hint/CN/LS.md';
import Hint_LS_EN from '@/assets/hint/EN/LS.md';
import Hint_DM_CN from '@/assets/hint/CN/DM.md';
import Hint_DM_EN from '@/assets/hint/EN/DM.md';
import Hint_Credits_CN from '@/assets/hint/CN/Credits.md';
import Hint_Credits_EN from '@/assets/hint/EN/Credits.md';
import { defaults } from './constants';
import Module from './Module';

// prettier-ignore
const guideSections = {
  DR:                   { EN: Hint_DR_EN,                   CN: Hint_DR_CN,                   title: { EN: 'Core features',                 CN: '基础功能' } },
  UCACSD:               { EN: Hint_UCACSD_EN,               CN: Hint_UCACSD_CN,               title: { EN: 'Cheats and combat values',      CN: '作弊入口与战斗数值' } },
  LongerCombat:         { EN: Hint_LongerCombat_EN,         CN: Hint_LongerCombat_CN,         title: { EN: 'Longer encounters',             CN: '更长遭遇战' } },
  MLIANPCA:             { EN: Hint_MLIANPCA_EN,             CN: Hint_MLIANPCA_CN,             title: { EN: 'Love interests and portraits',  CN: '更多恋人与社交栏头像' } },
  ICC:                  { EN: Hint_ICC_EN,                  CN: Hint_ICC_CN,                  title: { EN: 'Cheat collection',              CN: '作弊集' } },
  CA:                   { EN: Hint_CA_EN,                   CN: Hint_CA_CN,                   title: { EN: 'Celestial anomalies',           CN: '天体异象' } },
  MoreTransformations:  { EN: Hint_MoreTransformations_EN,  CN: Hint_MoreTransformations_CN,  title: { EN: 'Transformations',               CN: '更多转化' } },
  NPCSidebarPortrait:   { EN: Hint_NPCSidebarPortrait_EN,   CN: Hint_NPCSidebarPortrait_CN,   title: { EN: 'Sidebar portraits',             CN: 'NPC 侧边栏立绘' } },
  VP:                   { EN: Hint_VP_EN,                   CN: Hint_VP_CN,                   title: { EN: 'Vanilla Plus',                  CN: '原版增强' } },
  SydneyExpansion:      { EN: Hint_SydneyExpansion_EN,      CN: Hint_SydneyExpansion_CN,      title: { EN: 'Sydney',                        CN: '悉尼拓展' } },
  RobinExpansion:       { EN: Hint_RobinExpansion_EN,       CN: Hint_RobinExpansion_CN,       title: { EN: 'Robin',                         CN: '罗宾拓展' } },
  WhitneyExpansion:     { EN: Hint_WhitneyExpansion_EN,     CN: Hint_WhitneyExpansion_CN,     title: { EN: 'Whitney',                       CN: '惠特尼拓展' } },
  KylarExpansion:       { EN: Hint_KylarExpansion_EN,       CN: Hint_KylarExpansion_CN,       title: { EN: 'Kylar',                         CN: '凯拉尔拓展' } },
  LS:                   { EN: Hint_LS_EN,                   CN: Hint_LS_CN,                   title: { EN: 'Life Simulation',               CN: '模拟生活' } },
  DM:                   { EN: Hint_DM_EN,                   CN: Hint_DM_CN,                   title: { EN: 'Dynamic Music',                 CN: '动态音乐' } },
  Credits:              { EN: Hint_Credits_EN,              CN: Hint_Credits_CN,              title: { EN: 'Credits and sources',           CN: '致谢与素材来源' } }
} as const;

const guideOrder = [
  'DR',
  'SydneyExpansion',
  'RobinExpansion',
  'WhitneyExpansion',
  'KylarExpansion',
  'LS',
  'VP',
  'CA',
  'MoreTransformations',
  'LongerCombat',
  'MLIANPCA',
  'NPCSidebarPortrait',
  'UCACSD',
  'ICC',
  'DM',
  'Credits'
] as const;

// 使用 boot.json 的模组名识别已加载模组。只关闭重叠的本模组模块，不改动玩家安装的外部模组。
const overlappingMods = {
  LongerCombat: ['LongerCombat'],
  MLIANPCA: ['More Love Interests Mod', 'NPC Avatars Mod', 'NPC Avatars Mod (SF)'],
  RobinExpansion: ['DomRobin'],
  LS: ['DoLSims']
} as const;

type OverlappingModule = keyof typeof overlappingMods;

interface BaileyRentSnapshot {
  refusedTotal: number;
  rentStage: number;
  confiscation: { value: number; day: number } | null;
}

class BaileyRent {
  private previous?: BaileyRentSnapshot;

  public constructor(private readonly core: typeof maplebirch) {}

  private snapshot(): BaileyRentSnapshot {
    const refusedTotal = Number(V.baileyRefusedToPayTotalStat);
    const rentStage = Number(V.rentstage);
    const hold = V.bailey_confiscation;
    const confiscation =
      hold && Array.isArray(hold.items) && Number.isFinite(Number(hold.day))
        ? {
            value: hold.items.reduce((total: number, item: { value?: unknown }) => total + Math.max(0, Number(item.value) || 0), 0),
            day: Number(hold.day)
          }
        : null;
    return {
      refusedTotal: Number.isFinite(refusedTotal) ? refusedTotal : 0,
      rentStage: Number.isFinite(rentStage) ? rentStage : 0,
      confiscation
    };
  }

  private reconcile(previous: BaileyRentSnapshot): void {
    // 用前后状态差分追踪原版贝利结算，避免覆盖原版多处分支的租金逻辑。
    const current = this.snapshot();
    if (current.rentStage > previous.rentStage) this.settle();
    else if (current.refusedTotal > previous.refusedTotal) this.accrue();
    if (previous.confiscation && !current.confiscation && V.bailey_confiscation_lost === 1 && Time.days >= previous.confiscation.day + 8) this.offset(previous.confiscation.value);
  }

  private readonly sync = (): void => {
    if (this.previous) this.reconcile(this.previous);
    this.previous = this.snapshot();
  };

  private accrue(): void {
    if (V.options?.maplebirch?.baileyRent !== true || !Number.isFinite(V.rentmoney)) return;
    const debt = Number.isFinite(V.DeadwoodReblooms.baileyRentDebt) ? Math.max(0, Math.floor(V.DeadwoodReblooms.baileyRentDebt)) : 0;
    const rent = Math.max(0, Math.floor(V.rentmoney));
    const babyRent = Number.isFinite(V.babyRent) ? Math.max(0, Math.floor(V.babyRent)) : 0;
    const baseRent = Math.max(0, rent - debt);
    V.DeadwoodReblooms.baileyRentDebt = debt + baseRent + babyRent;
    V.rentmoney = baseRent + V.DeadwoodReblooms.baileyRentDebt;
  }

  private settle(): void {
    V.DeadwoodReblooms.baileyRentDebt = 0;
  }

  private offset(value: number): void {
    if (!Number.isFinite(value) || !Number.isFinite(V.rentmoney)) return;
    const debt = Number.isFinite(V.DeadwoodReblooms.baileyRentDebt) ? Math.max(0, Math.floor(V.DeadwoodReblooms.baileyRentDebt)) : 0;
    const baseRent = Math.max(0, Math.floor(V.rentmoney) - debt);
    V.DeadwoodReblooms.baileyRentDebt = Math.max(0, debt - Math.max(0, Math.floor(value)));
    V.rentmoney = baseRent + V.DeadwoodReblooms.baileyRentDebt;
  }

  public preInit(): void {
    // previous 仅是本次会话的差分基线；切换存档后从恢复的 V 重建，不能沿用上一局的贝利状态。
    this.core.on(':variable', () => (this.previous = this.snapshot()), 'Deadwood Reblooms Bailey Rent');
    this.core.dynamic.regTimeEvent('onBefore', 'DeadwoodRebloomsBaileyRentBefore', {
      action: this.sync
    });
    this.core.dynamic.regTimeEvent('onAfter', 'DeadwoodRebloomsBaileyRentAfter', {
      action: this.sync
    });
  }
}

class Hint {
  constructor(
    private readonly textbox: HTMLInputElement,
    private readonly content: HTMLElement
  ) {
    this.content.addEventListener('click', event => {
      const target = event.target as HTMLElement;
      const link = target.closest<HTMLAnchorElement>('a[data-guide-target]');
      if (!link) return;
      const section = document.getElementById(link.dataset.guideTarget || '');
      if (!section) return;
      event.preventDefault();
      section.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }

  public search() {
    this.clear();
    const keyword = this.textbox.value.trim();
    if (!keyword) return;
    const regex = new RegExp(keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
    // 只高亮文字节点。改写整段 innerHTML 会误中标签属性，也会销毁内容里的事件监听器。
    const walker = document.createTreeWalker(this.content, NodeFilter.SHOW_TEXT);
    const nodes: Text[] = [];
    while (walker.nextNode()) {
      const node = walker.currentNode as Text;
      if (node.parentElement && !['SCRIPT', 'STYLE'].includes(node.parentElement.tagName) && !node.parentElement.closest('nav')) nodes.push(node);
    }
    for (const node of nodes) {
      const source = node.data;
      const matches = [...source.matchAll(regex)];
      if (matches.length === 0) continue;
      const fragment = document.createDocumentFragment();
      let offset = 0;
      for (const match of matches) {
        const start = match.index;
        fragment.append(document.createTextNode(source.slice(offset, start)));
        const highlight = document.createElement('span');
        highlight.className = 'gold searchResult';
        highlight.textContent = match[0];
        fragment.append(highlight);
        offset = start + match[0].length;
      }
      fragment.append(document.createTextNode(source.slice(offset)));
      node.replaceWith(fragment);
    }
    const result = this.content.querySelector('.searchResult');
    if (result) {
      result.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    const noResult = document.createElement('div');
    noResult.className = 'gold noSearchResult';
    noResult.textContent = lanSwitch('No results', '无结果');
    this.content.before(noResult);
  }

  public clear() {
    document.querySelector('.noSearchResult')?.remove();
    this.content.querySelectorAll('.searchResult').forEach(element => element.replaceWith(...element.childNodes));
  }
}

class DeadwoodReblooms extends Module {
  static readonly options = {
    modhint: 'disabled' as 'disabled' | 'mobile' | 'desktop',
    bodywriting: false as boolean,
    baileyRent: false as boolean,
    hideEarSlimeParasites: false as boolean
  };

  public readonly exposed = true;
  public hint?: Hint;
  private random?: ReturnType<typeof maplebirch.tool.rand.create>;
  private readonly baileyRent: BaileyRent;

  public constructor(core: typeof maplebirch) {
    super(core, 'DeadwoodReblooms', defaults);
    this.baileyRent = new BaileyRent(core);
  }

  private markdown(source: string): string {
    const rendered = this.core.marked.parse(source);
    return typeof rendered === 'string' ? rendered : '';
  }

  public get wiki(): string {
    const intro = this.markdown(lanSwitch(Hint_EN, Hint_CN));
    const contents = guideOrder
      .map(name => {
        const section = guideSections[name];
        const title = lanSwitch(section.title.EN, section.title.CN);
        const label = name === 'Credits' ? title : `${name} · ${title}`;
        return `<div class='settingsToggleItem'><a href='#deadwood-guide-${name}' data-guide-target='deadwood-guide-${name}'>${label}</a></div>`;
      })
      .join('');
    const sections = guideOrder.map(name => {
      const section = guideSections[name];
      const title = lanSwitch(section.title.EN, section.title.CN);
      const label = name === 'Credits' ? title : `${name} · ${title}`;
      return `<section id='deadwood-guide-${name}'>
        <h2><span class='gold'>${label}</span></h2>
        ${this.markdown(lanSwitch(section.EN, section.CN))}
      </section>`;
    });
    return `${intro}<nav aria-label='${lanSwitch('Guide contents', '指南目录')}'><div class='settingsGrid'>${contents}</div></nav><br>${sections.join('<br>')}`;
  }

  private overlapping(): Set<OverlappingModule> {
    const loaded = new Set(this.core.host.modLoader.modUtils.getModListNameNoAlias());
    const conflicts = new Set<OverlappingModule>();
    for (const name of Object.keys(overlappingMods) as OverlappingModule[]) {
      if (overlappingMods[name].some(id => loaded.has(id))) conflicts.add(name);
    }
    return conflicts;
  }

  public get rng(): number {
    return this.rand.percent();
  }

  public get rand(): ReturnType<typeof maplebirch.tool.rand.create> {
    const state = (V.DeadwoodReblooms.rand ??= { seed: null, history: [], index: 0 });
    if (!Number.isInteger(state.index)) state.index = 0;
    // RNG 对象可以缓存，但种子与历史必须跟随当前存档的 V；对象身份变化即重建。
    if (this.random && this.random.state === state) return this.random;
    return (this.random = this.core.tool.rand.create(state));
  }

  public open(): void {
    $.wiki("<<maplebirchReplace 'DeadwoodRebloomsHint' 'title'>>");
    const textbox = document.querySelector<HTMLInputElement>('#textbox--deadwoodrebloomshinttextbox');
    const content = document.querySelector<HTMLElement>('#modhint-content');
    if (!textbox || !content) return;
    this.hint = new Hint(textbox, content);
  }

  public async preInit(): Promise<void> {
    // 根模块先于所有子模块预初始化。框架此时已读入 GUI 状态，可以一次保存全部冲突模块。
    const enabled = new Set(this.core.services.gui.enabledModules.map(module => module.name));
    const states = Object.fromEntries([...this.overlapping()].filter(name => enabled.has(name)).map(name => [name, false]));
    if (Object.keys(states).length) {
      try {
        if (await this.core.services.gui.setModuleStates(states)) {
          location.reload();
          return;
        }
      } catch (error) {
        this.log('Failed to disable overlapping Deadwood modules', 'ERROR', error);
      }
    }
    this.baileyRent.preInit();
    this.core.tool.onInit(() => setup.maplebirch.hint.push('<<= maplebirch.DR.wiki>>'));
    this.core.once(':storyready', () => {
      $('#history-backward').ariaClick(() => this.rand.back(1));
      $('#history-forward').ariaClick(() => this.rand.forward(1));
    });
    this.core.var.options.define('modhint', DeadwoodReblooms.options);
    this.core.var.options.define('bodywriting', DeadwoodReblooms.options);
    this.core.var.options.define('baileyRent', DeadwoodReblooms.options);
    this.core.var.options.define('hideEarSlimeParasites', DeadwoodReblooms.options);
    super.preInit();
  }
}

declare module '@scml-dol-maplebirch/types' {
  interface Extensions {
    readonly DR: DeadwoodReblooms;
  }
}

export default DeadwoodReblooms;
