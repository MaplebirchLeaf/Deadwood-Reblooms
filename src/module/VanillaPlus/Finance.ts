// ./src/module/VanillaPlus/Finance.ts

import Securities, { type Security } from './Securities';
import MarginTrading, { type MarginState } from './MarginTrading';
import tradingTerms from '../../assets/finance/trading.json';
import securitiesSource from '@/assets/finance/securities.yaml';
import type { MacroDefinition } from 'twine-sugarcube';
import type Robin from '../Robin';

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
  // 这里只存必须跨读档延续的事实和账务游标。额度与最低还款额从账户档位和欠款计算。
  opened: boolean;
  opened_day: number;
  account_tier: AccountTier;
  peak_balance: number;
  payment_method: PaymentMethod;
  balance: number;
  bailey_knows_account: boolean;
  debit_card: boolean;
  atm_withdrawn: number;
  atm_week: number;
  credit_card: boolean;
  credit_debt: number;
  credit_due_day: number;
  credit_missed_payments: number;
  bank_interest_last_day: number;
  loan_debt: number;
  loan_payment: number;
  loan_rate: number;
  loan_term: number;
  loan_due_day: number;
  loan_next_payment_day: number;
  loan_interest_last_day: number;
  loan_missed_payments: number;
  loan_project: 'shop' | 'orchard' | null;
}

interface BrokerageState {
  opened: boolean;
  cash: number;
  holdings: Record<string, number>;
  costs: Record<string, number>;
  realised: number;
  dividends: number;
  dividend_day: number;
  margin: MarginState;
}

interface MarketState {
  // 前一交易日价格用于页面涨跌显示。剧情事件的待处理涨跌要跨周末保存。
  seed: number;
  day: number;
  prices: Record<string, number>;
  previous_prices: Record<string, number>;
  history: { day: number; prices: Record<string, number> }[];
  farm_stage?: number;
  farm_attack_damage?: number;
  pending_farm_moves?: Record<string, number>;
  cafe_stage?: number;
  avery_fate?: string;
}

export interface FinanceState {
  bank: BankState;
  brokerage: BrokerageState;
  market: MarketState;
  collection: { amount: number; due_day: number; source: 'mortgage' | 'margin' | 'bank' | 'mixed'; destination: 'farm' | 'brothel' | null; extended: boolean; encounter_day: number };
  last_result: string | null;
}

const PENCE_PER_POUND = 100;
// 账户金额与原版 $money 都以便士保存，产品额度以英镑写在表内，初始化时统一乘 100。
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
const DEPOSIT_WEEKLY_RATE = 0.0014;
const CREDIT_WEEKLY_RATE = 0.021;
const CREDIT_BILLING_DAYS = 7;
const CREDIT_MINIMUM_PERCENT = 10;
const CREDIT_MINIMUM_PAYMENT = 10 * PENCE_PER_POUND;
const CREDIT_LATE_FEE = 10 * PENCE_PER_POUND;
const LOAN_LATE_FEE = 5 * PENCE_PER_POUND;
const LOAN_LATE_PERCENT = 2;
const LOAN_OVERDUE_MULTIPLIER = 2;
const LOAN_PRODUCTS = [
  { days: 7, weeklyRate: 0.0105 },
  { days: 14, weeklyRate: 0.014 },
  { days: 30, weeklyRate: 0.0175 }
] as const;

export const DEFAULT_FINANCE_STATE: FinanceState = {
  bank: {
    opened: false,
    opened_day: -1,
    account_tier: 'current',
    peak_balance: 0,
    payment_method: 'cash',
    balance: 0,
    bailey_knows_account: false,
    debit_card: false,
    atm_withdrawn: 0,
    atm_week: -1,
    credit_card: false,
    credit_debt: 0,
    credit_due_day: 0,
    credit_missed_payments: 0,
    bank_interest_last_day: -1,
    loan_debt: 0,
    loan_payment: 0,
    loan_rate: 0,
    loan_term: 0,
    loan_due_day: 0,
    loan_next_payment_day: 0,
    loan_interest_last_day: -1,
    loan_missed_payments: 0,
    loan_project: null
  },
  brokerage: {
    opened: false,
    cash: 0,
    holdings: {},
    costs: {},
    realised: 0,
    dividends: 0,
    dividend_day: -1,
    margin: MarginTrading.defaults
  },
  market: {
    seed: 0,
    day: -1,
    prices: {},
    previous_prices: {},
    history: []
  },
  collection: { amount: 0, due_day: 0, source: 'mortgage', destination: null, extended: false, encounter_day: -1 },
  last_result: null
};

class Finance {
  public readonly margin = new MarginTrading(this);
  public loanDiscount: () => number = () => 0;
  public constructor(private readonly core: typeof maplebirch) {}

