import securitiesSource from '@/assets/finance/securities.yaml';
import type { MacroDefinition } from 'twine-sugarcube';

export type FinanceResult =
  | 'ok'
  | 'already-open'
  | 'already-owned'
  | 'invalid-amount'
  | 'bank-required'
  | 'debit-required'
  | 'atm-limit'
  | 'credit-required'
  | 'brokerage-required'
  | 'insufficient-cash'
  | 'insufficient-bank'
  | 'insufficient-brokerage'
  | 'credit-limit'
  | 'credit-overdue'
  | 'loan-outstanding'
  | 'loan-limit'
  | 'invalid-term'
  | 'no-debt'
  | 'unknown-security'
  | 'insufficient-shares';

type AccountTier = 'current' | 'preferred' | 'premier';
type PaymentMethod = 'cash' | 'debit' | 'credit';

interface BankState {
  opened: boolean;
  openedDay: number;
  accountTier: AccountTier;
  peakBalance: number;
  paymentMethod: PaymentMethod;
  balance: number;
  baileyKnowsAccount: boolean;
  debitCard: boolean;
  atmWithdrawalLimit: number;
  atmWithdrawn: number;
  atmWeek: number;
  creditCard: boolean;
  creditLimit: number;
  creditDebt: number;
  creditMinimumPayment: number;
  creditDueDay: number;
  creditLastDay: number;
  creditMissedPayments: number;
  bankInterestLastDay: number;
  loanDebt: number;
  loanLimit: number;
  loanPayment: number;
  loanRate: number;
  loanTerm: number;
  loanDueDay: number;
  loanLastDay: number;
  loanMissedPayments: number;
}

interface BrokerageState {
  opened: boolean;
  cash: number;
  holdings: Record<string, number>;
}

interface MarketState {
  seed: number;
  day: number;
  prices: Record<string, number>;
  previousPrices: Record<string, number>;
  farmStage?: number;
  farmAttackDamage?: number;
  pendingFarmMoves?: Record<string, number>;
}

interface FinanceState {
  bank: BankState;
  brokerage: BrokerageState;
  market: MarketState;
}

export interface Security {
  symbol: string;
  name: {
    EN: string;
    CN: string;
  };
  initialPrice: number;
  volatility: number;
}

const PENCE_PER_POUND = 100;
const ACCOUNT_TIERS = [
  { id: 'current', days: 0, balance: 0, credit: 1000, loan: 5000, atm: 2000 },
  { id: 'preferred', days: 7, balance: 5000, credit: 5000, loan: 20000, atm: 5000 },
  { id: 'premier', days: 30, balance: 25000, credit: 15000, loan: 50000, atm: 10000 }
] as const;
const MERCHANT_SOURCES = new Set([
  'adultShop',
  'arcade',
  'brothelCondoms',
  'cafe',
  'clothes',
  'cosmetics',
  'danceStudioLessons',
  'fishing',
  'furniture',
  'hairdressers',
  'lube',
  'petShop',
  'pharmacy',
  'pub',
  'pubAlcohol',
  'pubPepperSpray',
  'ridingLessons',
  'schoolCondoms',
  'shopping',
  'spa',
  'supermarket',
  'tailor',
  'tattoo',
  'toyShop'
]);
const MERCHANT_LOCATIONS = new Set(['hospital', 'shopping_centre']);
const CREDIT_FEE_PERCENT = 5;
const DEPOSIT_DAILY_RATE = 0.0002;
const CREDIT_DAILY_RATE = 0.003;
const CREDIT_BILLING_DAYS = 7;
const CREDIT_MINIMUM_PERCENT = 10;
const CREDIT_MINIMUM_PAYMENT = 10 * PENCE_PER_POUND;
const CREDIT_LATE_FEE = 10 * PENCE_PER_POUND;
const LOAN_LATE_FEE = 5 * PENCE_PER_POUND;
const LOAN_LATE_PERCENT = 2;
const LOAN_OVERDUE_MULTIPLIER = 2;
const LOAN_PRODUCTS = [
  { days: 7, dailyRate: 0.0015 },
  { days: 14, dailyRate: 0.002 },
  { days: 30, dailyRate: 0.0025 }
] as const;

