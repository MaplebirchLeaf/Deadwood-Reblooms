// ./src/module/LifeSimulation/Casino/ThreeCard.ts

import { DEFAULT_CASINO_OPTIONS, type ThreeCardOptions } from '../../constants/casino';
import type { PlayingCard } from './Blackjack';
import { compareHands, threeCardRank } from './Poker';

interface ThreeSeat {
  name: string;
  cards: PlayingCard[];
  seen: boolean;
  folded: boolean;
  total: number;
}

export interface ThreeCardState {
  phase: 'ready' | 'player' | 'done';
  ante: number;
  stake: number;
  rounds: number;
  seats: ThreeSeat[];
  winners: number[];
  payout: number;
  paid: boolean;
  fee: number;
  log: { seat: number; action: string; amount: number }[];
  compared: number[];
  showdown: boolean;
}

export const DEFAULT_THREE_CARD_STATE: ThreeCardState = {
  phase: 'ready',
  ante: DEFAULT_CASINO_OPTIONS.threeCard.antes[0],
  stake: DEFAULT_CASINO_OPTIONS.threeCard.antes[0],
  rounds: 0,
  seats: [],
  winners: [],
  payout: 0,
  paid: true,
  fee: 0,
  log: [],
  compared: [],
  showdown: false
};

class ThreeCard {
  public constructor(
    private readonly core: typeof maplebirch,
    public readonly options: ThreeCardOptions = DEFAULT_CASINO_OPTIONS.threeCard
  ) {}
  public get antes(): readonly number[] {
    return this.options.antes;
  }

  public get funds(): number {
    return this.core.get('LifeSimulation')!.casino.chips;
  }

  public handRank(index: number): number {
    return threeCardRank(this.state.seats[index].cards)[0];
  }

  public get state(): ThreeCardState {
    return V.LifeSimulation.casino.three_card;
  }

  public get available(): boolean {
    return !!this.core.get('LifeSimulation')?.casino.available;
  }

  public get pot(): number {
    return this.state.seats.reduce((total, seat) => total + seat.total, 0);
  }

  public get callCost(): number {
    return this.state.stake * (this.state.seats[0]?.seen ? 2 : 1);
  }

  public get compareCost(): number {
    return this.callCost * 2;
  }

  public get canStart(): boolean {
    return this.available && this.state.phase !== 'player' && this.antes.includes(this.state.ante) && this.funds >= this.state.ante;
  }

  public get canAct(): boolean {
    return this.available && this.state.phase === 'player';
  }

  public get canRaise(): boolean {
    return this.canAct && this.state.stake < this.state.ante * 8 && this.funds >= this.callCost * 2;
  }

  public get ante(): number {
    return this.state.ante;
  }

  public set ante(ante: number) {
    if (this.state.phase !== 'player' && this.antes.includes(ante) && Number.isSafeInteger(ante) && ante > 0)
      Object.assign(this.state, structuredClone(DEFAULT_THREE_CARD_STATE), { ante, stake: ante });
  }

  public start(): boolean {
    if (!this.canStart) return false;
    const state = this.state,
      deck = window.shuffle(window.deck());
    Object.assign(state, structuredClone(DEFAULT_THREE_CARD_STATE), { phase: 'player', ante: state.ante, stake: state.ante, paid: false });
    state.seats = ['player', this.core.get('LifeSimulation')!.casino.tableGuest ?? 'regular', 'visitor'].map(name => ({ name, cards: [], seen: false, folded: false, total: state.ante }));
    for (let round = 0; round < 3; round++) for (const seat of state.seats) seat.cards.push(deck.shift()!);
    return true;
  }

  /** 返回本次需从筹码账户扣除的金额；-1 表示拒绝操作，0 可为免费查看。 */
  public act(action: 'look' | 'call' | 'raise' | 'compare' | 'fold', target = 1): number {
    if (!this.canAct) return -1;
    const state = this.state,
      player = state.seats[0];
    if (action === 'look') {
      if (player.seen) return -1;
      player.seen = true;
      return 0;
    }
    if (action === 'fold') {
      player.folded = true;
      state.log.push({ seat: 0, action, amount: 0 });
      this.finish();
      return 0;
    }
    if (!['call', 'raise', 'compare'].includes(action)) return -1;
    const cost = action === 'call' ? this.callCost : this.callCost * 2;
    if (this.funds < cost || (action === 'raise' && !this.canRaise)) return -1;
    if (action === 'compare' && (!player.seen || ![1, 2].includes(target) || state.seats[target].folded)) return -1;
    player.total += cost;
    if (action === 'raise') state.stake *= 2;
    state.log.push({ seat: 0, action, amount: cost });
    if (action === 'compare') {
      const other = state.seats[target];
      const wins = compareHands(threeCardRank(player.cards), threeCardRank(other.cards)) > 0;
      (wins ? other : player).folded = true;
      state.compared.push(target);
      if (!wins || state.seats.filter(seat => !seat.folded).length === 1) {
        this.finish();
        return cost;
      }
    }
    this.opponents();
    return cost;
  }

  private opponents(): void {
    const state = this.state;
    state.rounds++;
    for (let i = 1; i < 3; i++) {
      const seat = state.seats[i];
      if (seat.folded) continue;
      if (!seat.seen && random(1, 100) <= 55) seat.seen = true;
      const rank = seat.seen ? threeCardRank(seat.cards) : null;
      const roll = random(1, 100);
      if (rank && rank[0] === 0 && state.stake > state.ante && roll > 45) {
        seat.folded = true;
        state.log.push({ seat: i, action: 'fold', amount: 0 });
        continue;
      }
      const raise = state.stake < state.ante * 8 && roll < (rank && rank[0] >= 2 ? 22 : 6);
      if (raise) state.stake *= 2;
      const cost = state.stake * (seat.seen ? 2 : 1);
      seat.total += cost;
      state.log.push({ seat: i, action: raise ? 'raise' : 'call', amount: cost });
    }
    if (state.seats.filter(seat => !seat.folded).length === 1 || state.rounds >= 10) {
      state.showdown = state.rounds >= 10;
      this.finish();
    }
  }

  private finish(): void {
    const state = this.state,
      active = state.seats.flatMap((seat, i) => (seat.folded ? [] : [i]));
    const ranks = state.seats.map(seat => threeCardRank(seat.cards));
    state.winners = active.filter(index => active.every(other => compareHands(ranks[index], ranks[other]) >= 0));
    state.fee = Math.min(Math.floor(this.pot * 0.05), state.ante * 3);
    state.payout = state.winners.includes(0) ? Math.ceil((this.pot - state.fee) / state.winners.length) : 0;
    state.phase = 'done';
  }

  public collectPayout(): number {
    if (this.state.phase !== 'done' || this.state.paid) return 0;
    this.state.paid = true;
    return this.state.payout;
  }

  public leave(): void {
    if (this.state.phase === 'player') {
      this.state.seats[0].folded = true;
      this.finish();
    }
  }
}

export default ThreeCard;
