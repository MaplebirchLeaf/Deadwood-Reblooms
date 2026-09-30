import Shared from './Shared';

/** 花摊每日最多售出的支数。估算与周结算共用，改动必须保持一致。 */
const FLOWER_DAILY_SALES = 10;

export default class RobinFlowers extends Shared {
  /** 当前可经营的花种：原版食物表里归类为 flower 且有有效售价的。 */
  public get types(): string[] {
    return ['daisy', 'tulip', 'carnation', 'sunflower', 'white_rose', 'pink_rose', 'red_rose', 'orchid'].filter(
      type => setup.foodstuff?.[type]?.category === 'flower' && Number.isFinite(setup.foodstuff[type].shop?.sell_price) && (setup.foodstuff[type].shop?.sell_price ?? 0) > 0
    );
  }

  public get stockTotal(): number {
    return Object.values(this.state.flowerStock).reduce((total, count) => total + Math.max(0, count), 0);
  }

  /** 单支售价，单位英镑。非经营花种返回 0。 */
  public price(type: string): number {
    if (!this.types.includes(type)) return 0;
    return Math.ceil(((setup.foodstuff[type]?.shop?.sell_price ?? 0) * 1.4) / 100);
  }

  private forEachSold(apply: (type: string, sold: number) => void): void {
    let remaining = FLOWER_DAILY_SALES;
    for (const type of this.types) {
      const sold = Math.min(remaining, Math.max(0, this.state.flowerStock[type] || 0));
      if (sold > 0) apply(type, sold);
      remaining -= sold;
      if (remaining === 0) break;
    }
  }

  /** 今日预计花卉收入，单位英镑。 */
  public get salesEstimate(): number {
    if (!this.state.shopFlowers) return 0;
    let sales = 0;
    this.forEachSold((type, sold) => {
      sales += sold * this.price(type);
    });
    return sales;
  }

  /** 周结算时扣除当日实际售出的库存。 */
  public settle(): void {
    if (!this.state.shop || !this.state.shopFlowers) return;
    this.forEachSold((type, sold) => {
      this.state.flowerStock[type] -= sold;
    });
  }

  /** 首次添置花架：花 100 便士，附赠 10 支雏菊。 */
  public add(): boolean {
    if (!this.state.shop || this.state.shopFlowers || !this.robinAvailable || window.getRobinLocation() !== 'shop' || !this.spend(100)) return false;
    this.state.shopFlowers = true;
    this.state.flowerStock.daisy = 10;
    return true;
  }

  /** 库存见底时补 10 支雏菊，花 15 便士。 */
  public restock(): boolean {
    if (!this.state.shopFlowers || this.stockTotal > 5 || !this.robinAvailable || window.getRobinLocation() !== 'shop' || !this.spend(15)) return false;
    this.state.flowerStock.daisy = (this.state.flowerStock.daisy || 0) + 10;
    return true;
  }

  public sellToShop(type: string): boolean {
    if (!this.state.shopFlowers || !this.types.includes(type) || this.stockTotal > 20 || !this.robinAvailable || window.getRobinLocation() !== 'shop') return false;
    if (!V.foodstuff?.[type] || V.foodstuff[type].amount < 10) return false;
    const pounds = (setup.foodstuff[type]?.shop?.sell_price ?? 0) / 10;
    if (pounds <= 0) return false;
    if (!this.spend(pounds)) return false;
    V.foodstuff[type].amount -= 10;
    V.money += pounds * 100;
    this.state.flowerStock[type] = (this.state.flowerStock[type] || 0) + 10;
    return true;
  }

  /** 玩家从店里买走一支花，营业时间 9:00–21:00，货款进罗宾的储备金。 */
  public buyFromShop(type: string): boolean {
    const price = this.price(type);
    if (!this.state.shop || !this.state.shopFlowers || Time.hour < 9 || Time.hour >= 21 || !price || !(this.state.flowerStock[type] > 0) || V.money < price * 100 || !V.foodstuff?.[type]) return false;
    V.money -= price * 100;
    V.foodstuff[type].amount++;
    this.state.flowerStock[type]--;
    this.state.reserve += price;
    return true;
  }
}
