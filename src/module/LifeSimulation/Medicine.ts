// ./src/module/LifeSimulation/Medicine.ts

import catalogue from '../../assets/life-simulation/medicines.json';

interface MedicineDefinition {
  id: MedicineId;
  name: readonly string[];
  description: readonly string[];
  price: number;
  hours: number;
}

export type MedicineId = keyof typeof catalogue;

interface Use {
  owned: number;
  last: number;
  day: number;
  count: number;
  streak: number;
  dependence: number;
  until: number;
  rebound: number;
  settledDay: number;
}

export interface MedicineState {
  uses: Partial<Record<MedicineId, Use>>;
  notices: { id: MedicineId; kind: 'expiry' | 'withdrawal' }[];
  review: { day: number; shared: boolean; pending: boolean };
}

// 药品目录只保存名称、说明、售价和时长，服药效果仍由本模块结算。
export const MEDICINES: readonly MedicineDefinition[] = Object.entries(catalogue).map(([id, item]) => ({ id: id as MedicineId, ...item }));

const EMPTY_USE: Use = { owned: 0, last: -1, day: -1, count: 0, streak: 0, dependence: 0, until: 0, rebound: 0, settledDay: -1 };
const HOURS = 60 * 60;
const key = (id: MedicineId) => MEDICINES.find(item => item.id === id)!.name[0].toLowerCase();

export default class Medicine {
  public constructor(private readonly core: typeof maplebirch) {}

  private get state(): MedicineState {
    return V.LifeSimulation.medicine;
  }

  private use(id: MedicineId): Use {
    return (this.state.uses[id] ??= { ...EMPTY_USE, settledDay: Time.days });
  }

  public get offers() {
    return MEDICINES;
  }

  public name(id: MedicineId): string {
    const item = MEDICINES.find(item => item.id === id)!;
    return lanSwitch(item.name[0], item.name[1]);
  }

  /** 最近服用或仍有明显依赖的药片，供哈珀问诊读取。 */
  public get recent() {
    return MEDICINES.filter(item => {
      const use = this.state.uses[item.id];
      return use && ((use.last >= 0 && Time.date.timeStamp - use.last <= 7 * 24 * HOURS) || this.level(item.id) > 0);
    });
  }

  public get reviewDue(): boolean {
    return this.state.review.day !== Time.days && this.recent.length > 0;
  }

  public get dependence(): number {
    return Math.max(0, ...this.recent.map(item => this.level(item.id)));
  }

  public get frequent(): boolean {
    return this.recent.some(item => {
      const use = this.state.uses[item.id]!;
      return (use.day === Time.days && use.count > 1) || use.streak >= 7;
    });
  }

  public get drowsy(): boolean {
    return this.sleepy || this.active('calm') || this.active('soothe');
  }

  public report(shared: boolean): boolean {
    if (!this.reviewDue) return false;
    this.state.review = { day: Time.days, shared, pending: true };
    return true;
  }

  public reply(): boolean | undefined {
    if (!this.state.review.pending) return undefined;
    this.state.review.pending = false;
    return this.state.review.shared;
  }

  public owned(id: MedicineId): number {
    return this.state.uses[id]?.owned ?? 0;
  }

  public active(id: MedicineId): boolean {
    return (this.state.uses[id]?.until ?? 0) > Time.date.timeStamp;
  }

  public get focus(): number {
    return this.active('focus') ? 1.15 : 1;
  }

  public get sleepy(): boolean {
    return this.active('sleep');
  }

  public level(id: MedicineId): number {
    const value = this.state.uses[id]?.dependence ?? 0;
    return value >= 60 ? 3 : value >= 30 ? 2 : value >= 12 ? 1 : 0;
  }

  public canTake(id: MedicineId): boolean {
    const use = this.use(id);
    return V.statFreeze !== true && V.combat !== 1 && this.owned(id) > 0 && (use.last < 0 || Time.date.timeStamp - use.last >= HOURS);
  }

  public buy(id: MedicineId): boolean {
    const item = MEDICINES.find(item => item.id === id);
    if (!item || V.location !== 'hospital' || V.daily.pharm.closed) return false;
    const finance = this.core.get('VanillaPlus')?.finance;
    if (!(finance ? finance.canPay(item.price, 'shopping') : V.money >= item.price)) return false;
    // 复用原版 money 宏和模组付款路由，所有结算金额均为便士。
    this.core.SugarCube.Wikifier.wikifyEval(`<<money -${item.price} 'shopping'>>`);
    this.use(id).owned += 7;
    return true;
  }

