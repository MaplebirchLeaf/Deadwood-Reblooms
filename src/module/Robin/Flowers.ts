// ./src/module/Robin/Flowers.ts

import Shared from './Shared';

/** 花摊每周最多售出的支数。估算与周结算共用，改动必须保持一致。 */
const FLOWER_WEEKLY_SALES = 10;

export default class RobinFlowers extends Shared {
  /** 当前可经营的花种：原版食物表里归类为 flower 且有有效售价的。 */
  public get types(): string[] {
    return ['daisy', 'tulip', 'carnation', 'sunflower', 'white_rose', 'pink_rose', 'red_rose', 'orchid'].filter(
      type => setup.foodstuff?.[type]?.category === 'flower' && Number.isFinite(setup.foodstuff[type].shop?.sell_price) && (setup.foodstuff[type].shop?.sell_price ?? 0) > 0
    );
  }

  public get stockTotal(): number {
    return Object.values(this.state.flower_stock).reduce((total, count) => total + Math.max(0, count), 0);
  }

  /** 单支售价，单位英镑。非经营花种返回 0。 */
  public price(type: string): number {
    if (!this.types.includes(type)) return 0;
    return Math.ceil(((setup.foodstuff[type]?.shop?.sell_price ?? 0) * 1.4) / 100);
  }

  private forEachSold(apply: (type: string, sold: number) => void): void {
    let remaining = FLOWER_WEEKLY_SALES;
    for (const type of this.types) {
      const sold = Math.clamp(this.state.flower_stock[type] || 0, 0, remaining);
      if (sold > 0) apply(type, sold);
      remaining -= sold;
      if (remaining === 0) break;
    }
  }

  /** 本周预计花卉收入，单位英镑。 */
  public get salesEstimate(): number {
    if (!this.state.shop_flowers) return 0;
    let sales = 0;
    this.forEachSold((type, sold) => {
      sales += sold * this.price(type);
    });
    return sales;
  }

  /** 周结算时扣除实际售出的库存。 */
  public settle(): void {
    if (!this.state.shop || !this.state.shop_flowers) return;
    this.forEachSold((type, sold) => {
      this.state.flower_stock[type] -= sold;
    });
  }

  /** 首次添置花架：花 100 英镑，附赠 10 支雏菊。 */
  public add(): boolean {
    if (!this.state.shop || this.state.shop_flowers || !this.robinAvailable || window.getRobinLocation() !== 'shop' || !this.spend(100)) return false;
    this.state.shop_flowers = true;
    this.state.flower_stock.daisy = 10;
    return true;
  }

  /** 库存见底时补 10 支雏菊，花 15 英镑。 */
  public restock(): boolean {
    if (!this.state.shop_flowers || this.stockTotal > 5 || !this.robinAvailable || window.getRobinLocation() !== 'shop' || !this.spend(15)) return false;
    this.state.flower_stock.daisy = (this.state.flower_stock.daisy || 0) + 10;
    return true;
  }

  public sellToShop(type: string): boolean {
    if (!this.state.shop_flowers || !this.types.includes(type) || this.stockTotal > 20 || !this.robinAvailable || window.getRobinLocation() !== 'shop') return false;
    if (!V.foodstuff?.[type] || V.foodstuff[type].amount < 10) return false;
    const pounds = (setup.foodstuff[type]?.shop?.sell_price ?? 0) / 10;
    if (pounds <= 0) return false;
    if (!this.spend(pounds)) return false;
    V.foodstuff[type].amount -= 10;
    V.money += pounds * 100;
    this.state.flower_stock[type] = (this.state.flower_stock[type] || 0) + 10;
    return true;
  }

  /** 玩家从店里买走一支花，营业时间 9:00–21:00，货款进罗宾的储备金。 */
  public buyFromShop(type: string): boolean {
    const price = this.price(type);
    if (!this.state.shop || !this.state.shop_flowers || Time.hour < 9 || Time.hour >= 21 || !price || !(this.state.flower_stock[type] > 0) || !V.foodstuff?.[type]) return false;
    if (!(this.finance?.canPay(price * 100, 'shopping') ?? V.money >= price * 100)) return false;
    V.foodstuff[type].amount++;
    this.state.flower_stock[type]--;
    this.state.reserve += price;
    return true;
  }
}
