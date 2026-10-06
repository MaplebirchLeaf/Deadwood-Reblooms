// ./src/module/LifeSimulation/Casino/Blackjack.ts

import { DEFAULT_CARD_TRICK_STATE, DEFAULT_CASINO_OPTIONS, type BlackjackOptions, type CardTrickState } from '../../constants/casino';
import BlackjackClothes, { type BlackjackClothesState, type BlackjackSeat } from './BlackjackClothes';

export const blackjackPassage = 'Deadwood Reblooms Life Simulation Blackjack';

export interface PlayingCard {
  value: number;
  name: string;
  suits: string;
}

export interface BlackjackState {
  trick: CardTrickState;
  venue: 'arcade' | 'casino' | 'home';
  property: string | null;
  companion: string | null;
  partner: string | null;
  return_passage: string;
  deck: PlayingCard[];
  player: PlayingCard[];
  dealer: PlayingCard[];
  partner_cards: PlayingCard[];
  phase: 'ready' | 'player' | 'done';
  result: 'win' | 'loss' | 'push' | 'blackjack' | null;
  bet: number;
  paid: boolean;
  wager: 'fun' | 'strip';
  clothing: BlackjackClothesState | null;
  stripped_seats: BlackjackSeat[];
  match_lost_seats: BlackjackSeat[];
  intimacy_declined: boolean;
  /** 三人局的两位恋人，按姓名字母序保存，离开牌桌后仍由亲密场景读取。 */
  intimacy_pair: string[] | null;
}

export const DEFAULT_BLACKJACK_STATE: BlackjackState = {
  trick: clone(DEFAULT_CARD_TRICK_STATE),
  venue: 'arcade',
  property: null,
  companion: null,
  partner: null,
  return_passage: 'Arcade',
  deck: [],
  player: [],
  dealer: [],
  partner_cards: [],
  phase: 'ready',
  result: null,
  bet: DEFAULT_CASINO_OPTIONS.blackjack.bets[0],
  paid: true,
  wager: 'fun',
  clothing: null,
  stripped_seats: [],
  match_lost_seats: [],
  intimacy_declined: false,
  intimacy_pair: null
};

/** 沿用原版计分规则；A 先计 11，超出 21 时逐张改计 1。 */
export function blackjackScore(cards: readonly PlayingCard[]): number {
  let score = 0,
    aces = 0;
  for (const card of cards) {
    if (card.name === 'A') {
      score += 11;
      aces++;
    } else score += Math.min(card.value, 10);
  }
  while (score > 21 && aces-- > 0) score -= 10;
  return score;
}

class Blackjack {
  public animation: 'deal' | 'hit' | 'reveal' | null = null;
  public readonly clothes: BlackjackClothes;
  public constructor(
    private readonly core: typeof maplebirch,
    public readonly options: BlackjackOptions = DEFAULT_CASINO_OPTIONS.blackjack
  ) {
    this.clothes = new BlackjackClothes(core, () => (this.state.venue === 'home' && this.state.wager === 'strip' ? this.state.clothing : null));
  }

  public get state(): BlackjackState {
    return V.LifeSimulation.casino.blackjack;
  }

  public get bets(): readonly number[] {
    return this.state.venue === 'casino' ? this.options.bets : this.options.bets.filter(bet => bet <= 50000);
  }

  public get funds(): number {
    return this.state.venue === 'casino' ? this.core.get('LifeSimulation')!.casino.chips : V.money;
  }

  private get estate() {
    return this.core.get('VanillaPlus')?.realEstate;
  }

  public get homeOpponents() {
    const estate = this.estate;
    const property = estate?.current;
    return property && V.location === 'deadwood_home' && V.combat !== 1 && V.stress < V.stressmax
      ? estate.residentsHome(property.id).filter(profile => window.isLoveInterest(profile.id) && (profile.id !== 'Robin' || C.npc.Robin.trauma < 50))
      : [];
  }

