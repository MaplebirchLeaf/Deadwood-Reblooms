// ./src/module/Finance/CompanyEvents.ts

import events from '../../assets/finance/company-events.json';
import terms from '../../assets/finance/market.json';
import type { Security } from './Securities';
import type { FinanceState } from '../Finance';

type MarketState = FinanceState['market'];

interface CompanyEvent {
  id: string;
  signal: string;
  threshold: number;
  symbol: string;
  moves: Partial<Record<string, number>>;
  news?: string;
  module?: string;
}

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
    const street = V.StreetLife;
    const factories = V.Finance?.industry?.factories ?? [];
    return {
      cafe,
      suspicion: cafe > 0 ? Number(V.chef_sus) || 0 : 0,
      closed: Number(cafe >= 7 && cafe < 9 && Number(V.chef_rework) <= 30),
      truth: Number(V.chef_speech === 'truth'),
      model: V.photo_known >= 2 && V.nikiSeen?.includes('photo') ? Number(V.fame?.model) || 0 : 0,
      orphanage_buyout: Number(V.Finance?.orphanage?.pc_bought_out === true || V.Finance?.orphanage?.robin_bought_out === true),
      orphanage_supplies: Number(maplebirch.get('Finance')?.donations.aid.ready('orphanage') ?? false),
      orphanage_dispute: Number(V.RobinExpansion?.bailey_defeated === true),
      bank_incident: Number(street?.heist?.entered === true),
      bank_reopened: Number(street?.heist?.entered === true && street.heist.bankClosedUntil >= 0 && Math.floor(Time.days) >= street.heist.bankClosedUntil),
      cargo_arrest: Number(street?.bounties?.completedTypes?.includes('cargo_raid') ?? false),
      casino_arrest: Number(street?.bounties?.completedTypes?.includes('chips') ?? false),
      cafe_arrest: Number(street?.bounties?.completedTypes?.includes('intimidation') ?? false),
      taxi: V.Transport?.taxi?.completed ?? 0,
      ...Object.fromEntries(Object.keys(events.supplies.street.targets).map(site => [`street_${site}`, street?.jobs?.deliveries?.[site] ?? 0])),
      ...Object.fromEntries(Object.keys(events.supplies.factory.targets).map(symbol => [`factory_${symbol}`, factories.reduce((sum, factory) => sum + (factory.supplied?.[symbol] ?? 0), 0)])),
      ...Object.fromEntries(Object.keys(events.supplies.factory.targets).map(symbol => [`default_${symbol}`, Number(factories.some(factory => factory.unpaid_customers?.includes(symbol)))]))
    };
  }

  private static get linked(): CompanyEvent[] {
    return [
      ...events.linked,
      ...Object.entries(events.supplies.factory.targets).map(([target, symbol]) => ({
        id: `default_${target}`,
        signal: `default_${target}`,
        threshold: 1,
        symbol,
        moves: { [symbol]: events.supplies.factory.defaultMove },
        news: 'factory_default'
      })),
      ...Object.entries(events.supplies).flatMap(([source, supply]) =>
        Object.entries(supply.targets).flatMap(([target, symbol]) =>
          supply.milestones.map(threshold => ({
            id: `${source}_${target}_${threshold}`,
            signal: `${source}_${target}`,
            threshold,
            symbol,
            moves: { [symbol]: supply.move },
            news: `${source}_supply`,
            module: source === 'street' ? 'StreetLife' : 'Finance'
          }))
        )
      )
    ];
  }

  public static record(market: MarketState, symbol: string, event: string, move: number, day = Math.floor(Time.days), shareChange: number | null = null): NonNullable<MarketState['news']>[number] {
    const news = (market.news ??= []);
    const notice = { day, symbol, event, move, share_change: shareChange, applied_day: day };
    news.push(notice);
    if (news.length > 12) news.shift();
    return notice;
  }

  public static capture(market: MarketState, securities: readonly Security[], content?: ParentNode): void {
    if (V.replayScene || V.statFreeze || Math.floor(Time.days) < market.day) return;
    const signals = CompanyEvents.signals;
    const linked = CompanyEvents.linked;
    market.company_events ??= events.native.filter(event => signals[event.signal] >= event.threshold).map(event => event.id);
    market.linked_events ??= linked.filter(event => signals[event.signal] >= event.threshold).map(event => event.id);
    // 先补齐历史行情，再采集今天的新消息，避免把今日事件倒算进先前交易日。
    if (market.day < Math.floor(Time.days)) return;
    const moves = (market.pending_farm_moves ??= {});
    const sources: { catalog: readonly CompanyEvent[]; seen: string[] }[] = [
      { catalog: events.native, seen: market.company_events },
      { catalog: linked, seen: market.linked_events }
    ];
    for (const { catalog, seen } of sources) {
      for (const event of catalog) {
        if ((event.module === 'StreetLife' && !maplebirch.get('StreetLife')) || (event.module === 'Transport' && !maplebirch.get('Transport'))) continue;
        if (seen.includes(event.id) || (signals[event.signal] ?? 0) < event.threshold || !securities.some(item => item.symbol === event.symbol)) continue;
        seen.push(event.id);
        for (const [symbol, move] of Object.entries(event.moves)) {
          if (move === undefined || !securities.some(item => item.symbol === symbol)) continue;
          moves[symbol] = (moves[symbol] ?? 0) + move;
          CompanyEvents.record(market, symbol, event.news ?? event.id, move).applied_day = null;
        }
      }
    }
    const seen = market.company_events;
    // 两种调查分支都由原版正文生成链接，怀疑值达到上限本身不算已经被发现。
    if (
      V.passage === 'Cliff Street' &&
      !seen.includes('cafe_investigation') &&
      content?.querySelector('.macro-link[data-passage="Chef Blackmail Car"], .macro-link[data-passage="Chef Police Journey"]')
    ) {
      seen.push('cafe_investigation');
      moves.OBC = (moves.OBC ?? 0) + terms.investigationPercent;
      CompanyEvents.record(market, 'OBC', 'cafe_investigation', terms.investigationPercent).applied_day = null;
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