  public get loanProducts(): readonly { days: number; baseWeeklyRate: number; weeklyRate: number }[] {
    const discount = Math.clamp(this.loanDiscount(), 0, 0.1);
    // 折扣乘法先消除浮点尾差，避免便士向上取整时多收一便士。
    return LOAN_PRODUCTS.map(product => ({ ...product, baseWeeklyRate: product.weeklyRate, weeklyRate: Number((product.weeklyRate * (1 - discount)).toFixed(8)) }));
  }

  public get securities(): readonly Security[] {
    // setup 只缓存静态证券目录，ALF 是否上市每次都按当前存档的农场进度重新筛选。
    const finance = ((setup.DeadwoodReblooms ??= {}).finance ??= {});
    const securities = (finance.securities ??= Finance.loadSecurities(this.core));
    return securities.filter(item => item.symbol !== 'ALF' || Number(V.farm_stage) >= 7);
  }

  private get state(): FinanceState {
    return Finance.ensureState(this.securities);
  }

  public get creditMinimumPayment(): number {
    return Finance.creditMinimumPayment(this.state.bank.credit_debt);
  }

  public get loanPayoff(): number {
    const bank = this.state.bank;
    if (bank.loan_debt <= 0) return 0;
    const day = Finance.currentDay;
    const elapsedDays = Math.max(0, day - bank.loan_interest_last_day);
    const rate = bank.loan_rate * (day > bank.loan_due_day ? LOAN_OVERDUE_MULTIPLIER : 1);
    return bank.loan_debt + (elapsedDays > 0 ? Math.ceil((bank.loan_debt * rate * elapsedDays) / 7) : 0);
  }

  public get accountLimits(): { credit: number; loan: number; atm: number } {
    const tier = ACCOUNT_TIERS.find(item => item.id === this.state.bank.account_tier) ?? ACCOUNT_TIERS[0];
    return {
      credit: tier.credit * PENCE_PER_POUND,
      loan: tier.loan * PENCE_PER_POUND,
      atm: tier.atm * PENCE_PER_POUND
    };
  }

  public preInit(): void {
    // 追债只在小镇街道遇到；神殿、农场、战斗和昏厥流程不插入金融事件。
    this.core.dynamic.regStateEvent('gate', 'deadwood-finance-collection', {
      extra: { passage: ['High Street'] },
      forceExit: true,
      cond: () => !!V.VanillaPlus?.finance && this.core.get('VanillaPlus')!.finance.collectionEncounter,
      output: 'deadwood-finance-collection-gate'
    });
    this.core.tool.onInit(() => void this.securities);
    this.core.once(':storyready', () => this.registerMoneyMacro());
    // 行情在时间事件里刷新。银行周账务由房地产逐日推进，保持批量跳日时的真实顺序。
    this.core.dynamic.regTimeEvent('onDay', ':deadwood-reblooms-finance-market', {
      action: () => this.updateDay(),
      exact: true
    });
  }

  private updateDay(): void {
    // 行情仍按游戏时间事件刷新，个人债务由房产结算循环按日期推进。
    Finance.updateAccountTier(this.state.bank);
    Finance.resetAtmLimit(this.state.bank);
    this.advanceMarketThrough(Finance.currentDay);
  }

  private advanceMarketThrough(day: number): void {
    Securities.updatePrices(
      this.state,
      this.securities,
      day => {
        this.payDividends(day);
        this.margin.advance(day);
      },
      day
    );
    if (day === Finance.currentDay) Securities.applyEvents(this.state.market, this.securities);
    this.margin.advance(day);
    const latest = this.state.market.history.at(-1);
    if (latest?.day === day) latest.prices = { ...this.state.market.prices };
  }

  public advanceBankThrough(day: number): void {
    // 每处理完一天的房租和房贷，才处理同一天的存款、个人贷款和信用卡。
    this.advanceMarketThrough(day);
    const bank = this.state.bank;
    Finance.advanceDepositInterest(bank, day);
    this.advanceLoan(bank, day);
    this.advanceCredit(bank, day);
    Finance.updateAccountTier(bank);
  }

  /** 扣除所有个人金融债务后的银行净存款，用于人物业务资格。 */
  public get netDeposit(): number {
    const bank = this.state.bank;
    return Math.max(0, bank.balance - bank.credit_debt - bank.loan_debt - (V.VanillaPlus.real_estate?.mortgage?.outstanding ?? 0) - this.state.collection.amount);
  }

  // 银行业务
  public openBankAccount(): FinanceResult {
    const bank = this.state.bank;
    if (bank.opened) return 'already-open';
    bank.opened = true;
    bank.opened_day = Finance.currentDay;
    bank.bank_interest_last_day = Finance.currentDay;
    Finance.updateAccountTier(bank);
    return 'ok';
  }

