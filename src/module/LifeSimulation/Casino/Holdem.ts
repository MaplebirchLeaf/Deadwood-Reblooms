// ./src/module/LifeSimulation/Casino/Holdem.ts

import { DEFAULT_CASINO_OPTIONS, type HoldemOptions } from '../../constants/casino';
import type { PlayingCard } from './Blackjack';
import { holdemRank, settlePots, type PokerPot } from './Poker';

interface HoldemSeat {
  name: string;
  stack: number;
  cards: PlayingCard[];
  folded: boolean;
  street_bet: number;
  total: number;
  acted_at: number | null;
}

export interface HoldemState {
  joined: boolean;
  buy_in: number;
  button: number;
  phase: 'ready' | 'preflop' | 'flop' | 'turn' | 'river' | 'done';
  seats: HoldemSeat[];
  deck: PlayingCard[];
  board: PlayingCard[];
  current_bet: number;
  last_raise: number;
  pending: number[];
  pots: PokerPot[];
  fee: number;
  log: { seat: number; action: string; amount: number }[];
  showdown: boolean;
}

export const DEFAULT_HOLDEM_STATE: HoldemState = {
  joined: false,
  buy_in: DEFAULT_CASINO_OPTIONS.holdem.buyIns[0],
  button: 2,
  phase: 'ready',
  seats: [],
  deck: [],
  board: [],
  current_bet: 0,
  last_raise: 0,
  pending: [],
  pots: [],
  fee: 0,
  log: [],
  showdown: false
};

type HoldemAction = 'fold' | 'check' | 'call' | 'raise' | 'allin';

class Holdem {
  public constructor(
    private readonly core: typeof maplebirch,
    public readonly options: HoldemOptions = DEFAULT_CASINO_OPTIONS.holdem,
    public readonly watching = false
  ) {}

  public get buyIns(): readonly number[] {
    return this.options.buyIns;
  }

  public get funds(): number {
    return this.core.get('LifeSimulation')!.casino.chips;
  }

  public handRank(index: number): number {
    return holdemRank([...this.state.seats[index].cards, ...this.state.board])[0];
  }

  public get state(): HoldemState {
    return this.watching ? V.LifeSimulation.casino.watch : V.LifeSimulation.casino.holdem;
  }

  public get available(): boolean {
    return !!this.core.get('LifeSimulation')?.casino.available;
  }

  public get bigBlind(): number {
    return this.state.buy_in / this.options.bigBlindDivisor;
  }

  public get active(): boolean {
    return !['ready', 'done'].includes(this.state.phase);
  }

  public get player(): HoldemSeat | undefined {
    return this.state.seats[0];
  }

  public get canAct(): boolean {
    return !this.watching && this.available && this.active && this.state.pending[0] === 0;
  }

  public get callAmount(): number {
    return Math.min(this.player?.stack ?? 0, Math.max(0, this.state.current_bet - (this.player?.street_bet ?? 0)));
  }

  public get minimumRaise(): number {
    return this.state.current_bet < this.bigBlind ? this.bigBlind : this.state.current_bet + this.state.last_raise;
  }

  public get maximumRaise(): number {
    return (this.player?.street_bet ?? 0) + (this.player?.stack ?? 0);
  }

  public get canRaise(): boolean {
    return this.canAct && this.raiseOpen(0) && this.state.seats.some((seat, index) => index !== 0 && !seat.folded && seat.stack > 0) && this.maximumRaise > this.state.current_bet;
  }

  public get pot(): number {
    return this.state.seats.reduce((total, seat) => total + seat.total, 0);
  }

  public get canDeal(): boolean {
    return this.available && this.state.joined && !this.active && (this.player?.stack ?? 0) >= this.bigBlind;
  }

  public join(amount: number): boolean {
    if (
      !this.available ||
      (this.state.joined && (!this.watching || this.active)) ||
      !this.buyIns.includes(amount) ||
      !Number.isSafeInteger(amount / this.options.bigBlindDivisor / 2) ||
      amount <= 0 ||
      (!this.watching && this.funds < amount)
    )
      return false;
    const casino = this.core.get('LifeSimulation')!.casino;
    Object.assign(this.state, structuredClone(DEFAULT_HOLDEM_STATE), { joined: true, buy_in: amount });
    this.state.seats = (this.watching ? ['regular', 'visitor', 'guest'] : ['player', casino.tableGuest ?? 'regular', 'visitor']).map(name => ({
      name,
      stack: amount,
      cards: [],
      folded: false,
      street_bet: 0,
      total: 0,
      acted_at: null
    }));
    return true;
  }

