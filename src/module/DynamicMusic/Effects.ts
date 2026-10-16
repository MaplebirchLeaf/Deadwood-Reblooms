interface Snapshot {
  combat: boolean;
  attack: number;
  hit: number;
  bound: number;
  worn: string;
  integrity: Record<string, { id: string; value: number }>;
  ammo: Record<string, number>;
  orgasm: number;
  arousal: number;
  partner_max: number;
  penis: string;
  anus: string;
  mouth: string;
  wet: number;
}

const number = (value: unknown): number => (typeof value === 'number' && Number.isFinite(value) ? value : 0);

/** 只比较真实动作前后的轻量状态，不给 passage、刷新或存档添加音效标记。 */
export default class Effects {
  private installed = false;
  private seen = new WeakSet<object>();
  private previous: Snapshot | null = null;
  private pending: Snapshot | null = null;
  private timer: ReturnType<typeof setTimeout> | null = null;
  private rendering = false;
  private suppress = true;

  public constructor(
    private readonly core: typeof maplebirch,
    private readonly enabled: () => boolean,
    private readonly play: (event: string) => void
  ) {}

  public reset(): void {
    if (this.timer !== null) clearTimeout(this.timer);
    this.timer = null;
    this.seen = new WeakSet();
    this.previous = this.pending = null;
    this.rendering = false;
    this.suppress = true;
  }

  private snapshot(): Snapshot | null {
    if (typeof V === 'undefined' || !V.worn || !Number.isFinite(V.timeStamp)) return null;
    const clothes = Object.entries(V.worn ?? {}) as Array<[string, Record<string, any>]>;
    return {
      combat: V.combat === 1,
      attack: number(V.attackstat),
      hit: number(V.hitstat),
      bound: [V.leftarm, V.rightarm, V.leftleg, V.rightleg, V.head].filter(part => ['bound', 'grappled', 'swarmgrappled'].includes(part)).length,
      worn: clothes.map(([slot, item]) => [slot, item.index, item.name, item.colour, item.accessory_colour, item.pattern].join(':')).join('|'),
      integrity: Object.fromEntries(clothes.map(([slot, item]) => [slot, { id: [item.index, item.name].join(':'), value: number(item.integrity) }])),
      ammo: { ...V.StreetLife?.ammo },
      orgasm: number(V.orgasmcount),
      arousal: number(V.enemyarousal),
      partner_max: number(V.enemyarousalmax),
      penis: String(V.penisstate ?? 'none'),
      anus: String(V.anusstate ?? 'none'),
      mouth: String(V.mouthuse ?? 'none'),
      wet: number(V.vaginaWetness) + number(V.anusWetness)
    };
  }

  private flush(): void {
    if (this.rendering) return;
    if (!this.enabled()) {
      this.previous = this.pending = null;
      return;
    }
    const after = this.snapshot();
    if (!after) {
      this.previous = this.pending = null;
      this.suppress = true;
      return;
    }
    const before = this.pending;
    this.pending = null;
    this.previous = after;
    if (this.suppress || !before || V.replayScene || V.statFreeze) {
      this.suppress = false;
      return;
    }

    let action: string | undefined;
    const combat = before.combat || after.combat;
    const ammo = ['shotgun', 'rifle', 'handgun'].find(kind => Number.isFinite(after.ammo[kind]) && after.ammo[kind] < number(before.ammo[kind]));
    const damage = Object.entries(after.integrity).some(([slot, item]) => item.id === before.integrity[slot]?.id && item.value < before.integrity[slot].value);
    const intimate = this.intimate(before, after);
    if (intimate) action = intimate;
    else if (ammo && combat) action = `gun-${ammo}`;
    else if (combat && after.attack > before.attack) action = 'impact';
    else if (combat && after.hit > before.hit) action = 'impact';
    else if (combat && after.bound > before.bound) action = 'bind';
    else if (combat && damage) action = 'cloth-damage';
    else if (after.worn !== before.worn) action = combat ? 'cloth' : 'equip';
    if (action) this.play(action);
  }

  /** 插入、抽送与高潮。只用插槽状态与快感计数判断，不写任何存档标记。 */
  private intimate(before: Snapshot, after: Snapshot): string | undefined {
    if (!after.combat) return undefined;
    if (after.orgasm > before.orgasm) return 'sex-climax';
    if (before.arousal < before.partner_max && after.arousal >= after.partner_max) return 'sex-climax';
    const entering = (state: string) => state === 'entrance' || state.endsWith('entrance') || state === 'imminent' || state.endsWith('imminent');
    const seated = (state: string) => state === 'penetrated' || state === 'doublepenetrated' || state === 'tentacledeep' || state.startsWith('other');
    if ((entering(after.penis) && !entering(before.penis)) || (entering(after.anus) && !entering(before.anus))) return 'sex-enter';
    if (after.mouth === 'penetrated' && before.mouth !== 'penetrated') return 'sex-oral';
    if (seated(after.penis) || seated(after.anus)) return after.wet >= 700 ? 'sex-wet' : 'sex-dry';
    return undefined;
  }

  public install(): void {
    if (this.installed) return;
    this.installed = true;
    this.core.on(':onLoad', () => this.reset(), 'DynamicMusic effects load');
    this.core.on(':passagestart', () => {
      const state = this.core.SugarCube.State;
      if (!this.previous && this.suppress) for (const past of state.history) this.seen.add(past);
      const moment = state.current;
      const repeated = !moment || this.seen.has(moment);
      if (moment) this.seen.add(moment);
      this.rendering = true;
      if (repeated) {
        this.suppress = true;
        this.pending = null;
      } else this.pending ??= this.previous;
    });
    this.core.on(':passageend', () => {
      this.rendering = false;
      this.flush();
    });
    const capture = (event: MouseEvent) => {
      if (event.button !== 0 || !this.enabled() || !(event.target instanceof Element) || !event.target.closest('a.link-internal, button')) return;
      const before = this.snapshot();
      if (!before) return;
      if (!this.previous) this.suppress = false;
      this.pending ??= before;
      if (this.timer === null) {
        const started = Date.now();
        this.timer = setTimeout(() => {
          this.timer = null;
          if (Date.now() - started > 1500 || document.visibilityState === 'hidden') this.suppress = true;
          this.flush();
        }, 0);
      }
    };
    this.core.on(':passagerender', (_passage, content) => content.addEventListener('click', capture, true), 'DynamicMusic actions');
  }
}