  public get homeGroupAvailable(): boolean {
    const opponents = this.homeOpponents;
    return opponents.length === 2 && !this.estate!.householdRefusal(opponents.map(profile => profile.id));
  }

  public get arcadeAvailable(): boolean {
    return V.location === 'arcade' && V.exposed <= 0 && V.combat !== 1 && V.stress < V.stressmax && Time.hour !== 21 && ['day', 'dusk'].includes(Time.dayState);
  }

  public get available(): boolean {
    if (V.combat === 1 || V.stress >= V.stressmax) return false;
    if (this.state.venue === 'arcade') return this.arcadeAvailable;
    if (this.state.venue === 'casino') return this.core.get('LifeSimulation')?.casino.available ?? false;
    const present = this.homeOpponents.map(profile => profile.id);
    return (
      this.estate?.current?.id === this.state.property &&
      present.includes(this.state.companion ?? '') &&
      (!this.state.partner || (present.includes(this.state.partner) && !this.estate!.householdRefusal([this.state.companion!, this.state.partner])))
    );
  }

  public get playerScore(): number {
    return blackjackScore(this.state.player);
  }

  public get dealerScore(): number {
    return blackjackScore(this.state.dealer);
  }

  public get partnerScore(): number {
    return blackjackScore(this.state.partner_cards);
  }

  public get activeSeats(): BlackjackSeat[] {
    const seats: BlackjackSeat[] = this.state.partner ? ['player', 'dealer', 'partner'] : ['player', 'dealer'];
    return seats.filter(seat => !this.state.match_lost_seats.includes(seat));
  }

  public get playerEliminated(): boolean {
    return this.state.match_lost_seats.includes('player');
  }

  public get matchEnded(): boolean {
    return this.state.venue === 'home' && this.state.wager === 'strip' && !!this.state.clothing && this.activeSeats.length === 1;
  }

  public get winningSeats(): ('player' | 'dealer' | 'partner')[] {
    if (this.state.phase !== 'done') return [];
    const hands: ['player' | 'dealer' | 'partner', PlayingCard[]][] = [
      ['player', this.state.player],
      ['dealer', this.state.dealer]
    ];
    if (this.state.partner) hands.push(['partner', this.state.partner_cards]);
    const active = hands.filter(([seat]) => this.activeSeats.includes(seat));
    const scores = active.map(([, hand]) => {
      const score = blackjackScore(hand);
      return score > 21 ? -1 : score === 21 && hand.length === 2 ? 22 : score;
    });
    const highest = Math.max(...scores);
    return highest < 0 ? [] : active.filter((_, i) => scores[i] === highest).map(([seat]) => seat);
  }

  public get canStart(): boolean {
    if (this.state.venue === 'home' && this.state.wager === 'strip' && !this.state.clothing && !this.canStrip) return false;
    return this.available && !this.matchEnded && this.state.phase !== 'player' && (this.state.venue === 'home' || (this.bets.includes(this.state.bet) && this.funds >= this.state.bet));
  }

  public get canAct(): boolean {
    return this.available && this.state.phase === 'player' && !this.playerEliminated;
  }

  public get canStrip(): boolean {
    return this.available && this.state.venue === 'home' && !!this.state.companion && this.clothes.canPrepare(this.state.companion, this.state.partner);
  }

  public remainingClothes(seat: BlackjackSeat): number {
    return this.clothes.remaining(seat);
  }

  public get intimacyCandidates(): string[] {
    if (!this.available || !this.matchEnded || this.state.intimacy_declined) return [];
    return [this.state.companion, this.state.partner].filter((name): name is string => !!name && !!this.estate?.canIntimate(name, this.state.property ?? undefined));
  }

