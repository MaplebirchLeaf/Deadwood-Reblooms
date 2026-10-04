// ./src/module/Robin/Shop.ts

import Shared from './Shared';

/** 店铺开办流程的六个阶段，必须按序推进。 */
export type ShopStage = 'none' | 'planning' | 'applied' | 'site' | 'inspected' | 'permitted';

/** 两个正式职位由外来店员与孤儿院同伴共用。 */
const MAX_SHOP_STAFF = 2;

export default class RobinShop extends Shared {
  /** 正式店铺可刷卡，VanillaPlus 未启用时保留原本的现金购买。 */
  public canCustomerPay(pennies: number): boolean {
    if (!Number.isSafeInteger(pennies) || pennies < 0) return false;
    return this.vanillaPlus?.finance.canPay(pennies, 'shopping') ?? V.money >= pennies;
  }

  /** 店员带来的额外周销售，单位英镑。 */
  public get staffSales(): number {
    return this.employeeKeys.reduce((sales, key) => {
      const npc = V.per_npc?.[key];
      return sales + (npc?.shopOrphan ? 400 + Math.min(2, Math.floor((npc.shopExperience ?? 0) / 2)) * 150 : 700);
    }, 0);
  }

  /** 店员工资，单位英镑。 */
  public get staffWages(): number {
    return Math.min(MAX_SHOP_STAFF, this.state.shopStaff || 0) * 350;
  }

  public get canHireStaff(): boolean {
    return (
      this.robinAvailable &&
      window.getRobinLocation() === 'shop' &&
      this.state.shop &&
      this.state.shopStaff < MAX_SHOP_STAFF &&
      this.canSpend(350) &&
      Time.hour >= 9 &&
      Time.hour < 21 &&
      V.exposed <= 0 &&
      V.stress < V.stressmax &&
      (this.state.shopApplicant !== 'orphan' || !Time.schoolDay || Time.hour >= 16)
    );
  }

  /** 下一份应聘表对应的人选，离开再查看时仍是同一个人。 */
  public get applicantKey(): string {
    return `deadwood_robin_shop_${this.state.shopApplicant === 'orphan' ? 'orphan' : 'staff'}_${this.state.shopStaff}`;
  }

  /** 名单只含已聘人员，尚未接受的应聘者继续保留自己的记录。 */
  public get employeeKeys(): string[] {
    return Array.from({ length: Math.min(MAX_SHOP_STAFF, this.state.shopStaff) }, (_, index) => this.state.shopRoster[index] ?? `deadwood_robin_shop_staff_${index}`);
  }

  /** 正式雇员名单不包含尚未聘用的应聘者。 */
  public get employees(): string[] {
    return this.employeeKeys.map(key => V.per_npc?.[key]?.name).filter((name): name is string => typeof name === 'string');
  }

  /** 两位雇员按日轮班，同一天重复进店不会换人。 */
  public get attendantKey(): string | null {
    const keys = this.employeeKeys.filter(key => V.per_npc?.[key] && (!V.per_npc[key].shopOrphan || !Time.schoolDay || Time.hour >= 16));
    return keys.length ? keys[Time.days % keys.length] : null;
  }

  public get attendant(): string | null {
    const key = this.attendantKey;
    return key ? V.per_npc[key].name : null;
  }

  /** 熟客的口味与订单次数跟随同一个持久 NPC，不按进店次数更换。 */
  public get regular() {
    return V.per_npc?.deadwood_robin_shop_regular;
  }

  public hireStaff(): boolean {
    const key = this.applicantKey;
    const npc = V.per_npc?.[key];
    if (!this.canHireStaff || !npc || !this.spend(350)) return false;
    this.state.shopRoster = [...this.employeeKeys, key];
    this.state.shopStaff++;
    npc.shopExperience ??= npc.shopOrphan ? 0 : 4;
    npc.shopPaidWeeks = 0;
    npc.shopPaidWeek = this.state.week;
    if (npc.shopOrphan) this.core.SugarCube.Wikifier.wikifyEval('<<hope 1>>');
    return true;
  }

  /** 店员工资已由周收入扣除，这里只记实际领薪与熟练度，不重复扣钱。 */
  public settle(): void {
    if (!this.state.shop || V.statFreeze) return;
    for (const key of this.employeeKeys) {
      const npc = V.per_npc?.[key];
      if (!npc || npc.shopPaidWeek === this.state.week) continue;
      npc.shopPaidWeek = this.state.week;
      npc.shopPaidWeeks = (npc.shopPaidWeeks ?? 0) + 1;
      if (npc.shopOrphan) {
        npc.shopExperience = Math.min(4, (npc.shopExperience ?? 0) + 1);
        if (npc.shopPaidWeeks === 1) this.core.SugarCube.Wikifier.wikifyEval('<<hope 1>>');
      }
    }
  }

  public get canTrainStaff(): boolean {
    const key = this.attendantKey;
    const npc = key ? V.per_npc[key] : null;
    return (
      this.robinAvailable &&
      this.state.shop &&
      window.getRobinLocation() === 'shop' &&
      !!npc?.shopOrphan &&
      (npc.shopExperience ?? 0) < 4 &&
      npc.shopTrainingDay !== Time.days &&
      Time.hour >= 9 &&
      Time.hour < 20 &&
      V.exposed <= 0 &&
      V.stress < V.stressmax &&
      !window.pcAreArmsBound('both')
    );
  }

