// ./src/module/Finance/Industry.ts

import terms from '../../assets/finance/industry.json';
import laboratoryTerms from '../../assets/finance/laboratory.json';
import Securities from './Securities';
import Laboratory, { type LaboratoryState, type DistributionState } from './Industry/Laboratory';
import type Finance from '../Finance';

type Product = 'packaging' | 'crates' | 'metalwork';

export interface Order {
  id: number;
  product: Product;
  customer: string;
  batches: number;
  materials: number;
  total: number;
  deadline: number;
  outcome: 'paid' | 'late' | 'default';
  progress: number;
}

export interface FactoryState {
  site: number;
  owned: 'old' | 'new' | null;
  inspected: boolean;
  purchase_price: number;
  pressure_day: number;
  worry_day: number;
  ready_day: number;
  last_day: number;
  offer_week: number;
  next_id: number;
  cash: number;
  workers: number;
  lines: Product[];
  line_limit: number;
  rush: boolean;
  morale: number;
  wage_arrears: number;
  unpaid_days: number;
  overhead_arrears: number;
  manager: boolean;
  security: boolean;
  automatic: boolean;
  reserve: number;
  maximum_order: number;
  offers: Order[];
  order: Order | null;
  invoices: { order: Order; pay_day: number }[];
  issue: { type: 'machine' | 'injury' | 'shipment' | 'protection' | 'haul'; cost: number; day: number; seen: boolean } | null;
  earned: number;
  spent: number;
  delivered: number;
  defaults: number;
  laboratory: LaboratoryState;
  report: { day: number; event: 'paid' | 'default' | 'late' | 'cancelled' | 'delivered' | 'resigned'; seen: boolean; amount: number; customer: string } | null;
}

export interface IndustryState {
  selected: number;
  distribution: DistributionState;
  factories: FactoryState[];
  talk_day: number;
  talk: 'wages' | 'orders' | 'past' | 'off_duty' | null;
  decision: 'pay' | 'refuse' | 'haul' | 'decline' | 'sell' | null;
  result: string | null;
}

export default class Industry {
  public readonly terms = terms;
  private static readonly factory: FactoryState = {
    site: 0,
    owned: null,
    inspected: false,
    purchase_price: 0,
    pressure_day: 0,
    worry_day: -1,
    ready_day: 0,
    last_day: -1,
    offer_week: -1,
    next_id: 1,
    cash: 0,
    workers: 0,
    lines: [],
    line_limit: 1,
    rush: false,
    morale: 60,
    wage_arrears: 0,
    unpaid_days: 0,
    overhead_arrears: 0,
    manager: false,
    security: false,
    automatic: false,
    reserve: terms.reserve,
    maximum_order: 1500000,
    offers: [],
    order: null,
    invoices: [],
    issue: null,
    earned: 0,
    spent: 0,
    delivered: 0,
    defaults: 0,
    report: null,
    laboratory: structuredClone(Laboratory.defaults)
  };

  public static readonly defaults: IndustryState = {
    selected: 0,
    distribution: structuredClone(Laboratory.distribution),
    factories: terms.sites.map(site => ({ ...structuredClone(Industry.factory), site: site.id })),
    talk_day: -1,
    talk: null,
    decision: null,
    result: null
  };

  public readonly laboratory: Laboratory;

  public constructor(private readonly finance: Finance) {
    this.laboratory = new Laboratory(finance, this);
  }

  public get state(): FactoryState {
    return V.Finance.industry.factories[V.Finance.industry.selected];
  }

  public get owned(): FactoryState[] {
    return V.Finance.industry.factories.filter(factory => factory.owned);
  }

  public get purchasePrice(): { old: number; new: number } {
    const multiplier = terms.sites[V.Finance.industry.selected].multiplier;
    return { old: Math.round(terms.purchase.old * multiplier), new: Math.round(terms.purchase.new * multiplier) };
  }

  public get saleProceeds(): number {
    const state = this.state;
    return (
      Math.floor(state.purchase_price * terms.risks.resale) +
      state.cash -
      state.wage_arrears -
      state.overhead_arrears -
      state.workers * terms.wage * 3 -
      Math.ceil((state.order?.total ?? 0) * terms.risks.cancellation)
    );
  }

  public get available(): boolean {
    return V.id > 0 && V.combat !== 1 && !V.replayScene && !V.statFreeze && !V.possessed && V.exposed <= 0 && V.stress < V.stressmax;
  }

  public get open(): boolean {
    return Time.hour >= 8 && Time.hour < 18;
  }