export const DEFAULT_FINANCE_STATE: FinanceState = {
  bank: {
    opened: false,
    openedDay: -1,
    accountTier: 'current',
    peakBalance: 0,
    paymentMethod: 'cash',
    balance: 0,
    baileyKnowsAccount: false,
    debitCard: false,
    atmWithdrawalLimit: ACCOUNT_TIERS[0].atm * PENCE_PER_POUND,
    atmWithdrawn: 0,
    atmWeek: -1,
    creditCard: false,
    creditLimit: ACCOUNT_TIERS[0].credit * PENCE_PER_POUND,
    creditDebt: 0,
    creditMinimumPayment: 0,
    creditDueDay: 0,
    creditLastDay: -1,
    creditMissedPayments: 0,
    bankInterestLastDay: -1,
    loanDebt: 0,
    loanLimit: ACCOUNT_TIERS[0].loan * PENCE_PER_POUND,
    loanPayment: 0,
    loanRate: 0,
    loanTerm: 0,
    loanDueDay: 0,
    loanLastDay: -1,
    loanMissedPayments: 0
  },
  brokerage: {
    opened: false,
    cash: 0,
    holdings: {}
  },
  market: {
    seed: 0,
    day: -1,
    prices: {},
    previousPrices: {}
  }
};

class Finance {
  public constructor(private readonly core: typeof maplebirch) {}

  public get securities(): readonly Security[] {
    const finance = ((setup.DeadwoodReblooms ??= {}).finance ??= {});
    const securities = (finance.securities ??= Finance.loadSecurities(this.core));
    return securities.filter(item => item.symbol !== 'ALF' || Number(V.farm_stage) >= 7);
  }

  private get state(): FinanceState {
    return Finance.ensureState(this.securities);
  }

  public preInit(): void {
    this.core.tool.onInit(() => void this.securities);
    this.core.on(':variable', () => this.advanceDay(), 'Vanilla Plus Finance');
    this.core.once(':storyready', () => this.moneyPayment());
    this.core.dynamic.regTimeEvent('onDay', ':deadwood-reblooms-finance-market', {
      action: () => this.advanceDay(),
      exact: true
    });
  }

  private advanceDay(): void {
    Finance.refreshAccountTier(this.state.bank);
    Finance.resetAtmLimit(this.state.bank);
    Finance.advanceMarket(this.state, this.securities);
    Finance.advanceFarmMarket(this.state.market, this.securities);
    Finance.advanceDepositInterest(this.state.bank);
    Finance.advanceLoan(this.state.bank);
    Finance.advanceCredit(this.state.bank);
  }

  // 银行业务
  public openBankAccount(): FinanceResult {
    const bank = this.state.bank;
    if (bank.opened) return 'already-open';
    bank.opened = true;
    bank.openedDay = Finance.currentDay();
    bank.bankInterestLastDay = Finance.currentDay();
    Finance.refreshAccountTier(bank);
    return 'ok';
  }

  public issueDebitCard(): FinanceResult {
    const bank = this.state.bank;
    if (!bank.opened) return 'bank-required';
    if (bank.debitCard) return 'already-owned';
    bank.debitCard = true;
    return 'ok';
  }

  public issueCreditCard(): FinanceResult {
    const bank = this.state.bank;
    if (!bank.opened) return 'bank-required';
    if (bank.creditCard) return 'already-owned';
    bank.creditCard = true;
    return 'ok';
  }

  public deposit(amount: unknown, atm = false): FinanceResult {
    const finance = this.state;
    const { bank } = finance;
    if (!bank.opened) return 'bank-required';
    if (atm && !bank.debitCard) return 'debit-required';
    const result = Finance.moveFunds(finance, amount, 'cash', 'bank');
    if (result === 'ok') Finance.refreshAccountTier(bank);
    return result;
  }

  public withdraw(amount: unknown, atm = false): FinanceResult {
    const finance = this.state;
    const { bank } = finance;
    if (!bank.opened) return 'bank-required';
    if (atm && !bank.debitCard) return 'debit-required';
    if (!atm) return Finance.moveFunds(finance, amount, 'bank', 'cash');
    const value = Finance.toPennies(amount);
    if (value == null) return 'invalid-amount';
    Finance.resetAtmLimit(bank);
    if (bank.atmWithdrawn + value > bank.atmWithdrawalLimit) return 'atm-limit';
    const result = Finance.moveFunds(finance, amount, 'bank', 'cash');
    if (result === 'ok') bank.atmWithdrawn += value;
    return result;
  }

