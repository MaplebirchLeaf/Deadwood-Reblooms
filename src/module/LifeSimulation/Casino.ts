// ./src/module/LifeSimulation/Casino.ts

import Blackjack, { DEFAULT_BLACKJACK_STATE, type BlackjackState } from './Casino/Blackjack';
import Holdem, { DEFAULT_HOLDEM_STATE, type HoldemState } from './Casino/Holdem';
import ThreeCard, { DEFAULT_THREE_CARD_STATE, type ThreeCardState } from './Casino/ThreeCard';
import SlotMachine, { type SlotMachineState } from './Casino/SlotMachine';
import { DEFAULT_CASINO_OPTIONS, type CasinoOptions, type CardTrickState } from '../constants/casino';

export const casinoPassage = 'Deadwood Reblooms Life Simulation Casino';
export interface CasinoState {
  blackjack: BlackjackState;
  holdem: HoldemState;
  watch: HoldemState;
  three_card: ThreeCardState;
  slots: SlotMachineState;
  chips: number;
  suspicion: number;
  cheating_caught: number;
  banned_night: number;
  bribe_night: number;
  bribe_result: 'accepted' | 'refused' | null;
  trained: boolean;
  shifts: number;
  good_shifts: number;
  guest_night: number;
  atmosphere: number;
  statistics: {
    rounds: number;
    staked: number;
    paid: number;
    biggest_win: number;
    biggest_loss: number;
    games: Record<string, number>;
    exchanged: number;
    redeemed: number;
    bank_day: number;
    bank_in: number;
    bank_out: number;
    night: number;
    night_profit: number;
    best_night_profit: number;
    win_streak: number;
    best_streak: number;
    wren_hands: number;
    wren_profit: number;
  };
  wren_visit: boolean;
  landry_visit: boolean;
  work_scenario: number | null;
  last_work_correct: boolean | null;
  last_chat_night: number;
  chat_topic: '' | 'work' | 'past' | 'gambling' | 'off_duty';
  chat_reply: '' | 'listen' | 'joke' | 'pressure' | 'apologise';
}

export const DEFAULT_CASINO_STATE: CasinoState = {
  blackjack: DEFAULT_BLACKJACK_STATE,
  holdem: DEFAULT_HOLDEM_STATE,
  watch: clone(DEFAULT_HOLDEM_STATE),
  three_card: DEFAULT_THREE_CARD_STATE,
  slots: { reels: [0, 1, 2], payout: 0, played: false },
  chips: 0,
  suspicion: 0,
  cheating_caught: 0,
  banned_night: -1,
  bribe_night: -1,
  bribe_result: null,
  trained: false,
  shifts: 0,
  good_shifts: 0,
  guest_night: -1,
  atmosphere: 0,
  statistics: {
    rounds: 0,
    staked: 0,
    paid: 0,
    biggest_win: 0,
    biggest_loss: 0,
    games: {},
    exchanged: 0,
    redeemed: 0,
    bank_day: -1,
    bank_in: 0,
    bank_out: 0,
    night: -1,
    night_profit: 0,
    best_night_profit: 0,
    win_streak: 0,
    best_streak: 0,
    wren_hands: 0,
    wren_profit: 0
  },
  wren_visit: false,
  landry_visit: false,
  work_scenario: null,
  last_work_correct: null,
  last_chat_night: -1,
  chat_topic: '',
  chat_reply: ''
};

class Casino {
  public readonly blackjack: Blackjack;
  public readonly holdem: Holdem;
  public readonly watch: Holdem;
  public readonly threeCard: ThreeCard;
  public readonly slots = new SlotMachine();

  public constructor(
    private readonly core: typeof maplebirch,
    public readonly options: CasinoOptions = DEFAULT_CASINO_OPTIONS
  ) {
    this.blackjack = new Blackjack(core, options.blackjack);
    this.holdem = new Holdem(core, options.holdem);
    this.watch = new Holdem(core, options.holdem, true);
    this.threeCard = new ThreeCard(core, options.threeCard);
  }

  public get state(): CasinoState {
    return V.LifeSimulation.casino;
  }

  public get open(): boolean {
    return Time.hour >= 18 || Time.hour < 4;
  }

