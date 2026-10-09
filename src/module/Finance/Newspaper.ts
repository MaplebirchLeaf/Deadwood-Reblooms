// ./src/module/Finance/Newspaper.ts

import terms from '../../assets/finance/newspaper.json';
import type Finance from '../Finance';
import type { FinanceState } from '../Finance';

export interface NewspaperState {
  street_day: number;
  street_passage: string | null;
  return_passage: string | null;
  report: {
    issued_day: number;
    quote_day: number | null;
    quotes: { symbol: string; price: number; change: number | null }[];
    news: NonNullable<FinanceState['market']['news']>;
  } | null;
}

export default class Newspaper {
  public readonly terms = terms;
  public static readonly defaults: NewspaperState = { street_day: -1, street_passage: null, return_passage: null, report: null };
  private static readonly streetLinks: Record<string, string> = {
    'High Street': '.macro-link[data-passage="Shopping Centre"], .macro-link[data-passage="Office Lobby"], .macro-link[data-passage="Office New Location"]',
    'Danube Street': '.macro-link[data-passage="Spa"], .macro-link[data-passage="Spa Lock"]'
  };

  public constructor(private readonly finance: Finance) {}

  private get state(): NewspaperState {
    return V.Finance.newspaper;
  }

  public get day(): number {
    const start = Time.startDate;
    return Math.floor((Time.date.timeStamp - start.timeStamp + start.hour * 3600 + start.minute * 60 + start.second) / 86400);
  }

  public get readToday(): boolean {
    return this.state.report?.issued_day === this.day;
  }

  public get available(): boolean {
    return V.combat !== 1 && !V.replayScene && !V.statFreeze && !V.possessed && V.exposed <= 0 && V.stress < V.stressmax && V.arousal < V.arousalmax;
  }

  public get streetAvailable(): boolean {
    if (!this.available || Time.hour < terms.streetStartHour || Time.hour >= terms.streetEndHour) return false;
    if (V.passage === 'Deadwood Reblooms Newspaper Seller') {
      return this.state.street_day === this.day && this.state.street_passage !== null && this.state.street_passage === this.state.return_passage;
    }
    const selector = Newspaper.streetLinks[V.passage];
    return !!selector && !!document.getElementById('passage-content')?.querySelector(selector);
  }

  public get counterAvailable(): boolean {
    return this.available && this.finance.margin.open && V.passage === 'Deadwood Reblooms Financial Centre Securities';
  }

  public read(source: 'street' | 'counter' | 'loft'): boolean {
    if (!this.available || this.readToday) return false;
    if (source === 'street') {
      if (V.passage !== 'Deadwood Reblooms Newspaper Seller' || !this.streetAvailable || V.money < terms.price) return false;
    } else if (source === 'counter') {
      if (!this.counterAvailable) return false;
    } else if (source !== 'loft' || V.passage !== 'Orphanage Loft Reading Nook 2' || V.phase !== 'newspaper' || !V.daily.reading_nook) return false;

    const { market } = this.finance.state;
    const day = this.day;
    const history = market.history.filter(record => record.day < day);
    const latest = history.at(-1);
    const previous = history.at(-2);
    const quotes = this.finance.securities
      .filter(item => !latest || latest.prices[item.symbol] !== undefined)
      .map(item => {
        const price = latest?.prices[item.symbol] ?? market.previous_prices[item.symbol];
        const previousPrice = previous?.prices[item.symbol] ?? 0;
        return { symbol: item.symbol, price, change: latest && previousPrice > 0 ? (price / previousPrice - 1) * 100 : null };
      });
    if (source === 'street') this.finance.core.SugarCube.Wikifier.wikifyEval(`<<money ${-terms.price} "newspaper">>`);
    this.state.report = { issued_day: day, quote_day: latest?.day ?? null, quotes, news: clone((market.news ?? []).filter(item => item.day < day).slice(-3)) };
    return true;
  }
}
