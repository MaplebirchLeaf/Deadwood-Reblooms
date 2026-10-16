// ./src/migrations/Finance.ts

import type { FinanceState } from '../module/Finance';

type Migration = ReturnType<typeof maplebirch.tool.migration.create>;

interface LegacyState {
  finance?: {
    bank: Partial<FinanceState['bank']>;
    brokerage: Pick<FinanceState['brokerage'], 'opened' | 'cash' | 'holdings'> & Partial<FinanceState['brokerage']>;
    market: Pick<FinanceState['market'], 'seed' | 'day' | 'prices' | 'previous_prices'> & Partial<FinanceState['market']>;
  };
  real_estate?: FinanceState['real_estate'];
  adrian?: Record<string, unknown>;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function nonnegativeInteger(value: unknown): boolean {
  return Number.isSafeInteger(value) && (value as number) >= 0;
}

function validFinance(finance: LegacyState['finance']): boolean {
  if (
    !finance ||
    !isRecord(finance.bank) ||
    !isRecord(finance.brokerage) ||
    !isRecord(finance.market) ||
    !isRecord(finance.brokerage.holdings) ||
    !isRecord(finance.market.prices) ||
    !isRecord(finance.market.previous_prices)
  )
    return false;
  const bank = finance.bank;
  return (
    typeof bank.opened === 'boolean' &&
    typeof finance.brokerage.opened === 'boolean' &&
    Number.isSafeInteger(finance.market.seed) &&
    Number.isSafeInteger(finance.market.day) &&
    [
      bank.balance,
      bank.peak_balance,
      bank.credit_debt,
      bank.loan_debt,
      bank.loan_payment,
      bank.atm_withdrawn,
      finance.brokerage.cash,
      ...Object.values(finance.brokerage.holdings),
      ...Object.values(finance.market.prices),
      ...Object.values(finance.market.previous_prices)
    ].every(nonnegativeInteger) &&
    [
      'opened_day',
      'atm_week',
      'credit_due_day',
      'credit_missed_payments',
      'bank_interest_last_day',
      'loan_term',
      'loan_due_day',
      'loan_next_payment_day',
      'loan_interest_last_day',
      'loan_missed_payments'
    ].every(field => Number.isSafeInteger(bank[field as keyof typeof bank])) &&
    typeof bank.loan_rate === 'number' &&
    bank.loan_rate >= 0 &&
    Object.values(bank).every(value => typeof value !== 'number' || Number.isFinite(value))
  );
}

function validEstate(estate: LegacyState['real_estate']): boolean {
  if (!estate || !isRecord(estate.owned) || !isRecord(estate.management) || !isRecord(estate.residents)) return false;
  if (
    !Object.values(estate.owned).every(value => typeof value === 'boolean') ||
    !Object.values(estate.management).every(
      management => isRecord(management) && [management.condition, management.renovation, management.next_settlement_day].every(nonnegativeInteger) && typeof management.rented === 'boolean'
    ) ||
    !Object.values(estate.residents).every(names => Array.isArray(names) && names.every(name => typeof name === 'string'))
  )
    return false;
  if (estate.last_auction !== null && (!isRecord(estate.last_auction) || ![estate.last_auction.proceeds, estate.last_auction.debt, estate.last_auction.surplus].every(nonnegativeInteger)))
    return false;
  const mortgage = estate.mortgage;
  return (
    mortgage === null ||
    (isRecord(mortgage) &&
      [mortgage.outstanding, mortgage.arrears, mortgage.weekly_payment].every(nonnegativeInteger) &&
      (['next_payment_day', 'last_interest_day', 'last_day', 'maturity_day'] as const).every(field => Number.isSafeInteger(mortgage[field])) &&
      (mortgage.weekly_rate === undefined || (typeof mortgage.weekly_rate === 'number' && Number.isFinite(mortgage.weekly_rate) && mortgage.weekly_rate >= 0)) &&
      Object.values(mortgage).every(value => typeof value !== 'number' || Number.isFinite(value)))
  );
}

function validAdrian(adrian: LegacyState['adrian']): boolean {
  return (
    isRecord(adrian) &&
    ['lastVisit', 'visits', 'lastChat', 'career', 'careerReadyDay', 'businessDay', 'businessDays'].every(field => Number.isSafeInteger(adrian[field])) &&
    typeof adrian.accountDiscussed === 'boolean' &&
    typeof adrian.homeDiscussed === 'boolean' &&
    typeof adrian.last_offence === 'string' &&
    ['', 'pressure', 'insult', 'queue'].includes(adrian.last_offence)
  );
}

/** 将 1.4.4 的金融状态搬到独立模块，由框架 version 保证只执行一次。 */
export default function migration(runner: Migration, defaults: FinanceState): void {
  for (const from of ['0.0.0', '2.0.0', '2.0.1', '2.0.2', '2.0.3']) {
    runner.add(from, '2.1.0', (data, utils) => {
      // 包括首次升级，以及已经被 2.0.x 填入空账户的存档。
      utils.fill(data, { ...clone(defaults) });
      const state = data as unknown as FinanceState;
      const legacy = V.VanillaPlus as unknown as LegacyState | undefined;
      if (!legacy || (!legacy.finance && !legacy.real_estate && !legacy.adrian)) return;
      const { bank, brokerage } = state;
      // 自动生成的行情和日结游标不能当成玩家已使用账户的依据。
      const financeUsed =
        bank.opened ||
        bank.opened_day >= 0 ||
        bank.debit_card ||
        bank.credit_card ||
        bank.bailey_knows_account ||
        bank.payment_method !== 'cash' ||
        bank.balance !== 0 ||
        bank.peak_balance !== 0 ||
        bank.credit_debt !== 0 ||
        bank.loan_debt !== 0 ||
        bank.credit_missed_payments !== 0 ||
        bank.loan_missed_payments !== 0 ||
        bank.atm_withdrawn !== 0 ||
        brokerage.opened ||
        brokerage.cash !== 0 ||
        Object.values(brokerage.holdings).some(value => value !== 0) ||
        Object.values(brokerage.costs).some(value => value !== 0) ||
        brokerage.unsettled !== null ||
        brokerage.realised !== 0 ||
        brokerage.dividends !== 0 ||
        brokerage.margin.positions.length > 0 ||
        brokerage.margin.history.length > 0 ||
        brokerage.margin.closed !== 0 ||
        brokerage.margin.realised !== 0 ||
        brokerage.margin.recovery !== null ||
        state.collection.amount !== 0;
      if (validFinance(legacy.finance) && legacy.finance && !financeUsed) {
        const holdings = state.brokerage.holdings;
        const prices = state.market.prices;
        const previousPrices = state.market.previous_prices;
        Object.assign(state.bank, clone(legacy.finance.bank));
        Object.assign(state.brokerage, clone(legacy.finance.brokerage));
        state.brokerage.holdings = { ...holdings, ...clone(legacy.finance.brokerage.holdings) };
        if (state.brokerage.opened && legacy.finance.brokerage.dividend_day === undefined) state.brokerage.dividend_day = Math.max(0, Math.floor(Number(Time.days) || 0));
        Object.assign(state.market, clone(legacy.finance.market));
        state.market.prices = { ...prices, ...clone(legacy.finance.market.prices) };
        state.market.previous_prices = { ...previousPrices, ...clone(legacy.finance.market.previous_prices) };
        // 1.4.4 未记录持仓成本与价格历史，不推算过去交易，也不补发历史分红。
        state.market.history = clone(legacy.finance.market.history ?? []);
      }
      const estate = state.real_estate;
      const estateUsed =
        Object.values(estate.owned).some(Boolean) ||
        estate.mortgage !== null ||
        Object.keys(estate.management).length > 0 ||
        Object.values(estate.residents).some(names => names.length > 0) ||
        estate.last_auction !== null ||
        estate.tenant_property !== null;
      if (validEstate(legacy.real_estate) && legacy.real_estate && !estateUsed) {
        Object.assign(state.real_estate, clone(legacy.real_estate));
        for (const management of Object.values(state.real_estate.management)) {
          management.upgrades ??= [];
          management.rest_day ??= -1;
          management.affection_days ??= {};
          management.vacancy_until ??= 0;
          management.rental_issue ??= null;
        }
        if (state.real_estate.mortgage) {
          state.real_estate.mortgage.purpose ??= 'purchase';
          state.real_estate.mortgage.weekly_rate ??= 0.0035;
        }
        if (state.real_estate.last_auction) state.real_estate.last_auction.shortfall ??= 0;
      }
      const adrian = state.adrian;
      const adrianUsed =
        adrian.visits > 0 ||
        adrian.career > 0 ||
        adrian.last_visit >= 0 ||
        adrian.last_chat >= 0 ||
        adrian.account_discussed ||
        adrian.home_discussed ||
        adrian.business_days > 0 ||
        adrian.last_offence !== '';
      if (validAdrian(legacy.adrian) && legacy.adrian && !adrianUsed) {
        const fields = {
          last_offence: 'last_offence',
          visits: 'visits',
          career: 'career',
          lastVisit: 'last_visit',
          lastChat: 'last_chat',
          accountDiscussed: 'account_discussed',
          homeDiscussed: 'home_discussed',
          careerReadyDay: 'career_ready_day',
          businessDay: 'business_day',
          businessDays: 'business_days'
        };
        for (const [from, to] of Object.entries(fields)) {
          if (legacy.adrian[from] !== undefined) Object.assign(state.adrian, { [to]: clone(legacy.adrian[from]) });
        }
      }
    });
  }
}