  public issueDebitCard(): FinanceResult {
    const bank = this.state.bank;
    if (!bank.opened) return 'bank-required';
    if (bank.debit_card) return 'already-owned';
    bank.debit_card = true;
    return 'ok';
  }

  public issueCreditCard(): FinanceResult {
    const bank = this.state.bank;
    if (!bank.opened) return 'bank-required';
    if (this.state.collection.amount > 0) return 'credit-overdue';
    if (bank.credit_card) return 'already-owned';
    bank.credit_card = true;
    return 'ok';
  }

  public deposit(amount: unknown, atm = false): FinanceResult {
    const finance = this.state;
    const { bank } = finance;
    if (!bank.opened) return 'bank-required';
    if (atm && !bank.debit_card) return 'debit-required';
    const result = Finance.moveFunds(finance, amount, 'cash', 'bank');
    if (result === 'ok') Finance.updateAccountTier(bank);
    return result;
  }

  public withdraw(amount: unknown, atm = false): FinanceResult {
    const finance = this.state;
    const { bank } = finance;
    if (!bank.opened) return 'bank-required';
    if (atm && !bank.debit_card) return 'debit-required';
    if (!atm) return Finance.moveFunds(finance, amount, 'bank', 'cash');
    const value = Finance.toPennies(amount);
    if (value == null) return 'invalid-amount';
    Finance.resetAtmLimit(bank);
    if (bank.atm_withdrawn + value > this.accountLimits.atm) return 'atm-limit';
    const result = Finance.moveFunds(finance, amount, 'bank', 'cash');
    if (result === 'ok') bank.atm_withdrawn += value;
    return result;
  }

  // 房产金额已经以便士储存，此入口不再做英镑换算。
  public payFromBankPennies(amount: unknown): FinanceResult {
    const bank = this.state.bank;
    if (!bank.opened) return 'bank-required';
    if (!bank.debit_card) return 'debit-required';
    const value = Number(amount);
    if (!Number.isSafeInteger(value) || value <= 0) return 'invalid-amount';
    if (bank.balance < value) return 'insufficient-bank';
    bank.balance -= value;
    return 'ok';
  }

  public canPayWithCreditPennies(amount: unknown, keepBalance = 0): boolean {
    const value = Number(amount);
    const bank = this.state.bank;
    if (!bank.opened || !Number.isSafeInteger(value) || value <= 0 || !Number.isSafeInteger(keepBalance) || keepBalance < 0 || bank.balance < keepBalance) return false;
    const available = bank.balance - keepBalance;
    if (available >= value) return true;
    if (!bank.credit_card || bank.credit_missed_payments > 0 || this.state.collection.amount > 0) return false;
    return bank.credit_debt + Finance.addPercentage(value - available, CREDIT_FEE_PERCENT) <= this.accountLimits.credit;
  }

  // 房贷可预留手续费和首周周供，其他调用者仍默认使用全部银行余额。
  public payWithCreditPennies(amount: unknown, keepBalance = 0): FinanceResult {
    const value = Number(amount);
    const bank = this.state.bank;
    if (!bank.opened) return 'bank-required';
    if (!Number.isSafeInteger(value) || value <= 0 || !Number.isSafeInteger(keepBalance) || keepBalance < 0) return 'invalid-amount';
    if (bank.balance < keepBalance) return 'insufficient-bank';
    const available = bank.balance - keepBalance;
    if (available >= value) return this.payFromBankPennies(value);
    if (!bank.credit_card) return 'credit-required';
    if (bank.credit_missed_payments > 0 || this.state.collection.amount > 0) return 'credit-overdue';
    const advance = value - available;
    const debt = Finance.addPercentage(advance, CREDIT_FEE_PERCENT);
    if (bank.credit_debt + debt > this.accountLimits.credit) return 'credit-limit';
    Finance.addCreditDebt(bank, debt);
    bank.balance = keepBalance;
    return 'ok';
  }

  public creditBankPennies(amount: unknown): void {
    const value = Number(amount);
    if (Number.isSafeInteger(value) && value > 0) this.state.bank.balance += value;
  }

  public collectBankPennies(amount: unknown): number {
    // 周期费用允许部分收取，调用方负责记录剩余欠款或房况损失。
    const value = Number(amount);
    if (!Number.isSafeInteger(value) || value <= 0) return 0;
    const bank = this.state.bank;
    const paid = Math.min(Math.max(0, bank.balance), value);
    bank.balance -= paid;
    return paid;
  }

  // 贝利收租前先从已授权的银行账户补足现金，原版 rentpay 继续负责实际扣款和统计。
  public prepareBaileyRent(amount: unknown): void {
    const total = Math.floor(Number(amount));
    const bank = this.state.bank;
    if (!bank.bailey_knows_account || !Number.isSafeInteger(total) || total <= 0) return;
    const cash = Finance.cashOnHand;
    if (cash + bank.balance < total) return;
    const withdrawn = Math.min(bank.balance, total);
    bank.balance -= withdrawn;
    V.money = cash + withdrawn;
  }