  public get ready(): boolean {
    return !!this.state.owned && Math.floor(Time.days) >= this.state.ready_day;
  }

  public get dailyCost(): number {
    return Industry.dailyCost(this.state);
  }

  public get dailyCosts(): number[] {
    return V.Finance.industry.factories.map(Industry.dailyCost);
  }

  public get capacity(): number {
    return Industry.capacity(this.state);
  }

  private static dailyCost(state: FactoryState): number {
    return (
      Math.ceil(state.workers * terms.wage * (state.rush ? 1.5 : 1)) +
      Math.round(terms.overhead * terms.sites[state.site].multiplier) +
      (state.manager ? terms.managerWage : 0) +
      (state.security ? terms.securityFee : 0) +
      (state.laboratory.technician ? laboratoryTerms.technician_wage : 0)
    );
  }

  private static capacity(state: FactoryState): number {
    return state.workers < 2 || state.morale < 20 || state.wage_arrears > 0 || state.overhead_arrears > 0 || (state.issue && state.issue.type !== 'haul')
      ? 0
      : Math.floor(state.workers * (state.rush ? 1.5 : 1));
  }

  public get foreman(): boolean {
    return this.available && this.open && !!C.npc.Rowan;
  }

  public acquire(mode: 'old' | 'new', product: Product): boolean {
    if (!this.available || !this.open || this.state.owned || !['old', 'new'].includes(mode) || !terms.products.some(item => item.id === product) || this.finance.state.collection.amount > 0)
      return false;
    if (this.finance.payFromBankPennies(this.purchasePrice[mode]) !== 'ok') return false;
    Object.assign(this.state, {
      owned: mode,
      purchase_price: this.purchasePrice[mode],
      pressure_day: Math.floor(Time.days) + terms.risks.cooldown,
      worry_day: -1,
      ready_day: Math.floor(Time.days) + (mode === 'old' ? terms.purchase.oldDays : terms.purchase.newDays),
      last_day: Math.floor(Time.days),
      lines: [product],
      workers: mode === 'old' ? 3 : 0,
      wage_arrears: mode === 'old' ? terms.purchase.oldArrears : 0
    });
    return true;
  }

  public fund(pounds: number, withdraw = false): boolean {
    const amount = Math.round(pounds * 100);
    if (!this.available || !this.state.owned || !Number.isSafeInteger(amount) || amount <= 0 || !this.finance.state.bank.debit_card) return false;
    if (withdraw) {
      if (this.state.cash < amount || !Number.isSafeInteger(this.finance.state.bank.balance + amount)) return false;
      this.state.cash -= amount;
      this.finance.creditBankPennies(amount);
    } else {
      if (!Number.isSafeInteger(this.state.cash + amount) || this.finance.payFromBankPennies(amount) !== 'ok') return false;
      this.state.cash += amount;
    }
    return true;
  }

  public configure(workers: number, rush: boolean, automatic: boolean, reserve: number, maximum: number): boolean {
    const state = this.state;
    if (
      !this.available ||
      !this.open ||
      !this.ready ||
      !Number.isInteger(workers) ||
      workers < 0 ||
      workers > terms.sites[state.site].workers ||
      typeof rush !== 'boolean' ||
      typeof automatic !== 'boolean' ||
      (automatic && !state.manager)
    )
      return false;
    if (![reserve, maximum].every(amount => Number.isSafeInteger(amount) && amount >= 0) || maximum <= 0 || (workers < state.workers && state.wage_arrears > 0)) return false;
    const severance = Math.max(0, state.workers - workers) * terms.wage * 3;
    if (severance > state.cash) return false;
    state.cash -= severance;
    state.spent += severance;
    Object.assign(state, { workers, rush, automatic, reserve, maximum_order: maximum });
    return true;
  }

  public upgrade(product: Product | 'space' | 'manager'): boolean {
    const state = this.state;
    if (!this.available || !this.open || !this.ready || state.wage_arrears > 0 || state.overhead_arrears > 0 || state.issue || state.order || state.laboratory.job) return false;
    const cost = product === 'space' ? terms.expansionCost : product === 'manager' ? terms.managerFee : terms.lineCost;
    if (state.cash < cost) return false;
    if (product === 'space') {
      if (state.line_limit >= terms.maximumLines) return false;
      state.line_limit++;
      state.ready_day = Math.floor(Time.days) + 5;
    } else if (product === 'manager') {
      if (state.manager || !this.foreman || C.npc.Rowan.love < 10) return false;
      state.manager = true;
    } else {
      if (!terms.products.some(item => item.id === product) || state.lines.includes(product) || state.lines.length + Number(state.laboratory.installed) >= state.line_limit) return false;
      state.lines.push(product);
      state.ready_day = Math.floor(Time.days) + 2;
    }
    state.cash -= cost;
    state.spent += cost;
    return true;
  }

