import Module from './Module';
import type VanillaPlus from './VanillaPlus';

type BalloonRoute = 'none' | 'cooperate' | 'compete' | 'resolved';
type AsylumStatus = 'home' | 'admitted' | 'recovering';
type ShopStage = 'none' | 'planning' | 'applied' | 'site' | 'inspected' | 'permitted';

interface RobinExpansionState {
  lemonade: number;
  chocolate: number;
  tutor: boolean;
  shop: boolean;
  // 线索先在对应场景出现，再把话题带回罗宾房间。摊位用等级记录每次改造的下一条线索。
  topics: {
    lemonade: number;
    chocolate: number;
    tutor: boolean;
    shop: boolean;
  };
  shopStage: ShopStage;
  shopApplicationDay: number;
  shopInspectionDay: number;
  shopBankSupported: boolean;
  pcLoan: number;
  shopStock: number;
  balloon: BalloonRoute;
  balloonWins: number;
  balloonDay: number;
  reserve: number;
  careFund: number;
  weeklyIncome: number;
  week: number;
  selfRent: boolean;
  rentSeparated: boolean;
  bothRent: boolean;
  rebellion: boolean;
  victories: number;
  fightResolutionDay: number;
  allies: boolean;
  solidarity: boolean;
  baileyDefeated: boolean;
  meteorDay: number;
  swimDay: number;
  tutorDay: number;
  tutorLessons: number;
  tutorSubject: number;
  marketDay: number;
  marketSales: number;
  shopDay: number;
  nightDay: number;
  nightOutcomeDay: number;
  asylum: {
    status: AsylumStatus;
    checkedDay: number;
    severeDays: number;
    admittedDay: number;
    daysConfined: number;
    met: boolean;
    plan: number;
    planDay: number;
    visitDay: number;
    warningDay: number;
    warningVisitDay: number;
    savedDebt: number;
  };
}

class RobinExpansion extends Module {
  static readonly variables: RobinExpansionState = {
    lemonade: 0,
    chocolate: 0,
    tutor: false,
    shop: false,
    topics: {
      lemonade: 0,
      chocolate: 0,
      tutor: false,
      shop: false
    },
    shopStage: 'none',
    shopApplicationDay: -1,
    shopInspectionDay: -1,
    shopBankSupported: false,
    pcLoan: 0,
    shopStock: 0,
    balloon: 'none',
    balloonWins: 0,
    balloonDay: -1,
    reserve: 0,
    careFund: 0,
    weeklyIncome: 0,
    week: -1,
    selfRent: false,
    rentSeparated: false,
    bothRent: false,
    rebellion: false,
    victories: 0,
    fightResolutionDay: -1,
    allies: false,
    solidarity: false,
    baileyDefeated: false,
    meteorDay: -1,
    swimDay: -1,
    tutorDay: -1,
    tutorLessons: 0,
    tutorSubject: 0,
    marketDay: -1,
    marketSales: 0,
    shopDay: -1,
    nightDay: -1,
    nightOutcomeDay: -1,
    asylum: {
      status: 'home',
      checkedDay: -1,
      severeDays: 0,
      admittedDay: -1,
      daysConfined: 0,
      met: false,
      plan: 0,
      planDay: -1,
      visitDay: -1,
      warningDay: -1,
      warningVisitDay: -1,
      savedDebt: 0
    }
  };

  public constructor(core: typeof maplebirch) {
    super(core, 'RobinExpansion', RobinExpansion.variables);
  }

  public get state(): RobinExpansionState {
    return V.RobinExpansion;
  }

  public get funds(): number {
    return Math.max(0, Number(V.robinmoney) || 0) + this.state.reserve;
  }

  public get income(): number {
    const state = this.state;
    if (state.asylum.status === 'admitted') return 0;
    const stall = state.shop ? state.lemonade + state.chocolate : Time.season === 'winter' ? state.chocolate : state.lemonade;
    // 店铺的增收已经扣除每周的店租、水电和原料损耗。
    return (V.robin.stayup >= 1 ? 250 : 300) + (V.robin.moneyModifier || 0) + stall * 1200 + this.tutorIncome + (state.shop ? 1500 : 0) + this.balloonIncome;
  }

