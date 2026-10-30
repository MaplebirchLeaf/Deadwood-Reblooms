// ./src/module/Robin/Partnership.ts

import Partnership from '../Finance/Partnership';
import type { RobinFacade } from './Shared';

export default class RobinPartnership extends Partnership {
  public constructor(
    core: typeof maplebirch,
    private readonly robin: RobinFacade
  ) {
    super(core, () => robin.state.investment);
  }

  public override settle(day = Math.floor(Time.days)): void {
    super.settle(day);
    this.collect();
  }

  /** 罗宾领取的分红或归还的垫款转回个人储备，不留在营业账里。 */
  public collect(): void {
    if (V.statFreeze || V.replayScene || V.frozenValues || this.state.partner_cash <= 0) return;
    this.robin.state.reserve += this.state.partner_cash / 100;
    this.state.partner_cash = 0;
  }
}