  // 家局三人局沿用 RealEstateHousehold 的关系：只有罗宾与悉尼有一条愿意一起亲近的分支，
  // 凯拉尔不肯分享，悉尼不肯与惠特尼同席。其余组合仍可同桌玩牌，但亲密时只会当场拒绝。
  private static readonly threesomePairs = ['Robin:Sydney'] as const;
  /** 两位同住恋人是否愿意三人局：都在场能上床、不互相拒绝，且属于有相应分支的组合。 */
  public get pairIntimacyReady(): boolean {
    const names = [this.state.companion, this.state.partner].filter((name): name is string => !!name).sort();
    if (this.state.venue !== 'home' || !this.matchEnded || this.state.intimacy_declined) return false;
    if (names.length !== 2 || names[0] === names[1]) return false;
    if (this.estate?.householdRefusal(names)) return false;
    if (!Blackjack.threesomePairs.some(pair => pair === names.join(':'))) return false;
    return names.every(name => this.estate?.canIntimate(name, this.state.property ?? undefined));
  }

  public declineIntimacy(): void {
    if (this.state.venue === 'home' && this.state.wager === 'strip') this.state.intimacy_declined = true;
    this.state.intimacy_pair = null;
  }

  public beginIntimacy(name: string): boolean {
    if (!this.intimacyCandidates.includes(name) || !this.estate?.meetResident(name, this.state.property!)) return false;
    this.state.intimacy_pair = null;
    this.leave();
    return true;
  }

  /** 三人局把两位恋人的姓名留到亲密场景；leave 会穿回衣物，但不清空这个记录。 */
  public beginPairIntimacy(): boolean {
    if (!this.pairIntimacyReady) return false;
    this.state.intimacy_pair = [this.state.companion!, this.state.partner!].sort();
    this.leave();
    return true;
  }

  /** 亲密场景取走这组姓名后立即清空，避免返回牌桌时把旧组合当成新的邀请。 */
  public takeIntimacyPair(): string[] | null {
    const pair = this.state.intimacy_pair;
    this.state.intimacy_pair = null;
    return pair;
  }

  public clearIntimacyPair(): void {
    this.state.intimacy_pair = null;
  }

  public setWager(wager: BlackjackState['wager']): boolean {
    if (this.state.venue !== 'home' || !this.available || this.state.phase === 'player' || this.state.wager === wager) return false;
    // 已开始的脱衣局只能继续、拒绝进一步亲密或离桌，不能在两局之间更换赌注。
    if (this.state.clothing && !this.matchEnded) return false;
    if (wager === 'strip' && !this.canStrip) return false;
    this.leave();
    this.state.wager = wager;
    return true;
  }

  public resetMatch(): void {
    if (this.state.phase === 'player' || !this.matchEnded) return;
    const wager = this.state.wager;
    this.leave();
    this.state.wager = wager;
  }

  public get payout(): number {
    if (this.state.venue === 'home') return 0;
    switch (this.state.result) {
      case 'blackjack':
        return this.state.bet * 2.5;
      case 'win':
        return this.state.bet * 2;
      case 'push':
        return this.state.bet;
      default:
        return 0;
    }
  }

  public prepare(venue: BlackjackState['venue'], companion: string | null = null, origin = 'Arcade', partner: string | null = null): boolean {
    if (
      venue === 'home' &&
      (!this.homeOpponents.some(profile => profile.id === companion) ||
        (partner && (partner === companion || !this.homeOpponents.some(profile => profile.id === partner) || this.estate!.householdRefusal([companion!, partner]))))
    )
      return false;
    if (venue !== 'home') companion = partner = null;
    if (venue === 'arcade' && !this.arcadeAvailable) return false;
    if (venue === 'casino' && !this.core.get('LifeSimulation')?.casino.available) return false;
    const property = venue === 'home' ? this.estate!.current!.id : null;
    // 同一张桌子可继续已保存的牌局，换场地或对手时清理旧牌局。
    if (venue !== this.state.venue || property !== this.state.property || companion !== this.state.companion || partner !== this.state.partner) {
      this.leave();
      this.state.intimacy_pair = null;
    }
    Object.assign(this.state, { venue, property, companion, partner, return_passage: venue === 'arcade' ? 'Arcade' : origin });
    return true;
  }