  public get tutorIncome(): number {
    return this.state.tutor && this.state.tutorLessons > 0 && Time.schoolTerm ? (this.state.tutorLessons >= 6 ? 60 : 40) : 0;
  }

  public get balloonIncome(): number {
    if (V.balloonStand?.robin?.status !== 'helped') return 0;
    return this.state.balloon === 'cooperate' ? 50 : this.state.balloon === 'resolved' ? 25 : 0;
  }

  public get bothRentIncomeRequirement(): number {
    const pcRent = (Math.max(0, Number(V.rentmoney) || 0) + Math.max(0, Number(V.babyRent) || 0)) / 100;
    return Math.max(5000, Math.ceil(pcRent) + 1000);
  }

  public get robinRent(): number {
    if (this.state.baileyDefeated) return 0;
    const pcRentPennies = Math.max(0, Number(V.rentmoney) || 0);
    const ownSharePennies = V.robinpaid === 1 && !this.state.selfRent ? pcRentPennies / 2 : pcRentPennies;
    return Math.ceil(ownSharePennies / 100);
  }

  public get robinRentDebt(): number {
    return Math.max(0, Number(V.robindebt) || 0) * this.robinRent;
  }

  private get vanillaPlus(): VanillaPlus | undefined {
    return this.core.get('VP') as VanillaPlus | undefined;
  }

  private get robinAvailable(): boolean {
    return C.npc.Robin?.init === 1 && !V.robinmissing && V.robin.timer.hurt === 0 && this.state.asylum.status !== 'admitted';
  }

  public canSupportShopFromBank(): boolean {
    const stage = this.state.shopStage;
    return !this.state.shopBankSupported && stage !== 'none' && !this.state.shop && !!V.VanillaPlus?.finance?.bank?.opened && V.VanillaPlus.finance.bank.balance >= 200000 && !!this.vanillaPlus;
  }

  public supportShopFromBank(): boolean {
    if (!this.canSupportShopFromBank() || this.vanillaPlus?.finance.payFromBankPennies(200000) !== 'ok') return false;
    this.state.reserve += 2000;
    this.state.pcLoan += 2000;
    this.state.shopBankSupported = true;
    return true;
  }

  public canSpend(amount: number, protectNextRent = true): boolean {
    return this.funds - amount >= (protectNextRent && (this.state.selfRent || V.robinpaid !== 1) ? this.robinRent : 0);
  }

  private spend(amount: number, protectNextRent = true): boolean {
    if (!this.canSpend(amount, protectNextRent)) return false;
    const reserveSpent = Math.min(this.state.reserve, amount);
    this.state.reserve -= reserveSpent;
    V.robinmoney -= amount - reserveSpent;
    return true;
  }

  public upgrade(kind: 'lemonade' | 'chocolate', usePcMoney = false): boolean {
    const state = this.state;
    if (!this.robinAvailable || state[kind] >= 2 || state.topics[kind] <= state[kind]) return false;
    const cost = state[kind] === 0 ? 600 : 400;
    if (usePcMoney) {
      if ((Number(V.money) || 0) < cost * 100) return false;
      V.money -= cost * 100;
      state.pcLoan += cost;
    } else if (!this.spend(cost)) return false;
    state[kind]++;
    return true;
  }

  public repayPcLoan(): boolean {
    const amount = this.state.pcLoan;
    if (!this.robinAvailable || amount <= 0 || !this.spend(amount)) return false;
    V.money += amount * 100;
    this.state.pcLoan = 0;
    return true;
  }

  public startTutoring(): boolean {
    if (!this.robinAvailable || !this.state.topics.tutor || this.state.tutor || Math.max(this.state.lemonade, this.state.chocolate) < 1 || C.npc.Robin.dom < 45) return false;
    this.state.tutor = true;
    // 当天尚未到授课时间，罗宾也能自行完成试课；已过授课时间则从下个上课日开始。
    this.state.tutorDay = Time.hour < 19 ? Time.days - 1 : Time.days;
    return true;
  }

  public planShop(): boolean {
    if (!this.robinAvailable || !this.state.topics.shop || this.state.shopStage !== 'none' || this.state.lemonade < 2 || this.state.chocolate < 2) return false;
    this.state.shopStage = 'planning';
    return true;
  }

