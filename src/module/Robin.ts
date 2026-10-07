// ./src/module/Robin.ts

import Achievements from './Achievements';
import Module from './Module';
import { DEFAULT_ROBIN_EXPANSION_STATE, type RobinExpansionState } from './constants';
import type { RobinFacade } from './Robin/Shared';
import RobinAsylum from './Robin/Asylum';
import RobinBalloon from './Robin/Balloon';
import RobinFlowers from './Robin/Flowers';
import RobinFishing from './Robin/Fishing';
import RobinMarket from './Robin/Market';
import RobinNight from './Robin/Night';
import RobinRent from './Robin/Rent';
import RobinShop from './Robin/Shop';
import RobinTutoring from './Robin/Tutoring';

class Robin extends Module implements RobinFacade {
  public readonly rent: RobinRent;
  public readonly flowers: RobinFlowers;
  public readonly fishing: RobinFishing;
  public readonly shop: RobinShop;
  public readonly tutoring: RobinTutoring;
  public readonly balloon: RobinBalloon;
  public readonly market: RobinMarket;
  public readonly night: RobinNight;
  public readonly asylum: RobinAsylum;

  public constructor(core: typeof maplebirch) {
    super(core, 'RobinExpansion', DEFAULT_ROBIN_EXPANSION_STATE);
    this.rent = new RobinRent(core, this);
    this.flowers = new RobinFlowers(core, this);
    this.fishing = new RobinFishing(core, this);
    this.shop = new RobinShop(core, this);
    this.tutoring = new RobinTutoring(core, this);
    this.balloon = new RobinBalloon(core, this);
    this.market = new RobinMarket(core, this);
    this.night = new RobinNight(core, this);
    this.asylum = new RobinAsylum(core, this);
  }

  /** 当前存档的罗宾拓展状态。 */
  public get state(): RobinExpansionState {
    return V.RobinExpansion;
  }

  /** 罗宾自己持有的现金加上本模组的储备金，单位英镑。 */
  public get funds(): number {
    return Math.max(0, Number(V.robinmoney) || 0) + this.state.reserve;
  }

  public get income(): number {
    const state = this.state;
    if (state.asylum.status === 'admitted') return 0;
    const stall = state.shop ? state.lemonade + state.chocolate : Time.season === 'winter' ? state.chocolate : state.lemonade;
    // 旧神殿线的周津贴由本模块统一结算，避免两个模组重复给罗宾发收入。
    const temple = this.core.get('RobinTemple') ? V.RobinTemple : undefined;
    const templeGrace = Number(temple?.grace);
    const templeIncome = temple && ['member', 'approved', 'promised'].includes(temple.stage) && Number.isFinite(templeGrace) ? Math.max(0, Math.min(100, templeGrace)) * 10 : 0;
    // 基础店铺增收已扣除店租、水电、原料和临时帮工，正式员工的增收与工资单独入账。
    return (
      (V.robin.stayup >= 1 ? 250 : 300) +
      (V.robin.moneyModifier || 0) +
      stall * 1200 +
      this.tutoring.income +
      templeIncome +
      (state.shop
        ? 1500 +
          this.shop.staffSales -
          this.shop.staffWages +
          this.flowers.salesEstimate +
          (this.core.get('Orchard')?.freshSupplySales ?? 0) +
          (state.shopPopcorn ? 150 : 0) +
          (state.shopBalloons ? 75 : 0)
        : 0) +
      this.balloon.income
    );
  }

  /** 罗宾是否可正常互动。门面与子系统共用。 */
  public get available(): boolean {
    return C.npc.Robin?.init === 1 && !V.robinmissing && V.robin.timer.hurt === 0 && this.state.asylum.status !== 'admitted';
  }

  /** 营业中的冒险互动按性欲和主动程度判断，普通约会不使用这个门槛。 */
  public get canTease(): boolean {
    return this.available && window.isLoveInterest('Robin') && C.npc.Robin.trauma < 50 && C.npc.Robin.lust >= 60 && C.npc.Robin.dom >= 70;
  }

  /** 能否动用储备金完成一笔开销。 */
  public canSpend(amount: number, protectNextRent = true): boolean {
    return this.flowers.canSpend(amount, protectNextRent);
  }