  public take(id: MedicineId): void {
    if (!this.canTake(id)) return;
    this.tick();
    const use = this.use(id);
    const item = MEDICINES.find(item => item.id === id)!;
    const now = Time.date.timeStamp;
    const repeat = use.last >= 0 && now - use.last < 8 * HOURS;
    const consecutive = use.day === Time.days - 1;
    if (use.day !== Time.days) {
      use.streak = consecutive ? use.streak + 1 : 1;
      use.day = Time.days;
      use.count = 0;
    }
    use.count++;
    use.dependence = Math.min(100, use.dependence + (repeat ? 8 : 0) + (use.count > 1 ? 4 : 0) + (use.streak >= 7 ? 2 : 0));
    use.last = now;
    use.owned--;
    V.pillsConsumed = (V.pillsConsumed || 0) + 1;
    // 重复使用只增加风险，不累积或延长当前药效。
    const fresh = !this.active(id);
    const strength = this.level(id) >= 2 ? 0.5 : 1;
    let text = lanSwitch('You swallow a tablet with water.', '你就着水服下一片药。');
    if (fresh) {
      use.until = now + item.hours * HOURS;
      const before = id === 'alert' ? V.tiredness : V.trauma;
      const effects: Record<MedicineId, string> = {
        calm: `<<stress ${-6 * strength}>><<tiredness 4>><<lstress>><<gtiredness>>`,
        sleep: '<<tiredness 6>><<gtiredness>>',
        alert: `<<tiredness ${-12 * strength}>><<stress 3>><<ltiredness>><<gstress>>`,
        focus: '<<stress 3>><<gstress>>',
        soothe: `<<trauma ${-2 * strength}>><<tiredness 2>><<ltrauma>><<gtiredness>>`
      };
      this.core.SugarCube.Wikifier.wikifyEval(effects[id].replace(/<<[lg][^>]*>>/g, ''));
      if (id === 'alert' || id === 'soothe') use.rebound = Math.max(0, before - (id === 'alert' ? V.tiredness : V.trauma));
      text += ` ${lanSwitch(item.description[0], item.description[1])} ${effects[id].replace(/<<(stress|tiredness|trauma) [^>]*>>/g, '')}`;
    } else {
      this.core.SugarCube.Wikifier.wikifyEval('<<stress 3>><<tiredness 3>>');
      text += lanSwitch(
        ' The previous dose is still active. Another tablet brings no additional benefit. <<gstress>><<gtiredness>>',
        ' 上一次服药的效果仍未消退，再吃一片并没有带来更多益处。<<gstress>><<gtiredness>>'
      );
    }
    if (repeat || use.count > 1) text += lanSwitch(' <span class="red">You have exceeded the directions on the packet.</span>', ' <span class="red">你没有遵守包装上的服用间隔。</span>');
    if (use.streak >= 7) text += lanSwitch(' <span class="purple">You have been reaching for these tablets every day.</span>', ' <span class="purple">你已经连续多日依靠这些药片。</span>');
    V.lastPillTakenDescription = text;
    this.core.SugarCube.Engine.play('Take Pill From Medicine Drawer');
  }

  public get expired(): boolean {
    const uses: MedicineState['uses'] = V.LifeSimulation?.medicine?.uses ?? {};
    return Object.values(uses).some(use => use && use.until > 0 && use.until <= Time.date.timeStamp);
  }

  public get pending(): boolean {
    return (V.LifeSimulation?.medicine?.notices?.length ?? 0) > 0;
  }

  public flush(): string {
    const messages = this.state.notices.splice(0).map(({ id, kind }) => {
      if (kind === 'withdrawal') return `${this.name(id)}：${lanSwitch('Going without leaves you uneasy. <<gstress>>', '停用后，你感到有些不安。<<gstress>>')}`;
      const result = id === 'alert' ? '<<gtiredness>>' : id === 'soothe' ? '<<gtrauma>>' : id === 'sleep' ? '<<gtiredness>>' : '';
      return `${this.name(id)}：${lanSwitch('The effect has worn off.', '药效已经消退。')} ${result}`;
    });
    return `${messages.join('<br>')}<br><br>`;
  }

  public tick(): void {
    if (!V.LifeSimulation?.medicine || V.statFreeze) return;
    const now = Time.date.timeStamp;
    for (const item of MEDICINES) {
      const use = this.state.uses[item.id];
      if (!use || !use.until || use.until > now) continue;
      if (item.id === 'alert') V.tiredness = Math.min(V.tirednessmax, V.tiredness + use.rebound);
      if (item.id === 'soothe' && V.innocencestate !== 1) V.trauma = Math.min(V.traumamax, V.trauma + use.rebound);
      if (item.id === 'sleep') this.core.SugarCube.Wikifier.wikifyEval('<<tiredness 2>>');
      this.state.notices.push({ id: item.id, kind: 'expiry' });
      use.rebound = 0;
      use.until = 0;
    }
  }

