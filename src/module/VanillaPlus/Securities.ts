// ./src/module/VanillaPlus/Securities.ts

import type { FinanceState } from './Finance';

export interface Security {
  symbol: string;
  name: { EN: string; CN: string };
  initialPrice: number;
  volatility: number;
  weeklyDividendRate: number;
}

type MarketState = FinanceState['market'];

/** 证券行情与剧情涨跌，不持有存档，始终操作调用方提供的状态。 */
export default class Securities {
  // 每日行情
  public static generateSeed(): number {
    return Math.floor(Math.random() * 0x100000000) >>> 0 || 1;
  }

  public static dailyMove(item: Security, day: number, seed: number): number {
    let hash = 2166136261 ^ seed;
    for (const character of `${item.symbol}:${day}`) {
      hash ^= character.charCodeAt(0);
      hash = Math.imul(hash, 16777619);
    }
    return ((hash >>> 0) % (item.volatility * 2 + 1)) - item.volatility;
  }

  public static nextPrice(item: Security, price: number, day: number, seed: number): number {
    const next = Math.round((price * (100 + Securities.dailyMove(item, day, seed))) / 100);
    return Math.clamp(next, Math.round(item.initialPrice * 0.25), item.initialPrice * 4);
  }

  public static applyMoves(market: MarketState, securities: readonly Security[]): void {
    for (const item of securities) {
      const move = market.pending_farm_moves?.[item.symbol] ?? 0;
      if (!move) continue;
      market.prices[item.symbol] = Math.clamp(Math.round((market.prices[item.symbol] * (100 + move)) / 100), Math.round(item.initialPrice * 0.25), item.initialPrice * 4);
    }
    market.pending_farm_moves = {};
  }

  public static applyEvents(market: MarketState, securities: readonly Security[]): void {
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
    market.farm_stage = stage;

    const damage = Boolean(V.farm_attacked) && Array.isArray(V.fields_damaged) ? V.fields_damaged.length : 0;
    const newDamage = Math.max(0, damage - (market.farm_attack_damage ?? 0));
    if (newDamage > 0) {
      moves.ALF = (moves.ALF ?? 0) - Math.min(12, newDamage * 2);
      moves.RMY = (moves.RMY ?? 0) + Math.min(3, newDamage);
    }
    market.farm_attack_damage = damage;

    // 咖啡馆涨价、停业扩建和重新开业都由原版 chef_state 推进，行情只在节点变化时响应一次。
    const cafeStage = Math.max(0, Math.floor(Number(V.chef_state) || 0));
    const previousCafeStage = market.cafe_stage ?? cafeStage;
    if (previousCafeStage < 2 && cafeStage >= 2) moves.OBC = (moves.OBC ?? 0) + 3;
    if (previousCafeStage < 7 && cafeStage >= 7) moves.OBC = (moves.OBC ?? 0) - 4;
    if (previousCafeStage < 9 && cafeStage >= 9) moves.OBC = (moves.OBC ?? 0) + 10;
    market.cafe_stage = cafeStage;

    // 原版高楼事件的结局：仪式成功获得麋鹿们支持，救援路线则仍有火灾损失。
    // 已开始的存档以当前结局为基线，不重复补涨跌。
    const averyFate = String(V.avery_fate ?? '');
    if (market.avery_fate !== averyFate) {
      const move = averyFate === 'ascended' ? 8 : averyFate === 'saved' ? -4 : ['fallen', 'kicked'].includes(averyFate) ? -12 : 0;
      if (move) moves.AVY = (moves.AVY ?? 0) + move;
      market.avery_fate = averyFate;
    }
    if (Number(Time.weekDay) !== 1 && Number(Time.weekDay) !== 7) Securities.applyMoves(market, securities);
  }

  public static updatePrices(finance: FinanceState, securities: readonly Security[], onDay?: (day: number) => void, targetDay = Math.floor(Time.days)): void {
    const currentDay = Math.min(Math.floor(Time.days), Math.max(0, Math.floor(targetDay)));
    if (finance.market.day < 0) {
      // 新存档首次跨日时，也要计算刚过去的营业日行情。
      finance.market.day = currentDay - 1;
    }
    if (currentDay <= finance.market.day) return;
    for (let day = finance.market.day + 1; day <= currentDay; day++) {
      const weekDay = (((((Number(Time.weekDay) || 1) - (Math.floor(Time.days) - day) - 1) % 7) + 7) % 7) + 1;
      if (weekDay === 1 || weekDay === 7) {
        onDay?.(day);
        continue;
      }
      finance.market.previous_prices = { ...finance.market.prices };
      for (const item of securities) finance.market.prices[item.symbol] = Securities.nextPrice(item, finance.market.prices[item.symbol], day, finance.market.seed);
      Securities.applyMoves(finance.market, securities);
      finance.market.history.push({ day, prices: { ...finance.market.prices } });
      if (finance.market.history.length > 30) finance.market.history.shift();
      onDay?.(day);
    }
    finance.market.day = currentDay;
  }
}