  public get night(): number {
    return Time.days - (Time.hour < 4 ? 1 : 0);
  }

  public get barred(): boolean {
    return this.state.banned_night === this.night;
  }

  private get present(): boolean {
    return this.open && V.id > 0 && V.location === 'deadwood_casino' && V.exposed <= 0 && V.combat !== 1 && V.stress < V.stressmax;
  }

  public get available(): boolean {
    return this.present && !this.barred;
  }

  public get canReply(): boolean {
    return this.present && this.state.work_scenario === null && !V.worn.face.type.includes('gag');
  }

  public get canWork(): boolean {
    return (
      this.available &&
      (C.npc.Marlow?.rage ?? 0) < 10 &&
      !(this.state.bribe_night === this.night && this.state.bribe_result === 'accepted') &&
      (Time.hour >= 18 || Time.hour < 3) &&
      !this.holdem.active &&
      this.threeCard.state.phase !== 'player' &&
      !(this.blackjack.state.venue === 'casino' && this.blackjack.state.phase === 'player') &&
      !window.pcAreArmsBound('both') &&
      !V.worn.face.type.includes('gag') &&
      V.tiredness < 800
    );
  }

  public get canTalk(): boolean {
    return this.canReply && this.state.last_chat_night !== this.state.guest_night;
  }

  public get bribeCost(): number {
    return 10000 + this.state.cheating_caught * 5000;
  }

  public get canOfferBribe(): boolean {
    return this.canReply && this.barred && C.npc.Marlow.init === 1 && this.state.bribe_night !== this.night;
  }

  public bribe(): boolean {
    if (!this.canOfferBribe || V.money < this.bribeCost) return false;
    this.state.bribe_night = this.night;
    const npc = C.npc.Marlow;
    const familiar = npc && (npc.love >= 10 || this.state.good_shifts >= 3);
    if (!familiar || npc.rage >= 20 || this.state.cheating_caught > 2) {
      this.state.bribe_result = 'refused';
      return true;
    }
    V.money -= this.bribeCost;
    this.state.banned_night = -1;
    this.state.bribe_result = 'accepted';
    this.state.suspicion = Math.min(100, this.state.suspicion + 10);
    return true;
  }

  public get wrenPresent(): boolean {
    return this.available && this.state.wren_visit && [3, 5].includes(Time.weekDay) && Time.hour >= 22 && C.npc.Wren?.init === 1 && C.npc.Wren.state === 'active' && !V.wrenHeist;
  }

  public get landryPresent(): boolean {
    return this.available && this.state.landry_visit && [1, 4].includes(Time.weekDay) && Time.hour >= 20 && Time.hour < 22 && C.npc.Landry?.init === 1 && C.npc.Landry.state === 'active';
  }

  public get tableGuest(): string | null {
    return this.wrenPresent ? 'Wren' : null;
  }

  private get table(): Blackjack | Holdem | ThreeCard | undefined {
    switch (V.passage) {
      case 'Deadwood Reblooms Life Simulation Blackjack':
        return this.blackjack.state.venue === 'casino' ? this.blackjack : undefined;
      case 'Deadwood Reblooms Life Simulation Holdem':
        return this.holdem;
      case 'Deadwood Reblooms Life Simulation Three Card':
        return this.threeCard;
    }
  }

  public get trick(): CardTrickState | undefined {
    return this.table?.state.trick;
  }

  private get target(): number {
    const game = this.table;
    if (!game) return -1;
    if (game === this.blackjack) return 1;
    return (game as Holdem | ThreeCard).state.seats.findIndex((seat, index) => index > 0 && !seat.folded);
  }

  private get distractionTarget(): number {
    if (this.table !== this.holdem) return this.target;
    return this.holdem.state.seats.findIndex((seat, index) => index > 0 && !seat.folded && seat.stack > 0);
  }

  public get opponent(): string {
    const game = this.table;
    if (this.trick?.used) return this.trick.opponent;
    if (game === this.blackjack) return 'Marlow';
    return game ? ((game as Holdem | ThreeCard).state.seats[this.target]?.name ?? '') : '';
  }

  public get canPeek(): boolean {
    return !!this.table?.canAct && !this.trick!.used && this.target > 0 && !window.pcAreArmsBound('both');
  }