  // 贝利收租前先从已授权的银行账户补足现金，原版 rentpay 继续负责实际扣款和统计。
  public prepareBaileyRent(amount: unknown): void {
    const total = Math.floor(Number(amount));
    const bank = this.state.bank;
    if (!bank.baileyKnowsAccount || !Number.isSafeInteger(total) || total <= 0) return;
    const cash = Finance.cashOnHand();
    if (cash + bank.balance < total) return;
    const withdrawn = Math.min(bank.balance, total);
    bank.balance -= withdrawn;
    V.money = cash + withdrawn;
  }

  public creditAdvance(amount: unknown): FinanceResult {
    const bank = this.state.bank;
    if (!bank.opened) return 'bank-required';
    if (!bank.creditCard) return 'credit-required';
    if (bank.creditMissedPayments > 0) return 'credit-overdue';
    const value = Finance.toPennies(amount);
    if (value == null) return 'invalid-amount';
    const debt = Finance.addPercentage(value, CREDIT_FEE_PERCENT);
    if (debt > Math.max(0, bank.creditLimit - bank.creditDebt)) return 'credit-limit';
    bank.balance += value;
    Finance.addCreditDebt(bank, debt);
    return 'ok';
  }

  public repayCredit(amount: unknown): FinanceResult {
    const bank = this.state.bank;
    if (!bank.opened) return 'bank-required';
    if (!bank.creditCard) return 'credit-required';
    if (bank.creditDebt <= 0) return 'no-debt';
    const value = Finance.toPennies(amount);
    if (value == null) return 'invalid-amount';
    const payment = Math.min(value, bank.creditDebt);
    if (payment > bank.balance) return 'insufficient-bank';
    bank.balance -= payment;
    bank.creditDebt -= payment;
    if (bank.creditDebt === 0) Finance.clearCredit(bank);
    else bank.creditMinimumPayment = Finance.creditMinimumPayment(bank.creditDebt);
    return 'ok';
  }

  public takeLoan(amount: unknown, term: unknown): FinanceResult {
    const bank = this.state.bank;
    if (!bank.opened) return 'bank-required';
    if (bank.loanDebt > 0) return 'loan-outstanding';
    const value = Finance.toPennies(amount);
    if (value == null) return 'invalid-amount';
    if (value > bank.loanLimit) return 'loan-limit';
    const days = Number(term);
    const product = LOAN_PRODUCTS.find(option => option.days === days);
    if (!product) return 'invalid-term';
    bank.balance += value;
    bank.loanDebt = value;
    bank.loanRate = product.dailyRate;
    bank.loanTerm = product.days;
    bank.loanPayment = Finance.loanPayment(value, product.days, product.dailyRate);
    bank.loanDueDay = Finance.currentDay() + days;
    bank.loanLastDay = Finance.currentDay();
    bank.loanMissedPayments = 0;
    return 'ok';
  }

  public repayLoan(amount: unknown): FinanceResult {
    const bank = this.state.bank;
    if (!bank.opened) return 'bank-required';
    if (bank.loanDebt <= 0) return 'no-debt';
    const value = Finance.toPennies(amount);
    if (value == null) return 'invalid-amount';
    const payment = Math.min(value, bank.loanDebt);
    if (payment > bank.balance) return 'insufficient-bank';
    bank.balance -= payment;
    bank.loanDebt -= payment;
    if (bank.loanDebt === 0) Finance.clearLoan(bank);
    return 'ok';
  }

  // 证券账户与交易
  public openBrokerageAccount(): FinanceResult {
    const { bank, brokerage } = this.state;
    if (!bank.opened) return 'bank-required';
    if (brokerage.opened) return 'already-open';
    brokerage.opened = true;
    return 'ok';
  }

  public transferToBrokerage(amount: unknown): FinanceResult {
    const finance = this.state;
    const { bank, brokerage } = finance;
    if (!bank.opened) return 'bank-required';
    if (!brokerage.opened) return 'brokerage-required';
    return Finance.moveFunds(finance, amount, 'bank', 'brokerage');
  }