  public take(id: number): boolean {
    const state = this.state;
    const order = state.offers.find(item => item.id === id);
    if (
      !this.available ||
      !this.open ||
      !this.ready ||
      state.order ||
      state.laboratory.job ||
      !order ||
      !state.lines.includes(order.product) ||
      order.deadline <= Math.floor(Time.days) ||
      this.capacity === 0 ||
      state.cash < order.materials
    )
      return false;
    this.accept(state, order);
    return true;
  }

  private accept(state: FactoryState, order: Order): void {
    state.cash -= order.materials;
    state.spent += order.materials;
    state.order = order;
    state.offers = state.offers.filter(item => item.id !== order.id);
  }

  public deliver(): boolean {
    const order = this.state.order;
    if (!this.available || !this.open || !order || order.progress < order.batches) return false;
    this.dispatch(this.state, Math.floor(Time.days));
    return true;
  }

  private dispatch(state: FactoryState, day: number): void {
    const order = state.order!;
    const late = Math.max(0, day - order.deadline);
    order.total = Math.round(order.total * Math.clamp(1 - late * 0.05, 0.5, 1));
    this.finance.company.dispatch(state, order, day);
    const contract = this.finance.company.state.contract;
    const payDay = contract?.site === state.site && contract.id === order.id ? contract.pay_day : day + (order.outcome === 'late' ? 7 : 2);
    state.invoices.push({ order, pay_day: payDay });
    state.delivered++;
    this.finance.recognition.award('business', 'factory-delivery', 5);
    state.report = { day, event: 'delivered', seen: false, amount: order.total, customer: order.customer };
    state.order = null;
  }

  public resolve(choice: 'arrears' | 'repair' | 'compensate' | 'replace' | 'cancel' | 'pay' | 'refuse' | 'haul' | 'decline'): boolean {
    const state = this.state;
    if (!this.available || !this.open || !state.owned) return false;
    const issue = state.issue;
    if (choice === 'pay' || choice === 'refuse' || choice === 'haul' || choice === 'decline') {
      if (
        !issue ||
        (issue.type === 'haul' && Math.floor(Time.days) > issue.day + 2) ||
        (issue.type === 'protection' ? !['pay', 'refuse'].includes(choice) : issue.type !== 'haul' || !['haul', 'decline'].includes(choice))
      )
        return false;
      if (choice === 'pay') {
        if (state.cash < issue.cost) return false;
        state.cash -= issue.cost;
        state.spent += issue.cost;
      } else if (choice === 'haul') {
        state.cash += terms.risks.haulFee;
        state.earned += terms.risks.haulFee;
      }
      state.issue = choice === 'refuse' && random(1, 100) <= 40 ? { type: 'machine', cost: terms.risks.damage, day: Math.floor(Time.days), seen: false } : null;
      state.pressure_day = Math.floor(Time.days) + terms.risks.cooldown;
      V.Finance.industry.decision = choice;
      return true;
    }
    if (choice === 'cancel') {
      if (!state.order) return false;
      const order = state.order;
      const penalty = Math.ceil(order.total * terms.risks.cancellation);
      const refund = this.finance.company.cancellationRefund;
      if (state.cash < penalty + refund) return false;
      state.cash -= penalty + refund;
      state.spent += penalty;
      this.finance.company.cancel(state, order);
      this.finance.recognition.award('business', 'factory-cancellation', -3);
      state.report = { day: Math.floor(Time.days), event: 'cancelled', seen: false, amount: order.materials, customer: order.customer };
      state.order = null;
      if (state.issue?.type === 'shipment') state.issue = null;
      return true;
    }
    const debt = state.wage_arrears + state.overhead_arrears;
    const cost = choice === 'arrears' ? debt : (issue?.cost ?? 0);
    if (
      cost <= 0 ||
      state.cash < cost ||
      (choice !== 'arrears' && (!issue || ({ machine: 'repair', injury: 'compensate', shipment: 'replace', protection: 'pay', haul: 'haul' } as const)[issue.type] !== choice))
    )
      return false;
    state.cash -= cost;
    state.spent += cost;
    if (choice === 'arrears') {
      state.wage_arrears = state.overhead_arrears = 0;
      state.morale = Math.clamp(state.morale + 8, 0, 100);
    } else {
      if (issue?.type === 'injury') state.morale = Math.clamp(state.morale + 5, 0, 100);
      state.issue = null;
    }
    return true;
  }

