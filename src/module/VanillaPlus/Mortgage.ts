import type Finance from './Finance';
import type { FinanceResult } from './Finance';

// 房贷和持有成本固定在同一套规则内，房源价格与房间布局仍由 properties.yaml 提供。
const PROPERTY_TERMS = {
  down_payment_percent: 20,
  closing_fee_percent: 2,
  payment_reserve_weeks: 1,
  term_days: 90,
  weekly_interest_rate: 0.0035,
  late_fee_pennies: 2000,
  freeze_after_notice_days: 7,
  auction_after_freeze_days: 7,
  fight_extension_days: 7,
  freeze_fee_pennies: 50000,
  foreclosure_auction_percent: 80,
  voluntary_auction_percent: 75,
  voluntary_auction_days: 7,
  rental: {
    weekly_maintenance_percent: 0.105,
    minimum_condition: 50,
    condition_loss_per_week: 1,
    renovation_rent_bonus_percent: 60,
    renovation_cost_percent: 5,
    repair_cost_per_condition_percent: 0.05,
    max_renovation_level: 3
  }
};

export interface MortgageState {
  property_id: string;
  outstanding: number;
  arrears: number;
  weekly_payment: number;
  next_payment_day: number;
  last_interest_day: number;
  last_day: number;
  maturity_day: number;
  stage: 'current' | 'notice' | 'frozen';
  notice_day: number | null;
  frozen_day: number | null;
  bailey_pending: boolean;
  fight_used: boolean;
}

type MortgageResult = FinanceResult | 'mortgage-outstanding' | 'mortgage-ineligible' | 'no-mortgage' | 'nothing-due';

class Mortgage {
  public readonly terms = PROPERTY_TERMS;

  public constructor(
    private readonly finance: Finance,
    private readonly onAuction: (property_id: string, debt: number, day: number) => void
  ) {}

  public get current(): MortgageState | null {
    return V.VanillaPlus.real_estate.mortgage as MortgageState | null;
  }

  private set current(value: MortgageState | null) {
    V.VanillaPlus.real_estate.mortgage = value;
  }

  public downPayment(price: number): number {
    return Math.ceil((price * this.terms.down_payment_percent) / 100);
  }

  public purchaseCosts(price: number): { deposit: number; fee: number; weekly_payment: number; reserve: number } {
    const deposit = this.downPayment(price);
    const principal = price - deposit;
    const { closing_fee_percent, payment_reserve_weeks, term_days, weekly_interest_rate } = this.terms;
    const weekly_payment = Mortgage.instalment(principal, Math.ceil(term_days / 7), weekly_interest_rate);
    return {
      deposit,
      fee: Math.ceil((price * closing_fee_percent) / 100),
      weekly_payment,
      reserve: weekly_payment * payment_reserve_weeks
    };
  }

  private static instalment(principal: number, periods: number, rate: number): number {
    const growth = Math.pow(1 + rate, periods);
    return Math.ceil((principal * rate * growth) / (growth - 1));
  }

  public canStart(price: number, useCredit = false): boolean {
    const bank = V.VanillaPlus.finance.bank;
    if (!Number.isSafeInteger(price) || price <= 0 || this.current || !bank.opened || bank.loan_missed_payments > 0 || bank.credit_missed_payments > 0) return false;
    const { deposit, fee, reserve } = this.purchaseCosts(price);
    const bankReserve = fee + reserve;
    if (bank.balance < bankReserve) return false;
    return useCredit ? this.finance.canPayWithCreditPennies(deposit, bankReserve) : bank.balance >= deposit + bankReserve;
  }

  public start(property_id: string, price: number, useCredit = false): MortgageResult {
    if (this.current) return 'mortgage-outstanding';
    const bank = V.VanillaPlus.finance.bank;
    if (!bank.opened) return 'bank-required';
    if (bank.loan_missed_payments > 0 || bank.credit_missed_payments > 0) return 'mortgage-ineligible';
    if (!this.canStart(price, useCredit)) return 'mortgage-ineligible';
    const { deposit, fee, weekly_payment, reserve } = this.purchaseCosts(price);
    const result = useCredit ? this.finance.payWithCreditPennies(deposit, fee + reserve) : this.finance.payFromBankPennies(deposit);
    if (result !== 'ok') return result;
    // canStart() 已检查银行余额。信用卡只补首付，手续费必须从银行账户划走。
    this.finance.payFromBankPennies(fee);
    // 价格、首付、本金和 weekly_payment 全部是便士。信用卡仅补首付差额，不进入房贷本金。
    const principal = price - deposit;
    const { term_days } = this.terms;
    const today = Mortgage.today();
    this.current = {
      property_id,
      outstanding: principal,
      arrears: 0,
      weekly_payment,
      next_payment_day: today + 7,
      last_interest_day: today,
      last_day: today,
      maturity_day: today + term_days,
      stage: 'current',
      notice_day: null,
      frozen_day: null,
      bailey_pending: false,
      fight_used: false
    };
    return 'ok';
  }

