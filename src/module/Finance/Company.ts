// ./src/module/Finance/Company.ts

import terms from '../../assets/finance/company.json';
import type Finance from '../Finance';
import Shareholders, { type ShareholdersState } from './Shareholders';
import CompanyStaff, { type CompanyStaffState } from './CompanyStaff';
import CompanyAvery, { type CompanyAveryState } from './CompanyAvery';
import CompanySuite, { type CompanySuiteState } from './CompanySuite';
import CompanyAscension, { type CompanyAscensionState } from './CompanyAscension';
import type { FactoryState, Order } from './Industry';

export interface CompanyState {
  name: string | null;
  office: boolean;
  rent_day: number;
  rent_arrears: number;
  last_day: number;
  completed: number;
  next_order_day: number;
  agreement: boolean;
  policy: 'standard' | 'volume' | 'price';
  review_day: number;
  result: string | null;
  staff: CompanyStaffState;
  shareholders: ShareholdersState;
  avery: CompanyAveryState;
  suite: CompanySuiteState;
  ascension: CompanyAscensionState;
  contract: {
    site: number;
    id: number;
    advance: number;
    due: number;
    pay_day: number;
    credit: boolean;
    stage: 'production' | 'invoice' | 'disputed' | 'waiting';
  } | null;
}

export default class Company {
  public readonly terms = terms;
  public readonly shareholders = new Shareholders(this);
  public readonly staff = new CompanyStaff(this);
  public readonly avery: CompanyAvery;
  public readonly suite = new CompanySuite(this);
  public readonly ascension = new CompanyAscension(this);
  public static readonly defaults: CompanyState = {
    name: null,
    office: false,
    rent_day: -1,
    rent_arrears: 0,
    last_day: -1,
    completed: 0,
    next_order_day: 0,
    agreement: false,
    policy: 'standard',
    review_day: 0,
    result: null,
    staff: CompanyStaff.defaults,
    shareholders: Shareholders.defaults,
    avery: CompanyAvery.defaults,
    suite: CompanySuite.defaults,
    ascension: CompanyAscension.defaults,
    contract: null
  };

  public constructor(public readonly finance: Finance) {
    this.avery = new CompanyAvery(this);
  }

  public get state(): CompanyState {
    return this.finance.state.company;
  }

  public get available(): boolean {
    return V.id > 0 && V.combat !== 1 && !V.replayScene && !V.statFreeze && !V.possessed && V.exposed <= 0 && V.stress < V.stressmax && !window.pcAreArmsBound('both');
  }

  public get open(): boolean {
    return !Time.isWeekEnd() && Time.hour >= 9 && Time.hour < 17;
  }

  public get dealing(): boolean {
    return this.available && this.open && this.state.office && this.state.rent_arrears === 0 && this.finance.state.collection.amount === 0;
  }

  public get factories(): FactoryState[] {
    return this.finance.industry.owned.filter(
      factory =>
        Math.floor(Time.days) >= factory.ready_day &&
        factory.workers >= 2 &&
        factory.morale >= 20 &&
        factory.lines.includes('metalwork') &&
        !factory.order &&
        !factory.laboratory.job &&
        !factory.issue &&
        factory.wage_arrears === 0 &&
        factory.overhead_arrears === 0
    );
  }

  public get share(): number {
    const total = this.finance.state.market.shares.AVY?.total ?? 0;
    return total > 0 ? (this.finance.sellableShares.AVY ?? 0) / total : 0;
  }

  public get eligible(): boolean {
    return this.dealing && this.state.completed >= terms.partnerContracts && this.factories.length > 0;
  }

  public get partner(): boolean {
    return this.state.agreement && this.state.office && this.state.rent_arrears === 0 && this.finance.state.collection.amount === 0;
  }

  public get meeting(): boolean {
    const avery = C.npc.Avery;
    return (
      this.dealing &&
      ((avery?.init === 1 && avery.state === 'active') || (avery?.init === 0 && avery.state === '' && this.eligible)) &&
      !V.avery_injury &&
      V.avery_mansion?.schedule !== 'away' &&
      !['fallen', 'kicked'].includes(V.avery_fate)
    );
  }

  public get quote(): { batches: number; materials: number; total: number; advance: number } {
    const product = this.finance.industry.terms.products.find(item => item.id === 'metalwork')!;
    const policy = this.partner ? this.state.policy : 'standard';
    const boardPolicy = this.shareholders.state.policy;
    const batches = Math.round(terms.batches * (policy === 'volume' ? terms.volumeMultiplier : 1) * (this.partner && boardPolicy === 'expansion' ? terms.governance.supplyExpansionMultiplier : 1));
    const total = Math.round(product.price * batches * (policy === 'price' ? terms.priceMultiplier : 1));
    // 采购政策只影响新签订单，不改已经约定的数量、货款或预付款。
    const advanceRate = this.partner ? terms.partnerAdvanceRate + (boardPolicy === 'reserve' ? terms.governance.supplyReserveAdvance : 0) : terms.advanceRate;
    return { batches, materials: product.materials * batches, total, advance: Math.floor(total * advanceRate) };
  }

