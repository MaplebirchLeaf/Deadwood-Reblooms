import Blackjack, { DEFAULT_BLACKJACK_STATE, type BlackjackState } from '../LifeSimulation/Casino/Blackjack';
import Holdem, { DEFAULT_HOLDEM_STATE, type HoldemState } from '../LifeSimulation/Casino/Holdem';
import type SmugglerPub from './SmugglerPub';

export const pubCardPassages = { blackjack: 'Deadwood Smuggler Pub Blackjack', holdem: 'Deadwood Smuggler Pub Holdem' };
type PubGame = keyof typeof pubCardPassages;
interface PubCardsState {
  mode: PubGame | null;
  revision: number;
  blackjack: BlackjackState;
  holdem: HoldemState;
}

class PubBlackjack extends Blackjack {
  public constructor(private readonly cards: SmugglerCards) {
    super(cards.pub.core, { bets: [100, 500, 1000] });
  }

  public override get state(): BlackjackState {
    return this.cards.state.blackjack;
  }

  public override get available(): boolean {
    return this.cards.atTable('blackjack');
  }
}

class PubHoldem extends Holdem {
  public constructor(private readonly cards: SmugglerCards) {
    super(cards.pub.core, { buyIns: [500, 1000, 2000], seats: [3, 4], bigBlindDivisor: 50 });
  }

  public override get state(): HoldemState {
    return this.cards.state.holdem;
  }

  public override get available(): boolean {
    return this.cards.atTable('holdem');
  }

  public override get funds(): number {
    return V.money;
  }

  protected override get names(): string[] {
    return Array.from({ length: this.tableSize }, (_, index) => (index === 0 ? 'player' : index === 1 ? 'regular' : `guest_${index}`));
  }

  protected override get feeCap(): number {
    return 0;
  }

  protected override get refill(): boolean {
    return false;
  }

  // 酒馆不增加赌场账目或人物好感，使用同一套发牌、下注和边池规则。
  protected override record(): void {}
}

/** 现金放在独立的酒馆存档中，点击结算一次，重绘与读档只展示牌局。 */
export default class SmugglerCards {
  public static readonly defaults: PubCardsState = {
    mode: null,
    revision: 0,
    blackjack: { ...clone(DEFAULT_BLACKJACK_STATE), venue: 'pub', bet: 100, return_passage: 'Deadwood Smuggler Pub' },
    holdem: { ...clone(DEFAULT_HOLDEM_STATE), buy_in: 500, table_size: 3 }
  };
  public readonly blackjack: PubBlackjack;
  public readonly holdem: PubHoldem;
  public constructor(public readonly pub: SmugglerPub) {
    this.blackjack = new PubBlackjack(this);
    this.holdem = new PubHoldem(this);
  }

  public get state(): PubCardsState {
    return this.pub.state.cards;
  }

  public atTable(game: PubGame): boolean {
    return this.state.mode === game && this.pub.core.passage.title === pubCardPassages[game] && this.pub.gamblingAvailable;
  }

  public enter(game: PubGame): boolean {
    if (!Object.hasOwn(pubCardPassages, game) || this.pub.core.passage.title !== 'Deadwood Smuggler Pub' || !this.pub.gamblingAvailable) return false;
    this.close();
    this.state.mode = game;
    this.state.revision++;
    return true;
  }

  public action(game: PubGame, action: string, amount: number, revision: number): boolean {
    if (revision !== this.state.revision || this.state.mode !== game || this.pub.core.passage.title !== pubCardPassages[game]) return false;
    if (action === 'cashout') return this.close();
    if (!this.atTable(game)) return false;
    let accepted = false;
    let minutes = 0;
    if (game === 'blackjack') {
      const table = this.blackjack;
      if (action === 'bet') {
        const old = table.bet;
        table.bet = amount;
        accepted = old !== table.bet;
      } else if (['start', 'hit', 'stand'].includes(action)) {
        accepted = action === 'start' ? table.start() : action === 'hit' ? table.hit() : table.stand();
        if (accepted) {
          if (action === 'start') this.money(-table.bet);
          this.money(table.collectPayout());
          minutes = action === 'start' ? 2 : 1;
        }
      }
    } else {
      const table = this.holdem;
      switch (action) {
        case 'seats': {
          const old = table.tableSize;
          table.tableSize = amount;
          accepted = old !== table.tableSize;
          break;
        }
        case 'join':
          accepted = table.join(amount);
          if (accepted) this.money(-amount);
          break;
        case 'deal':
          accepted = table.deal();
          minutes = 2;
          break;
        case 'fold':
        case 'check':
        case 'call':
        case 'raise':
        case 'allin':
          accepted = table.act(action, amount);
          minutes = 1;
          break;
      }
    }
    if (!accepted) return false;
    this.state.revision++;
    if (minutes) this.pub.core.SugarCube.Wikifier.wikifyEval(`<<pass ${minutes}>>`);
    return true;
  }

  private money(amount: number): void {
    if (amount) this.pub.core.SugarCube.Wikifier.wikifyEval(`<<money ${amount}>>`);
  }

  /** 主动离桌或强制转场都清算一次，未完的二十一点作弃局，扑克已下注的钱留在底池。 */
  public close(): boolean {
    if (!this.state.mode || V.replayScene || V.statFreeze || V.frozenValues) return false;
    const game = this.state.mode;
    this.state.mode = null;
    this.state.revision++;
    if (game === 'blackjack') {
      this.money(this.blackjack.collectPayout());
      this.blackjack.leave();
    } else {
      this.money(this.holdem.cashOut());
      this.holdem.state.table_size = 3;
      this.holdem.state.buy_in = 500;
    }
    return true;
  }
}