  public secure(enabled: boolean): boolean {
    const state = this.state;
    if (!this.available || !this.open || !this.ready || typeof enabled !== 'boolean' || state.security === enabled) return false;
    if (enabled && (state.wage_arrears > 0 || state.overhead_arrears > 0 || state.cash < terms.securityFee)) return false;
    state.security = enabled;
    return true;
  }

  public liquidate(): boolean {
    const state = this.state;
    if (
      !this.available ||
      !this.open ||
      !state.owned ||
      state.issue ||
      state.laboratory.job ||
      state.laboratory.raw.phial > 0 ||
      state.laboratory.raw.flower > 0 ||
      state.laboratory.batches.length > 0 ||
      state.laboratory.invoices.length > 0 ||
      this.finance.company.state.contract?.site === state.site ||
      this.saleProceeds < 0
    )
      return false;
    const proceeds = this.saleProceeds;
    if (!Number.isSafeInteger(this.finance.state.bank.balance + proceeds)) return false;
    state.spent += state.wage_arrears + state.overhead_arrears + state.workers * terms.wage * 3 + Math.ceil((state.order?.total ?? 0) * terms.risks.cancellation);
    this.finance.creditBankPennies(proceeds);
    Object.assign(state, {
      owned: null,
      purchase_price: 0,
      cash: 0,
      workers: 0,
      wage_arrears: 0,
      overhead_arrears: 0,
      lines: [],
      line_limit: 1,
      rush: false,
      morale: 60,
      manager: false,
      security: false,
      automatic: false,
      offers: [],
      order: null,
      invoices: [],
      issue: null,
      report: null,
      laboratory: structuredClone(Laboratory.defaults)
    });
    V.Finance.industry.decision = 'sell';
    return true;
  }

  public talk(topic: NonNullable<IndustryState['talk']>): boolean {
    if (!this.foreman || !['wages', 'orders', 'past', 'off_duty'].includes(topic) || V.Finance.industry.talk_day === Math.floor(Time.days)) return false;
    V.Finance.industry.talk_day = Math.floor(Time.days);
    V.Finance.industry.talk = topic;
    C.npc.Rowan.love = Math.clamp(C.npc.Rowan.love + (this.owned.some(factory => factory.wage_arrears > 0) ? 0 : 2), 0, 50);
    return true;
  }

  public advance(day: number): void {
    if (V.replayScene || V.statFreeze || !Number.isInteger(day) || day > Math.floor(Time.days)) return;
    const factories = this.owned;
    if (!factories.length) return;
    const first = Math.min(...factories.map(factory => factory.last_day)) + 1;
    for (let current = first; current <= day; current++) {
      for (const state of factories) {
        if (current > state.last_day) this.advanceFactory(state, current);
      }
    }
  }