  public get canDistract(): boolean {
    return !!this.table?.canAct && !this.trick!.used && this.distractionTarget > 0 && !V.worn.face.type.includes('gag');
  }

  public get trickDifficulty(): number {
    return 400 + Math.floor(this.state.suspicion / 10) * 100 + (['Wren', 'Marlow'].includes(this.opponent) ? 200 : 0);
  }

  public get distractionDifficulty(): number {
    const name = this.table === this.holdem ? this.holdem.state.seats[this.distractionTarget]?.name : this.opponent;
    return (name === 'Wren' ? 6000 : 4000) + Math.floor(this.state.suspicion / 20) * 2000;
  }

  /** 每手牌共用一次机会，线索不改变牌堆，分心只影响对手的下一次行动。 */
  public attempt(action: 'peek' | 'distract', success: boolean): boolean {
    if (action === 'peek' ? !this.canPeek : action !== 'distract' || !this.canDistract) return false;
    const game = this.table!,
      trick = game.state.trick,
      target = action === 'peek' ? this.target : this.distractionTarget;
    trick.opponent = game === this.blackjack ? 'Marlow' : (game as Holdem | ThreeCard).state.seats[target].name;
    trick.used = true;
    if (action === 'distract') {
      trick.result = game === this.blackjack ? 'refused' : success ? 'distract' : 'miss';
      if (trick.result === 'distract') trick.distracted = target;
      return true;
    }
    this.state.suspicion = Math.min(100, this.state.suspicion + (success ? 10 : 25));
    if (this.state.suspicion < 100 && (success || this.state.suspicion < 60)) {
      trick.result = success ? 'peek' : 'noticed';
      if (success) trick.peeked = target;
      else this.displease(1);
      return true;
    }
    // 先按原牌桌规则弃牌结算，再设置禁玩，未下注的筹码仍能取回。
    if (game === this.blackjack) {
      this.record('blackjack', game.state.bet, 0);
      Object.assign(game.state, { phase: 'done', result: 'loss', paid: true });
    } else if (game === this.threeCard) this.threeCard.act('fold');
    else this.holdem.act('fold');
    trick.result = 'caught';
    this.state.cheating_caught++;
    this.displease(5);
    if (this.state.cheating_caught >= 2) this.state.banned_night = this.night;
    return true;
  }

  private displease(amount: number): void {
    const npc = C.npc.Marlow;
    if (!npc) return;
    npc.love = Math.max(0, npc.love - amount);
    npc.rage = Math.min(30, (npc.rage ?? 0) + amount);
  }

  public get chips(): number {
    return this.state.chips;
  }

  public get chipStacks(): { value: number; count: number }[] {
    let remaining = this.chips;
    return this.options.denominations.flatMap(value => {
      const count = Math.floor(remaining / value);
      remaining %= value;
      return count > 0 ? [{ value, count }] : [];
    });
  }

  private get finance() {
    return this.core.get('Finance');
  }

  public get bankAvailable(): boolean {
    const bank = this.finance ? V.Finance.bank : undefined;
    return !!bank?.opened && bank.debit_card;
  }

  public canExchange(amount: number, method: 'cash' | 'bank' = 'cash'): boolean {
    if (!this.available || !this.options.exchanges.includes(amount) || !Number.isSafeInteger(amount) || amount <= 0 || !Number.isSafeInteger(this.chips + amount)) return false;
    if (method === 'cash') return V.money >= amount;
    return method === 'bank' && this.bankAvailable && V.Finance.bank.balance >= amount;
  }

  /** 现金仍由 money 宏扣除，借记卡复用金融模块的便士接口。 */
  public exchange(amount: number, method: 'cash' | 'bank' = 'cash'): boolean {
    if (!this.canExchange(amount, method)) return false;
    if (method === 'bank' && this.finance!.payFromBankPennies(amount) !== 'ok') return false;
    if (!this.adjustChips(amount)) return false;
    this.state.statistics.exchanged += amount;
    if (method === 'bank') this.bankTransfer(amount, false);
    return true;
  }

  /** 下注与领奖共用账户，不允许透支或产生小数便士。 */
  public adjustChips(amount: number): boolean {
    const balance = this.chips + amount;
    if (!Number.isSafeInteger(amount) || !Number.isSafeInteger(balance) || balance < 0) return false;
    this.state.chips = balance;
    return true;
  }