  public transferFromBrokerage(amount: unknown): FinanceResult {
    const finance = this.state;
    const { bank, brokerage } = finance;
    if (!bank.opened) return 'bank-required';
    if (!brokerage.opened) return 'brokerage-required';
    const result = Finance.moveFunds(finance, amount, 'brokerage', 'bank');
    if (result === 'ok') Finance.refreshAccountTier(bank);
    return result;
  }

  // 商户先汇总三种可用支付方式，避免页面只按随身现金隐藏商品。
  public canPay(amount: unknown, source?: unknown): boolean {
    const value = Math.floor(Number(amount));
    if (!Number.isSafeInteger(value) || value < 0) return false;
    if (source != null && !Finance.isMerchantSource(source)) return Finance.cashOnHand() >= value;
    return this.purchaseMethod(value) != null;
  }

  public setPaymentMethod(method: unknown): FinanceResult {
    const bank = this.state.bank;
    if (method === 'debit' && !bank.debitCard) return 'debit-required';
    if (method === 'credit' && !bank.creditCard) return 'credit-required';
    if (method !== 'cash' && method !== 'debit' && method !== 'credit') return 'invalid-amount';
    bank.paymentMethod = method;
    return 'ok';
  }

  private purchaseMethod(value: number): PaymentMethod | null {
    const bank = this.state.bank;
    const available: Record<PaymentMethod, boolean> = {
      cash: Finance.cashOnHand() >= value,
      debit: bank.debitCard && bank.balance >= value,
      credit: bank.creditCard && bank.creditMissedPayments === 0 && bank.creditDebt + value <= bank.creditLimit
    };
    const methods: PaymentMethod[] = [bank.paymentMethod, 'cash', 'debit', 'credit'];
    return methods.find((method, index) => methods.indexOf(method) === index && available[method]) ?? null;
  }

  private purchase(amount: unknown, source: unknown): boolean {
    const value = Math.floor(Number(amount));
    const bank = this.state.bank;
    if (!Number.isSafeInteger(value) || value <= 0 || !Finance.isMerchantSource(source)) return false;
    const method = this.purchaseMethod(value);
    if (method) bank.paymentMethod = method;
    if (method === 'debit') bank.balance -= value;
    else if (method === 'credit') Finance.addCreditDebt(bank, value);
    else return false;
    return true;
  }

  // 包装原版 money 宏：银行卡负责扣款，原宏以 recordOnly 保留消费统计。
  private moneyPayment(): void {
    const original = this.core.SugarCube.Macro.get('money') as MacroDefinition | undefined;
    if (!original) return;
    const purchase = (amount: unknown, source: unknown) => this.purchase(amount, source);
    const refresh = () => this.refreshMoney();
    this.core.tool.macro.define('money', function (this: any, amountArg: unknown, sourceArg: unknown, optionalArg?: unknown) {
      const amount = Number(amountArg);
      if (amount >= 0 || !purchase(-amount, sourceArg)) {
        original.handler.call(this);
        return;
      }
      const optional = optionalArg;
      this.args[2] = { ...(typeof optional === 'object' && optional !== null ? optional : {}), recordOnly: true };
      try {
        original.handler.call(this);
      } finally {
        if (optional === undefined) this.args.length = 2;
        else this.args[2] = optional;
      }
      refresh();
    });
  }

  private refreshMoney(): void {
    $.wiki('<<updatesidebarmoney>>');
    if (document.getElementById('dr-finance-caption')) $.wiki('<<replace "#dr-finance-caption">><<deadwood-reblooms-finance-caption-content>><</replace>>');
  }

  public buy(symbol: unknown, amount: unknown): FinanceResult {
    const { brokerage, market } = this.state;
    if (!brokerage.opened) return 'brokerage-required';
    const item = this.securities.find(security => security.symbol === symbol);
    if (!item) return 'unknown-security';
    const shares = Finance.toShares(amount);
    if (shares == null) return 'invalid-amount';
    const cost = market.prices[item.symbol] * shares;
    if (cost > brokerage.cash) return 'insufficient-brokerage';
    brokerage.cash -= cost;
    brokerage.holdings[item.symbol] += shares;
    // 成交后重置未来行情，避免回退后按已知涨跌交易。
    market.seed = Finance.marketSeed();
    return 'ok';
  }