  public deal(): boolean {
    if (!this.canDeal) return false;
    const state = this.state;
    state.button = (state.button + 1) % 3;
    state.deck = window.shuffle(window.deck());
    Object.assign(state, { board: [], phase: 'preflop', current_bet: this.bigBlind, last_raise: this.bigBlind, pots: [], fee: 0, log: [], showdown: false });
    state.seats.forEach((seat, index) => {
      if (index === 1 && !this.watching) {
        const name = this.core.get('LifeSimulation')!.casino.tableGuest ?? 'regular';
        if (seat.name !== name) {
          seat.name = name;
          seat.stack = state.buy_in;
        }
      }
      // 对手输光后由下一位客人带同档筹码入座；PC 必须自行兑回并重新买入。
      if (index > 0 && seat.stack < this.bigBlind) seat.stack = state.buy_in;
      Object.assign(seat, { cards: [], folded: false, street_bet: 0, total: 0, acted_at: null });
    });
    for (let round = 0; round < 2; round++) for (let offset = 1; offset <= 3; offset++) state.seats[(state.button + offset) % 3].cards.push(state.deck.shift()!);
    this.put((state.button + 1) % 3, this.bigBlind / 2);
    this.put((state.button + 2) % 3, this.bigBlind);
    state.pending = this.order((state.button + 3) % 3);
    this.advance();
    return true;
  }

  public act(action: HoldemAction, raiseTo = 0): boolean {
    if (!this.canAct || !this.takeAction(0, action, raiseTo)) return false;
    this.advance();
    return true;
  }

  public next(): boolean {
    if (!this.watching || !this.active || !this.state.pending.length || V.id <= 0 || V.location !== 'deadwood_casino' || V.combat === 1 || V.exposed > 0 || V.stress >= V.stressmax) return false;
    this.opponent(this.state.pending[0]);
    this.advance();
    return true;
  }

  private raiseOpen(index: number): boolean {
    const last = this.state.seats[index].acted_at;
    return last === null || (last === 0 && this.state.current_bet > 0) || this.state.current_bet - last >= this.state.last_raise;
  }

  private order(first: number): number[] {
    return [0, 1, 2].map(offset => (first + offset) % 3).filter(index => !this.state.seats[index].folded && this.state.seats[index].stack > 0);
  }

  private put(index: number, amount: number): number {
    const seat = this.state.seats[index],
      chips = Math.min(seat.stack, amount);
    seat.stack -= chips;
    seat.street_bet += chips;
    seat.total += chips;
    return chips;
  }

  private takeAction(index: number, action: HoldemAction, raiseTo = 0): boolean {
    const state = this.state,
      seat = state.seats[index];
    const previousBet = seat.street_bet,
      due = Math.max(0, state.current_bet - previousBet);
    const maximum = seat.street_bet + seat.stack;
    if (action === 'allin') {
      action = maximum > state.current_bet ? 'raise' : 'call';
      raiseTo = maximum;
    }
    if (action === 'check' && due > 0) return false;
    if (action === 'raise') {
      if (!Number.isInteger(raiseTo) || raiseTo <= state.current_bet || raiseTo > maximum || !this.raiseOpen(index)) return false;
      if (!state.seats.some((other, otherIndex) => otherIndex !== index && !other.folded && other.stack > 0)) return false;
      const minimum = state.current_bet < this.bigBlind ? this.bigBlind : state.current_bet + state.last_raise;
      if (raiseTo < minimum && raiseTo !== maximum) return false;
      const opening = state.current_bet < this.bigBlind;
      const increase = raiseTo - state.current_bet;
      this.put(index, raiseTo - seat.street_bet);
      state.current_bet = raiseTo;
      if ((opening && raiseTo >= this.bigBlind) || increase >= state.last_raise) {
        state.last_raise = opening ? raiseTo : increase;
        state.seats.forEach((other, otherIndex) => {
          if (otherIndex !== index) other.acted_at = null;
        });
      }
      state.pending = this.order((index + 1) % 3).filter(other => other !== index && (state.seats[other].acted_at === null || state.seats[other].street_bet < state.current_bet));
    } else {
      if (!['fold', 'check', 'call'].includes(action)) return false;
      if (action === 'fold') seat.folded = true;
      else if (action === 'call') this.put(index, due);
      state.pending.shift();
    }
    seat.acted_at = state.current_bet;
    state.log.push({ seat: index, action: seat.stack === 0 && !seat.folded ? 'allin' : action, amount: action === 'call' && seat.stack > 0 ? seat.street_bet - previousBet : seat.street_bet });
    return true;
  }