  /** 把柠檬水或巧克力摊位升一级。usePcMoney 为真时改由 PC 的现金垫付并记入 pcLoan。 */
  public upgrade(kind: 'lemonade' | 'chocolate', usePcMoney = false): boolean {
    const state = this.state;
    if (!this.available || state[kind] >= 2 || state.topics[kind] <= state[kind]) return false;
    const cost = state[kind] === 0 ? 600 : 400;
    if (usePcMoney) {
      if ((Number(V.money) || 0) < cost * 100) return false;
      V.money -= cost * 100;
      state.pcLoan += cost;
    } else if (!this.flowers.spend(cost)) return false;
    state[kind]++;
    return true;
  }

  /** 把 PC 垫付的钱还给玩家，清空 pcLoan。 */
  public repayPcLoan(): boolean {
    const amount = this.state.pcLoan;
    if (!this.available || amount <= 0 || !this.flowers.spend(amount)) return false;
    V.money += amount * 100;
    this.state.pcLoan = 0;
    return true;
  }

  private sync(): void {
    if (!V.RobinExpansion || C.npc.Robin?.init !== 1) return;
    const state = this.state;
    if (state.week < 0) state.week = Math.floor(Time.days / 7);
    if (state.selfRent && !state.rentSeparated) {
      if (V.robinpaid === 1) V.rentmoney /= 2;
      state.rentSeparated = true;
    }

    const asylum = state.asylum;
    if (asylum.checkedDay !== Time.days) {
      const elapsedDays = asylum.checkedDay < 0 ? 1 : Math.max(1, Time.days - asylum.checkedDay);
      asylum.checkedDay = Time.days;
      if (asylum.status === 'home' && (V.robinmissing === 0 || !V.robinmissing) && C.npc.Robin.trauma >= 95) {
        if (asylum.severeDays === 0) asylum.warningDay = Time.days;
        asylum.severeDays += elapsedDays;
        if (asylum.severeDays >= 2 && Time.days > asylum.warningDay) {
          asylum.status = 'admitted';
          asylum.admittedDay = Time.days;
          asylum.daysConfined = 0;
          asylum.met = false;
          asylum.plan = 0;
          asylum.planDay = -1;
          asylum.visitDay = -1;
          asylum.savedDebt = Math.max(0, Number(V.robindebt) || 0);
          V.robindebt = -1;
        }
      } else if (asylum.status === 'home') asylum.severeDays = 0;
      // 原版 PC 可经评估出院，罗宾没有这条既有路径。此处只记录留院的创伤，
      // 罗宾不会在玩家未参与时凭空完成逃离。
      if (asylum.status === 'admitted' && Time.days > asylum.admittedDay && elapsedDays > 0) {
        const previousPeriods = Math.floor(asylum.daysConfined / 3);
        asylum.daysConfined += elapsedDays;
        const periods = Math.floor(asylum.daysConfined / 3) - previousPeriods;
        C.npc.Robin.trauma = Math.min(100, C.npc.Robin.trauma + periods * 2);
        C.npc.Robin.dom = Math.max(0, C.npc.Robin.dom - periods);
      }
      if (asylum.status === 'recovering' && C.npc.Robin.trauma < 60) asylum.status = 'home';
    }

    if (asylum.status === 'admitted') {
      // 同座、同行与原版重逢标记不能让留院中的罗宾出现在学校。
      V.robinhistory = 'missing';
      V.withRobin = undefined;
      V.robinReunionScene = undefined;
    }

    if (state.tutor) {
      // 原版 Robin 17:30 至 18:30 的日程已转到家教。PC 未陪同的上课日照常推进，
      // 而共同授课已写入 tutorDay，因此不会重复计算。逐日回补睡眠等跨日推进。
      const lastFinishedDay = Time.hour >= 19 ? Time.days : Time.days - 1;
      for (let day = state.tutorDay + 1; day <= lastFinishedDay; day++) {
        const date = new DateTime(Time.date).addDays(day - Time.days);
        if (this.available && C.npc.Robin.trauma < 80 && Time.isSchoolDay(date)) {
          state.tutorLessons++;
          state.tutorSubject = (state.tutorLessons - 1) % 3;
        }
        state.tutorDay = day;
      }
    }
  }