  public day(): void {
    if (!V.LifeSimulation?.medicine || V.statFreeze) return;
    for (const item of MEDICINES) {
      const use = this.state.uses[item.id];
      if (!use) continue;
      // 时间事件一次可以跨过多天。停药第二天起回补依赖衰减，不倒放过去的 PC 状态。
      const previousDay = Math.max(use.settledDay ?? Time.days, use.day + 1);
      const days = Math.max(0, Time.days - previousDay);
      use.settledDay = Math.max(use.settledDay ?? Time.days, Time.days);
      if (days === 0) continue;
      use.streak = 0;
      if (use.dependence - (days - 1) * 2 >= 12 && !V.statFreeze) {
        this.core.SugarCube.Wikifier.wikifyEval('<<stress 1>>');
        this.state.notices.push({ id: item.id, kind: 'withdrawal' });
      }
      use.dependence = Math.max(0, use.dependence - days * 2);
    }
  }

  public preInit(): void {
    // 正常推进由时间事件结算，gate 只补结算载入或直接跳时后已经到期的药效。
    this.core.dynamic.regStateEvent('gate', 'life-simulation-medicine-expiry', {
      cond: () => this.core.get('LifeSimulation')?.medicine?.expired === true,
      action: () => this.tick()
    });

    this.core.dynamic.regStateEvent('gate', 'life-simulation-medicine-notices', {
      forceExit: false,
      cond: () => V.combat !== 1 && this.core.get('LifeSimulation')?.medicine?.pending === true,
      output: 'print maplebirch.get("LifeSimulation").medicine.flush()'
    });

    this.core.dynamic.regStateEvent('gate', 'life-simulation-medicine-sale', {
      forceExit: true,
      cond: () => Boolean(this.core.get('LifeSimulation')) && MEDICINES.some(item => V.pharmacyItem?.type === `deadwood-${item.id}`),
      output: 'deadwood-medicine-sale',
      extra: { passage: ['Pharmacy Sale'] }
    });
    this.core.on(':variable', () => {
      for (const item of MEDICINES) {
        const use = V.LifeSimulation?.medicine?.uses[item.id];
        if (!use) continue;
        use.settledDay ??= Time.days;
        const duration = item.hours * HOURS;
        const savedDuration = use.until - use.last;
        if (use.last >= 0 && use.until >= duration * 1000 && savedDuration > duration && savedDuration <= duration * 1000) {
          use.until -= duration * 999;
        }
      }
    });
    this.core.dynamic.regTimeEvent('onAfter', 'LifeSimulation Medicine Expiry', { action: () => this.tick() });
    this.core.dynamic.regTimeEvent('onDay', 'LifeSimulation Medicine Dependence', { exact: true, action: () => this.day() });
    const indicators: Record<MedicineId, [string, string, string][]> = {
      calm: [
        ['- Stress', '- 压力', 'green'],
        ['+ Fatigue', '+ 疲劳', 'red']
      ],
      sleep: [
        ['Easier sleep', '助眠', 'green'],
        ['+ Fatigue', '+ 疲劳', 'red']
      ],
      alert: [
        ['- Fatigue', '- 疲劳', 'green'],
        ['+ Stress', '+ 压力', 'red']
      ],
      focus: [
        ['+ Learning', '+ 学习收益', 'green'],
        ['+ Stress', '+ 压力', 'red']
      ],
      soothe: [
        ['- Trauma', '- 创伤', 'green'],
        ['+ Fatigue', '+ 疲劳', 'red']
      ]
    };
    for (const item of MEDICINES) {
      const config = {
        cn_name: item.name[1],
        icon: `img/misc/icon/medicine/pill-${item.id}.png`,
        description: () => lanSwitch(item.description[0], item.description[1]),
        indicators: () => indicators[item.id].map(([en, cn, colour]) => `<span class="${colour}">${lanSwitch(en, cn)}</span>`),
        warning_label: () =>
          lanSwitch(
            'Leave at least eight hours between doses. Repeated and prolonged use may cause dependence. Manual use only.',
            '两次服用至少间隔八小时。反复或长期使用可能形成依赖，仅限手动服用。'
          ),
        owned: () => this.owned(item.id),
        doseTaken: () => (this.use(item.id).day === Time.days ? this.use(item.id).count : 0),
        canTake: () => !!this.core.get('LifeSimulation') && this.canTake(item.id),
        take: () => this.take(item.id)
      };
      this.core.tool.patch.require<{ add: (name: string, definition: typeof config) => void }>('pills').add(key(item.id), config);
    }
  }
}