  public creditAdvance(amount: unknown): FinanceResult {
    const bank = this.state.bank;
    if (!bank.opened) return 'bank-required';
    if (!bank.credit_card) return 'credit-required';
    if (bank.credit_missed_payments > 0 || this.state.collection.amount > 0) return 'credit-overdue';
    const value = Finance.toPennies(amount);
    if (value == null) return 'invalid-amount';
    const debt = Finance.addPercentage(value, CREDIT_FEE_PERCENT);
    if (debt > Math.max(0, this.accountLimits.credit - bank.credit_debt)) return 'credit-limit';
    bank.balance += value;
    Finance.addCreditDebt(bank, debt);
    return 'ok';
  }

  public repayCredit(amount: unknown): FinanceResult {
    const bank = this.state.bank;
    if (!bank.opened) return 'bank-required';
    if (!bank.credit_card) return 'credit-required';
    if (bank.credit_debt <= 0) return 'no-debt';
    const value = Finance.toPennies(amount);
    if (value == null) return 'invalid-amount';
    const payment = Math.min(value, bank.credit_debt);
    if (payment > bank.balance) return 'insufficient-bank';
    bank.balance -= payment;
    bank.credit_debt -= payment;
    if (bank.credit_debt === 0) Finance.clearCredit(bank);
    return 'ok';
  }

  public takeLoan(amount: unknown, term: unknown): FinanceResult {
    const bank = this.state.bank;
    if (!bank.opened) return 'bank-required';
    if (bank.credit_missed_payments > 0 || this.state.collection.amount > 0) return 'credit-overdue';
    if (bank.loan_debt > 0) return 'loan-outstanding';
    const value = Finance.toPennies(amount);
    if (value == null) return 'invalid-amount';
    if (value > this.accountLimits.loan) return 'loan-limit';
    const days = Number(term);
    const product = this.loanProducts.find(option => option.days === days);
    if (!product) return 'invalid-term';
    bank.balance += value;
    bank.loan_debt = value;
    bank.loan_rate = product.weeklyRate;
    bank.loan_term = product.days;
    bank.loan_payment = Finance.loanPayment(value, Math.ceil(product.days / 7), product.weeklyRate);
    bank.loan_due_day = Finance.currentDay + days;
    bank.loan_next_payment_day = Math.min(Finance.currentDay + 7, bank.loan_due_day);
    bank.loan_interest_last_day = Finance.currentDay;
    bank.loan_missed_payments = 0;
    return 'ok';
  }

  public get businessProjects(): { id: 'shop' | 'orchard'; eligible: boolean }[] {
    const robin = this.core.get('Robin') as Robin | undefined;
    return [
      { id: 'shop', eligible: !!robin?.available && V.RobinExpansion.shopStage !== 'none' },
      { id: 'orchard', eligible: !!this.core.get('Orchard')?.state.unlocked.farm && (V.Orchard.sales_income > 0 || V.Orchard.contracts_completed > 0) }
    ];
  }

  /** PC 是签约借款人；经营贷款复用银行账单，借来的存款不会被当作经营利润。 */
  public takeBusinessLoan(project: 'shop' | 'orchard', amount: number): FinanceResult {
    if (!this.businessProjects.some(item => item.id === project && item.eligible)) return 'invalid-amount';
    const result = this.takeLoan(amount, 30);
    if (result === 'ok') this.state.bank.loan_project = project;
    return result;
  }

  public repayLoan(amount: unknown): FinanceResult {
    const bank = this.state.bank;
    if (!bank.opened) return 'bank-required';
    if (bank.loan_debt <= 0) return 'no-debt';
    const value = Finance.toPennies(amount);
    if (value == null) return 'invalid-amount';
    // 提前还款时结清已经使用的天数，防止周扣款日前全额还款变成无息贷款。
    const day = Finance.currentDay;
    const payoff = this.loanPayoff;
    const interest = payoff - bank.loan_debt;
    const payment = Math.min(value, payoff);
    if (payment > bank.balance) return 'insufficient-bank';
    bank.loan_debt += interest;
    bank.loan_interest_last_day = day;
    bank.balance -= payment;
    bank.loan_debt -= payment;
    if (bank.loan_debt === 0) Finance.clearLoan(bank);
    return 'ok';
  }

  // 证券账户与交易
  public openBrokerageAccount(): FinanceResult {
    const { bank, brokerage } = this.state;
    if (!bank.opened) return 'bank-required';
    if (brokerage.opened) return 'already-open';
    brokerage.opened = true;
    brokerage.dividend_day = Finance.currentDay;
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
    if (result === 'ok') Finance.updateAccountTier(bank);
    return result;
  }

