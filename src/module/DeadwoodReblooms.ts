// ./src/module/DeadwoodReblooms.ts
import { defaults } from './constants';
import Module from './Module';

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
    baileyRent: false as boolean
  };

  public readonly exposed = true;
  public hint?: Hint;
  public readonly log = maplebirch.tool.createlog('DeadwoodReblooms');
  private random?: ReturnType<typeof maplebirch.tool.rand.create>;

  public constructor(core: typeof maplebirch) {
    super(core, 'DeadwoodReblooms', defaults);
    this.core.once(':storyready', () => {
      $('#history-backward').ariaClick(() => this.rand.back(1));
      $('#history-forward').ariaClick(() => this.rand.forward(1));
    });
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

  public accrueBaileyRent(): void {
    if (V.options?.maplebirch?.baileyRent !== true || !Number.isFinite(V.rentmoney)) return;
    const debt = Number.isFinite(V.DeadwoodReblooms.baileyRentDebt) ? Math.max(0, Math.floor(V.DeadwoodReblooms.baileyRentDebt)) : 0;
    const rent = Math.max(0, Math.floor(V.rentmoney));
    const babyRent = Number.isFinite(V.babyRent) ? Math.max(0, Math.floor(V.babyRent)) : 0;
    const baseRent = Math.max(0, rent - debt);
    V.DeadwoodReblooms.baileyRentDebt = debt + baseRent + babyRent;
    V.rentmoney = baseRent + V.DeadwoodReblooms.baileyRentDebt;
  }

  public settleBaileyRent(): void {
    V.DeadwoodReblooms.baileyRentDebt = 0;
  }

  public open(): void {
    $.wiki("<<maplebirchReplace 'DeadwoodRebloomsHint' 'title'>>");
    const textbox = document.querySelector<HTMLInputElement>('#textbox--deadwoodrebloomshinttextbox');
    const content = document.querySelector<HTMLElement>('#modhint-content');
    if (!textbox || !content) return;
    this.hint = new Hint(textbox, content);
  }

  public preInit(): void {
    this.core.var.options.define('modhint', DeadwoodReblooms.options);
    this.core.var.options.define('bodywriting', DeadwoodReblooms.options);
    this.core.var.options.define('baileyRent', DeadwoodReblooms.options);
    super.preInit();
  }
}

declare module '@scml-dol-maplebirch/types' {
  interface Extensions {
    readonly DR: DeadwoodReblooms;
  }
}

export default DeadwoodReblooms;
