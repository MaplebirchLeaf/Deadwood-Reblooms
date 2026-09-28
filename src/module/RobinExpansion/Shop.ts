import Shared from './Shared';

/** 店铺开办流程的六个阶段，必须按序推进。 */
export type ShopStage = 'none' | 'planning' | 'applied' | 'site' | 'inspected' | 'permitted';

/** 店铺最多雇两名店员，各自的增收与工资见 staffSales / staffWages。 */
const MAX_SHOP_STAFF = 2;

export default class RobinShop extends Shared {
  /** 店员带来的额外周销售，单位英镑。 */
  public get staffSales(): number {
    return Math.min(MAX_SHOP_STAFF, this.state.shopStaff || 0) * 700;
  }

  /** 店员工资，单位英镑。 */
  public get staffWages(): number {
    return Math.min(MAX_SHOP_STAFF, this.state.shopStaff || 0) * 350;
  }

  public get canHireStaff(): boolean {
    return this.robinAvailable && window.getRobinLocation() === 'shop' && this.state.shop && this.state.shopStaff < MAX_SHOP_STAFF && this.canSpend(350);
  }

  public hireStaff(): boolean {
    if (!this.canHireStaff || !this.spend(350)) return false;
    this.state.shopStaff++;
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

  /** 提交开店申请，花 500 便士，记录申请日。 */
  public applyForPermit(): boolean {
    if (!this.robinAvailable || this.state.shopStage !== 'planning' || !this.spend(500)) return false;
    this.state.shopStage = 'applied';
    this.state.shopApplicationDay = Time.days;
    return true;
  }

  /** 落实店面，花 1500 便士。 */
  public secureSite(): boolean {
    if (!this.robinAvailable || this.state.shopStage !== 'applied' || !this.spend(1500)) return false;
    this.state.shopStage = 'site';
    return true;
  }

  /** 付费接受验店（1400 便士）；须在申请次日之后。 */
  public payInspection(): boolean {
    if (!this.robinAvailable || this.state.shopStage !== 'site' || Time.days <= this.state.shopApplicationDay || !this.spend(1400)) return false;
    this.state.shopStage = 'inspected';
    this.state.shopInspectionDay = Time.days;
    return true;
  }

  /** 领取执照；须在验店次日之后领取。 */
  public collectPermit(): boolean {
    if (!this.robinAvailable || this.state.shopStage !== 'inspected' || Time.days <= this.state.shopInspectionDay) return false;
    this.state.shopStage = 'permitted';
    return true;
  }

  /** 正式开张：花 4000 便士，初始饮品库存 3 箱。 */
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
  public work(): boolean {
    if (!this.state.shop || this.state.shopStock <= 0 || this.state.shopDay === Time.days || V.robin.timer.hurt !== 0 || C.npc.Robin.trauma >= 80 || window.getRobinLocation() !== 'shop') return false;
    this.state.shopDay = Time.days;
    this.state.shopStock--;
    V.money += 1000;
    this.state.reserve += 20;
    return true;
  }

  /** 增设爆米花，花 150 便士。 */
  public addPopcorn(): boolean {
    if (!this.state.shop || this.state.shopPopcorn || !this.robinAvailable || window.getRobinLocation() !== 'shop' || !this.spend(150)) return false;
    this.state.shopPopcorn = true;
    return true;
  }

  /** 增设气球，花 100 便士；需气球摊已合作或已收束。 */
  public addBalloons(): boolean {
    if (!this.state.shop || this.state.shopBalloons || !['cooperate', 'resolved'].includes(this.state.balloon) || !this.robinAvailable || window.getRobinLocation() !== 'shop' || !this.spend(100))
      return false;
    this.state.shopBalloons = true;
    return true;
  }
}
