// ./src/compat/DoLX/Robin.ts

import type { MaplebirchCore } from '@scml-dol-maplebirch/types';

export default function adaptRobin(maplebirch: MaplebirchCore): void {
  const robin = maplebirch.get('Robin');
  if (!robin) return;
  const income = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(robin), 'income')!.get!.bind(robin);
  const sync = (Reflect.get(robin, 'sync') as () => void).bind(robin);
  const acceptSelfRent = robin.rent.acceptSelfRent.bind(robin.rent);
  // 复用当前模组收入，剥离原版固定底薪。DoLX 的摊位与咖啡馆收入仍由原生函数结算。
  const expansionIncome = () => (robin.state.asylum.status === 'admitted' ? 0 : income() - ((V.robin.stayup >= 1 ? 250 : 300) + (V.robin.moneyModifier || 0)));

  // 仅在 DoLX 环境遮蔽实例方法，原版 Robin 门面与其他版本的周结算保持各自流程。
  Object.defineProperties(robin, {
    income: {
      configurable: true,
      get: () => {
        if (robin.state.asylum.status === 'admitted') return 0;
        const standIncome = Math.max(
          0,
          Math.round(window.robinStandBaseIncome() * window.robinStandWeatherModifier() * (window.robinCafeStandModifier?.() ?? 1) - (V.robin.stayup >= 1 ? 50 : 0) + (V.robin.moneyModifier || 0))
        );
        const cafe = V.robinCafe;
        const cafeIncome = (cafe?.weekShifts ?? 0) > 0 ? ((cafe?.weekShifts ?? 0) + Math.min(cafe?.rainDays ?? 0, 2)) * (window.robinCafeShiftWage?.() ?? 0) : 0;
        return standIncome + cafeIncome + expansionIncome();
      }
    },
    sync: {
      configurable: true,
      value: () => {
        if (!V.RobinExpansion || C.npc.Robin?.init !== 1 || V.replayScene || V.statFreeze) return sync();
        const state = robin.state;
        const stand = window.ensureRobinStand();
        if (stand.fellBehind === 1 && state.self_rent) {
          state.self_rent = false;
          state.both_rent = false;
          state.rent_separated = false;
        } else if (stand.selfSufficient === 1 && !state.self_rent) {
          state.self_rent = true;
          state.rent_separated = true;
        }
        sync();
        if (state.self_rent) stand.selfSufficient = 1;
      }
    },
    settleWeek: {
      configurable: true,
      value: (nativeWeekPassed: () => void) => {
        if (!V.RobinExpansion || C.npc.Robin?.init !== 1 || V.replayScene || V.statFreeze) return nativeWeekPassed();
        (Reflect.get(robin, 'sync') as () => void)();
        const state = robin.state;
        state.week++;
        const extraIncome = robin.personalIncome - ((V.robin.stayup >= 1 ? 250 : 300) + (V.robin.moneyModifier || 0));
        let shopDividend = 0;
        if (state.asylum.status !== 'admitted') {
          shopDividend = robin.shop.settleWeek();
          state.reserve += extraIncome;
          if (!state.bailey_defeated && (state.self_rent || V.robinpaid !== 1)) {
            const owed = state.self_rent ? window.ensureRobinStand().owed : 0;
            const reserveTransfer = Math.clamp(robin.rent.due + owed - V.robinmoney, 0, state.reserve);
            state.reserve -= reserveTransfer;
            V.robinmoney += reserveTransfer;
          }
        }
        nativeWeekPassed();
        state.weekly_income = state.asylum.status === 'admitted' ? 0 : window.ensureRobinStand().lastIncome + (V.robinCafe?.lastWage ?? 0) + extraIncome + shopDividend;
        if (state.solidarity && state.reserve >= 10) {
          state.reserve -= 10;
          state.care_fund += 10;
        }
      }
    }
  });
  Object.defineProperties(robin.rent, {
    due: { configurable: true, get: () => (robin.state.bailey_defeated ? 0 : window.robinStandRent()) },
    debt: { configurable: true, get: () => Math.max(0, Number(V.robindebt) || 0) * robin.rent.due + window.ensureRobinStand().owed },
    acceptSelfRent: {
      configurable: true,
      value: () => {
        if (!acceptSelfRent()) return false;
        Object.assign(window.ensureRobinStand(), { selfSufficient: 1, owed: 0, missedWeeks: 0, fellBehind: 0 });
        return true;
      }
    }
  });
}
