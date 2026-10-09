// ./src/module/Finance/MarginTrading.ts

import terms from '../../assets/finance/trading.json';
import Securities from './Securities';
import type Finance from '../Finance';

export interface MarginPosition {
  id: number;
  kind: 'stock' | 'futures';
  symbol: string;
  side: 1 | -1;
  leverage: number;
  units: number;
  entry: number;
  margin: number;
  borrowed: number;
  fees: number;
  opening_fee: number;
  opened: number;
  charged_day: number;
  expires: number | null;
  stop_loss?: number | null;
  take_profit?: number | null;
}

export interface MarginState {
  next_id: number;
  positions: MarginPosition[];
  history: { day: number; symbol: string; kind: MarginPosition['kind']; side?: 1 | -1; reason: 'closed' | 'liquidated' | 'expired' | 'stopped' | 'target'; profit: number }[];
  realised: number;
  closed: number;
}

/** 融资股票和现金交割期货共用保证金结算，持仓与普通股票分开记账。 */
export default class MarginTrading {
  public readonly terms = terms;
  public static readonly defaults: MarginState = { next_id: 1, positions: [], history: [], realised: 0, closed: 0 };

  public constructor(private readonly finance: Finance) {}

  private get state(): MarginState {
    return V.Finance.brokerage.margin;
  }

  public get positions(): readonly MarginPosition[] {
    return this.state.positions;
  }

  public get history(): readonly MarginState['history'][number][] {
    return this.state.history;
  }

  public get open(): boolean {
    return Time.weekDay >= 2 && Time.weekDay <= 6 && Time.hour >= 9 && Time.hour < 17;
  }

  public get closablePositions(): readonly MarginPosition[] {
    return this.open ? this.positions.filter(position => Math.floor(Time.days) > position.opened) : [];
  }

  public quote(symbol: string): number {
    return V.Finance.market.prices[symbol] ?? 0;
  }

  public profit(position: MarginPosition): number {
    return Math.round((this.quote(position.symbol) - position.entry) * position.units * position.side) - position.fees;
  }

  public equity(position: MarginPosition): number {
    return position.margin + this.profit(position);
  }

  public get equityTotal(): number {
    return this.positions.reduce((total, position) => total + this.equity(position), 0);
  }

  /** 报价只计算本次所需资金，不扣款，下单时再次核对余额和资格。 */
  public orderQuote(
    kind: 'stock' | 'futures',
    symbol: string,
    side: number,
    lots: number,
    leverage: number
  ): { units: number; entry: number; notional: number; margin: number; fee: number; total: number } | null {
    if (!['stock', 'futures'].includes(kind) || ![1, -1].includes(side) || !Number.isSafeInteger(lots) || lots <= 0) return null;
    if (!(kind === 'stock' ? terms.stockLeverage : terms.futuresLeverage).includes(leverage)) return null;
    if (!this.finance.securities.some(item => item.symbol === symbol)) return null;
    const entry = this.quote(symbol);
    const units = lots;
    const notional = entry * units;
    const margin = Math.ceil(notional / leverage);
    const fee = Math.max(terms.minimumFee, Math.ceil(notional * terms.feeRate));
    if (!Number.isSafeInteger(notional) || !Number.isSafeInteger(units) || notional <= 0 || notional > terms.maximumPositionValue || !Number.isSafeInteger(margin + fee)) return null;
    return { units, entry, notional, margin, fee, total: margin + fee };
  }

  public place(kind: 'stock' | 'futures', symbol: string, side: number, lots: number, leverage: number): boolean {
    const finance = V.Finance;
    if (
      !this.open ||
      !finance.brokerage.opened ||
      this.positions.length >= terms.maximumPositions ||
      finance.collection.amount > 0 ||
      finance.bank.credit_missed_payments ||
      finance.bank.loan_missed_payments
    )
      return false;
    const quote = this.orderQuote(kind, symbol, side, lots, leverage);
    if (!quote || finance.brokerage.cash < quote.total) return false;
    const { units, entry, notional, margin, fee } = quote;
    finance.brokerage.cash -= margin + fee;
    const day = Math.floor(Time.days);
    this.state.positions.push({
      id: this.state.next_id++,
      kind,
      symbol,
      side: side as 1 | -1,
      leverage,
      units,
      entry,
      margin,
      borrowed: kind === 'stock' ? (side === -1 ? notional : notional - margin) : 0,
      fees: 0,
      opening_fee: fee,
      opened: day,
      charged_day: day,
      expires: kind === 'futures' ? day + terms.futuresDays : side === -1 ? day + terms.shortDays : null
    });
    this.finance.resetMarketSeed();
    return true;
  }