  public repay(which: 'arrears' | 'all', useCredit = false): MortgageResult {
    const loan = this.current;
    if (!loan) return 'no-mortgage';
    if (which === 'all') this.accrueInterest(loan, Mortgage.today());
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

  public baileyAtDoor(property_id: string): boolean {
    const loan = this.current;
    return loan?.property_id === property_id && loan.stage === 'notice' && loan.bailey_pending;
  }

  public fightBailey(won: boolean): void {
    const loan = this.current;
    if (!loan || loan.stage !== 'notice') return;
    loan.bailey_pending = false;
    if (won && !loan.fight_used) {
      loan.fight_used = true;
      loan.notice_day = Mortgage.today() + this.terms.fight_extension_days - this.terms.freeze_after_notice_days;
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
    for (let day = loan.last_day + 1; day <= today && this.current === loan; day++) {
      if (day >= loan.next_payment_day || day === loan.maturity_day) {
        this.accrueInterest(loan, day);
        // 每七天收一笔。第 90 天收取剩余本金和按六天折算的最后一期利息。
        const scheduled = Math.min(loan.outstanding, day >= loan.maturity_day ? loan.outstanding : loan.weekly_payment);
        const due = Math.min(loan.outstanding, scheduled + loan.arrears);
        const paid = this.finance.collectBankPennies(due);
        loan.outstanding -= paid;
        loan.arrears = Math.max(0, loan.arrears + scheduled - paid);
        if (loan.outstanding === 0) {
          this.current = null;
          break;
        }
        if (loan.arrears > 0) {
          loan.outstanding += this.terms.late_fee_pennies;
          loan.arrears += this.terms.late_fee_pennies;
        } else Mortgage.clearDefault(loan);
        loan.next_payment_day = day < loan.maturity_day ? Math.min(day + 7, loan.maturity_day) : day + 7;
      }
      if (loan.stage === 'current' && loan.arrears > 0) {
        loan.stage = 'notice';
        loan.notice_day = day;
        loan.bailey_pending = true;
      } else if (loan.stage === 'notice' && loan.notice_day !== null && day - loan.notice_day >= this.terms.freeze_after_notice_days) {
        this.freeze(loan, day);
      } else if (loan.stage === 'frozen' && loan.frozen_day !== null && day - loan.frozen_day >= this.terms.auction_after_freeze_days) {
        this.current = null;
        // 补算可能跨过多天；把实际拍卖日传给房产记录，而非读取补算结束后的当前日期。
        this.onAuction(loan.property_id, loan.outstanding, day);
      }
      loan.last_day = day;
    }
    if (this.current === loan) loan.last_day = today;
  }

  private accrueInterest(loan: MortgageState, day: number): void {
    const elapsedDays = Math.max(0, day - loan.last_interest_day);
    if (elapsedDays === 0) return;
    loan.outstanding += Math.ceil((loan.outstanding * this.terms.weekly_interest_rate * elapsedDays) / 7);
    loan.last_interest_day = day;
  }

  private freeze(loan: MortgageState, day: number): void {
    if (loan.stage === 'frozen') return;
    loan.stage = 'frozen';
    loan.frozen_day = day;
    loan.bailey_pending = false;
    loan.outstanding += this.terms.freeze_fee_pennies;
    loan.arrears += this.terms.freeze_fee_pennies;
  }

  private static clearDefault(loan: MortgageState): void {
    loan.stage = 'current';
    loan.notice_day = null;
    loan.frozen_day = null;
    loan.bailey_pending = false;
  }

  private static today(): number {
    return Math.max(0, Math.floor(Number(Time.days) || 0));
  }
}

export default Mortgage;
