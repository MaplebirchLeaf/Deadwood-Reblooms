import Shared from './Shared';

/** 每天最多处理三条鱼，避免在同一营业日无限重复售卖。 */
const DAILY_FISH_LIMIT = 3;

export default class RobinFishing extends Shared {
  public get available(): boolean {
    if (!this.robinAvailable) return false;
    const location = window.getRobinLocation();
    return (location === 'beach' && Time.season !== 'winter' && this.state.lemonade >= 1 && this.state.fishGrill) || (location === 'shop' && this.state.shop);
  }

  public get canAddGrill(): boolean {
    return this.robinAvailable && !this.state.fishGrill && this.state.lemonade >= 1 && Time.season !== 'winter' && window.getRobinLocation() === 'beach' && this.canSpend(30);
  }

  /** 购置烤架会扣除储备金并写入存档，因此保留为操作方法。 */
  public purchaseGrill(): boolean {
    if (!this.canAddGrill || !this.spend(30)) return false;
    this.state.fishGrill = true;
    return true;
  }

  public get types(): string[] {
    const fish = setup.fishing?.lootTables?.fish;
    if (!fish || !V.foodstuff) return [];
    return Object.keys(fish).filter(type => fish[type]?.cookable === true && (V.foodstuff[type]?.amount ?? 0) > 0 && this.basePricePennies(type) > 0);
  }

  public get remaining(): number {
    return DAILY_FISH_LIMIT - (this.state.fishSoldDay === Time.days ? this.state.fishSoldToday : 0);
  }

  /** 原版食材售价是便士，料理按食材售价的两倍加 £1 辅料定价。返回英镑。 */
  public price(type: string): number {
    return (this.basePricePennies(type) * 2 + 100) / 100;
  }

  public share(type: string, amount: number): number {
    return (this.basePricePennies(type) * amount) / 100;
  }

  private basePricePennies(type: string): number {
    const pennies = Number(setup.foodstuff?.[type]?.shop?.sell_price);
    return Number.isFinite(pennies) && pennies > 0 ? Math.round(pennies) : 0;
  }

  public canServe(type: string, amount: number, sell: boolean): boolean {
    return (
      this.available &&
      this.types.includes(type) &&
      Number.isInteger(amount) &&
      amount >= 1 &&
      amount <= (V.foodstuff[type]?.amount ?? 0) &&
      (sell ? this.state.fishCooked && amount <= this.remaining : amount === 1)
    );
  }

  /** 扣除实际持有的鱼。售卖时 PC 取得原版鱼价，罗宾取得等额净收入。 */
  public serve(type: string, amount: number, sell: boolean): boolean {
    if (!this.canServe(type, amount, sell)) return false;
    V.foodstuff[type].amount -= amount;
    this.state.fishCooked = true;
    if (sell) {
      if (this.state.fishSoldDay !== Time.days) {
        this.state.fishSoldDay = Time.days;
        this.state.fishSoldToday = 0;
        this.state.fishEarningsToday = 0;
      }
      this.state.fishSoldToday += amount;
      const sharePennies = this.basePricePennies(type) * amount;
      V.money += sharePennies;
      this.state.reserve = Math.round(this.state.reserve * 100 + sharePennies) / 100;
      this.state.fishEarningsToday = Math.round(this.state.fishEarningsToday * 100 + sharePennies) / 100;
    }
    return true;
  }
}