  // 商户先汇总三种可用支付方式，避免页面只按随身现金隐藏商品。
  public canPay(amount: unknown, source?: unknown): boolean {
    const value = Math.floor(Number(amount));
    if (!Number.isSafeInteger(value) || value < 0) return false;
    if (source != null && !Finance.isMerchantSource(source)) return Finance.cashOnHand >= value;
    return this.choosePayment(value) != null;
  }

  public setPaymentMethod(method: unknown): FinanceResult {
    const bank = this.state.bank;
    if (method === 'debit' && !bank.debit_card) return 'debit-required';
    if (method === 'credit' && !bank.credit_card) return 'credit-required';
    if (method !== 'cash' && method !== 'debit' && method !== 'credit') return 'invalid-amount';
    bank.payment_method = method;
    return 'ok';
  }

  private choosePayment(value: number): PaymentMethod | null {
    const bank = this.state.bank;
    const available: Record<PaymentMethod, boolean> = {
      cash: Finance.cashOnHand >= value,
      debit: bank.debit_card && bank.balance >= value,
      credit: bank.credit_card && bank.credit_missed_payments === 0 && this.state.collection.amount === 0 && bank.credit_debt + value <= this.accountLimits.credit
    };
    const methods: PaymentMethod[] = [bank.payment_method, 'cash', 'debit', 'credit'];
    return methods.find(method => available[method]) ?? null;
  }

  private chargeMerchant(amount: unknown, source: unknown): boolean {
    const value = Math.floor(Number(amount));
    const bank = this.state.bank;
    if (!Number.isSafeInteger(value) || value <= 0 || !Finance.isMerchantSource(source)) return false;
    const method = this.choosePayment(value);
    if (method) bank.payment_method = method;
    if (method === 'debit') bank.balance -= value;
    else if (method === 'credit') Finance.addCreditDebt(bank, value);
    else return false;
    return true;
  }

  // 包装原版 money 宏：银行卡负责扣款，原宏以 recordOnly 保留消费统计。
  private registerMoneyMacro(): void {
    const original = this.core.SugarCube.Macro.get('money') as MacroDefinition | undefined;
    if (!original) return;
    const chargeMerchant = (amount: unknown, source: unknown) => this.chargeMerchant(amount, source);
    const refresh = () => this.refreshMoneyUI();
    this.core.tool.macro.define('money', function (this: any, amountArg: unknown, sourceArg: unknown, optionalArg?: unknown) {
      const amount = Number(amountArg);
      const optional = optionalArg;
      const recordOnly = typeof optional === 'object' && optional !== null && 'recordOnly' in optional && optional.recordOnly;
      if (recordOnly || amount >= 0 || !chargeMerchant(-amount, sourceArg)) {
        original.handler.call(this);
        return;
      }
      const argumentCount = this.args.length;
      this.args[2] = { ...(typeof optional === 'object' && optional !== null ? optional : {}), recordOnly: true };
      try {
        original.handler.call(this);
      } finally {
        if (argumentCount > 2) this.args[2] = optional;
        this.args.length = argumentCount;
      }
      refresh();
    });
  }

  private refreshMoneyUI(): void {
    this.core.SugarCube.Wikifier.wikifyEval('<<updatesidebarmoney>>');
    if (document.getElementById('dr-finance-caption')) this.core.SugarCube.Wikifier.wikifyEval('<<replace "#dr-finance-caption">><<deadwood-reblooms-finance-caption-content>><</replace>>');
  }

  public buy(symbol: unknown, amount: unknown): FinanceResult {
    const { brokerage, market } = this.state;
    if (!brokerage.opened) return 'brokerage-required';
    const item = this.securities.find(security => security.symbol === symbol);
    if (!item) return 'unknown-security';
    const shares = Finance.toShares(amount);
    if (shares == null) return 'invalid-amount';
    const cost = market.prices[item.symbol] * shares;
    if (!Number.isSafeInteger(cost)) return 'invalid-amount';
    const fee = this.tradingFee(cost);
    if (cost + fee > brokerage.cash) return 'insufficient-brokerage';
    brokerage.cash -= cost + fee;
    brokerage.holdings[item.symbol] += shares;
    brokerage.costs[item.symbol] = (brokerage.costs[item.symbol] ?? 0) + cost + fee;
    // 成交后重置未来行情，避免回退后按已知涨跌交易。
    market.seed = Securities.generateSeed();
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
    const proceeds = market.prices[item.symbol] * shares;
    if (!Number.isSafeInteger(proceeds)) return 'invalid-amount';
    const cost = Math.round(((brokerage.costs[item.symbol] ?? 0) * shares) / brokerage.holdings[item.symbol]);
    const net = proceeds - this.tradingFee(proceeds);
    if (net < 0) return 'invalid-amount';
    brokerage.holdings[item.symbol] -= shares;
    brokerage.costs[item.symbol] = Math.max(0, (brokerage.costs[item.symbol] ?? 0) - cost);
    brokerage.realised += net - cost;
    brokerage.cash += net;
    market.seed = Securities.generateSeed();
    return 'ok';
  }