  public sell(symbol: unknown, amount: unknown): FinanceResult {
    const { brokerage, market } = this.state;
    if (!brokerage.opened) return 'brokerage-required';
    const item = this.securities.find(security => security.symbol === symbol);
    if (!item) return 'unknown-security';
    const shares = Finance.toShares(amount);
    if (shares == null) return 'invalid-amount';
    if (shares > brokerage.holdings[item.symbol]) return 'insufficient-shares';
    brokerage.holdings[item.symbol] -= shares;
    brokerage.cash += market.prices[item.symbol] * shares;
    market.seed = Finance.marketSeed();
    return 'ok';
  }

  // 配置与存档状态
  private static loadSecurities(core: typeof maplebirch): Security[] {
    const data = core.yaml.load(securitiesSource);
    if (!Array.isArray(data)) throw new Error('Finance securities config must be an array.');
    return data.map((item, index) => {
      if (!item || typeof item !== 'object' || Array.isArray(item)) throw new Error(`Finance security #${index + 1} is invalid.`);
      const security = item as Partial<Security>;
      if (!security.symbol || !security.name?.EN || !security.name.CN || !Number.isFinite(security.initialPrice) || !Number.isFinite(security.volatility)) {
        throw new Error(`Finance security #${index + 1} is incomplete.`);
      }
      return {
        symbol: String(security.symbol),
        name: { EN: String(security.name.EN), CN: String(security.name.CN) },
        initialPrice: Math.max(1, Math.floor(security.initialPrice!)),
        volatility: Math.clamp(Math.floor(security.volatility!), 1, 20)
      };
    });
  }

  private static ensureState(securities: readonly Security[]): FinanceState {
    V.VanillaPlus.finance ??= clone(DEFAULT_FINANCE_STATE);
    const finance = V.VanillaPlus.finance as FinanceState;
    finance.bank ??= clone(DEFAULT_FINANCE_STATE.bank);
    finance.brokerage ??= clone(DEFAULT_FINANCE_STATE.brokerage);
    finance.market ??= clone(DEFAULT_FINANCE_STATE.market);
    for (const [key, value] of Object.entries(DEFAULT_FINANCE_STATE.bank)) {
      (finance.bank as unknown as Record<string, unknown>)[key] ??= value;
    }
    finance.brokerage.holdings ??= {};
    finance.market.prices ??= {};
    finance.market.previousPrices ??= {};
    if (!Number.isSafeInteger(finance.market.seed) || finance.market.seed === 0) finance.market.seed = Finance.marketSeed();
    for (const item of securities) {
      finance.brokerage.holdings[item.symbol] ??= 0;
      const initialPrice = item.symbol === 'ALF' && finance.market.farmStage === undefined
        ? Math.round(item.initialPrice * (Number(V.farm_stage) >= 12 ? 1.188 : Number(V.farm_stage) >= 9 ? 1.08 : 1))
        : item.initialPrice;
      finance.market.prices[item.symbol] ??= initialPrice;
      finance.market.previousPrices[item.symbol] ??= finance.market.prices[item.symbol];
    }
    finance.market.farmStage ??= Math.max(0, Math.floor(Number(V.farm_stage) || 0));
    finance.market.farmAttackDamage ??= Boolean(V.farm_attacked) && Array.isArray(V.fields_damaged) ? V.fields_damaged.length : 0;
    finance.market.pendingFarmMoves ??= {};
    if (finance.bank.loanDebt > 0) {
      finance.bank.loanRate = finance.bank.loanRate || 0.002;
      finance.bank.loanTerm = finance.bank.loanTerm || 30;
      if (finance.bank.loanPayment <= 0) {
        finance.bank.loanPayment = Finance.loanPayment(finance.bank.loanDebt, finance.bank.loanTerm, finance.bank.loanRate);
        finance.bank.loanDueDay = Finance.currentDay() + finance.bank.loanTerm;
        finance.bank.loanLastDay = Finance.currentDay();
      }
    }
    if (finance.bank.opened && finance.bank.bankInterestLastDay < 0) finance.bank.bankInterestLastDay = Finance.currentDay();
    if (finance.bank.opened && finance.bank.openedDay < 0) finance.bank.openedDay = Finance.currentDay();
    Finance.refreshAccountTier(finance.bank);
    Finance.resetAtmLimit(finance.bank);
    if (finance.bank.creditDebt > 0 && finance.bank.creditLastDay < 0) {
      finance.bank.creditDueDay = Finance.currentDay() + CREDIT_BILLING_DAYS;
      finance.bank.creditLastDay = Finance.currentDay();
    }
    finance.bank.creditMinimumPayment = Finance.creditMinimumPayment(finance.bank.creditDebt);
    return finance;
  }