  /** 离席结清牌桌，剩余筹码保留在账户中。 */
  public leave(): void {
    this.adjustChips(this.holdem.cashOut());
    this.threeCard.leave();
    this.adjustChips(this.threeCard.collectPayout());
    if (this.blackjack.state.venue === 'casino') {
      this.adjustChips(this.blackjack.collectPayout());
      this.blackjack.leave();
    }
  }

  /** 只有柜台兑换才会清空筹码余额，重复兑换不会再次付款。 */
  public cashOut(method: 'cash' | 'bank' = 'cash'): number {
    if (method !== 'cash' && (method !== 'bank' || !this.bankAvailable)) return 0;
    this.leave();
    const amount = this.chips;
    if (method === 'bank') this.finance!.creditBankPennies(amount);
    this.state.chips = 0;
    this.state.statistics.redeemed += amount;
    if (method === 'bank' && amount > 0) this.bankTransfer(amount, true);
    return amount;
  }

  /** 只在手牌或转轮真正结算时记账。买入、换筹码和取回本金不是赢利。 */
  public record(game: 'blackjack' | 'holdem' | 'three_card' | 'slots', stake: number, payout: number, opponent = ''): void {
    if (!Number.isSafeInteger(stake) || !Number.isSafeInteger(payout) || stake < 0 || payout < 0) return;
    const stats = this.state.statistics;
    stats.rounds++;
    stats.staked += stake;
    stats.paid += payout;
    stats.games[game] = (stats.games[game] ?? 0) + 1;
    const profit = payout - stake;
    stats.biggest_win = Math.max(stats.biggest_win, profit);
    stats.biggest_loss = Math.max(stats.biggest_loss, -profit);
    if (stats.night !== this.night) {
      stats.night = this.night;
      stats.night_profit = 0;
      stats.win_streak = 0;
    }
    stats.night_profit += profit;
    stats.best_night_profit = Math.max(stats.best_night_profit, stats.night_profit);
    // 连胜只计算付过赌注的牌局，平局和输局中断，转轮不参与牌局连胜。
    if (game !== 'slots' && stake > 0) {
      stats.win_streak = profit > 0 ? stats.win_streak + 1 : 0;
      stats.best_streak = Math.max(stats.best_streak, stats.win_streak);
    }
    if (opponent === 'Wren') {
      stats.wren_hands++;
      stats.wren_profit += profit;
    }
  }

  /** 银行仅看到柜台转账，不会据此推断客人的现金输赢。 */
  private bankTransfer(amount: number, incoming: boolean): void {
    const stats = this.state.statistics;
    if (stats.bank_day !== Time.days) {
      stats.bank_day = Time.days;
      stats.bank_in = stats.bank_out = 0;
    }
    if (incoming) stats.bank_in += amount;
    else stats.bank_out += amount;
  }

  public enter(): void {
    V.location = 'deadwood_casino';
    V.outside = 0;
    V.bus = 'connudatus';
    const night = this.night;
    if (this.state.guest_night !== night) {
      this.state.guest_night = night;
      this.state.suspicion = 0;
      this.state.cheating_caught = 0;
      this.state.wren_visit = random(1, 100) <= 35;
      this.state.landry_visit = random(1, 100) <= 25;
      this.state.atmosphere = random(0, 9);
    }
  }

  public beginWork(): boolean {
    if (!this.canWork || !this.state.trained || this.state.work_scenario !== null) return false;
    this.state.work_scenario = random(0, 2);
    this.state.last_work_correct = null;
    return true;
  }

  public finishWork(choice: number): number {
    if (!this.canWork || this.state.work_scenario === null || ![0, 1].includes(choice)) return 0;
    const correct = choice === [0, 1, 0][this.state.work_scenario];
    Object.assign(this.state, { work_scenario: null, last_work_correct: correct, shifts: this.state.shifts + 1, good_shifts: this.state.good_shifts + (correct ? 1 : 0) });
    if (correct && C.npc.Marlow) C.npc.Marlow.rage = Math.max(0, (C.npc.Marlow.rage ?? 0) - 2);
    return correct ? 4000 : 3000;
  }
}

export default Casino;
