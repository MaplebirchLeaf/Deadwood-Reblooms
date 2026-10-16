import type Casino from '../Casino';

/** 赔率均为净赢倍数，结算另退本金，本桌不使用随机倍率。 */
export const sicBoBets = [
  ...['small', 'big', 'odd', 'even'].map(key => ({ key, odds: 1 })),
  { key: 'triple', odds: 30 },
  ...Array.from({ length: 6 }, (_, i) => ({ key: `triple_${i + 1}`, odds: 180 })),
  ...Array.from({ length: 6 }, (_, i) => ({ key: `single_${i + 1}`, odds: 0 })),
  ...Array.from({ length: 14 }, (_, i) => ({ key: `total_${i + 4}`, odds: [60, 30, 18, 12, 8, 7, 6, 6, 7, 8, 12, 18, 30, 60][i] }))
];

export interface SicBoState {
  bets: Record<string, number>;
  dice: number[];
  stake: number;
  payout: number;
}

export default class SicBo {
  public static readonly defaults: SicBoState = { bets: {}, dice: [], stake: 0, payout: 0 };
  public animateNext = false;
  public readonly bets = sicBoBets;
  public readonly limit = 10000000;

  public constructor(private readonly casino: Casino) {}

  public get state(): SicBoState {
    return this.casino.state.sic_bo;
  }

  public get stake(): number {
    return Object.values(this.state.bets).reduce((sum, amount) => sum + amount, 0);
  }

  public get canRoll(): boolean {
    return this.casino.available && !V.replayScene && !V.statFreeze && !V.possessed && this.stake > 0 && this.stake <= this.limit && this.casino.chips >= this.stake;
  }

  /** 布置赌注时不扣筹码，重复选择同一格撤回，开骰后一次扣付并清空布局。 */
  public place(key: string, amount: number): boolean {
    if (!this.casino.available || V.replayScene || V.statFreeze || V.possessed || !sicBoBets.some(bet => bet.key === key) || !this.casino.options.blackjack.bets.includes(amount)) return false;
    if (this.state.bets[key] === amount) delete this.state.bets[key];
    else {
      if (this.stake - (this.state.bets[key] ?? 0) + amount > Math.min(this.limit, this.casino.chips)) return false;
      this.state.bets[key] = amount;
    }
    return true;
  }

  /** 单点按出现次数净赢 1/2/3 倍，豹子使大小、单双全部输，合计点数照常结算。 */
  public roll(): boolean {
    if (!this.canRoll) return false;
    const dice = Array.from({ length: 3 }, () => random(1, 6));
    const total = dice.reduce((sum, value) => sum + value, 0);
    const triple = dice.every(value => value === dice[0]);
    const stake = this.stake;
    let payout = 0;
    for (const { key, odds } of sicBoBets) {
      const amount = this.state.bets[key] ?? 0;
      const [kind, value] = key.split('_');
      if (kind === 'single') {
        const count = dice.filter(die => die === Number(value)).length;
        if (count) payout += amount * (count + 1);
      } else {
        const won =
          kind === 'total'
            ? total === Number(value)
            : kind === 'triple'
              ? triple && (value === undefined || dice[0] === Number(value))
              : !triple && (key === 'small' ? total <= 10 : key === 'big' ? total >= 11 : key === 'odd' ? total % 2 === 1 : total % 2 === 0);
        if (won) payout += amount * (odds + 1);
      }
    }
    if (!this.casino.adjustChips(payout - stake)) return false;
    Object.assign(this.state, { bets: {}, dice, stake, payout });
    this.casino.record('sic_bo', stake, payout);
    this.animateNext = true;
    return true;
  }
}
