// ./src/module/DeadwoodReblooms.ts
import hint_cn from '@/assets/hint/CN.md';
import hint_en from '@/assets/hint/EN.md';
import { defaults } from './constants';
import Module from './Module';

const noticeModules = ['UCACSD', 'LongerCombat', 'MLIANPCA', 'ICC', 'CA', 'MoreTransformations', 'NPCSidebarPortrait', 'VP', 'DM'] as const;

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
  ) {}

  public search() {
    this.clear();
    const keyword = this.textbox.value.trim();
    if (!keyword) return;
    const regex = new RegExp(keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
    this.content.innerHTML = this.content.innerHTML.replace(regex, '<span class="gold searchResult">$&</span>');
    const result = this.content.querySelector('.searchResult');
    if (result) {
      result.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    const noResult = document.createElement('div');
    noResult.className = 'gold noSearchResult';
    noResult.textContent = maplebirch.Language === 'CN' ? '无结果' : 'No results';
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
    return this.markdown(this.core.Language === 'CN' ? hint_cn : hint_en);
  }

  private noticeModuleRows(): string {
    const enabled = new Set(this.core.services.gui.enabledModules.map(module => module.name));
    T.deadwoodRebloomsNoticeModules = Object.fromEntries(noticeModules.map(name => [name, enabled.has(name)]));
    return noticeModules
      .map(name => {
        const label = this.core.t(`deadwood-reblooms:notice:module:${name}`);
        return `<label class='settingsToggleItem'><<checkbox '_deadwoodRebloomsNoticeModules.${name}' false true autocheck>><span>${label}</span></label>`;
      })
      .join('');
  }

  private get notice(): string {
    Links.enabled = false;
    $('#story').addClass('gateBlur');
    $('#ui-bar').addClass('gateBlur');
    return `
      <<dialog ${JSON.stringify(this.core.t('deadwood-reblooms:notice:title'))} 'class' true>>
        <p>${this.core.t('deadwood-reblooms:notice:description')}</p>
        <div class='settingsGrid'>${this.noticeModuleRows()}</div>
        <p>${this.core.t('deadwood-reblooms:notice:reload')}</p>
        <div class='text-align-center'>
          <div class='m-2'>
          <<button ${JSON.stringify(this.core.t('deadwood-reblooms:notice:confirm'))}>>
            <<run maplebirch.DR.applyNoticeModules(_deadwoodRebloomsNoticeModules)>>
          <</button>>
          </div>
        </div>
      <</dialog>>
    `;
  }

  public async applyNoticeModules(selection: Record<string, boolean>): Promise<void> {
    if (this.noticeSaving) return;
    this.noticeSaving = true;
    const gui = this.core.services.gui;
    const available = new Set([...gui.enabledModules, ...gui.disabledModules].map(module => module.name));
    const states = Object.fromEntries(noticeModules.filter(name => available.has(name)).map(name => [name, selection[name] === true]));

    try {
      await gui.setModuleStates(states);
      localStorage.setItem('deadwoodRebloomsNotice', 'true');
      location.reload();
    } catch (error) {
      this.log('Failed to apply notice module selection', 'ERROR', error);
      this.noticeSaving = false;
    }
  }

  public get rng(): number {
    return this.rand.percent();
  }

  public get rand(): ReturnType<typeof maplebirch.tool.rand.create> {
    const state = (V.DeadwoodReblooms.rand ??= { seed: null, history: [], index: 0 });
    if (!Number.isInteger(state.index)) state.index = 0;
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

  public preInit(): void {
    this.baileyRent.preInit();
    this.core.tool.onInit(() => setup.maplebirch.hint.push('<<= maplebirch.DR.wiki>>'));
    this.core.once(':sugarcube', () => this.core.tool.macro.defineS('DeadwoodRebloomsNotice', () => this.notice));
    this.core.dynamic.regStateEvent('gate', 'DeadwoodRebloomsNotice', {
      output: 'DeadwoodRebloomsNotice',
      cond: () => localStorage.getItem('verifiedAge') === 'true' && localStorage.getItem('maplebirchFrameworkNotice') === 'true' && !localStorage.getItem('deadwoodRebloomsNotice')
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
