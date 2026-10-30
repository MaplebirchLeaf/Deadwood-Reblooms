// ./src/migrations/Robin.ts

import Partnership from '../module/Finance/Partnership';
import { DEFAULT_ROBIN_EXPANSION_STATE, type RobinExpansionState } from '../module/constants/robin';
import type { RobinFacade } from '../module/Robin/Shared';

type Migration = ReturnType<typeof maplebirch.tool.migration.create>;

/** 旧饮品店出资转为合伙垫款，房租与个人储备只拆分一次。 */
export default function migration(runner: Migration, robin: RobinFacade): void {
  runner.add('*', '2.5.8', (data, utils) => {
    utils.fill(data, { ...clone(DEFAULT_ROBIN_EXPANSION_STATE) });
    const state = data as unknown as RobinExpansionState;
    if (state.self_rent && !state.rent_separated) {
      if (V.robinpaid === 1) V.rentmoney /= 2;
      state.rent_separated = true;
    }
    const old = state.investment as typeof state.investment & { migrated?: boolean; invested_total?: number; returned_total?: number; dividends_total?: number };
    if (state.shop && !old.migrated) {
      const investment = clone(Partnership.defaults);
      investment.agreed = true;
      investment.contributed = old.invested_total ?? 0;
      investment.returned = old.returned_total ?? 0;
      investment.dividends = old.dividends_total ?? 0;
      investment.loans.pc = Math.max(0, investment.contributed - investment.returned);
      // 下一期房租仍留在个人储备，不作为店铺周转金。
      const rent_reserve = Math.min(state.reserve, Math.max(0, robin.rent.due - Math.max(0, Number(V.robinmoney) || 0)));
      investment.treasury = Math.max(0, Math.round((state.reserve - rent_reserve) * 100));
      investment.loans.partner = investment.treasury;
      investment.next_settlement = Math.floor(Time.days) + 7;
      state.reserve = rent_reserve;
      state.investment = investment;
    }
    for (const field of ['migrated', 'invested_total', 'returned_total', 'dividends_total']) utils.remove(data, `investment.${field}`);
  });
}
