// ./src/module/constants/casino.ts

/** 金额统一使用便士；配置只决定档位，不写入正在进行的牌局。 */
export interface BlackjackOptions {
  bets: readonly number[];
}

export interface ThreeCardOptions {
  antes: readonly number[];
}

export interface HoldemOptions {
  buyIns: readonly number[];
  /** 买入金额与大盲的比值，小盲为大盲的一半。 */
  bigBlindDivisor: number;
}

export interface CasinoOptions {
  exchanges: readonly number[];
  blackjack: BlackjackOptions;
  threeCard: ThreeCardOptions;
  holdem: HoldemOptions;
}

export const DEFAULT_CASINO_OPTIONS: CasinoOptions = {
  exchanges: [500, 5000, 50000, 250000, 500000, 1000000],
  blackjack: { bets: [5000, 25000, 50000] },
  threeCard: { antes: [1000, 5000, 10000] },
  holdem: { buyIns: [50000, 250000, 500000], bigBlindDivisor: 50 }
};
