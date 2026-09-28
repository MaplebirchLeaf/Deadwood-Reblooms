// ./src/module/DeadwoodReblooms.ts
import hint_cn from '@/assets/hint/CN/Index.md';
import hint_en from '@/assets/hint/EN/Index.md';
import hint_DR_cn from '@/assets/hint/CN/DR.md';
import hint_DR_en from '@/assets/hint/EN/DR.md';
import hint_UCACSD_cn from '@/assets/hint/CN/UCACSD.md';
import hint_UCACSD_en from '@/assets/hint/EN/UCACSD.md';
import hint_LongerCombat_cn from '@/assets/hint/CN/LongerCombat.md';
import hint_LongerCombat_en from '@/assets/hint/EN/LongerCombat.md';
import hint_MLIANPCA_cn from '@/assets/hint/CN/MLIANPCA.md';
import hint_MLIANPCA_en from '@/assets/hint/EN/MLIANPCA.md';
import hint_ICC_cn from '@/assets/hint/CN/ICC.md';
import hint_ICC_en from '@/assets/hint/EN/ICC.md';
import hint_CA_cn from '@/assets/hint/CN/CA.md';
import hint_CA_en from '@/assets/hint/EN/CA.md';
import hint_MoreTransformations_cn from '@/assets/hint/CN/MoreTransformations.md';
import hint_MoreTransformations_en from '@/assets/hint/EN/MoreTransformations.md';
import hint_NPCSidebarPortrait_cn from '@/assets/hint/CN/NPCSidebarPortrait.md';
import hint_NPCSidebarPortrait_en from '@/assets/hint/EN/NPCSidebarPortrait.md';
import hint_VP_cn from '@/assets/hint/CN/VP.md';
import hint_VP_en from '@/assets/hint/EN/VP.md';
import hint_SydneyExpansion_cn from '@/assets/hint/CN/SydneyExpansion.md';
import hint_SydneyExpansion_en from '@/assets/hint/EN/SydneyExpansion.md';
import hint_RobinExpansion_cn from '@/assets/hint/CN/RobinExpansion.md';
import hint_RobinExpansion_en from '@/assets/hint/EN/RobinExpansion.md';
import hint_WhitneyExpansion_cn from '@/assets/hint/CN/WhitneyExpansion.md';
import hint_WhitneyExpansion_en from '@/assets/hint/EN/WhitneyExpansion.md';
import hint_KylarExpansion_cn from '@/assets/hint/CN/KylarExpansion.md';
import hint_KylarExpansion_en from '@/assets/hint/EN/KylarExpansion.md';
import hint_LS_cn from '@/assets/hint/CN/LS.md';
import hint_LS_en from '@/assets/hint/EN/LS.md';
import hint_DM_cn from '@/assets/hint/CN/DM.md';
import hint_DM_en from '@/assets/hint/EN/DM.md';
import hint_Credits_cn from '@/assets/hint/CN/Credits.md';
import hint_Credits_en from '@/assets/hint/EN/Credits.md';
import { defaults } from './constants';
import Module from './Module';

