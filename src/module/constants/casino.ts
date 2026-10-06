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

/** 每手牌只尝试一次小动作；公开线索与分心只属于当前手牌。 */
export interface CardTrickState {
  used: boolean;
  opponent: string;
  peeked: number | null;
  distracted: number | null;
  result: '' | 'peek' | 'distract' | 'miss' | 'noticed' | 'caught' | 'refused';
}

export const DEFAULT_CARD_TRICK_STATE: CardTrickState = { used: false, opponent: '', peeked: null, distracted: null, result: '' };

export interface CasinoOptions {
  denominations: readonly number[];
  exchanges: readonly number[];
  blackjack: BlackjackOptions;
  threeCard: ThreeCardOptions;
  holdem: HoldemOptions;
}

export const DEFAULT_CASINO_OPTIONS: CasinoOptions = {
  denominations: [1000000, 500000, 100000, 10000, 2500, 500, 100, 50, 10, 1],
  exchanges: [500, 5000, 50000, 250000, 500000, 1000000, 5000000, 10000000],
  blackjack: { bets: [1000, 5000, 25000, 50000, 100000, 500000, 1000000] },
  threeCard: { antes: [1000, 5000, 10000, 100000, 500000] },
  holdem: { buyIns: [50000, 250000, 500000, 2500000, 10000000], bigBlindDivisor: 50 }
};