  // 金额换算与转账
  private static cashOnHand(): number {
    const cash = Math.floor(Number(V.money));
    return Number.isFinite(cash) ? Math.max(0, cash) : 0;
  }

  private static toPennies(value: unknown): number | null {
    const amount = Math.round(Number(value) * PENCE_PER_POUND);
    return Number.isSafeInteger(amount) && amount > 0 ? amount : null;
  }

  private static toShares(value: unknown): number | null {
    const amount = Number(value);
    return Number.isSafeInteger(amount) && amount > 0 ? amount : null;
  }

  private static addPercentage(amount: number, percent: number): number {
    return amount + Math.ceil((amount * percent) / 100);
  }

  private static currentDay(): number {
    return Math.max(0, Math.floor(Number(Time.days) || 0));
  }

  private static currentWeek(): number {
    const weekDay = Math.clamp(Math.floor(Number(Time.weekDay) || 1), 1, 7);
    return Finance.currentDay() - ((weekDay + 5) % 7);
  }

  private static resetAtmLimit(bank: BankState): void {
    const week = Finance.currentWeek();
    if (bank.atmWeek === week) return;
    bank.atmWeek = week;
    bank.atmWithdrawn = 0;
  }

  private static isMerchantSource(source: unknown): boolean {
    if (MERCHANT_LOCATIONS.has(String(V.location))) return true;
    if (!(typeof source === 'string' || source instanceof String)) return false;
    const name = String(source);
    return MERCHANT_SOURCES.has(name) || name.startsWith('hospital') || name.startsWith('pharmacy');
  }

  private static refreshAccountTier(bank: BankState): void {
    if (!bank.opened) return;
    const netBalance = Math.max(0, bank.balance - bank.creditDebt - bank.loanDebt);
    bank.peakBalance = Math.max(bank.peakBalance, netBalance);
    const age = Math.max(0, Finance.currentDay() - bank.openedDay);
    const cleanRecord = bank.creditMissedPayments === 0 && bank.loanMissedPayments === 0;
    const current = Math.max(
      0,
      ACCOUNT_TIERS.findIndex(tier => tier.id === bank.accountTier)
    );
    let next = current;
    if (cleanRecord) {
      for (let index = current + 1; index < ACCOUNT_TIERS.length; index++) {
        const tier = ACCOUNT_TIERS[index];
        if (age >= tier.days && bank.peakBalance >= tier.balance * PENCE_PER_POUND) next = index;
      }
    }
    const tier = ACCOUNT_TIERS[next];
    bank.accountTier = tier.id;
    bank.creditLimit = tier.credit * PENCE_PER_POUND;
    bank.loanLimit = tier.loan * PENCE_PER_POUND;
    bank.atmWithdrawalLimit = tier.atm * PENCE_PER_POUND;
    if (bank.paymentMethod === 'debit' && !bank.debitCard) bank.paymentMethod = 'cash';
    if (bank.paymentMethod === 'credit' && !bank.creditCard) bank.paymentMethod = 'cash';
  }

  private static loanPayment(principal: number, days: number, dailyRate: number): number {
    const growth = Math.pow(1 + dailyRate, days);
    return Math.ceil((principal * dailyRate * growth) / (growth - 1));
  }

  private static clearLoan(bank: BankState): void {
    bank.loanDebt = 0;
    bank.loanPayment = 0;
    bank.loanRate = 0;
    bank.loanTerm = 0;
    bank.loanDueDay = 0;
    bank.loanLastDay = -1;
    bank.loanMissedPayments = 0;
  }