  private settleWeek(vanillaWeekPassed: () => void): void {
    if (!V.RobinExpansion || C.npc.Robin?.init !== 1) {
      vanillaWeekPassed();
      return;
    }
    this.sync();
    const state = this.state;
    const vanillaIncome = (V.robin.stayup >= 1 ? 250 : 300) + (V.robin.moneyModifier || 0);
    const robinRent = this.rent.due;
    state.week++;
    state.weeklyIncome = this.income;
    if (state.asylum.status === 'admitted') {
      const cashBefore = V.robinmoney;
      V.robindebt = -1;
      vanillaWeekPassed();
      V.robinmoney = cashBefore;
      return;
    }
    this.flowers.settle();
    this.shop.settle();
    // 原版先扣房租、检查债务，再发周收入，先入账才可用于当周房租。
    V.robinmoney += Math.max(0, state.weeklyIncome - vanillaIncome);
    if (V.robinpaid !== 1 || state.selfRent) {
      const reserveTransfer = Math.min(state.reserve, Math.max(0, robinRent - V.robinmoney));
      state.reserve -= reserveTransfer;
      V.robinmoney += reserveTransfer;
    }
    if (state.selfRent && V.robinpaid === 1) {
      V.robinmoney -= robinRent;
      if (V.robinmoney < 0) {
        V.robinmoney = 0;
        V.robindebt = Math.max(0, V.robindebt) + 1;
      }
    } else if (V.robinpaid !== 1) V.robinmoney += 400 - robinRent;
    const beforeVanilla = V.robinmoney;
    // 原版用 <= 0 判定欠租，现金恰好 £400 时会误记欠债并可能立刻触发惩罚。
    const exactRent = V.robinpaid !== 1 && beforeVanilla === 400;
    if (exactRent) V.robinmoney++;
    const expected = (V.robinpaid === 1 ? beforeVanilla : Math.max(0, beforeVanilla - 400)) + vanillaIncome;
    vanillaWeekPassed();
    if (exactRent && V.robinmoney < 4000) V.robinmoney = Math.max(0, V.robinmoney - 1);
    state.reserve += Math.max(0, expected - 4000);
    if (state.solidarity && state.reserve >= 10) {
      state.reserve -= 10;
      state.careFund += 10;
    }
  }

  public preInit(): void {
    super.preInit();
    Achievements.add(this.core, 'Robin');
    this.core.on(':passagestart', () => this.sync(), 'Robin Expansion');
    this.core.dynamic.regTimeEvent('onDay', ':deadwood-reblooms-robin-asylum-daily', {
      action: () => {
        this.sync();
        // 特质按当前存档的关系阶段生效。罗宾留院或失踪时没有每日陪伴收益。
        if (V.RobinExpansion && this.available && this.state.selfRent) window.statChange.stress(this.state.bothRent || this.state.baileyDefeated ? -250 : -100, 1);
      },
      exact: true
    });
    this.core.once(':storyready', () => {
      // onWeek 在原版 weekPassed() 后触发，房租抵扣须在原版周结算前入账。
      const vanillaWeekPassed = window.weekPassed;
      if (vanillaWeekPassed) window.weekPassed = () => this.settleWeek(vanillaWeekPassed);
      const getLocation = window.getRobinLocation;
      window.getRobinLocation = () => {
        const location = getLocation();
        if (
          location === 'orphanage' &&
          !V.robinlocationoverride?.during?.includes(Time.hour) &&
          Weather.precipitation === 'rain' &&
          Time.isWeekEnd() &&
          Time.hour >= 9 &&
          (Time.hour < 16 || (Time.hour === 16 && Time.minute >= 30)) &&
          C.npc.Robin.init === 1 &&
          !V.robinmissing &&
          C.npc.Robin.trauma < 80 &&
          (Time.season === 'winter' ? (V.RobinExpansion?.chocolate ?? 0) >= 1 : (V.RobinExpansion?.lemonade ?? 0) >= 1)
        ) {
          T.robin_location = Time.season === 'winter' ? 'park' : 'beach';
          return T.robin_location;
        }
        if (
          V.RobinExpansion?.tutor &&
          location === 'orphanage' &&
          Time.schoolDay &&
          ((Time.hour === 17 && Time.minute >= 30) || (Time.hour === 18 && Time.minute < 30)) &&
          V.robin.timer.hurt === 0 &&
          C.npc.Robin.trauma < 80
        ) {
          T.robin_location = 'tutor';
          return 'tutor';
        }
        if (
          V.RobinExpansion?.shop &&
          location === 'orphanage' &&
          (Time.hour > 18 || (Time.hour === 18 && Time.minute >= 30)) &&
          Time.hour < 21 &&
          V.robin.timer.hurt === 0 &&
          C.npc.Robin.trauma < 80
        ) {
          T.robin_location = 'shop';
          return 'shop';
        }
        return location;
      };
    });
  }
}

export default Robin;
