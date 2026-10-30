// ./src/module/Finance/Partnership.ts

/** 私人合伙账使用便士。双方各占一半，借款和追加周转金不改变股比。 */
export interface PartnershipState {
  agreed: boolean;
  treasury: number;
  reserve: number;
  loans: { pc: number; partner: number };
  contributed: number;
  returned: number;
  income: number;
  expenses: number;
  dividends: number;
  partner_cash: number;
  next_settlement: number;
  report: { day: number; income: number; expenses: number; dividend: number } | null;
}

/** 仅共用两处合伙的收支和分配，营业收入仍由各自业务实际结算。 */
export default class Partnership {
  public static readonly defaults: PartnershipState = {
    agreed: false,
    treasury: 0,
    reserve: 100000,
    loans: { pc: 0, partner: 0 },
    contributed: 0,
    returned: 0,
    income: 0,
    expenses: 0,
    dividends: 0,
    partner_cash: 0,
    next_settlement: -1,
    report: null
  };

  public readonly share = 50;

  public constructor(
    private readonly core: typeof maplebirch,
    private readonly current: () => PartnershipState
  ) {}

  public get state(): PartnershipState {
    return this.current();
  }

  private get active(): boolean {
    return this.state.agreed && !V.statFreeze && !V.replayScene && !V.frozenValues;
  }

  public agree(): boolean {
    if (this.state.agreed || V.statFreeze || V.replayScene || V.frozenValues) return false;
    this.state.agreed = true;
    this.state.next_settlement = Math.floor(Time.days) + 7;
    return true;
  }

  /** 出资只记为可归还的周转垫款，不能把借来的本金再当作利润分掉。 */
  public contribute(pounds: number): boolean {
    const amount = Math.round(pounds * 100);
    if (!this.active || !Number.isFinite(pounds) || !Number.isSafeInteger(amount) || amount <= 0 || V.money < amount) return false;
    if (![this.state.treasury + amount, this.state.loans.pc + amount, this.state.contributed + amount].every(Number.isSafeInteger)) return false;
    V.money -= amount;
    this.state.treasury += amount;
    this.state.loans.pc += amount;
    this.state.contributed += amount;
    return true;
  }

  public receive(amount: number): boolean {
    if (!this.active || !Number.isSafeInteger(amount) || amount <= 0 || !Number.isSafeInteger(this.state.treasury + amount) || !Number.isSafeInteger(this.state.income + amount)) return false;
    this.state.treasury += amount;
    this.state.income += amount;
    return true;
  }

  public spend(amount: number): boolean {
    if (!this.active || !Number.isSafeInteger(amount) || amount < 0 || this.state.treasury < amount || !Number.isSafeInteger(this.state.expenses + amount)) return false;
    this.state.treasury -= amount;
    this.state.expenses += amount;
    return true;
  }

  public repay(partner = false): boolean {
    const key = partner ? 'partner' : 'pc';
    const amount = Math.min(this.state.treasury, this.state.loans[key]);
    if (!this.active || amount <= 0) return false;
    this.state.treasury -= amount;
    this.state.loans[key] -= amount;
    if (partner) this.state.partner_cash += amount;
    else {
      this.state.returned += amount;
      this.credit(amount);
    }
    return true;
  }

  /** 合伙人把已领到的分红垫回经营账，金额只在两个钱袋之间移动。 */
  public reinvest(): boolean {
    const amount = this.state.partner_cash;
    if (!this.active || amount <= 0 || !Number.isSafeInteger(this.state.treasury + amount) || !Number.isSafeInteger(this.state.loans.partner + amount)) return false;
    this.state.partner_cash = 0;
    this.state.treasury += amount;
    this.state.loans.partner += amount;
    return true;
  }

  public hold(pounds: number): boolean {
    const amount = Math.round(pounds * 100);
    if (!this.active || !Number.isFinite(pounds) || !Number.isSafeInteger(amount) || amount < 0) return false;
    this.state.reserve = amount;
    return true;
  }

  public dividend(additional = 0): number {
    return Math.floor(Math.max(0, this.state.treasury + additional - this.state.loans.pc - this.state.loans.partner - this.state.reserve) / 2);
  }

  /** 先留足垫款和约定的周转金，余款每周平分，避免把整笔营业收入当作个人收入。 */
  public settle(day = Math.floor(Time.days), committed = 0): void {
    if (!this.active || !Number.isInteger(day) || day > Math.floor(Time.days) || day < this.state.next_settlement) return;
    const state = this.state;
    const dividend = this.dividend(-Math.max(0, committed));
    state.treasury -= dividend * 2;
    state.dividends += dividend;
    state.partner_cash += dividend;
    state.report = { day, income: state.income, expenses: state.expenses, dividend };
    // 一次长跳时只分配实际已有的钱，不回放多期分红。
    state.next_settlement = day + 7;
    this.credit(dividend);
  }

  private credit(amount: number): void {
    if (amount <= 0) return;
    const finance = this.core.get('Finance');
    if (finance?.state.bank.opened) finance.creditBankPennies(amount);
    else V.money += amount;
  }
}