  public applyForShopPermit(): boolean {
    if (!this.robinAvailable || this.state.shopStage !== 'planning' || !this.spend(500)) return false;
    this.state.shopStage = 'applied';
    this.state.shopApplicationDay = Time.days;
    return true;
  }

  public secureShopSite(): boolean {
    if (!this.robinAvailable || this.state.shopStage !== 'applied' || !this.spend(1500)) return false;
    this.state.shopStage = 'site';
    return true;
  }

  public inspectShop(): boolean {
    const cost = 1400;
    if (!this.robinAvailable || this.state.shopStage !== 'site' || Time.days <= this.state.shopApplicationDay || !this.spend(cost)) return false;
    this.state.shopStage = 'inspected';
    this.state.shopInspectionDay = Time.days;
    return true;
  }

  public collectShopPermit(): boolean {
    if (!this.robinAvailable || this.state.shopStage !== 'inspected' || Time.days <= this.state.shopInspectionDay) return false;
    this.state.shopStage = 'permitted';
    return true;
  }

  public openShop(): boolean {
    const state = this.state;
    if (!this.robinAvailable || state.shop || state.shopStage !== 'permitted' || state.lemonade < 2 || state.chocolate < 2 || !this.spend(4000)) return false;
    state.shop = true;
    state.shopStock = 3;
    return true;
  }

  public restockShop(): boolean {
    if (!this.state.shop || this.state.shopStock > 0 || !this.robinAvailable || window.getRobinLocation() !== 'shop' || !this.spend(V.maths >= 300 ? 25 : 30)) return false;
    // 基础饮品的原料已从周收入扣除。这三箱只供 PC 与罗宾的额外营业班次使用。
    this.state.shopStock = 3;
    return true;
  }

  public chooseBalloon(route: 'cooperate' | 'compete'): boolean {
    if (
      !this.robinAvailable ||
      this.state.balloon !== 'none' ||
      this.state.lemonade < 1 ||
      V.balloonStand?.robin?.status !== 'helped' ||
      V.balloonStand.robin.talked !== true ||
      C.npc.Robin.dom < 60 ||
      Time.season === 'winter' ||
      window.getRobinLocation() !== 'beach' ||
      Weather.precipitation === 'rain'
    )
      return false;
    this.state.balloon = route;
    return true;
  }

  public compete(): boolean {
    if (
      !this.robinAvailable ||
      this.state.balloon !== 'compete' ||
      this.state.balloonWins >= 3 ||
      this.state.balloonDay === Time.days ||
      V.balloonStand?.robin?.status !== 'helped' ||
      window.getRobinLocation() !== 'beach' ||
      Weather.precipitation === 'rain'
    )
      return false;
    this.state.balloonDay = Time.days;
    this.state.balloonWins++;
    if (this.state.balloonWins >= 3) this.state.balloon = 'resolved';
    return true;
  }

  public workShop(): boolean {
    if (!this.state.shop || this.state.shopStock <= 0 || this.state.shopDay === Time.days || V.robin.timer.hurt !== 0 || C.npc.Robin.trauma >= 80 || window.getRobinLocation() !== 'shop') return false;
    this.state.shopDay = Time.days;
    this.state.shopStock--;
    V.money += 1000;
    this.state.reserve += 20;
    return true;
  }

  public canTutorToday(): boolean {
    return (
      this.state.tutor &&
      Time.schoolDay &&
      this.state.tutorDay !== Time.days &&
      ((Time.hour === 17 && Time.minute >= 30) || (Time.hour === 18 && Time.minute < 30)) &&
      window.getRobinLocation() === 'tutor' &&
      !V.robinmissing &&
      V.robin.timer.hurt === 0 &&
      C.npc.Robin.trauma < 80
    );
  }

  public tutorWithRobin(): boolean {
    if (!this.canTutorToday()) return false;
    this.state.tutorDay = Time.days;
    this.state.tutorLessons++;
    this.state.tutorSubject = (this.state.tutorLessons - 1) % 3;
    V.money += 750;
    this.state.reserve += 8;
    return true;
  }

