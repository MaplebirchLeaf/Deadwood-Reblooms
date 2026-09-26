import mortgageSource from '@/assets/finance/mortgage.yaml';
import type Finance from './Finance';
import type { FinanceResult } from './Finance';

interface MortgageTerms {
  downPaymentPercent: number;
  termDays: number;
  dailyInterestRate: number;
  lateFeePennies: number;
  noticeAfterMissedDays: number;
  freezeAfterNoticeDays: number;
  auctionAfterFreezeDays: number;
  fightExtensionDays: number;
  freezeFeePennies: number;
  foreclosureAuctionPercent: number;
  voluntaryAuctionDays: number;
  rivalBuyoutPremiumPercent: number;
  rivalAuctionReservePercent: number;
  rental: {
    dailyMaintenancePercent: number;
    minimumCondition: number;
    conditionLossPerDay: number;
    renovationRentBonusPercent: number;
    renovationCostPercent: number;
    repairCostPerConditionPercent: number;
    maxRenovationLevel: number;
  };
}

export interface MortgageState {
  propertyId: string;
  price: number;
  outstanding: number;
  arrears: number;
  dailyPayment: number;
  lastDay: number;
  maturityDay: number;
  missedDays: number;
  stage: 'current' | 'notice' | 'frozen';
  noticeDay: number | null;
  frozenDay: number | null;
  baileyPending: boolean;
  fightUsed: boolean;
}

type MortgageResult = FinanceResult | 'mortgage-outstanding' | 'mortgage-ineligible' | 'no-mortgage' | 'nothing-due';

class Mortgage {
  private loadedTerms?: MortgageTerms;

  public constructor(
    private readonly core: typeof maplebirch,
    private readonly finance: Finance,
    private readonly onAuction: (propertyId: string, debt: number, day: number) => void
  ) {}

  public get terms(): MortgageTerms {
    return (this.loadedTerms ??= Mortgage.loadTerms(this.core));
  }

  public get current(): MortgageState | null {
    return V.VanillaPlus.realEstate.mortgage as MortgageState | null;
  }

  private set current(value: MortgageState | null) {
    V.VanillaPlus.realEstate.mortgage = value;
  }

  private static loadTerms(core: typeof maplebirch): MortgageTerms {
    const data = core.yaml.load(mortgageSource) as Partial<MortgageTerms> | null;
    const rental = data?.rental;
    const positive = (value: unknown) => typeof value === 'number' && Number.isFinite(value) && value > 0;
    if (
      !data ||
      !rental ||
      !positive(data.downPaymentPercent) ||
      data.downPaymentPercent! >= 100 ||
      !positive(data.termDays) ||
      !Number.isSafeInteger(data.termDays) ||
      !positive(data.dailyInterestRate) ||
      !positive(data.lateFeePennies) ||
      !positive(data.noticeAfterMissedDays) ||
      !positive(data.freezeAfterNoticeDays) ||
      !positive(data.auctionAfterFreezeDays) ||
      !positive(data.fightExtensionDays) ||
      !positive(data.freezeFeePennies) ||
      !positive(data.foreclosureAuctionPercent) ||
      data.foreclosureAuctionPercent! > 100 ||
      !positive(data.voluntaryAuctionDays) ||
      !positive(data.rivalBuyoutPremiumPercent) ||
      !positive(data.rivalAuctionReservePercent) ||
      data.rivalAuctionReservePercent! > 100 ||
      !positive(rental.dailyMaintenancePercent) ||
      !positive(rental.minimumCondition) ||
      rental.minimumCondition! > 100 ||
      !positive(rental.conditionLossPerDay) ||
      !positive(rental.renovationRentBonusPercent) ||
      !positive(rental.renovationCostPercent) ||
      !positive(rental.repairCostPerConditionPercent) ||
      !positive(rental.maxRenovationLevel)
    ) {
      throw new Error('Real estate mortgage config is incomplete.');
    }
    return data as MortgageTerms;
  }

  public downPayment(price: number): number {
    return Math.ceil((price * this.terms.downPaymentPercent) / 100);
  }

  public canStart(price: number, useCredit = false): boolean {
    const bank = V.VanillaPlus.finance.bank;
    if (this.current || !bank.opened || bank.loanMissedPayments > 0 || bank.creditMissedPayments > 0) return false;
    const deposit = this.downPayment(price);
    return useCredit ? this.finance.canPayWithCreditPennies(deposit) : bank.balance >= deposit;
  }

  public start(propertyId: string, price: number, useCredit = false): MortgageResult {
    if (this.current) return 'mortgage-outstanding';
    const bank = V.VanillaPlus.finance.bank;
    if (!bank.opened) return 'bank-required';
    if (bank.loanMissedPayments > 0 || bank.creditMissedPayments > 0) return 'mortgage-ineligible';
    const deposit = this.downPayment(price);
    const result = useCredit ? this.finance.payWithCreditPennies(deposit) : this.finance.payFromBankPennies(deposit);
    if (result !== 'ok') return result;
    // 价格、首付、本金和 dailyPayment 全部是便士；信用卡仅补首付差额，不进入房贷本金。
    const principal = price - deposit;
    const { termDays, dailyInterestRate } = this.terms;
    // 等额本息的日供；每日结算仍先给剩余本金计息，提前还款可减少后续利息。
    const growth = Math.pow(1 + dailyInterestRate, termDays);
    this.current = {
      propertyId,
      price,
      outstanding: principal,
      arrears: 0,
      dailyPayment: Math.ceil((principal * dailyInterestRate * growth) / (growth - 1)),
      lastDay: Mortgage.today(),
      maturityDay: Mortgage.today() + termDays,
      missedDays: 0,
      stage: 'current',
      noticeDay: null,
      frozenDay: null,
      baileyPending: false,
      fightUsed: false
    };
    return 'ok';
  }