  public get bet(): number {
    return this.state.bet;
  }

  public set bet(bet: number) {
    if (this.state.venue !== 'home' && this.state.phase !== 'player' && this.bets.includes(bet) && Number.isSafeInteger(bet) && bet > 0 && bet % 2 === 0 && this.state.bet !== bet) {
      this.leave();
      this.state.bet = bet;
    }
  }

  public start(): boolean {
    if (!this.canStart) return false;
    if (this.state.venue === 'home' && this.state.wager === 'strip' && !this.state.clothing) {
      this.state.clothing = this.clothes.prepare(this.state.companion!, this.state.partner);
      if (!this.state.clothing) return false;
    }
    const deck = window.shuffle(window.deck());
    Object.assign(this.state, { deck, player: [], dealer: [], partner_cards: [], phase: 'player', result: null, paid: false, stripped_seats: [], trick: clone(DEFAULT_CARD_TRICK_STATE) });
    const hands = { player: this.state.player, dealer: this.state.dealer, partner: this.state.partner_cards };
    for (let i = 0; i < 2; i++) for (const seat of this.activeSeats) hands[seat].push(deck.shift()!);
    this.animation = 'deal';
    if (this.activeSeats.some(seat => blackjackScore(hands[seat]) === 21)) this.finish();
    else if (this.playerEliminated) this.playOpponents();
    return true;
  }

  public hit(): boolean {
    if (!this.canAct) return false;
    this.state.player.push(this.state.deck.shift()!);
    this.animation = 'hit';
    if (this.playerScore > 21) {
      if (this.activeSeats.length === 3) this.stand();
      else this.finish();
    } else if (this.playerScore === 21) this.stand();
    return true;
  }

  public stand(): boolean {
    if (!this.canAct) return false;
    this.playOpponents();
    this.animation = 'reveal';
    return true;
  }

  private playOpponents(): void {
    // 对手执行公开固定规则：所有 17 点（含软 17）停牌。
    if (this.activeSeats.includes('dealer')) while (this.dealerScore < 17) this.state.dealer.push(this.state.deck.shift()!);
    if (this.activeSeats.includes('partner')) while (this.partnerScore < 17) this.state.partner_cards.push(this.state.deck.shift()!);
    this.finish();
  }

  private finish(): void {
    this.state.phase = 'done';
    const winners = this.winningSeats;
    if (this.playerEliminated) this.state.result = null;
    else if (!winners.length || (winners.includes('player') && winners.length > 1)) this.state.result = 'push';
    else if (winners.includes('player')) this.state.result = this.playerScore === 21 && this.state.player.length === 2 ? 'blackjack' : 'win';
    else this.state.result = 'loss';
    if (this.state.venue !== 'home' || this.state.wager !== 'strip' || !this.state.clothing) return;
    if (!winners.length) return;
    for (const seat of this.activeSeats.filter(seat => !winners.includes(seat))) {
      if (this.clothes.remove(seat)) this.state.stripped_seats.push(seat);
      if (this.remainingClothes(seat) === 0) this.state.match_lost_seats.push(seat);
    }
  }

  /** 钱由原版宏写入。先消费领取标记，重绘与读档不会再次付款。 */
  public collectPayout(): number {
    if (this.state.phase !== 'done' || this.state.paid) return 0;
    this.state.paid = true;
    return this.payout;
  }

  public leave(): void {
    this.clothes.restore();
    this.state.phase = 'ready';
    this.state.trick = clone(DEFAULT_CARD_TRICK_STATE);
    this.state.result = null;
    this.state.deck = [];
    this.state.player = [];
    this.state.dealer = [];
    this.state.partner_cards = [];
    this.state.paid = true;
    this.state.wager = 'fun';
    this.state.clothing = null;
    this.state.stripped_seats = [];
    this.state.match_lost_seats = [];
    this.state.intimacy_declined = false;
    this.animation = null;
  }
}

export default Blackjack;