  public workMarket(): boolean {
    const state = this.state;
    if (state.marketDay === Time.days || !this.robinAvailable || C.npc.Robin.trauma >= 80 || !['beach', 'park'].includes(window.getRobinLocation() || '')) return false;
    state.marketDay = Time.days;
    const seasonalLevel = Time.season === 'winter' ? state.chocolate : state.lemonade;
    state.marketSales = 4 + seasonalLevel * 2 + (state.balloon === 'cooperate' ? 2 : 0);
    state.reserve += state.marketSales;
    V.money += state.marketSales * 100;
    return true;
  }

  public canWorkMarket(): boolean {
    return this.state.marketDay !== Time.days && this.robinAvailable && C.npc.Robin.trauma < 80 && ['beach', 'park'].includes(window.getRobinLocation() || '');
  }

  public canVisitAtNight(): boolean {
    return (
      C.npc.Robin?.init === 1 &&
      (V.robinmissing === 0 || !V.robinmissing) &&
      V.robin.timer.hurt === 0 &&
      this.state.asylum.status !== 'admitted' &&
      this.state.nightDay !== Time.days &&
      !this.vanillaPlus?.realEstate.residenceOf('Robin') &&
      Time.hour >= 21 &&
      Time.hour <= 22 &&
      C.npc.Robin.love >= 50 &&
      (V.robinromance === 1 || C.npc.Robin.trauma >= 50) &&
      C.npc.Robin.trauma < 80 &&
      window.getRobinLocation() === 'sleep'
    );
  }

  public startNightVisit(): boolean {
    if (!this.canVisitAtNight()) return false;
    this.state.nightDay = Time.days;
    return true;
  }

  public finishNightVisit(): boolean {
    const visitDay = this.state.nightDay;
    if (visitDay < 0 || this.state.nightOutcomeDay === visitDay || (Time.days !== visitDay && (Time.days !== visitDay + 1 || Time.hour !== 0))) return false;
    this.state.nightOutcomeDay = visitDay;
    return true;
  }

  public canAcceptSelfRent(): boolean {
    return (
      this.robinAvailable &&
      !this.state.selfRent &&
      this.state.lemonade >= 2 &&
      this.state.chocolate >= 2 &&
      this.income >= Math.max(1500, this.robinRent + 50) &&
      C.npc.Robin.dom >= 60 &&
      C.npc.Robin.trauma <= 40 &&
      this.funds >= this.robinRentDebt + this.robinRent
    );
  }

  public acceptSelfRent(): boolean {
    if (!this.canAcceptSelfRent()) return false;
    this.spend(this.robinRentDebt, false);
    this.state.selfRent = true;
    if (V.robinpaid === 1) V.rentmoney /= 2;
    this.state.rentSeparated = true;
    V.robindebt = 0;
    return true;
  }

  public acceptBothRent(): boolean {
    if (!this.robinAvailable || !this.state.selfRent || this.state.bothRent || this.income < this.bothRentIncomeRequirement || C.npc.Robin.dom < 80 || C.npc.Robin.love < 60 || C.npc.Robin.trauma > 30)
      return false;
    this.state.bothRent = true;
    return true;
  }

  public canPayPcRent(): boolean {
    return this.robinAvailable && this.state.bothRent && (this.funds - this.robinRent) * 100 >= (Number(V.rentmoney) || 0) + (Number(V.babyRent) || 0);
  }

  public payPcRent(): boolean {
    const pennies = (Number(V.rentmoney) || 0) + (Number(V.babyRent) || 0);
    if (!this.canPayPcRent() || !this.spend(Math.ceil(pennies / 100))) return false;
    V.money += pennies;
    return true;
  }

  public proposeRebellion(): boolean {
    if (!this.robinAvailable || this.state.rebellion || !this.state.selfRent || this.income < 4000 || C.npc.Robin.dom < 85 || C.npc.Robin.trauma > 30) return false;
    this.state.rebellion = true;
    return true;
  }