  private advance(): void {
    const state = this.state;
    while (this.active) {
      if (state.seats.filter(seat => !seat.folded).length === 1) {
        this.finish(false);
        break;
      }
      state.pending = state.pending.filter(index => !state.seats[index].folded && state.seats[index].stack > 0);
      const funded = state.seats.filter(seat => !seat.folded && seat.stack > 0);
      if (funded.length <= 1 && funded.every(seat => seat.street_bet >= state.current_bet)) state.pending = [];
      if (!state.pending.length) {
        if (state.phase === 'river') {
          this.finish(true);
          break;
        }
        state.deck.shift(); // 烧牌。
        const count = state.phase === 'preflop' ? 3 : 1;
        for (let n = 0; n < count; n++) state.board.push(state.deck.shift()!);
        state.phase = state.phase === 'preflop' ? 'flop' : state.phase === 'flop' ? 'turn' : 'river';
        state.seats.forEach(seat => {
          seat.street_bet = 0;
          seat.acted_at = null;
        });
        state.current_bet = 0;
        state.last_raise = this.bigBlind;
        state.pending = this.order((state.button + 1) % 3);
        continue;
      }
      const index = state.pending[0];
      if (this.watching || index === 0) break;
      this.opponent(index);
    }
  }

  private opponent(index: number): void {
    const seat = this.state.seats[index],
      state = this.state;
    const values = seat.cards.map(card => card.value).sort((a, b) => b - a);
    // 只看自己的底牌、公开公共牌和下注；不会读取 PC 的牌或未来牌。
    const rank = state.board.length ? holdemRank([...seat.cards, ...state.board]) : null;
    const strength = rank ? Math.min(0.95, 0.2 + rank[0] * 0.14 + rank[1] / 80) : values[0] === values[1] ? 0.65 + values[0] / 60 : (values[0] + values[1]) / 40;
    const due = state.current_bet - seat.street_bet,
      roll = random(1, 100) / 100;
    if (due > 0 && strength < 0.5 && due > this.bigBlind && roll > strength + 0.15) {
      this.takeAction(index, 'fold');
      return;
    }
    const target = state.current_bet + Math.max(state.last_raise, this.bigBlind * 2);
    if (
      roll < 0.12 + strength * 0.12 &&
      this.raiseOpen(index) &&
      seat.stack + seat.street_bet >= target &&
      state.seats.some((other, otherIndex) => otherIndex !== index && !other.folded && other.stack > 0)
    )
      this.takeAction(index, 'raise', target);
    else this.takeAction(index, due > 0 ? 'call' : 'check');
  }

  private finish(showdown: boolean): void {
    const state = this.state;
    const ranks = state.seats.map(seat => holdemRank([...seat.cards, ...state.board]));
    const settlement = settlePots(state.seats, ranks, state.button, this.bigBlind * 3);
    settlement.awards.forEach((award, index) => (state.seats[index].stack += award));
    Object.assign(state, { phase: 'done', pending: [], pots: settlement.pots, fee: settlement.fee, showdown });
  }

  /** 离席视为弃牌，随后结清已买入的剩余筹码；关闭营业也可兑回。 */
  public cashOut(): number {
    if (this.watching || !this.state.joined) return 0;
    if (this.active) {
      this.player!.folded = true;
      this.state.pending = this.state.pending.filter(index => index !== 0);
      this.advance();
    }
    const chips = this.player!.stack;
    Object.assign(this.state, structuredClone(DEFAULT_HOLDEM_STATE));
    return chips;
  }
}

export default Holdem;