  private static clearCredit(bank: BankState): void {
    bank.creditDebt = 0;
    bank.creditMinimumPayment = 0;
    bank.creditDueDay = 0;
    bank.creditLastDay = -1;
    bank.creditMissedPayments = 0;
  }

  private static addCreditDebt(bank: BankState, amount: number): void {
    if (bank.creditDebt <= 0) {
      bank.creditDueDay = Finance.currentDay() + CREDIT_BILLING_DAYS;
      bank.creditLastDay = Finance.currentDay();
    }
    bank.creditDebt += amount;
    bank.creditMinimumPayment = Finance.creditMinimumPayment(bank.creditDebt);
  }

  private static creditMinimumPayment(debt: number): number {
    if (debt <= 0) return 0;
    return Math.min(debt, Math.max(CREDIT_MINIMUM_PAYMENT, Math.ceil((debt * CREDIT_MINIMUM_PERCENT) / 100)));
  }

  private static advanceDepositInterest(bank: BankState): void {
    const currentDay = Finance.currentDay();
    if (!bank.opened || bank.bankInterestLastDay < 0) {
      bank.bankInterestLastDay = currentDay;
      return;
    }
    for (let day = bank.bankInterestLastDay + 1; day <= currentDay; day++) {
      if (bank.balance > 0) bank.balance += Math.floor(bank.balance * DEPOSIT_DAILY_RATE);
    }
    bank.bankInterestLastDay = currentDay;
  }

  private static advanceLoan(bank: BankState): void {
    const currentDay = Finance.currentDay();
    if (bank.loanDebt <= 0) return;
    if (bank.loanLastDay < 0) bank.loanLastDay = currentDay;
    for (let day = bank.loanLastDay + 1; day <= currentDay && bank.loanDebt > 0; day++) {
      const dailyRate = bank.loanRate * (day > bank.loanDueDay ? LOAN_OVERDUE_MULTIPLIER : 1);
      bank.loanDebt += Math.ceil(bank.loanDebt * dailyRate);
      const scheduled = Math.min(bank.loanPayment, bank.loanDebt);
      const paid = Math.min(bank.balance, scheduled);
      bank.balance -= paid;
      bank.loanDebt -= paid;
      if (paid < scheduled) {
        const unpaid = scheduled - paid;
        bank.loanDebt += Math.max(LOAN_LATE_FEE, Math.ceil((unpaid * LOAN_LATE_PERCENT) / 100));
        bank.loanMissedPayments++;
      }
    }
    bank.loanLastDay = currentDay;
    if (bank.loanDebt === 0) Finance.clearLoan(bank);
  }

  private static advanceCredit(bank: BankState): void {
    const currentDay = Finance.currentDay();
    if (bank.creditDebt <= 0) {
      if (bank.creditLastDay >= 0) Finance.clearCredit(bank);
      return;
    }
    if (bank.creditLastDay < 0) bank.creditLastDay = currentDay;
    if (bank.creditDueDay <= 0) bank.creditDueDay = currentDay + CREDIT_BILLING_DAYS;
    for (let day = bank.creditLastDay + 1; day <= currentDay && bank.creditDebt > 0; day++) {
      bank.creditDebt += Math.ceil(bank.creditDebt * CREDIT_DAILY_RATE);
      if (day >= bank.creditDueDay) {
        const minimum = Finance.creditMinimumPayment(bank.creditDebt);
        const paid = Math.min(bank.balance, minimum);
        bank.balance -= paid;
        bank.creditDebt -= paid;
        if (paid < minimum) {
          bank.creditDebt += CREDIT_LATE_FEE;
          bank.creditMissedPayments++;
        }
        bank.creditDueDay += CREDIT_BILLING_DAYS;
      }
    }
    bank.creditLastDay = currentDay;
    if (bank.creditDebt === 0) Finance.clearCredit(bank);
    else bank.creditMinimumPayment = Finance.creditMinimumPayment(bank.creditDebt);
  }