  public trainStaff(): boolean {
    if (!this.canTrainStaff) return false;
    const npc = V.per_npc[this.attendantKey!];
    npc.shopTrainingDay = Time.days;
    npc.shopExperience = (npc.shopExperience ?? 0) + 1;
    return true;
  }

  /** 银行是否愿意为开店提供贷款：需已开户、余额足够，且尚未接受过。 */
  public get canBorrowLoan(): boolean {
    const stage = this.state.shopStage;
    return !this.state.shopBankSupported && stage !== 'none' && !this.state.shop && !!V.VanillaPlus?.finance?.bank?.opened && V.VanillaPlus.finance.bank.balance >= 200000 && !!this.vanillaPlus;
  }

  /** 从银行贷款 2000 英镑作为开店资金，同时记入 PC 垫付。 */
  public borrowLoan(): boolean {
    if (!this.canBorrowLoan || this.vanillaPlus?.finance.payFromBankPennies(200000) !== 'ok') return false;
    this.state.reserve += 2000;
    this.state.pcLoan += 2000;
    this.state.shopBankSupported = true;
    return true;
  }

  /** 进入规划阶段：两个摊位都要升到 2 级，并已拿到店铺线索。 */
  public plan(): boolean {
    if (!this.robinAvailable || !this.state.topics.shop || this.state.shopStage !== 'none' || this.state.lemonade < 2 || this.state.chocolate < 2) return false;
    this.state.shopStage = 'planning';
    return true;
  }

  /** 提交开店申请，花 500 英镑，记录申请日。 */
  public applyForPermit(): boolean {
    if (!this.robinAvailable || this.state.shopStage !== 'planning' || !this.spend(500)) return false;
    this.state.shopStage = 'applied';
    this.state.shopApplicationDay = Time.days;
    return true;
  }

  /** 落实店面，花 1500 英镑。 */
  public secureSite(): boolean {
    if (!this.robinAvailable || this.state.shopStage !== 'applied' || !this.spend(1500)) return false;
    this.state.shopStage = 'site';
    return true;
  }

  /** 付费接受验店（1400 英镑），须在申请次日之后。 */
  public payInspection(): boolean {
    if (!this.robinAvailable || this.state.shopStage !== 'site' || Time.days <= this.state.shopApplicationDay || !this.spend(1400)) return false;
    this.state.shopStage = 'inspected';
    this.state.shopInspectionDay = Time.days;
    return true;
  }

  /** 领取执照，须在验店次日之后领取。 */
  public collectPermit(): boolean {
    if (!this.robinAvailable || this.state.shopStage !== 'inspected' || Time.days <= this.state.shopInspectionDay) return false;
    this.state.shopStage = 'permitted';
    return true;
  }

  /** 正式开张：花 4000 英镑，初始饮品库存 3 箱。 */
  public open(): boolean {
    const state = this.state;
    if (!this.robinAvailable || state.shop || state.shopStage !== 'permitted' || state.lemonade < 2 || state.chocolate < 2 || !this.spend(4000)) return false;
    state.shop = true;
    state.shopStock = 3;
    return true;
  }

  /** 补饮品库存。基础饮品原料已从周收入扣除，这三箱只供 PC 与罗宾的额外班次。 */
  public restockDrinks(): boolean {
    if (!this.state.shop || this.state.shopStock > 0 || !this.robinAvailable || window.getRobinLocation() !== 'shop' || !this.spend(V.maths >= 300 ? 25 : 30)) return false;
    this.state.shopStock = 3;
    return true;
  }

  /** 与罗宾共同看店一次，消耗一箱库存。 */
  public get canWork(): boolean {
    return (
      this.state.shop &&
      this.state.shopStock > 0 &&
      this.state.shopDay !== Time.days &&
      this.robinAvailable &&
      C.npc.Robin.trauma < 80 &&
      window.getRobinLocation() === 'shop' &&
      Time.hour >= 9 &&
      Time.hour < 21 &&
      V.exposed <= 0 &&
      V.stress < V.stressmax
    );
  }

  public work(special = false): boolean {
    const regular = this.regular;
    if (!this.canWork || regular?.name_known !== 1) return false;
    this.state.shopDay = Time.days;
    this.state.shopStock--;
    V.money += 1000;
    this.state.reserve += 20;
    regular.shopOrders = (regular.shopOrders ?? 0) + 1;
    if (special) regular.shopSpecials = (regular.shopSpecials ?? 0) + 1;
    return true;
  }

  /** 增设爆米花，花 150 便士。 */
  public addPopcorn(): boolean {
    if (!this.state.shop || this.state.shopPopcorn || !this.robinAvailable || window.getRobinLocation() !== 'shop' || !this.spend(150)) return false;
    this.state.shopPopcorn = true;
    return true;
  }

  /** 增设气球，花 100 便士，需气球摊已合作或已收束。 */
  public addBalloons(): boolean {
    if (!this.state.shop || this.state.shopBalloons || !['cooperate', 'resolved'].includes(this.state.balloon) || !this.robinAvailable || window.getRobinLocation() !== 'shop' || !this.spend(100))
      return false;
    this.state.shopBalloons = true;
    return true;
  }
}
