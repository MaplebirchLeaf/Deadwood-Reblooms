// ./src/module/LifeSimulation/Casino/SlotMachine.ts

export const slotSymbols = [
  { image: 'cherry', name: ['Cherries', '樱桃'], payout: 20 },
  { image: 'lemon', name: ['Lemons', '柠檬'], payout: 30 },
  { image: 'plum', name: ['Plums', '李子'], payout: 50 },
  { image: 'bell', name: ['Bells', '铃铛'], payout: 80 },
  { image: 'star', name: ['Stars', '星星'], payout: 150 },
  { image: 'seven', name: ['Sevens', '七'], payout: 500 }
] as const;

export interface SlotMachineState {
  reels: [number, number, number];
  payout: number;
  played: boolean;
}

/** 三轴各自均匀抽取六种图案，奖金含投入，216 种结果每份投入 £5，共返还 £905。 */
function slotPayout(reels: readonly number[]): number {
  if (reels.length !== 3 || reels.some(index => !Number.isInteger(index) || index < 0 || index >= slotSymbols.length)) return 0;
  if (reels.every(index => index === reels[0])) return slotSymbols[reels[0]].payout;
  return reels.filter(index => index === 0).length === 2 ? 5 : 0;
}

export default class SlotMachine {
  public animateNext = false;

  public get state(): SlotMachineState {
    return V.LifeSimulation.casino.slots;
  }

  public get available(): boolean {
    if (V.location === 'deadwood_casino') return !!maplebirch.get('LifeSimulation')?.casino.available;
    return V.location === 'arcade' && (Time.dayState === 'day' || Time.dayState === 'dusk') && Time.hour !== 21 && V.exposed <= 0 && V.stress < V.stressmax && V.combat !== 1;
  }

  public get funds(): number {
    return V.location === 'deadwood_casino' ? maplebirch.get('LifeSimulation')!.casino.chips : V.money;
  }

  public get canPlay(): boolean {
    return this.available && this.funds >= 500;
  }

  /** 这里只确定结果，钱和时间由原版宏结算，动画不接触存档。 */
  public spin(): boolean {
    if (!this.canPlay) return false;
    const reels: SlotMachineState['reels'] = [random(0, 5), random(0, 5), random(0, 5)];
    this.state.reels = reels;
    this.state.payout = slotPayout(reels);
    this.state.played = true;
    if (V.location === 'deadwood_casino') maplebirch.get('LifeSimulation')?.casino.record('slots', 500, this.state.payout * 100);
    this.animateNext = true;
    return true;
  }
}