  public get canOrder(): boolean {
    return this.dealing && !['fallen', 'kicked'].includes(V.avery_fate) && !this.state.contract && Math.floor(Time.days) >= this.state.next_order_day && this.factories.length > 0;
  }

  public get cancellationRefund(): number {
    const factory = this.finance.industry.state;
    return this.state.contract?.stage === 'production' && this.state.contract.site === factory.site && this.state.contract.id === factory.order?.id ? this.state.contract.advance : 0;
  }

  public register(name: string): boolean {
    if (!this.available || !this.open || this.state.name || typeof name !== 'string') return false;
    name = name.trim();
    if (!/^[\p{L}\p{N}][\p{L}\p{N} '’.-]{1,39}$/u.test(name) || this.finance.payFromBankPennies(terms.registrationFee) !== 'ok') return false;
    this.state.name = name;
    return true;
  }

  public lease(): boolean {
    if (!this.available || !this.open || !this.state.name || this.state.office || this.finance.state.collection.amount > 0) return false;
    if (this.finance.payFromBankPennies(terms.officeDeposit + terms.weeklyRent) !== 'ok') return false;
    Object.assign(this.state, { office: true, rent_day: Math.floor(Time.days) + 7, last_day: Math.floor(Time.days), rent_arrears: 0 });
    return true;
  }

  public payRent(): boolean {
    if (!this.available || !this.open || this.state.rent_arrears <= 0 || this.finance.payFromBankPennies(this.state.rent_arrears) !== 'ok') return false;
    this.state.rent_arrears = 0;
    return true;
  }

  public close(): boolean {
    if (!this.available || !this.open || !this.state.office || this.state.contract || this.staff.employed || this.staff.arrears > 0 || this.state.rent_arrears > terms.officeDeposit) return false;
    const refund = terms.officeDeposit - this.state.rent_arrears;
    if (!Number.isSafeInteger(this.finance.state.bank.balance + refund)) return false;
    this.finance.creditBankPennies(refund);
    Object.assign(this.state, { office: false, rent_day: -1, rent_arrears: 0, agreement: false, policy: 'standard' });
    return true;
  }

  public take(site: number, credit: boolean): boolean {
    const factory = this.factories.find(item => item.site === site);
    if (!this.canOrder || !factory || typeof credit !== 'boolean') return false;
    const quote = this.quote;
    const advance = credit ? 0 : quote.advance;
    const total = credit ? Math.round(quote.total * terms.creditPremium) : quote.total;
    if (factory.cash + advance < quote.materials || !Number.isSafeInteger(factory.cash + advance)) return false;
    const day = Math.floor(Time.days);
    const id = factory.next_id++;
    factory.cash += advance - quote.materials;
    factory.earned += advance;
    factory.spent += quote.materials;
    factory.order = { id, product: 'metalwork', customer: 'AVY', batches: quote.batches, materials: quote.materials, total, deadline: day + terms.deliveryDays, outcome: 'paid', progress: 0 };
    this.state.contract = { site, id, advance, due: total - advance, pay_day: -1, credit, stage: 'production' };
    this.state.next_order_day = day + (this.partner && this.state.policy === 'price' ? terms.discountCooldown : this.staff.sales ? terms.salesCooldown : terms.orderCooldown);
    return true;
  }

  public dispatch(factory: FactoryState, order: Order, day: number): void {
    const contract = this.state.contract;
    if (!contract || contract.site !== factory.site || contract.id !== order.id || contract.stage !== 'production') return;
    contract.due = order.total - contract.advance;
    contract.pay_day = day + (contract.credit ? terms.creditDays : 2);
    contract.stage = 'invoice';
    order.total = contract.due;
  }

  public settle(factory: FactoryState, order: Order): boolean {
    const contract = this.state.contract;
    if (!contract || contract.site !== factory.site || contract.id !== order.id || contract.stage !== 'invoice') return false;
    if (contract.credit) {
      contract.stage = 'disputed';
      return true;
    }
    this.state.completed++;
    this.state.contract = null;
    return false;
  }

  public cancel(factory: FactoryState, order: Order): void {
    if (this.state.contract?.site === factory.site && this.state.contract.id === order.id) {
      factory.earned -= this.state.contract.advance;
      this.state.contract = null;
    }
  }

  public collect(discount: boolean): boolean {
    const contract = this.state.contract;
    if (!this.available || !this.open || !contract || contract.stage !== 'disputed' || typeof discount !== 'boolean') return false;
    if (!discount) {
      contract.stage = 'waiting';
      contract.pay_day = Math.floor(Time.days) + terms.reminderDays;
      return true;
    }
    const factory = this.finance.state.industry.factories[contract.site];
    const amount = Math.floor(contract.due * terms.settlementRate);
    if (!Number.isSafeInteger(factory.cash + amount)) return false;
    factory.cash += amount;
    factory.earned += amount;
    factory.paid ??= {};
    factory.paid.AVY = (factory.paid.AVY ?? 0) + 1;
    this.finance.industry.report(factory, { day: Math.floor(Time.days), event: 'paid', amount, customer: 'AVY' });
    this.state.completed++;
    this.state.contract = null;
    this.finance.core.SugarCube.Wikifier.wikifyEval('<<earnFeat "Deadwood First Factory Payment">>');
    return true;
  }

  public agree(): boolean {
    if (!this.eligible || this.state.agreement || !this.meeting) return false;
    this.state.agreement = true;
    this.state.review_day = Math.floor(Time.days);
    return true;
  }

  public review(policy: CompanyState['policy']): boolean {
    if (!this.partner || !this.meeting || this.state.contract || Math.floor(Time.days) < this.state.review_day || !['standard', 'volume', 'price'].includes(policy)) return false;
    this.state.policy = policy;
    this.state.review_day = Math.floor(Time.days) + 7;
    return true;
  }

  public advance(day: number): void {
    const state = this.state;
    if (V.replayScene || V.statFreeze || !Number.isInteger(day) || day > Math.floor(Time.days) || day <= state.last_day) return;
    if (state.office) {
      while (state.rent_day <= day) {
        const due = state.rent_arrears + terms.weeklyRent;
        state.rent_arrears = due - this.finance.collectBankPennies(due);
        state.rent_day += 7;
      }
    }
    this.staff.advance(day);
    this.shareholders.advance(day);
    const contract = state.contract;
    if (contract?.stage === 'waiting' && day >= contract.pay_day) {
      const factory = this.finance.state.industry.factories[contract.site];
      if (Number.isSafeInteger(factory.cash + contract.due)) {
        factory.cash += contract.due;
        factory.earned += contract.due;
        factory.paid ??= {};
        factory.paid.AVY = (factory.paid.AVY ?? 0) + 1;
        this.finance.industry.report(factory, { day, event: 'paid', amount: contract.due, customer: 'AVY' });
        state.completed++;
        state.contract = null;
        this.finance.core.SugarCube.Wikifier.wikifyEval('<<earnFeat "Deadwood First Factory Payment">>');
      }
    }

    // 按既有日结游标处理关系收益，营业时间只限制会面，不限制日结。
    const shareholders = this.shareholders;
    const brokerage = this.finance.state.brokerage;
    const unsettled = brokerage.unsettled;
    // 快进逐日结算时使用该日的交割资格，不能把最终日期已交割的股份倒填到过去。
    const held = Math.max(0, (brokerage.holdings.AVY ?? 0) - (unsettled && day < unsettled.available_day ? (unsettled.shares.AVY ?? 0) : 0));
    const controller = held > shareholders.stock.total / 2;
    const director = shareholders.state.board && held / shareholders.stock.total >= shareholders.terms.boardShare;
    const meeting = shareholders.state.minutes;
    const contactDay = Math.max(meeting?.passed ? meeting.day : -1, this.avery.state.talk_day);
    const avery = C.npc.Avery;
    if (
      (controller || director) &&
      contactDay >= 0 &&
      day > contactDay &&
      day <= contactDay + 7 &&
      state.rent_arrears === 0 &&
      this.finance.state.collection.amount === 0 &&
      avery?.init === 1 &&
      avery.state === 'active' &&
      !V.avery_injury &&
      V.avery_mansion?.schedule !== 'away' &&
      !['fallen', 'kicked'].includes(V.avery_fate)
    ) {
      if (avery.rage > 0) this.finance.core.SugarCube.Wikifier.wikifyEval('<<npcincr Avery rage -1>>');
      const lastDomDay = shareholders.state.last_dom_day ?? -1;
      const domChange = Math.min(1, Math.max(0, avery.dom - (controller ? 25 : 50)));
      // 董事与控股共用七天限额，身份升级或暂时失效都不重置，已有低值不会反抬。
      if (domChange > 0 && (lastDomDay < 0 || day >= lastDomDay + 7)) {
        shareholders.state.last_dom_day = day;
        this.finance.core.SugarCube.Wikifier.wikifyEval(`<<npcincr Avery dom ${-domChange}>>`);
      }
    }
    state.last_day = day;
  }
}