  public resetMarketSeed(): void {
    this.state.market.seed = Securities.generateSeed();
  }

  public tradingFee(value: number): number {
    return Math.max(tradingTerms.minimumFee, Math.ceil(value * tradingTerms.feeRate));
  }

  public maximumShares(symbol: string): number {
    const price = this.state.market.prices[symbol];
    if (!price) return 0;
    const cash = this.state.brokerage.cash;
    let shares = Math.max(0, Math.floor((cash - tradingTerms.minimumFee) / price));
    shares = Math.min(shares, Math.floor(cash / (price * (1 + tradingTerms.feeRate))));
    while (shares > 0 && price * shares + this.tradingFee(price * shares) > cash) shares--;
    return shares;
  }

  private payDividends(day: number): void {
    const { brokerage, market } = this.state;
    if (!brokerage.opened || brokerage.dividend_day < 0) return;
    while (brokerage.dividend_day + 7 <= day) {
      const payment = this.securities.reduce((total, item) => total + Math.floor(brokerage.holdings[item.symbol] * market.prices[item.symbol] * item.weeklyDividendRate), 0);
      brokerage.cash += payment;
      brokerage.dividends += payment;
      brokerage.dividend_day += 7;
    }
  }

  /** 交易跳空与拍卖差额不挤进信用卡额度，也不被下一笔贷款覆盖。 */
  public addCollectionDebt(amount: number, source: FinanceState['collection']['source'], day = Finance.currentDay): void {
    if (!Number.isSafeInteger(amount) || amount <= 0) return;
    const debt = this.state.collection;
    if (debt.amount === 0) {
      debt.due_day = day + tradingTerms.collectionDays;
      debt.extended = false;
      debt.destination = null;
    }
    if (!debt.extended) debt.due_day = Math.min(debt.due_day, day + tradingTerms.collectionDays);
    debt.source = debt.amount > 0 && debt.source !== source ? 'mixed' : source;
    debt.amount += amount;
  }

  public repayCollection(): boolean {
    const debt = this.state.collection;
    if (debt.amount <= 0) return false;
    const fromBank = Math.min(this.state.bank.balance, debt.amount);
    const cash = debt.amount - fromBank;
    if (V.money < cash) return false;
    this.state.bank.balance -= fromBank;
    if (cash > 0) this.core.SugarCube.Wikifier.wikifyEval(`<<money ${-cash} 'deadwoodDebt'>>`);
    debt.amount = 0;
    return true;
  }

  public get canExtendCollection(): boolean {
    const debt = this.state.collection;
    return debt.amount > 0 && !debt.extended && this.state.bank.balance >= Math.ceil(debt.amount * 0.05);
  }

  public extendCollection(): boolean {
    if (!this.canExtendCollection) return false;
    const debt = this.state.collection;
    this.state.bank.balance -= Math.ceil(debt.amount * 0.05);
    debt.due_day = Math.max(Finance.currentDay, debt.due_day) + 7;
    debt.extended = true;
    return true;
  }

  public get collectionEncounter(): boolean {
    const debt = this.state.collection;
    return debt.amount > 0 && Time.days >= debt.due_day && Time.days > debt.encounter_day && !V.statFreeze && V.combat !== 1 && V.exposed <= 0 && V.stress < V.stressmax && !V.possessed;
  }

  public evadeCollection(): void {
    this.state.collection.encounter_day = Finance.currentDay;
  }

