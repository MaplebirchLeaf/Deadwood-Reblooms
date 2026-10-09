// ./src/module/Finance/CompanyEvents.ts

import events from '../../assets/finance/company-events.json';
import terms from '../../assets/finance/market.json';
import type { Security } from './Securities';
import type { FinanceState } from '../Finance';

type MarketState = FinanceState['market'];

export default class CompanyEvents {
  public static hash(key: string, day: number, seed: number): number {
    let hash = 2166136261 ^ seed;
    for (const character of `${key}:${day}`) {
      hash ^= character.charCodeAt(0);
      hash = Math.imul(hash, 16777619);
    }
    return hash >>> 0;
  }

  private static get signals(): Record<string, number> {
    const cafe = Math.max(0, Number(V.chef_state) || 0);
    return {
      cafe,
      suspicion: cafe > 0 ? Number(V.chef_sus) || 0 : 0,
      closed: Number(cafe >= 7 && cafe < 9 && Number(V.chef_rework) <= 30),
      truth: Number(V.chef_speech === 'truth'),
      model: V.photo_known >= 2 && V.nikiSeen?.includes('photo') ? Number(V.fame?.model) || 0 : 0
    };
  }

  public static record(market: MarketState, symbol: string, event: string, move: number, day = Math.floor(Time.days)): void {
    const news = (market.news ??= []);
    news.push({ day, symbol, event, move });
    if (news.length > 12) news.shift();
  }

  public static capture(market: MarketState, securities: readonly Security[], content?: ParentNode): void {
    const signals = CompanyEvents.signals;
    if (market.company_events === null) {
      market.company_events = events.native.filter(event => signals[event.signal] >= event.threshold).map(event => event.id);
      return;
    }
    const seen = market.company_events;
    const moves = (market.pending_farm_moves ??= {});
    for (const event of events.native) {
      if (seen.includes(event.id) || signals[event.signal] < event.threshold || !securities.some(item => item.symbol === event.symbol)) continue;
      seen.push(event.id);
      for (const [symbol, move] of Object.entries(event.moves)) {
        if (securities.some(item => item.symbol === symbol)) moves[symbol] = (moves[symbol] ?? 0) + move;
      }
      CompanyEvents.record(market, event.symbol, event.id, event.moves[event.symbol as keyof typeof event.moves]!);
    }
    // 两种调查分支都由原版正文生成链接，怀疑值达到上限本身不算已经被发现。
    if (
      V.passage === 'Cliff Street' &&
      !seen.includes('cafe_investigation') &&
      content?.querySelector('.macro-link[data-passage="Chef Blackmail Car"], .macro-link[data-passage="Chef Police Journey"]')
    ) {
      seen.push('cafe_investigation');
      moves.OBC = (moves.OBC ?? 0) + terms.investigationPercent;
      CompanyEvents.record(market, 'OBC', 'cafe_investigation', terms.investigationPercent);
    }
  }

  public static daily(market: MarketState, securities: readonly Security[], day: number): void {
    const closed = CompanyEvents.signals.closed;
    for (const item of securities) {
      if ((item.symbol === 'OBC' && closed) || (item.symbol === 'RDS' && market.robin_shop === false)) continue;
      const roll = CompanyEvents.hash(`business:${item.symbol}`, day, market.seed);
      if (roll / 0x100000000 >= terms.businessChance) continue;
      const pool = events.companies[item.symbol as keyof typeof events.companies];
      if (!pool?.length) continue;
      const event = pool[CompanyEvents.hash(`headline:${item.symbol}`, day, market.seed) % pool.length];
      const [minimum, maximum] = event.move;
      const move = minimum + (CompanyEvents.hash(`impact:${item.symbol}`, day, market.seed) % (maximum - minimum + 1));
      market.prices[item.symbol] = Math.clamp(Math.round((market.prices[item.symbol] * (100 + move)) / 100), 1, Number.MAX_SAFE_INTEGER);
      CompanyEvents.record(market, item.symbol, event.id, move, day);
    }
  }
}
