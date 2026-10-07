// ./src/module/LifeSimulation/Casino/Poker.ts

import type { PlayingCard } from './Blackjack';

export type HandRank = number[];
export function compareHands(a: HandRank, b: HandRank): number {
  for (let i = 0; i < Math.max(a.length, b.length); i++) {
    const difference = (a[i] ?? 0) - (b[i] ?? 0);
    if (difference) return difference;
  }
  return 0;
}

function groups(cards: readonly PlayingCard[]) {
  const values = cards.map(card => card.value).sort((a, b) => b - a);
  const counts = new Map<number, number>();
  for (const value of values) counts.set(value, (counts.get(value) ?? 0) + 1);
  return { values, sets: [...counts].sort((a, b) => b[1] - a[1] || b[0] - a[0]), flush: cards.every(card => card.suits === cards[0].suits) };
}

function fiveCardRank(cards: readonly PlayingCard[]): HandRank {
  const { values, sets, flush } = groups(cards);
  const unique = [...new Set(values)];
  const straight = unique.length === 5 ? (unique[0] - unique[4] === 4 ? unique[0] : unique.join(',') === '14,5,4,3,2' ? 5 : 0) : 0;
  if (flush && straight) return [8, straight];
  if (sets[0][1] === 4) return [7, sets[0][0], sets[1][0]];
  if (sets[0][1] === 3 && sets[1][1] === 2) return [6, sets[0][0], sets[1][0]];
  if (flush) return [5, ...values];
  if (straight) return [4, straight];
  if (sets[0][1] === 3) return [3, sets[0][0], ...sets.slice(1).map(([value]) => value)];
  if (sets[0][1] === 2 && sets[1][1] === 2) return [2, sets[0][0], sets[1][0], sets[2][0]];
  if (sets[0][1] === 2) return [1, sets[0][0], ...sets.slice(1).map(([value]) => value)];
  return [0, ...values];
}

/** 从两张底牌和公共牌中选出最强五张，允许完全使用公共牌。 */
export function holdemRank(cards: readonly PlayingCard[]): HandRank {
  if (cards.length < 5) return [0, ...cards.map(card => card.value).sort((a, b) => b - a)];
  let best: HandRank = [];
  for (let a = 0; a < cards.length - 4; a++)
    for (let b = a + 1; b < cards.length - 3; b++)
      for (let c = b + 1; c < cards.length - 2; c++)
        for (let d = c + 1; d < cards.length - 1; d++)
          for (let e = d + 1; e < cards.length; e++) {
            const rank = fiveCardRank([cards[a], cards[b], cards[c], cards[d], cards[e]]);
            if (compareHands(rank, best) > 0) best = rank;
          }
  return best;
}

/** 三张牌的常规牌型：豹子 > 顺金 > 金花 > 顺子 > 对子 > 单张，A23 最小顺子。 */
export function threeCardRank(cards: readonly PlayingCard[]): HandRank {
  const { values, sets, flush } = groups(cards);
  const straight = sets.length === 3 ? (values[0] - values[2] === 2 ? values[0] : values.join(',') === '14,3,2' ? 3 : 0) : 0;
  if (sets[0][1] === 3) return [5, sets[0][0]];
  if (flush && straight) return [4, straight];
  if (flush) return [3, ...values];
  if (straight) return [2, straight];
  if (sets[0][1] === 2) return [1, sets[0][0], sets[1][0]];
  return [0, ...values];
}

/** 杂色 235 只克制豹子，与其余牌型仍按普通单张比较。 */
export function compareThreeCardHands(a: HandRank, b: HandRank): number {
  if (a[0] === 0 && a[1] === 5 && a[2] === 3 && a[3] === 2 && b[0] === 5) return 1;
  if (b[0] === 0 && b[1] === 5 && b[2] === 3 && b[3] === 2 && a[0] === 5) return -1;
  return compareHands(a, b);
}

export interface PokerPot {
  amount: number;
  winners: number[];
  fee: number;
  returned: boolean;
}

/** 每层底池只让出资且未弃牌的座位争夺，未被跟注的筹码退回，不抽水。 */
export function settlePots(seats: readonly { total: number; folded: boolean }[], ranks: HandRank[], button: number, feeCap: number) {
  const awards = seats.map(() => 0),
    pots: PokerPot[] = [];
  const levels = [...new Set(seats.map(seat => seat.total).filter(total => total > 0))].sort((a, b) => a - b);
  let previous = 0,
    charged = 0;
  for (const level of levels) {
    const contributors = seats.flatMap((seat, index) => (seat.total >= level ? [index] : []));
    const amount = (level - previous) * contributors.length;
    previous = level;
    const eligible = contributors.filter(index => !seats[index].folded);
    const returned = contributors.length === 1;
    let winners = returned ? contributors : eligible.filter(index => eligible.every(other => compareHands(ranks[index], ranks[other]) >= 0));
    // 全部弃牌者出资的高层只会在异常终止中出现，仍退给出资者，避免吞筹码。
    if (!winners.length) winners = contributors;
    winners.sort((a, b) => ((a - button - 1 + seats.length) % seats.length) - ((b - button - 1 + seats.length) % seats.length));
    const fee = returned ? 0 : Math.min(Math.floor(amount * 0.05), feeCap - charged);
    charged += fee;
    const share = Math.floor((amount - fee) / winners.length),
      odd = (amount - fee) % winners.length;
    winners.forEach((seat, index) => (awards[seat] += share + (index < odd ? 1 : 0)));
    pots.push({ amount, winners, fee, returned });
  }
  return { awards, pots, fee: charged };
}