  public repay(which: 'arrears' | 'all', useCredit = false): MortgageResult {
    const loan = this.current;
    if (!loan) return 'no-mortgage';
    const amount = which === 'all' ? loan.outstanding : Math.min(loan.arrears, loan.outstanding);
    if (amount <= 0) return 'nothing-due';
    const result = useCredit ? this.finance.payWithCreditPennies(amount) : this.finance.payFromBankPennies(amount);
    if (result !== 'ok') return result;
    this.applyPayment(amount);
    return 'ok';
  }

  public applySeizedRent(amount: number): void {
    if (!this.current || amount <= 0) return;
    const payment = Math.min(this.current.outstanding, amount);
    this.applyPayment(payment);
    this.finance.creditBankPennies(amount - payment);
  }

  private applyPayment(amount: number): void {
    const loan = this.current;
    if (!loan) return;
    // arrears 是 outstanding 中逾期部分的标记，不是第二笔独立债务；同一笔还款两者同时减少。
    loan.outstanding = Math.max(0, loan.outstanding - amount);
    loan.arrears = Math.max(0, loan.arrears - amount);
    if (loan.outstanding === 0) this.current = null;
    else if (loan.arrears === 0) Mortgage.clearDefault(loan);
  }

  public baileyAtDoor(propertyId: string): boolean {
    const loan = this.current;
    return loan?.propertyId === propertyId && loan.stage === 'notice' && loan.baileyPending;
  }

  public fightBailey(won: boolean): void {
    const loan = this.current;
    if (!loan || loan.stage !== 'notice') return;
    loan.baileyPending = false;
    if (won && !loan.fightUsed) {
      loan.fightUsed = true;
      loan.noticeDay = Mortgage.today() + this.terms.fightExtensionDays - this.terms.freezeAfterNoticeDays;
    } else this.freeze(loan, Mortgage.today());
  }

  public refuseBailey(): void {
    const loan = this.current;
    if (loan?.stage === 'notice') this.freeze(loan, Mortgage.today());
  }

  public advanceThrough(targetDay = Mortgage.today()): void {
    const loan = this.current;
    if (!loan) return;
    const today = Math.min(Mortgage.today(), Math.max(0, Math.floor(targetDay)));
    for (let day = loan.lastDay + 1; day <= today && this.current === loan; day++) {
      loan.outstanding += Math.ceil(loan.outstanding * this.terms.dailyInterestRate);
      // 到期日将剩余本金和当日利息一并列为应付；普通日按等额日供尝试扣款。
      const scheduled = Math.min(loan.outstanding, day >= loan.maturityDay ? loan.outstanding : loan.dailyPayment);
      // 当天分期与旧欠款一起尝试扣款；arrears 只记录未偿部分，不额外增加本金。
      const due = Math.min(loan.outstanding, scheduled + loan.arrears);
      const paid = this.finance.collectBankPennies(due);
      loan.outstanding -= paid;
      loan.arrears = Math.max(0, loan.arrears + scheduled - paid);
      if (loan.outstanding === 0) {
        this.current = null;
        break;
      }
      if (loan.arrears > 0) {
        loan.outstanding += this.terms.lateFeePennies;
        loan.arrears += this.terms.lateFeePennies;
        loan.missedDays++;
      } else {
        loan.missedDays = 0;
        Mortgage.clearDefault(loan);
      }
      if (loan.stage === 'current' && loan.missedDays >= this.terms.noticeAfterMissedDays) {
        loan.stage = 'notice';
        loan.noticeDay = day;
        loan.baileyPending = true;
      } else if (loan.stage === 'notice' && loan.noticeDay !== null && day - loan.noticeDay >= this.terms.freezeAfterNoticeDays) {
        this.freeze(loan, day);
      } else if (loan.stage === 'frozen' && loan.frozenDay !== null && day - loan.frozenDay >= this.terms.auctionAfterFreezeDays) {
        this.current = null;
        // 补算可能跨过多天；把实际拍卖日传给房产记录，而非读取补算结束后的当前日期。
        this.onAuction(loan.propertyId, loan.outstanding, day);
      }
      loan.lastDay = day;
    }
    if (this.current === loan) loan.lastDay = today;
  }

  private freeze(loan: MortgageState, day: number): void {
    if (loan.stage === 'frozen') return;
    loan.stage = 'frozen';
    loan.frozenDay = day;
    loan.baileyPending = false;
    loan.outstanding += this.terms.freezeFeePennies;
    loan.arrears += this.terms.freezeFeePennies;
  }

  private static clearDefault(loan: MortgageState): void {
    loan.stage = 'current';
    loan.noticeDay = null;
    loan.frozenDay = null;
    loan.baileyPending = false;
    loan.missedDays = 0;
  }

  private static today(): number {
    return Math.max(0, Math.floor(Number(Time.days) || 0));
  }
}

export default Mortgage;