const guideSections = {
  DR: { en: hint_DR_en, cn: hint_DR_cn, title: { en: 'Core features', cn: '基础功能' } },
  UCACSD: { en: hint_UCACSD_en, cn: hint_UCACSD_cn, title: { en: 'Cheats and combat values', cn: '作弊入口与战斗数值' } },
  LongerCombat: { en: hint_LongerCombat_en, cn: hint_LongerCombat_cn, title: { en: 'Longer encounters', cn: '更长遭遇战' } },
  MLIANPCA: { en: hint_MLIANPCA_en, cn: hint_MLIANPCA_cn, title: { en: 'Love interests and portraits', cn: '更多恋人与社交栏头像' } },
  ICC: { en: hint_ICC_en, cn: hint_ICC_cn, title: { en: 'Cheat collection', cn: '作弊集' } },
  CA: { en: hint_CA_en, cn: hint_CA_cn, title: { en: 'Celestial anomalies', cn: '天体异象' } },
  MoreTransformations: { en: hint_MoreTransformations_en, cn: hint_MoreTransformations_cn, title: { en: 'Transformations', cn: '更多转化' } },
  NPCSidebarPortrait: { en: hint_NPCSidebarPortrait_en, cn: hint_NPCSidebarPortrait_cn, title: { en: 'Sidebar portraits', cn: 'NPC 侧边栏立绘' } },
  VP: { en: hint_VP_en, cn: hint_VP_cn, title: { en: 'Vanilla Plus', cn: '原版增强' } },
  SydneyExpansion: { en: hint_SydneyExpansion_en, cn: hint_SydneyExpansion_cn, title: { en: 'Sydney', cn: '悉尼拓展' } },
  RobinExpansion: { en: hint_RobinExpansion_en, cn: hint_RobinExpansion_cn, title: { en: 'Robin', cn: '罗宾拓展' } },
  WhitneyExpansion: { en: hint_WhitneyExpansion_en, cn: hint_WhitneyExpansion_cn, title: { en: 'Whitney', cn: '惠特尼拓展' } },
  KylarExpansion: { en: hint_KylarExpansion_en, cn: hint_KylarExpansion_cn, title: { en: 'Kylar', cn: '凯拉尔拓展' } },
  LS: { en: hint_LS_en, cn: hint_LS_cn, title: { en: 'Life Simulation', cn: '模拟生活' } },
  DM: { en: hint_DM_en, cn: hint_DM_cn, title: { en: 'Dynamic Music', cn: '动态音乐' } },
  Credits: { en: hint_Credits_en, cn: hint_Credits_cn, title: { en: 'Credits and sources', cn: '致谢与素材来源' } }
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

const noticeModules = guideOrder.filter(name => name !== 'DR' && name !== 'Credits');

// 使用 boot.json 的模组名识别已加载模组。只关闭重叠的本模组模块，不改动玩家安装的外部模组。
const overlappingMods = {
  LongerCombat: [{ ids: ['LongerCombat'], author: '狐千月', title: 'LongerCombat', url: 'https://github.com/emicoto/DOLMods/' }],
  MLIANPCA: [
    { ids: ['More Love Interests Mod'], author: '苯环', title: 'More Love Interests', url: 'https://github.com/Nephthelana/DoL-More-Love-Interests-Mod' },
    { ids: ['NPC Avatars Mod', 'NPC Avatars Mod (SF)'], author: 'Eudemonism00', title: 'NPC Avatars Mod', url: 'https://github.com/Eudemonism00/DOL-npcicon-mods/' }
  ],
  RobinExpansion: [{ ids: ['DomRobin'], author: '零环零幻想', title: 'Dom Robin', url: 'https://github.com/ZeroRing233/Degrees-of-Lewdity-RobinMod' }],
  LS: [{ ids: ['DoLSims'], author: '丧心', title: 'DoLSims', url: 'https://github.com/MissedHeart/Degrees-of-Lewdity-DolSims' }]
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
      if (!(section instanceof HTMLDetailsElement)) return;
      event.preventDefault();
      section.open = true;
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
      result.closest('details')?.setAttribute('open', '');
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
  private noticeSaving = false;
  private noticeActive = false;
  private noticeLinksEnabled?: boolean;
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
    const intro = this.markdown(lanSwitch(hint_en, hint_cn));
    const contents = guideOrder
      .map(name => {
        const section = guideSections[name];
        const label = lanSwitch(section.title.en, section.title.cn);
        return `<div class='settingsToggleItem'><a href='#deadwood-guide-${name}' data-guide-target='deadwood-guide-${name}'>${name === 'Credits' ? label : `${name} · ${label}`}</a></div>`;
      })
      .join('');
    // 每个模块都是独立折叠节，只有总览默认展开。搜索仍能打开命中的节。
    const sections = Object.entries(guideSections).map(([name, section]) => {
      const title = lanSwitch(section.title.en, section.title.cn);
      const label = name === 'Credits' ? title : `${name} · ${title}`;
      return `<details id='deadwood-guide-${name}'${name === 'DR' ? ' open' : ''}>
        <summary class='settingsHeader options'><span class='gold'>${label}</span></summary>
        <div class='settingsGrid'><div class='settingsToggleItemWide'>${this.markdown(lanSwitch(section.en, section.cn))}</div></div>
      </details>`;
    });
    return `${intro}<nav aria-label='${lanSwitch('Guide contents', '指南目录')}'><div class='settingsGrid'>${contents}</div></nav><br>${sections.join('')}`;
  }

  private overlapping(): Map<OverlappingModule, string[]> {
    const loaded = new Set(this.core.host.modLoader.modUtils.getModListNameNoAlias());
    const conflicts = new Map<OverlappingModule, string[]>();
    for (const name of Object.keys(overlappingMods) as OverlappingModule[]) {
      const matches = overlappingMods[name].filter(mod => mod.ids.some(id => loaded.has(id)));
      if (matches.length)
        conflicts.set(
          name,
          matches.map(mod => mod.title)
        );
    }
    return conflicts;
  }

  private noticeModuleRows(): string {
    const enabled = new Set(this.core.services.gui.enabledModules.map(module => module.name));
    const conflicts = this.overlapping();
    T.deadwoodRebloomsNoticeModules = Object.fromEntries(noticeModules.map(name => [name, enabled.has(name) && !conflicts.has(name as OverlappingModule)]));
    return `<div class='settingsGrid'>${noticeModules
      .map(name => {
        const label = this.core.t(`deadwood-reblooms:notice:module:${name}`);
        const credits = name in overlappingMods ? overlappingMods[name as OverlappingModule] : [];
        const sources = credits.length
          ? `<br><small><span class='gold'>${this.core.t('deadwood-reblooms:notice:thanks')}</span> ${credits
              .map(mod => `<a href='${mod.url}' target='_blank' rel='noopener noreferrer'>${mod.author} · ${mod.title}</a>`)
              .join(' · ')}</small>`
          : '';
        const overlap = conflicts.get(name as OverlappingModule);
        const checkbox = overlap ? `<input type='checkbox' disabled>` : `<<checkbox '_deadwoodRebloomsNoticeModules.${name}' false true autocheck>>`;
        const reason = overlap
          ? `<br><small class='green'>${this.core.t('deadwood-reblooms:notice:overlap')} ${overlap.join(' · ')}</small>${name === 'MLIANPCA' ? `<br><small>${this.core.t('deadwood-reblooms:notice:bundled')}</small>` : ''}`
          : '';
        return `<div class='settingsToggleItem'><label>${checkbox}<span>${label}</span></label>${sources}${reason}</div>`;
      })
      .join('')}</div>`;
  }

  private get notice(): string {
    if (this.noticeActive) return '';
    this.noticeActive = true;
    this.noticeLinksEnabled ??= Links.enabled;
    Links.enabled = false;
    $('#story').addClass('gateBlur');
    $('#ui-bar').addClass('gateBlur');
    return `
      <<dialog ${JSON.stringify(this.core.t('deadwood-reblooms:notice:title'))} 'class' true>>
        ${this.core.t('deadwood-reblooms:notice:description')}<br><br>
        ${this.noticeModuleRows()}
        <br>${this.core.t('deadwood-reblooms:notice:reload')}<br><br>
        <div class='text-align-center'>
          <div class='m-2'>
            <<button ${JSON.stringify(this.core.t('deadwood-reblooms:notice:confirm'))}>>
              <<run maplebirch.DR.applyNotice(_deadwoodRebloomsNoticeModules)>>
            <</button>>
          </div>
        </div>
      <</dialog>>
    `;
  }

  public async applyNotice(selection: Record<string, boolean>): Promise<void> {
    if (this.noticeSaving) return;
    this.noticeSaving = true;
    const gui = this.core.services.gui;
    const available = new Set([...gui.enabledModules, ...gui.disabledModules].map(module => module.name));
    const enabled = new Set(gui.enabledModules.map(module => module.name));
    const conflicts = this.overlapping();
    // 只提交实际变化，避免首次确认未改选项时写入 IndexedDB 或触发重载。
    const states = Object.fromEntries(
      noticeModules
        .filter(name => available.has(name))
        .map(name => [name, selection[name] === true && !conflicts.has(name as OverlappingModule)] as const)
        .filter(([name, selected]) => selected !== enabled.has(name))
    );

    try {
      const changed = await gui.setModuleStates(states);
      if (changed) {
        localStorage.setItem('deadwoodRebloomsNotice', 'true');
        location.reload();
        return;
      }
      Links.enabled = this.noticeLinksEnabled ?? true;
      this.noticeLinksEnabled = undefined;
      $('#story, #ui-bar').removeClass('gateBlur');
      this.core.SugarCube.Dialog.close();
      localStorage.setItem('deadwoodRebloomsNotice', 'true');
      this.noticeSaving = false;
    } catch (error) {
      this.log(`Failed to apply notice module selection: ${error instanceof Error ? error.message : String(error)}`, 'ERROR', error);
      Links.enabled = this.noticeLinksEnabled ?? true;
      this.noticeLinksEnabled = undefined;
      $('#story, #ui-bar').removeClass('gateBlur');
      this.core.SugarCube.Dialog.close();
      this.noticeSaving = false;
    }
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
    const states = Object.fromEntries([...this.overlapping().keys()].filter(name => enabled.has(name)).map(name => [name, false]));
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
    const noticeReady = () => localStorage.getItem('verifiedAge') === 'true' && localStorage.getItem('maplebirchFrameworkNotice') === 'true' && !localStorage.getItem('deadwoodRebloomsNotice');
    this.core.once(':sugarcube', () => {
      this.core.tool.macro.defineS('DeadwoodRebloomsNotice', () => this.notice);
      // 框架在关闭自身弹窗时才写入确认标志。此时没有新的 Passage，gate 事件不会再运行。
      $(document).on(':dialogclosed.deadwoodRebloomsNotice', () => {
        if (State.passage !== 'Start' || this.noticeActive || !noticeReady()) return;
        queueMicrotask(() => {
          if (!this.noticeActive && noticeReady()) $.wiki('<<DeadwoodRebloomsNotice>>');
        });
      });
    });
    this.core.dynamic.regStateEvent('gate', 'DeadwoodRebloomsNotice', {
      output: 'DeadwoodRebloomsNotice',
      cond: noticeReady,
      extra: { passage: ['Start'] }
    });
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