  public close(id: number): boolean {
    const position = this.closablePositions.find(item => item.id === id);
    if (!position) return false;
    this.settle(position, 'closed', Math.floor(Time.days));
    this.finance.resetMarketSeed();
    return true;
  }

  /** 按当前保证金设定盈亏金额，零值撤销委托，追加资金不会偷偷改动已设的限额。 */
  public limits(id: number, loss: number, profit: number): boolean {
    const position = this.positions.find(item => item.id === id);
    if (!this.open || !position || !Number.isFinite(loss) || !Number.isFinite(profit) || loss < 0 || loss > 90 || profit < 0 || profit > 1000) return false;
    position.stop_loss = loss > 0 ? Math.ceil((position.margin * loss) / 100) : null;
    position.take_profit = profit > 0 ? Math.ceil((position.margin * profit) / 100) : null;
    return true;
  }

  /** 追加保证金不改变开仓价或方向，也不会重开一份合约。 */
  public topUp(id: number, pounds: number): boolean {
    const amount = Math.round(pounds * 100);
    const position = this.positions.find(item => item.id === id);
    const brokerage = V.Finance.brokerage;
    if (!this.open || !position || !Number.isSafeInteger(amount) || amount <= 0 || brokerage.cash < amount || !Number.isSafeInteger(position.margin + amount)) return false;
    brokerage.cash -= amount;
    position.margin += amount;
    return true;
  }

  /** 所有仓位从次一交易日起结算，周末仍累计费用，到期顺延至营业日。 */
  public advance(day: number): void {
    for (const position of this.positions.slice()) {
      if (day < position.opened) continue;
      const elapsed = Math.max(0, day - position.charged_day);
      if (elapsed > 0) {
        const short = position.kind === 'stock' && position.side === -1;
        const value = short ? this.quote(position.symbol) * position.units : position.borrowed;
        position.fees += Math.ceil((value * (short ? terms.shortWeeklyRate : terms.borrowWeeklyRate) * elapsed) / 7);
        position.charged_day = day;
      }
      if (day <= position.opened || !Securities.tradingDay(day)) continue;
      if (this.equity(position) <= position.margin * terms.maintenanceRatio) this.settle(position, 'liquidated', day);
      else if (position.stop_loss && this.profit(position) <= -position.stop_loss) this.settle(position, 'stopped', day);
      else if (position.take_profit && this.profit(position) >= position.take_profit) this.settle(position, 'target', day);
      else if (position.expires !== null && day >= position.expires) this.settle(position, 'expired', day);
    }
  }

  private settle(position: MarginPosition, reason: MarginState['history'][number]['reason'], day: number): void {
    const state = this.state;
    const index = state.positions.findIndex(item => item.id === position.id);
    if (index < 0) return;
    const fee = Math.max(terms.minimumFee, Math.ceil(this.quote(position.symbol) * position.units * terms.feeRate));
    const equity = this.equity(position) - fee;
    state.positions.splice(index, 1);
    if (equity >= 0) V.Finance.brokerage.cash += equity;
    else {
      // 跳空损失可能超过保证金，先扣证券闲置资金和银行存款，差额继续追偿。
      const brokerage = V.Finance.brokerage;
      const paid = Math.min(brokerage.cash, -equity);
      brokerage.cash -= paid;
      const remainder = -equity - paid;
      this.finance.addCollectionDebt(remainder - this.finance.collectBankPennies(remainder), 'margin', day);
    }
    const profit = equity - position.margin - position.opening_fee;
    state.realised += profit;
    state.closed++;
    state.history.push({ day, symbol: position.symbol, kind: position.kind, side: position.side, reason, profit });
    if (state.history.length > terms.historyLimit) state.history.shift();
  }
}