  private static moveFunds(finance: FinanceState, amount: unknown, source: 'cash' | 'bank' | 'brokerage', target: 'cash' | 'bank' | 'brokerage'): FinanceResult {
    const value = Finance.toPennies(amount);
    if (value == null) return 'invalid-amount';
    const balances = {
      cash: Finance.cashOnHand(),
      bank: finance.bank.balance,
      brokerage: finance.brokerage.cash
    };
    if (balances[source] < value) {
      if (source === 'cash') return 'insufficient-cash';
      if (source === 'bank') return 'insufficient-bank';
      return 'insufficient-brokerage';
    }
    if (source === 'cash') V.money = balances.cash - value;
    else if (source === 'bank') finance.bank.balance -= value;
    else finance.brokerage.cash -= value;
    if (target === 'cash') V.money = Finance.cashOnHand() + value;
    else if (target === 'bank') finance.bank.balance += value;
    else finance.brokerage.cash += value;
    return 'ok';
  }

  // 每日行情
  private static marketSeed(): number {
    return Math.floor(Math.random() * 0x100000000) >>> 0 || 1;
  }

  private static marketMove(item: Security, day: number, seed: number): number {
    let hash = 2166136261 ^ seed;
    for (const character of `${item.symbol}:${day}`) {
      hash ^= character.charCodeAt(0);
      hash = Math.imul(hash, 16777619);
    }
    return ((hash >>> 0) % (item.volatility * 2 + 1)) - item.volatility;
  }

  private static nextPrice(item: Security, price: number, day: number, seed: number): number {
    const next = Math.round((price * (100 + Finance.marketMove(item, day, seed))) / 100);
    return Math.clamp(next, Math.round(item.initialPrice * 0.25), item.initialPrice * 4);
  }

  private static applyFarmMoves(market: MarketState, securities: readonly Security[]): void {
    for (const item of securities) {
      const move = market.pendingFarmMoves?.[item.symbol] ?? 0;
      if (!move) continue;
      market.prices[item.symbol] = Math.clamp(
        Math.round(market.prices[item.symbol] * (100 + move) / 100),
        Math.round(item.initialPrice * 0.25),
        item.initialPrice * 4
      );
    }
    market.pendingFarmMoves = {};
  }

  private static advanceFarmMarket(market: MarketState, securities: readonly Security[]): void {
    const stage = Math.max(0, Math.floor(Number(V.farm_stage) || 0));
    const previousStage = market.farmStage ?? stage;
    const moves = (market.pendingFarmMoves ??= {});
    if (previousStage < 7 && stage >= 7) moves.RMY = (moves.RMY ?? 0) - 2;
    if (previousStage < 9 && stage >= 9) {
      moves.ALF = (moves.ALF ?? 0) + 8;
      moves.RMY = (moves.RMY ?? 0) - 3;
    }
    if (previousStage < 12 && stage >= 12) {
      moves.ALF = (moves.ALF ?? 0) + 10;
      moves.RMY = (moves.RMY ?? 0) - 4;
    }
    market.farmStage = stage;

    const damage = Boolean(V.farm_attacked) && Array.isArray(V.fields_damaged) ? V.fields_damaged.length : 0;
    const newDamage = Math.max(0, damage - (market.farmAttackDamage ?? 0));
    if (newDamage > 0) {
      moves.ALF = (moves.ALF ?? 0) - Math.min(12, newDamage * 2);
      moves.RMY = (moves.RMY ?? 0) + Math.min(3, newDamage);
    }
    market.farmAttackDamage = damage;
    if (Number(Time.weekDay) !== 1 && Number(Time.weekDay) !== 7) Finance.applyFarmMoves(market, securities);
  }

  private static advanceMarket(finance: FinanceState, securities: readonly Security[]): void {
    const currentDay = Finance.currentDay();
    if (finance.market.day < 0) {
      finance.market.day = currentDay;
      return;
    }
    if (currentDay <= finance.market.day) return;
    for (let day = finance.market.day + 1; day <= currentDay; day++) {
      const weekDay = (((((Number(Time.weekDay) || 1) - (currentDay - day) - 1) % 7) + 7) % 7) + 1;
      if (weekDay === 1 || weekDay === 7) continue;
      finance.market.previousPrices = { ...finance.market.prices };
      for (const item of securities) finance.market.prices[item.symbol] = Finance.nextPrice(item, finance.market.prices[item.symbol], day, finance.market.seed);
      Finance.applyFarmMoves(finance.market, securities);
    }
    finance.market.day = currentDay;
  }
}

export default Finance;
