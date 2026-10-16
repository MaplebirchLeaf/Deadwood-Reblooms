// ./src/module/Finance/PrivateCards.ts

import Holdem, { DEFAULT_HOLDEM_STATE, type HoldemState } from '../LifeSimulation/Casino/Holdem';
import type Finance from '../Finance';

export const privateCardsPassage = 'Deadwood Reblooms Company Cards';

export interface PrivateCardsState {
  active: boolean;
  closed: boolean;
  day: number;
  mode: 'play' | 'watch';
  hands: number;
  bank_payment: boolean;
  table: HoldemState;
}

/** 贝利家的四位固定客人共用扑克规则，筹码、座位与结束状态独立于赌场。 */
export default class PrivateCards extends Holdem {
  public static readonly defaults: PrivateCardsState = {
    active: false,
    closed: false,
    day: -1,
    mode: 'watch',
    hands: 0,
    bank_payment: false,
    table: clone(DEFAULT_HOLDEM_STATE)
  };

  public constructor(private readonly finance: Finance) {
    super(finance.core);
  }

  public get session(): PrivateCardsState {
    return this.finance.company.avery.state.cards;
  }

  public override get state(): HoldemState {
    return this.session.table;
  }

  public override get watching(): boolean {
    return this.session.mode === 'watch';
  }

  protected override get names(): string[] {
    return [...(this.watching ? [] : ['player']), 'Avery', 'Bailey', 'Leighton', 'Quinn'];
  }

  protected override get feeCap(): number {
    return 0;
  }

  protected override get refill(): boolean {
    return false;
  }

  public override get tableSize(): number {
    return this.names.length;
  }

  public override get funds(): number {
    const bank = this.finance.state.bank;
    return Math.max(V.money, bank.opened && bank.debit_card ? bank.balance : 0);
  }

  public get present(): boolean {
    return !V.replayScene && !V.statFreeze && !V.possessed && V.combat !== 1 && ['Avery', 'Bailey', 'Leighton', 'Quinn'].every((name, index) => V.NPCList?.[index]?.fullDescription === name);
  }

  public override get available(): boolean {
    return this.present && this.session.active && [privateCardsPassage, 'Avery Cards 6'].includes(this.finance.core.passage.title) && V.exposed <= 0 && V.stress < V.stressmax;
  }

  public override get canAct(): boolean {
    return super.canAct && !window.pcAreArmsBound('any');
  }

  public override get canDeal(): boolean {
    return super.canDeal && this.session.hands < 1 && (this.watching || !window.pcAreArmsBound('any'));
  }

  public enter(): boolean {
    if (!this.present || this.finance.core.passage.title !== 'Avery Cards 6') return false;
    if (this.session.active) return true;
    if (this.session.closed && this.session.day === Math.floor(Time.days)) return false;
    Object.assign(this.session, clone(PrivateCards.defaults), { active: true, day: Math.floor(Time.days) });
    return true;
  }

  public override join(amount: number): boolean {
    if ((!this.watching && window.pcAreArmsBound('any')) || !super.join(amount)) return false;
    this.state.button = this.names.indexOf('Bailey') - 1;
    if (this.watching) return true;
    const bank = this.finance.state.bank;
    const bankPayment = bank.opened && bank.debit_card && bank.balance >= amount && (bank.payment_method === 'debit' || V.money < amount);
    if (bankPayment && this.finance.payFromBankPennies(amount) !== 'ok') {
      Object.assign(this.state, clone(DEFAULT_HOLDEM_STATE));
      return false;
    }
    this.session.bank_payment = bankPayment;
    this.finance.core.SugarCube.Wikifier.wikifyEval(`<<money -${amount} 'privateCards' {recordOnly: ${bankPayment}}>>`);
    return true;
  }

  public override deal(): boolean {
    if (!super.deal()) return false;
    this.session.hands++;
    return true;
  }

  protected override record(stake: number, payout: number): void {
    this.finance.core.get('LifeSimulation')?.casino.record('holdem', stake, payout, '', 'private');
  }

  /** 中断与主动离席均只兑回一次，旁观者没有买入，也不会领取桌上的钱。 */
  public close(): boolean {
    if (!this.session.active || V.replayScene || V.statFreeze) return false;
    const amount = this.watching ? 0 : super.cashOut();
    if (amount > 0) {
      if (this.session.bank_payment) this.finance.creditBankPennies(amount);
      this.finance.core.SugarCube.Wikifier.wikifyEval(`<<money ${amount} 'privateCards' {recordOnly: ${this.session.bank_payment}}>>`);
    }
    this.session.active = false;
    this.session.closed = true;
    this.session.day = Math.floor(Time.days);
    this.finance.refreshMoneyUI();
    return true;
  }
}