  /** 被带走抵偿本次追债，已有其他贷款和原版房租仍按各自账目结算。 */
  public surrenderCollection(): void {
    this.state.collection.amount = 0;
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
        volatility: Math.clamp(Math.floor(security.volatility!), 1, 20),
        weeklyDividendRate: Math.clamp(Number(security.weeklyDividendRate) || 0, 0, 0.01)
      };
    });
  }

  private static ensureState(securities: readonly Security[]): FinanceState {
    // 账户和行情始终读取当前 V，不把可变状态放进 setup 或模块实例。
    const finance = V.VanillaPlus.finance as FinanceState;
    if (finance.market.day < 0) finance.market.day = Finance.currentDay;
    if (!Number.isSafeInteger(finance.market.seed) || finance.market.seed === 0) finance.market.seed = Securities.generateSeed();
    for (const item of securities) {
      finance.brokerage.holdings[item.symbol] ??= 0;
      finance.brokerage.costs[item.symbol] ??= 0;
      const initialPrice =
        item.symbol === 'ALF' && finance.market.farm_stage === undefined
          ? Math.round(item.initialPrice * (Number(V.farm_stage) >= 12 ? 1.188 : Number(V.farm_stage) >= 9 ? 1.08 : 1))
          : item.initialPrice;
      finance.market.prices[item.symbol] ??= initialPrice;
      finance.market.previous_prices[item.symbol] ??= finance.market.prices[item.symbol];
    }
    finance.market.farm_stage ??= Math.max(0, Math.floor(Number(V.farm_stage) || 0));
    finance.market.farm_attack_damage ??= Boolean(V.farm_attacked) && Array.isArray(V.fields_damaged) ? V.fields_damaged.length : 0;
    finance.market.pending_farm_moves ??= {};
    finance.market.cafe_stage ??= Math.max(0, Math.floor(Number(V.chef_state) || 0));
    finance.market.avery_fate ??= String(V.avery_fate ?? '');
    if (finance.bank.opened && finance.bank.bank_interest_last_day < 0) finance.bank.bank_interest_last_day = Finance.currentDay;
    if (finance.bank.opened && finance.bank.opened_day < 0) finance.bank.opened_day = Finance.currentDay;
    Finance.updateAccountTier(finance.bank);
    Finance.resetAtmLimit(finance.bank);
    if (finance.bank.credit_debt > 0 && finance.bank.credit_due_day <= 0) {
      finance.bank.credit_due_day = Finance.currentDay + CREDIT_BILLING_DAYS;
    }
    return finance;
  }

  // 金额换算与转账
  private static get cashOnHand(): number {
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

  private static get currentDay(): number {
    return Math.max(0, Math.floor(Number(Time.days) || 0));
  }

  private static get currentWeek(): number {
    // 原版 Time.weekDay 是 1=周日 … 7=周六（见 datetime.js 的 weekEnd：7 或 1 为周末）。
    // 以周日为一周起点回推，否则周日会算出与本周其余六天不同的 id，ATM 额度一周重置两次。
    const weekDay = Math.clamp(Math.floor(Number(Time.weekDay) || 1), 1, 7);
    return Finance.currentDay - (weekDay - 1);
  }

  private static resetAtmLimit(bank: BankState): void {
    const week = Finance.currentWeek;
    if (bank.atm_week === week) return;
    bank.atm_week = week;
    bank.atm_withdrawn = 0;
  }

  private static isMerchantSource(source: unknown): boolean {
    if (MERCHANT_LOCATIONS.has(String(V.location))) return true;
    if (!(typeof source === 'string' || source instanceof String)) return false;
    const name = String(source);
    return MERCHANT_SOURCES.has(name) || name.startsWith('hospital') || name.startsWith('pharmacy');
  }

  private static updateAccountTier(bank: BankState): void {
    if (!bank.opened) return;
    const propertyDebt = V.VanillaPlus.real_estate?.mortgage?.outstanding ?? 0;
    const recoveryDebt = V.VanillaPlus.finance.collection.amount;
    const netBalance = Math.max(0, bank.balance - bank.credit_debt - bank.loan_debt - propertyDebt - recoveryDebt);
    bank.peak_balance = Math.max(bank.peak_balance, netBalance);
    const age = Math.max(0, Finance.currentDay - bank.opened_day);
    const cleanRecord = bank.credit_missed_payments === 0 && bank.loan_missed_payments === 0 && recoveryDebt === 0;
    const current = Math.max(
      0,
      ACCOUNT_TIERS.findIndex(tier => tier.id === bank.account_tier)
    );
    let next = current;
    if (cleanRecord) {
      for (let index = current + 1; index < ACCOUNT_TIERS.length; index++) {
        const tier = ACCOUNT_TIERS[index];
        if (age >= tier.days && bank.peak_balance >= tier.balance * PENCE_PER_POUND) next = index;
      }
    }
    const tier = ACCOUNT_TIERS[next];
    bank.account_tier = tier.id;
    if (bank.payment_method === 'debit' && !bank.debit_card) bank.payment_method = 'cash';
    if (bank.payment_method === 'credit' && !bank.credit_card) bank.payment_method = 'cash';
  }

  private static loanPayment(principal: number, weeks: number, weeklyRate: number): number {
    const growth = Math.pow(1 + weeklyRate, weeks);
    return Math.ceil((principal * weeklyRate * growth) / (growth - 1));
  }

  private static clearLoan(bank: BankState): void {
    bank.loan_project = null;
    bank.loan_debt = 0;
    bank.loan_payment = 0;
    bank.loan_rate = 0;
    bank.loan_term = 0;
    bank.loan_due_day = 0;
    bank.loan_next_payment_day = 0;
    bank.loan_interest_last_day = -1;
    bank.loan_missed_payments = 0;
  }

  private static clearCredit(bank: BankState): void {
    bank.credit_debt = 0;
    bank.credit_due_day = 0;
    bank.credit_missed_payments = 0;
  }

  private static addCreditDebt(bank: BankState, amount: number): void {
    if (bank.credit_debt <= 0) {
      bank.credit_due_day = Finance.currentDay + CREDIT_BILLING_DAYS;
    }
    bank.credit_debt += amount;
  }

  private static creditMinimumPayment(debt: number): number {
    if (debt <= 0) return 0;
    return Math.min(debt, Math.max(CREDIT_MINIMUM_PAYMENT, Math.ceil((debt * CREDIT_MINIMUM_PERCENT) / 100)));
  }

  private static advanceDepositInterest(bank: BankState, currentDay: number): void {
    if (!bank.opened || bank.bank_interest_last_day < 0) {
      bank.bank_interest_last_day = currentDay;
      return;
    }
    while (bank.bank_interest_last_day + 7 <= currentDay) {
      if (bank.balance > 0) bank.balance += Math.floor(bank.balance * DEPOSIT_WEEKLY_RATE);
      bank.bank_interest_last_day += 7;
    }
  }

  private advanceLoan(bank: BankState, currentDay: number): void {
    // 时间事件仍可每天触发，但银行只在周付款日和最终到期日计息、扣款。
    if (bank.loan_debt <= 0) return;
    while (bank.loan_debt > 0 && bank.loan_next_payment_day <= currentDay) {
      const day = bank.loan_next_payment_day;
      Finance.accrueLoanInterest(bank, day);
      const scheduled = Math.min(day >= bank.loan_due_day ? bank.loan_debt : bank.loan_payment, bank.loan_debt);
      const paid = Math.min(bank.balance, scheduled);
      bank.balance -= paid;
      bank.loan_debt -= paid;
      if (paid < scheduled) {
        const unpaid = scheduled - paid;
        bank.loan_debt += Math.max(LOAN_LATE_FEE, Math.ceil((unpaid * LOAN_LATE_PERCENT) / 100));
        bank.loan_missed_payments++;
        // 两期不足额后转交追偿，原贷款清账，避免继续重复计息和扣款。
        if (bank.loan_missed_payments >= 2) {
          this.addCollectionDebt(bank.loan_debt, 'bank', day);
          Finance.clearLoan(bank);
          break;
        }
      }
      bank.loan_next_payment_day = day < bank.loan_due_day ? Math.min(day + 7, bank.loan_due_day) : day + 7;
    }
    if (bank.loan_debt === 0) Finance.clearLoan(bank);
  }

  private static accrueLoanInterest(bank: BankState, day: number): void {
    const elapsedDays = Math.max(0, day - bank.loan_interest_last_day);
    if (elapsedDays === 0) return;
    const rate = bank.loan_rate * (day > bank.loan_due_day ? LOAN_OVERDUE_MULTIPLIER : 1);
    bank.loan_debt += Math.ceil((bank.loan_debt * rate * elapsedDays) / 7);
    bank.loan_interest_last_day = day;
  }

  private advanceCredit(bank: BankState, currentDay: number): void {
    if (bank.credit_debt <= 0) {
      if (bank.credit_due_day > 0) Finance.clearCredit(bank);
      return;
    }
    if (bank.credit_due_day <= 0) bank.credit_due_day = currentDay + CREDIT_BILLING_DAYS;
    while (bank.credit_due_day <= currentDay && bank.credit_debt > 0) {
      bank.credit_debt += Math.ceil(bank.credit_debt * CREDIT_WEEKLY_RATE);
      const minimum = Finance.creditMinimumPayment(bank.credit_debt);
      const paid = Math.min(bank.balance, minimum);
      bank.balance -= paid;
      bank.credit_debt -= paid;
      if (paid < minimum) {
        bank.credit_debt += CREDIT_LATE_FEE;
        bank.credit_missed_payments++;
        if (bank.credit_missed_payments >= 2) {
          this.addCollectionDebt(bank.credit_debt, 'bank', bank.credit_due_day);
          Finance.clearCredit(bank);
          bank.credit_card = false;
          break;
        }
      }
      bank.credit_due_day += CREDIT_BILLING_DAYS;
    }
    if (bank.credit_debt === 0) Finance.clearCredit(bank);
  }

  private static moveFunds(finance: FinanceState, amount: unknown, source: 'cash' | 'bank' | 'brokerage', target: 'cash' | 'bank' | 'brokerage'): FinanceResult {
    const value = Finance.toPennies(amount);
    if (value == null) return 'invalid-amount';
    const balances = {
      cash: Finance.cashOnHand,
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
    if (target === 'cash') V.money = Finance.cashOnHand + value;
    else if (target === 'bank') finance.bank.balance += value;
    else finance.brokerage.cash += value;
    return 'ok';
  }
}

export default Finance;
