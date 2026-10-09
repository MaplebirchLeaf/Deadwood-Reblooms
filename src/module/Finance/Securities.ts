// ./src/module/Finance/Securities.ts

import type { FinanceState } from '../Finance';
import terms from '../../assets/finance/market.json';
import CompanyEvents from './CompanyEvents';

export interface Security {
  symbol: string;
  name: string;
  initialPrice: number;
  totalShares: number;
  listedShares: number;
  volatility: number;
  weeklyDividendRate: number;
}

type MarketState = FinanceState['market'];

/** 证券行情与剧情涨跌，不持有存档，始终操作调用方提供的状态。 */
export default class Securities {
  public static supply(finance: FinanceState, securities: readonly Security[]): Record<string, { total: number; listed: number; held: number; available: number }> {
    const { holdings, margin } = finance.brokerage;
    return Object.fromEntries(
      securities.map(item => {
        let held = holdings[item.symbol] ?? 0;
        let borrowed = 0;
        for (const position of margin.positions) {
          if (position.kind !== 'stock' || position.symbol !== item.symbol) continue;
          if (position.side === 1) held += position.units;
          else borrowed += position.units;
        }
        const shares = finance.market.shares[item.symbol];
        return [item.symbol, { ...shares, held, available: Math.max(0, shares.listed - held - borrowed) }];
      })
    );
  }

  public static tradingDay(day: number): boolean {
    const weekDay = (((((Number(Time.weekDay) || 1) - (Math.floor(Time.days) - day) - 1) % 7) + 7) % 7) + 1;
    return weekDay >= 2 && weekDay <= 6;
  }

  public static nextTradingDay(day: number): number {
    do day++;
    while (!Securities.tradingDay(day));
    return day;
  }

  // 每日行情
  public static generate(): number {
    return Math.floor(Math.random() * 0x100000000) >>> 0 || 1;
  }

  public static dailyMove(item: Security, day: number, seed: number): number {
    const value = CompanyEvents.hash(item.symbol, day, seed);
    const roll = value / 0x100000000;
    if (roll < terms.extremeChance / 2 || roll >= 1 - terms.extremeChance / 2) {
      const magnitude = terms.extremeMinPercent + (value % (terms.extremeMaxPercent - terms.extremeMinPercent + 1));
      return roll < 0.5 ? -magnitude : magnitude;
    }
    if (roll < terms.shockChance / 2 || roll >= 1 - terms.shockChance / 2) {
      const magnitude = terms.shockMinPercent + (value % (terms.shockMaxPercent - terms.shockMinPercent + 1));
      return roll < 0.5 ? -magnitude : magnitude;
    }
    return (value % (item.volatility * 2 + 1)) - item.volatility;
  }

  public static nextPrice(item: Security, price: number, day: number, seed: number): number {
    const next = Math.round((price * (100 + Securities.dailyMove(item, day, seed))) / 100);
    return Math.clamp(next, 1, Number.MAX_SAFE_INTEGER);
  }

  private static advanceShares(finance: FinanceState, securities: readonly Security[], day: number): void {
    const market = finance.market;
    const supply = Securities.supply(finance, securities);
    for (const item of securities) {
      if (item.symbol === 'RDS' && market.robin_shop === false) continue;
      if (CompanyEvents.hash(`capital:${item.symbol}`, day, market.seed) / 0x100000000 >= terms.capitalChance) continue;
      const event = (['share_issue', 'share_buyback', 'share_release', 'share_lockup'] as const)[CompanyEvents.hash(`capital-event:${item.symbol}`, day, market.seed) % 4];
      // 饮品店的私人合伙份额与罗宾控股约定不因随机公告改变。
      if (item.symbol === 'RDS' && (event === 'share_issue' || event === 'share_buyback')) continue;
      const shares = market.shares[item.symbol];
      const percent = terms.capitalMinPercent + (CompanyEvents.hash(`capital-size:${item.symbol}`, day, market.seed) % (terms.capitalMaxPercent - terms.capitalMinPercent + 1));
      const amount = Math.max(1, Math.floor((shares.listed * percent) / 100));
      let change: number;
      if (event === 'share_issue') {
        change = Math.min(amount, Number.MAX_SAFE_INTEGER - shares.total);
        shares.total += change;
        shares.listed += change;
      } else if (event === 'share_buyback') {
        change = -Math.min(amount, supply[item.symbol].available, shares.total - 1);
        shares.total += change;
        shares.listed += change;
      } else if (event === 'share_release') {
        const limit = item.symbol === 'RDS' ? item.listedShares : shares.total;
        change = Math.max(0, Math.min(amount, limit - shares.listed));
        shares.listed += change;
      } else {
        change = -Math.min(amount, supply[item.symbol].available);
        shares.listed += change;
      }
      if (!change) continue;
      const move = terms.capitalMoves[event];
      market.prices[item.symbol] = Math.clamp(Math.round((market.prices[item.symbol] * (100 + move)) / 100), 1, Number.MAX_SAFE_INTEGER);
      CompanyEvents.record(market, item.symbol, event, move, day, change);
    }
  }

  public static applyMoves(market: MarketState, securities: readonly Security[]): void {
    for (const item of securities) {
      const move = market.pending_farm_moves?.[item.symbol] ?? 0;
      if (!move) continue;
      market.prices[item.symbol] = Math.clamp(Math.round((market.prices[item.symbol] * (100 + move)) / 100), 1, Number.MAX_SAFE_INTEGER);
    }
    market.pending_farm_moves = {};
  }

