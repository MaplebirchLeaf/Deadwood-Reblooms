// ./src/module/DeadwoodReblooms.ts
import { defaults, version } from './constants';

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

class DeadwoodReblooms {
  static readonly options = {
    modhint: 'disabled' as 'disabled' | 'mobile' | 'desktop',
    bodywriting: false as boolean
  };

  public readonly exposed = true;
  public readonly version = version;
  public hint?: Hint;
  public readonly log = maplebirch.tool.createlog('DeadwoodReblooms');
  private readonly migration: ReturnType<typeof maplebirch.tool.migration.create>;
  private random?: ReturnType<typeof maplebirch.tool.rand.create>;

  public constructor(readonly core: typeof maplebirch) {
    this.migration = this.core.tool.migration.create();
    this.migration.add('*', version, (data, utils) => utils.fill(data, clone(defaults)));
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
    this.core.on(':variable', () => {
      V.DeadwoodReblooms ??= {};
      if (this.core.passage?.title === 'Start2') V.DeadwoodReblooms = clone({ ...defaults, version: this.version });
      this.migration.run(V.DeadwoodReblooms, this.version);
    });
  }
}

declare module '@scml-maplebirch/types/maplebirch' {
  interface Extensions {
    readonly DR: DeadwoodReblooms;
  }
}

export default DeadwoodReblooms;