  private advanceFactory(state: FactoryState, current: number): void {
    state.last_day = current;
    if (state.issue?.type === 'haul' && current > state.issue.day + 2) state.issue = null;
    for (const invoice of state.invoices.filter(item => item.pay_day <= current)) {
      const { order } = invoice;
      if (this.finance.company.settle(state, order)) continue;
      if (order.outcome === 'default') {
        state.defaults++;
        this.finance.core.SugarCube.Wikifier.wikifyEval('<<earnFeat "Deadwood Unpaid Invoice">>');
      } else {
        state.cash += order.total;
        state.earned += order.total;
        this.finance.core.SugarCube.Wikifier.wikifyEval('<<earnFeat "Deadwood First Factory Payment">>');
      }
      state.report = { day: current, event: order.outcome, seen: false, amount: order.total, customer: order.customer };
    }
    state.invoices = state.invoices.filter(item => item.pay_day > current);
    const wages = Math.ceil(state.workers * terms.wage * (state.rush ? 1.5 : 1)) + (state.manager ? terms.managerWage : 0) + (state.laboratory.technician ? laboratoryTerms.technician_wage : 0);
    const paid = Math.min(state.cash, wages);
    state.cash -= paid;
    state.spent += paid;
    state.wage_arrears += wages - paid;
    state.unpaid_days = state.wage_arrears > 0 ? state.unpaid_days + 1 : 0;
    if (state.unpaid_days >= 14 && (state.workers > 0 || state.manager || state.laboratory.technician)) {
      state.workers = 0;
      state.manager = state.automatic = state.laboratory.technician = false;
      state.laboratory.automatic = null;
      state.report = { day: current, event: 'resigned', seen: false, amount: state.wage_arrears, customer: '' };
    }
    const bills = Math.round(terms.overhead * terms.sites[state.site].multiplier) + (state.security ? terms.securityFee : 0);
    const overhead = Math.min(state.cash, bills);
    state.cash -= overhead;
    state.spent += overhead;
    state.overhead_arrears += bills - overhead;
    state.morale = Math.clamp(state.morale + (state.wage_arrears > 0 ? -5 : state.rush ? -2 : 1), 0, 100);
    if (current < state.ready_day) {
      this.laboratory.advance(state, current, 0);
      return;
    }
    const week = Math.floor(current / 7);
    if (state.offer_week !== week) {
      this.offers(state, current);
      if (
        !state.issue &&
        state.workers >= 2 &&
        current >= state.pressure_day &&
        random(1, 100) <= (state.security && state.overhead_arrears === 0 ? terms.risks.guardedPressureChance : terms.risks.pressureChance)
      ) {
        const type = random(0, 1) === 0 ? 'protection' : 'haul';
        state.issue = { type, cost: type === 'protection' ? terms.risks.protection : 0, day: current, seen: false };
        state.pressure_day = current + terms.risks.cooldown;
      }
    }
    const processing = !!state.laboratory.job || !!(state.laboratory.automatic && state.laboratory.raw[state.laboratory.automatic] > 0);
    this.laboratory.advance(state, current, Securities.tradingDay(current) ? Industry.capacity(state) : 0);
    if (!Securities.tradingDay(current) || Industry.capacity(state) === 0 || processing) return;
    if (state.automatic && state.manager && !state.order) {
      const order = state.offers
        .filter(
          item =>
            state.lines.includes(item.product) &&
            item.total <= state.maximum_order &&
            item.total > item.materials &&
            state.cash - item.materials >= state.reserve + Industry.dailyCost(state) * 3 &&
            item.deadline > current
        )
        .sort((a, b) => (b.total - b.materials) / b.batches - (a.total - a.materials) / a.batches)[0];
      if (order) this.accept(state, order);
    }
    if (!state.order) return;
    if (state.order.progress >= state.order.batches) {
      if (state.automatic && state.manager) this.dispatch(state, current);
      return;
    }
    if (!state.issue && random(1, 100) <= (state.rush ? terms.rushEventChance : terms.eventChance)) {
      const type = (['machine', 'injury', 'shipment'] as const)[random(0, 2)];
      state.issue = { type, cost: type === 'machine' ? terms.risks.machine : type === 'injury' ? terms.risks.injury : Math.ceil(state.order.materials * 0.25), day: current, seen: false };
      return;
    }
    state.order.progress = Math.min(state.order.batches, state.order.progress + Industry.capacity(state));
    if (state.automatic && state.manager && state.order.progress >= state.order.batches) this.dispatch(state, current);
  }

  private offers(state: FactoryState, day: number): void {
    const season = Time.getSeason(new DateTime(Time.date).addDays(day - Math.floor(Time.days)));
    const index = ['winter', 'spring', 'summer', 'autumn'].indexOf(season);
    state.offers = terms.products.flatMap(product => {
      const customers = product.customers.filter(
        symbol => this.finance.securities.some(item => item.symbol === symbol) && (symbol !== 'RDS' || this.finance.core.get('Robin')?.state.shop) && (symbol !== 'AVY' || V.avery_fate === 'ascended')
      );
      if (!customers.length || random(1, 100) > product.seasons[Math.max(0, index)]) return [];
      const customer = customers[random(0, customers.length - 1)];
      const batches = Math.clamp(
        Math.round((random(6, 15) * product.seasons[Math.max(0, index)] * terms.sites[state.site].multiplier) / 100),
        3,
        customer === 'RDS' ? 5 : Math.round(24 * terms.sites[state.site].multiplier)
      );
      const roll = random(1, 100);
      const multiplier = random(1, 100) > 94 ? random(150, 220) : random(80, 120);
      return [
        {
          id: state.next_id++,
          product: product.id as Product,
          customer,
          batches,
          materials: product.materials * batches,
          total: Math.round((product.price * batches * multiplier) / 100),
          deadline: day + random(5, 10),
          outcome: roll <= 8 && customer !== 'RDS' ? ('default' as const) : roll <= 25 ? ('late' as const) : ('paid' as const),
          progress: 0
        }
      ];
    });
    state.offer_week = Math.floor(day / 7);
  }
}