  public static applyEvents(market: MarketState, securities: readonly Security[], shop?: boolean, business?: { upgrades: number; staff: number; orders: number }, content?: ParentNode): void {
    const record = (symbol: string, event: string, move: number) => {
      CompanyEvents.record(market, symbol, event, move);
    };
    const stage = Math.max(0, Math.floor(Number(V.farm_stage) || 0));
    const previousStage = market.farm_stage ?? stage;
    const moves = (market.pending_farm_moves ??= {});
    if (previousStage < 7 && stage >= 7) moves.RMY = (moves.RMY ?? 0) - 2;
    if (previousStage < 9 && stage >= 9) {
      moves.ALF = (moves.ALF ?? 0) + 8;
      moves.RMY = (moves.RMY ?? 0) - 3;
    }
    if (previousStage < 12 && stage >= 12) {
      moves.ALF = (moves.ALF ?? 0) + 10;
      moves.RMY = (moves.RMY ?? 0) - 4;
    }
    if (previousStage !== stage && [7, 9, 12].some(level => previousStage < level && stage >= level)) record('ALF', 'farm', moves.ALF ?? 0);
    market.farm_stage = stage;

    const damage = Boolean(V.farm_attacked) && Array.isArray(V.fields_damaged) ? V.fields_damaged.length : 0;
    const newDamage = Math.max(0, damage - (market.farm_attack_damage ?? 0));
    if (newDamage > 0) {
      moves.ALF = (moves.ALF ?? 0) - Math.min(12, newDamage * 2);
      moves.RMY = (moves.RMY ?? 0) + Math.min(3, newDamage);
      record('ALF', 'raid', -Math.min(12, newDamage * 2));
    }
    market.farm_attack_damage = damage;

    // 进入第七阶段时仍营业一周，实际施工停业另按 chef_rework 判断。
    const cafeStage = Math.max(0, Math.floor(Number(V.chef_state) || 0));
    const previousCafeStage = market.cafe_stage ?? cafeStage;
    if (previousCafeStage < 2 && cafeStage >= 2) moves.OBC = (moves.OBC ?? 0) + 3;
    if (previousCafeStage < 7 && cafeStage >= 7) moves.OBC = (moves.OBC ?? 0) - 4;
    if (previousCafeStage < 9 && cafeStage >= 9) moves.OBC = (moves.OBC ?? 0) + 10;
    if (previousCafeStage !== cafeStage && [2, 7, 9].some(level => previousCafeStage < level && cafeStage >= level)) record('OBC', 'cafe', cafeStage >= 9 ? 10 : cafeStage >= 7 ? -4 : 3);
    market.cafe_stage = cafeStage;

    // 原版高楼事件的结局：仪式成功获得麋鹿们支持，救援路线则仍有火灾损失。
    const averyFate = String(V.avery_fate ?? '');
    if (market.avery_fate !== averyFate) {
      const move = averyFate === 'ascended' ? 8 : averyFate === 'saved' ? -4 : ['fallen', 'kicked'].includes(averyFate) ? -12 : 0;
      if (move) {
        moves.AVY = (moves.AVY ?? 0) + move;
        record('AVY', 'avery', move);
      }
      market.avery_fate = averyFate;
    }
    // 店铺挂牌与实际经营节点分别去重。日常订单只在有限里程碑影响报价，不能刷订单无限抬价。
    if (shop !== undefined) {
      if (market.robin_shop !== undefined && market.robin_shop !== shop) {
        if (securities.some(item => item.symbol === 'RDS')) moves.RDS = (moves.RDS ?? 0) + (shop ? 5 : -15);
        record('RDS', 'shop', shop ? 5 : -15);
      }
      market.robin_shop = shop;
    }
    if (business) {
      const upgrades = Math.clamp(Math.floor(business.upgrades), 0, 4);
      const staff = Math.clamp(Math.floor(business.staff), 0, 2);
      const orders = Math.max(0, Math.floor(business.orders));
      const upgraded = upgrades - (market.robin_upgrades ?? upgrades);
      const hired = staff - (market.robin_staff ?? staff);
      const supplied = [1, 5, 10].filter(count => count > (market.robin_orders ?? orders) && count <= orders).length;
      for (const [event, move] of [
        ['shop_upgrade', upgraded * 2],
        ['shop_staff', hired * 2],
        ['shop_supply', supplied * 2]
      ] as const) {
        if (!move) continue;
        moves.RDS = (moves.RDS ?? 0) + move;
        record('RDS', event, move);
      }
      market.robin_upgrades = upgrades;
      market.robin_staff = staff;
      market.robin_orders = orders;
    }
    CompanyEvents.capture(market, securities, content);
    if (Number(Time.weekDay) !== 1 && Number(Time.weekDay) !== 7) Securities.applyMoves(market, securities);
  }

  public static updatePrices(finance: FinanceState, securities: readonly Security[], onDay?: (day: number) => void, targetDay = Math.floor(Time.days)): void {
    const currentDay = Math.clamp(Math.floor(targetDay), 0, Math.floor(Time.days));
    if (finance.market.day < 0) {
      // 新存档首次跨日时，也要计算刚过去的营业日行情。
      finance.market.day = currentDay - 1;
    }
    if (currentDay <= finance.market.day) return;
    for (let day = finance.market.day + 1; day <= currentDay; day++) {
      if (!Securities.tradingDay(day)) {
        onDay?.(day);
        continue;
      }
      finance.market.previous_prices = { ...finance.market.prices };
      for (const item of securities) finance.market.prices[item.symbol] = Securities.nextPrice(item, finance.market.prices[item.symbol], day, finance.market.seed);
      Securities.applyMoves(finance.market, securities);
      CompanyEvents.daily(finance.market, securities, day);
      Securities.advanceShares(finance, securities, day);
      finance.market.history.push({ day, prices: { ...finance.market.prices } });
      if (finance.market.history.length > 30) finance.market.history.shift();
      onDay?.(day);
    }
    finance.market.day = currentDay;
  }
}
