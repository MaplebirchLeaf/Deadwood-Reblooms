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

  /** 旧版已投入的资本转为可偿还垫款，原有分红与回收记录保留。只迁移一次。 */
  public migrate(): void {
    if (!this.robin.state.shop || this.state.migrated || V.statFreeze || V.replayScene || V.frozenValues) return;
    const old = this.state as typeof this.state & { invested_total?: number; returned_total?: number; dividends_total?: number };
    const state = clone(Partnership.defaults);
    state.agreed = state.migrated = true;
    state.contributed = old.invested_total ?? 0;
    state.returned = old.returned_total ?? 0;
    state.dividends = old.dividends_total ?? 0;
    state.loans.pc = Math.max(0, state.contributed - state.returned);
    // 迁移前仍留够下一期个人房租，不把受保护的钱锁进营业账。
    const rentReserve = Math.min(this.robin.state.reserve, Math.max(0, this.robin.rent.due - Math.max(0, Number(V.robinmoney) || 0)));
    state.treasury = Math.max(0, Math.round((this.robin.state.reserve - rentReserve) * 100));
    state.loans.partner = state.treasury;
    state.next_settlement = Math.floor(Time.days) + 7;
    this.robin.state.reserve = rentReserve;
    this.robin.state.investment = state;
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
