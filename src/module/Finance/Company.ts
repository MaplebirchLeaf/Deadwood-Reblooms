// ./src/module/Finance/Company.ts

import terms from '../../assets/finance/company.json';
import type Finance from '../Finance';
import Shareholders, { type ShareholdersState } from './Shareholders';
import CompanyStaff, { type CompanyStaffState } from './CompanyStaff';
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
    contract: null
  };

  public constructor(public readonly finance: Finance) {}

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
    return this.dealing && this.state.completed >= terms.partnerContracts && this.share >= terms.partnerShare && this.factories.length > 0;
  }

  public get partner(): boolean {
    return this.state.agreement && this.state.office && this.state.rent_arrears === 0 && this.finance.state.collection.amount === 0 && this.share >= terms.partnerShare;
  }

  public get meeting(): boolean {
    return this.dealing && C.npc.Avery?.init === 1 && C.npc.Avery.state === 'active' && !V.avery_injury && V.avery_mansion?.schedule !== 'away' && !['fallen', 'kicked'].includes(V.avery_fate);
  }

  public get quote(): { batches: number; materials: number; total: number; advance: number } {
    const product = this.finance.industry.terms.products.find(item => item.id === 'metalwork')!;
    const policy = this.partner ? this.state.policy : 'standard';
    const batches = Math.round(terms.batches * (policy === 'volume' ? terms.volumeMultiplier : 1));
    const total = Math.round(product.price * batches * (policy === 'price' ? terms.priceMultiplier : 1));
    return { batches, materials: product.materials * batches, total, advance: Math.floor(total * (this.partner ? terms.partnerAdvanceRate : terms.advanceRate)) };
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
        factory.report = { day, event: 'paid', seen: false, amount: contract.due, customer: 'AVY' };
        state.completed++;
        state.contract = null;
        this.finance.core.SugarCube.Wikifier.wikifyEval('<<earnFeat "Deadwood First Factory Payment">>');
      }
    }
    state.last_day = day;
  }
}