  public combatTurn(): boolean {
    if (!this.state.rebellion || V.fightstart === 1 || V.enemyhealth <= 0) return false;
    const chance = this.state.solidarity ? 90 : this.state.allies ? 80 : 65;
    if (V.rng <= chance) {
      V.timer = Math.min(4, Math.max(0, V.timer) + 2);
      return true;
    } else {
      C.npc.Robin.trauma = Math.min(100, C.npc.Robin.trauma + 2);
      return false;
    }
  }

  public combatFinish(): void {
    if (!this.state.rebellion || this.state.fightResolutionDay === Time.days) return;
    this.state.fightResolutionDay = Time.days;
    if (V.enemyhealth <= 0 || V.enemyarousal >= V.enemyarousalmax) {
      this.state.victories++;
    } else {
      const supported = this.state.solidarity && this.state.careFund >= 10;
      if (supported) this.state.careFund -= 10;
      C.npc.Robin.trauma = Math.min(100, C.npc.Robin.trauma + (supported ? 4 : 8));
    }
  }

  public comfortRobin(): boolean {
    const asylum = this.state.asylum;
    if (!this.robinAvailable || asylum.status !== 'home' || asylum.severeDays < 1 || asylum.warningVisitDay === Time.days || C.npc.Robin.trauma < 95) return false;
    asylum.warningVisitDay = Time.days;
    return true;
  }

  public escapeAsylumTogether(): void {
    const asylum = this.state.asylum;
    if (asylum.status === 'admitted') V.robinReunionScene = undefined;
    if (asylum.status !== 'admitted' || asylum.plan < 2 || !asylum.met) return;
    this.releaseAsylum();
    C.npc.Robin.trauma = Math.max(0, C.npc.Robin.trauma - 15);
  }

  private releaseAsylum(): void {
    const asylum = this.state.asylum;
    asylum.status = 'recovering';
    asylum.plan = 0;
    asylum.severeDays = 0;
    V.robindebt = asylum.savedDebt;
    V.robinReunionScene = undefined;
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
      // 原版 PC 可经评估出院；罗宾没有这条既有路径。此处只记录留院的创伤，
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

    if (state.tutor) {
      // 原版 Robin 17:30 至 18:30 的日程已转到家教。PC 未陪同的上课日照常推进，
      // 而共同授课已写入 tutorDay，因此不会重复计算。逐日回补睡眠等跨日推进。
      const lastFinishedDay = Time.hour >= 19 ? Time.days : Time.days - 1;
      for (let day = state.tutorDay + 1; day <= lastFinishedDay; day++) {
        const date = new DateTime(Time.date).addDays(day - Time.days);
        if (this.robinAvailable && C.npc.Robin.trauma < 80 && Time.isSchoolDay(date)) {
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
    const robinRent = this.robinRent;
    state.week++;
    state.weeklyIncome = this.income;
    if (state.asylum.status === 'admitted') {
      const cashBefore = V.robinmoney;
      V.robindebt = -1;
      vanillaWeekPassed();
      V.robinmoney = cashBefore;
      return;
    }
    // 原版先扣房租、检查债务，再发周收入；先入账才可用于当周房租。
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
    // 原版用 <= 0 判定欠租；现金恰好 £400 时会误记欠债并可能立刻触发惩罚。
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
    this.core.on(':passagestart', () => this.sync(), 'Robin Expansion');
    this.core.dynamic.regTimeEvent('onDay', ':deadwood-reblooms-robin-asylum-daily', {
      action: () => {
        this.sync();
        // 特质按当前存档的关系阶段生效。罗宾留院或失踪时没有每日陪伴收益。
        if (V.RobinExpansion && this.robinAvailable && this.state.selfRent) window.statChange.stress(this.state.bothRent || this.state.baileyDefeated ? -250 : -100, 1);
      }
    });
    this.core.once(':storyready', () => {
      // onWeek 在原版 weekPassed() 后触发；房租抵扣须在原版周结算前入账。
      const vanillaWeekPassed = window.weekPassed;
      if (vanillaWeekPassed) window.weekPassed = () => this.settleWeek(vanillaWeekPassed);
      const getLocation = window.getRobinLocation;
      window.getRobinLocation = () => {
        const location = getLocation();
        if (V.RobinExpansion?.asylum?.status === 'admitted') {
          T.robin_location = 'asylum';
          return 'asylum';
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

export default RobinExpansion;
