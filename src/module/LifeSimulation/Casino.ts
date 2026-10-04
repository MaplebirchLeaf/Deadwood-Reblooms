// ./src/module/LifeSimulation/Casino.ts

import Blackjack, { DEFAULT_BLACKJACK_STATE, type BlackjackState } from './Casino/Blackjack';
import Holdem, { DEFAULT_HOLDEM_STATE, type HoldemState } from './Casino/Holdem';
import ThreeCard, { DEFAULT_THREE_CARD_STATE, type ThreeCardState } from './Casino/ThreeCard';
import SlotMachine, { type SlotMachineState } from './Casino/SlotMachine';
import { DEFAULT_CASINO_OPTIONS, type CasinoOptions } from '../constants/casino';

export const casinoPassage = 'Deadwood Reblooms Life Simulation Casino';
export interface CasinoState {
  blackjack: BlackjackState;
  holdem: HoldemState;
  three_card: ThreeCardState;
  slots: SlotMachineState;
  chips: number;
  met_dealer: boolean;
  trained: boolean;
  shifts: number;
  good_shifts: number;
  guest_night: number;
  wren_visit: boolean;
  landry_visit: boolean;
  work_scenario: number | null;
  last_work_correct: boolean | null;
}

export const DEFAULT_CASINO_STATE: CasinoState = {
  blackjack: DEFAULT_BLACKJACK_STATE,
  holdem: DEFAULT_HOLDEM_STATE,
  three_card: DEFAULT_THREE_CARD_STATE,
  slots: { reels: [0, 1, 2], payout: 0, played: false },
  chips: 0,
  met_dealer: false,
  trained: false,
  shifts: 0,
  good_shifts: 0,
  guest_night: -1,
  wren_visit: false,
  landry_visit: false,
  work_scenario: null,
  last_work_correct: null
};

class Casino {
  public readonly blackjack: Blackjack;
  public readonly holdem: Holdem;
  public readonly threeCard: ThreeCard;
  public readonly slots = new SlotMachine();

  public constructor(
    private readonly core: typeof maplebirch,
    public readonly options: CasinoOptions = DEFAULT_CASINO_OPTIONS
  ) {
    this.blackjack = new Blackjack(core, options.blackjack);
    this.holdem = new Holdem(core, options.holdem);
    this.threeCard = new ThreeCard(core, options.threeCard);
  }

  public get state(): CasinoState {
    return V.LifeSimulation.casino;
  }

  public get open(): boolean {
    return Time.hour >= 18 || Time.hour < 4;
  }

  public get available(): boolean {
    return this.open && V.id > 0 && V.location === 'deadwood_casino' && V.exposed <= 0 && V.combat !== 1 && V.stress < V.stressmax;
  }

  public get canWork(): boolean {
    return (
      this.available &&
      (Time.hour >= 18 || Time.hour < 3) &&
      !this.holdem.active &&
      this.threeCard.state.phase !== 'player' &&
      !(this.blackjack.state.venue === 'casino' && this.blackjack.state.phase === 'player') &&
      !window.pcAreArmsBound('both') &&
      !V.worn.face.type.includes('gag') &&
      V.tiredness < 800
    );
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

  public get chips(): number {
    return this.state.chips;
  }

  private get finance() {
    return this.core.get('VanillaPlus')?.finance;
  }

  public get bankAvailable(): boolean {
    const bank = this.finance ? V.VanillaPlus.finance.bank : undefined;
    return !!bank?.opened && bank.debit_card;
  }

  public canExchange(amount: number, method: 'cash' | 'bank' = 'cash'): boolean {
    if (!this.available || !this.options.exchanges.includes(amount) || !Number.isSafeInteger(amount) || amount <= 0 || !Number.isSafeInteger(this.chips + amount)) return false;
    if (method === 'cash') return V.money >= amount;
    return method === 'bank' && this.bankAvailable && V.VanillaPlus.finance.bank.balance >= amount;
  }

  /** 现金仍由 money 宏扣除；借记卡复用金融模块的便士接口。 */
  public exchange(amount: number, method: 'cash' | 'bank' = 'cash'): boolean {
    if (!this.canExchange(amount, method)) return false;
    if (method === 'bank' && this.finance!.payFromBankPennies(amount) !== 'ok') return false;
    return this.adjustChips(amount);
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

  /** 只有柜台兑换才会清空筹码余额；重复兑换不会再次付款。 */
  public cashOut(method: 'cash' | 'bank' = 'cash'): number {
    if (method !== 'cash' && (method !== 'bank' || !this.bankAvailable)) return 0;
    this.leave();
    const amount = this.chips;
    if (method === 'bank') this.finance!.creditBankPennies(amount);
    this.state.chips = 0;
    return amount;
  }

  public enter(): void {
    V.location = 'deadwood_casino';
    V.outside = 0;
    V.bus = 'connudatus';
    const night = Time.days - (Time.hour < 4 ? 1 : 0);
    if (this.state.guest_night !== night) {
      this.state.guest_night = night;
      this.state.wren_visit = random(1, 100) <= 35;
      this.state.landry_visit = random(1, 100) <= 25;
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
    return correct ? 4000 : 3000;
  }
}

export default Casino;
