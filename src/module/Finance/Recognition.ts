// ./src/module/Finance/Recognition.ts

import type Finance from '../Finance';

export interface RecognitionState {
  awarded: Record<string, number>;
}

export default class Recognition {
  public static readonly defaults: RecognitionState = { awarded: {} };

  public constructor(private readonly finance: Finance) {}

  // 逐日补算传入实际日期，手动互动默认使用当前日期。
  public award(kind: 'business' | 'good' | 'social', key: string, amount: number, interval = 7, day = Math.floor(Time.days)): void {
    if (V.replayScene || V.statFreeze) return;
    const awarded = this.finance.state.recognition.awarded;
    if (awarded[key] != null && day - awarded[key] < interval) return;
    awarded[key] = day;
    this.finance.core.SugarCube.Wikifier.wikifyEval(`<<fame${kind} ${amount} null true>>`);
  }
}
