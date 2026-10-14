// ./src/module/Orchard/Winery.ts

import terms from '../../assets/orchard/winery.json';
import type Orchard from '../Orchard';
import type { OrchardFruit } from './Species';

export type WineRecipe = 'cider' | 'perry' | 'plum_wine' | 'cherry_wine';

export interface WineBatch {
  id: number;
  recipe: WineRecipe;
  bottles: number;
  ready_at: number;
}

export interface WineryState {
  installed: boolean;
  batches: WineBatch[];
  next_id: number;
  stock: Record<WineRecipe, number>;
  reserve: Record<WineRecipe, number>;
  shop_enabled: boolean;
  shop_stock: Record<WineRecipe, number>;
  shop_settled_week: number;
  sold_day: number;
  sold_today: number;
  supply_day: number;
  expenses: number;
  income: number;
  produced: number;
  supplied: number;
  sold: number;
  ledger: { day: number; recipe: WineRecipe; amount: number; income: number; source: 'wholesale' | 'robin' }[];
}

export default class Winery {
  public readonly terms = terms;

  public static readonly defaults: WineryState = {
    installed: false,
    batches: [],
    next_id: 0,
    stock: { cider: 0, perry: 0, plum_wine: 0, cherry_wine: 0 },
    reserve: { cider: 0, perry: 0, plum_wine: 0, cherry_wine: 0 },
    shop_enabled: false,
    shop_stock: { cider: 0, perry: 0, plum_wine: 0, cherry_wine: 0 },
    shop_settled_week: -1,
    sold_day: -1,
    sold_today: 0,
    supply_day: -1,
    expenses: 0,
    income: 0,
    produced: 0,
    supplied: 0,
    sold: 0,
    ledger: []
  };

  public constructor(private readonly orchard: Orchard) {}

  public get state(): WineryState {
    return this.orchard.state.winery;
  }

  public get available(): boolean {
    return !!V.Orchard?.winery && this.orchard.available('farm');
  }

  public get canOperate(): boolean {
    return (
      this.available &&
      this.state.installed &&
      this.orchard.core.passage.title === 'Deadwood Orchard Winery' &&
      V.location === 'alex_farm' &&
      !V.statFreeze &&
      !V.replayScene &&
      V.combat !== 1 &&
      V.stress < V.stressmax &&
      !window.pcAreArmsBound('both') &&
      !this.orchard.farmInterrupted &&
      !V.farm_assault
    );
  }

  /** 发酵只读取绝对时间，反复查看、跨日和读档均不会凭空装瓶。 */
  public get ready(): WineBatch[] {
    return this.state.batches.filter(batch => batch.ready_at <= Time.date.timeStamp);
  }

  /** 限额按日历午夜重置，不跟随进园或领货次数。 */
  public get saleRemaining(): number {
    const day = Math.floor(Time.date.timeStamp / 86400);
    return Math.max(0, terms.saleDailyLimit - (this.state.sold_day === day ? this.state.sold_today : 0));
  }

  public get shopStock(): number {
    return Object.values(this.state.shop_stock).reduce((total, amount) => total + amount, 0);
  }

  public get canSupply(): boolean {
    return (
      this.available &&
      this.state.installed &&
      this.state.shop_enabled &&
      this.orchard.core.passage.title === 'Deadwood Orchard Robin Wine' &&
      this.orchard.canSupplyRobin &&
      this.shopStock + terms.shopSupplyQuantity <= terms.shopStockLimit
    );
  }

  /** 批发沿用农场日间收货日程，酿造和装瓶仍可在夜间室内完成。 */
  public get canSell(): boolean {
    return this.canOperate && this.orchard.canWork && V.farm_work?.alex === 'admin';
  }

  /** 原料保留量与仍有效的水果订单共用，酿酒不会拿走已经答应的货。 */
  public begin(recipe: WineRecipe): boolean {
    const data = terms.recipes.find(item => item.id === recipe);
    if (!data || !this.canOperate || this.state.batches.length >= terms.barrelCapacity) return false;
    const fruit = V.foodstuff?.[data.fruit];
    const promised = [this.orchard.state.order, this.orchard.state.farm_contract].reduce(
      (total, order) => total + (order?.status === 'pending' && order.deadline >= Math.floor(Time.days) && order.type === data.fruit ? order.amount : 0),
      0
    );
    const kept = this.orchard.state.reserve[data.fruit as OrchardFruit] ?? 0;
    if (!fruit || fruit.amount - kept - promised < terms.fruitPerBatch || !(this.orchard.core.get('Finance')?.canPay(terms.batchCost, 'orchard') ?? V.money >= terms.batchCost)) return false;
    this.orchard.core.SugarCube.Wikifier.wikifyEval(`<<money -${terms.batchCost} 'orchard'>>`);
    fruit.amount -= terms.fruitPerBatch;
    this.state.expenses += terms.batchCost;
    this.state.batches.push({ id: this.state.next_id++, recipe, bottles: terms.bottlesPerBatch, ready_at: Time.date.timeStamp + data.days * 86400 });
    return true;
  }

  /** 只有实际装瓶才计产量；玻璃瓶费用是便士，准备时间留给 Twee 的点击结算。 */
  public bottle(id: number): boolean {
    if (!this.canOperate || !Number.isSafeInteger(id)) return false;
    const index = this.state.batches.findIndex(batch => batch.id === id && batch.ready_at <= Time.date.timeStamp);
    if (index < 0) return false;
    const batch = this.state.batches[index];
    const cost = batch.bottles * terms.bottleCost;
    if (!(this.orchard.core.get('Finance')?.canPay(cost, 'orchard') ?? V.money >= cost)) return false;
    this.orchard.core.SugarCube.Wikifier.wikifyEval(`<<money -${cost} 'orchard'>>`);
    this.state.batches.splice(index, 1);
    this.state.stock[batch.recipe] += batch.bottles;
    this.state.expenses += cost;
    this.state.produced += batch.bottles;
    return true;
  }

  public sell(recipe: WineRecipe, amount: number): boolean {
    const data = terms.recipes.find(item => item.id === recipe);
    if (!data || !this.canSell || !Number.isSafeInteger(amount) || amount < 1 || amount > this.saleRemaining || amount > this.state.stock[recipe] - this.state.reserve[recipe]) return false;
    const day = Math.floor(Time.date.timeStamp / 86400);
    if (this.state.sold_day !== day) {
      this.state.sold_day = day;
      this.state.sold_today = 0;
    }
    this.state.stock[recipe] -= amount;
    this.state.sold_today += amount;
    this.state.sold += amount;
    this.recordSale(recipe, amount, 'wholesale');
    return true;
  }

  public supply(recipe: WineRecipe): boolean {
    const data = terms.recipes.find(item => item.id === recipe);
    const shop = this.orchard.core.get('Robin')?.shop;
    if (!data || !shop || !this.canSupply || this.state.stock[recipe] - this.state.reserve[recipe] < terms.shopSupplyQuantity) return false;
    const income = data.wholesale * terms.shopSupplyQuantity;
    // 罗宾资金为英镑；先实际付款，才转移瓶装库存并结算 PC 的便士收入。
    if (!shop.spend(income / 100)) return false;
    this.state.stock[recipe] -= terms.shopSupplyQuantity;
    this.state.shop_stock[recipe] += terms.shopSupplyQuantity;
    this.state.supplied += terms.shopSupplyQuantity;
    this.recordSale(recipe, terms.shopSupplyQuantity, 'robin');
    const day = Math.floor(Time.date.timeStamp / 86400);
    if (this.state.supply_day !== day) {
      this.state.supply_day = day;
      this.orchard.core.SugarCube.Wikifier.wikifyEval('<<npcincr Robin love 1>>');
    }
    return true;
  }

  /** 自用可取保留的酒；邀请、人物在场与同意由实际互动的 Twee 决定。 */
  public take(recipe: WineRecipe): boolean {
    if (!terms.recipes.some(item => item.id === recipe) || !V.Orchard?.winery || !this.state.installed || V.statFreeze || V.replayScene || V.combat === 1 || this.state.stock[recipe] < 1) return false;
    this.state.stock[recipe]--;
    return true;
  }

  private get shopSales(): { recipe: WineRecipe; amount: number }[] {
    if (!V.RobinExpansion?.shop || V.RobinExpansion.asylum.status === 'admitted' || !this.state.shop_enabled || this.state.shop_settled_week === V.RobinExpansion.week) return [];
    const sales: { recipe: WineRecipe; amount: number }[] = [];
    let remaining = terms.shopWeeklyLimit;
    for (const data of terms.recipes) {
      const recipe = data.id as WineRecipe;
      const amount = Math.min(this.state.shop_stock[recipe], remaining);
      if (amount > 0) sales.push({ recipe, amount });
      remaining -= amount;
      if (remaining === 0) break;
    }
    return sales;
  }

  /** 货款在进货时已付。本周营业收入按实际可售瓶数计算，单位英镑。 */
  public get shopSalesEstimate(): number {
    return this.shopSales.reduce((income, { recipe, amount }) => income + (terms.recipes.find(item => item.id === recipe)!.retail * amount) / 100, 0);
  }

  /** 由罗宾原有周结算调用；这里只扣实售库存，不能再给罗宾发一笔钱。 */
  public settleShop(): void {
    if (!V.RobinExpansion?.shop || V.RobinExpansion.asylum.status === 'admitted' || !this.state.shop_enabled || V.statFreeze || V.replayScene || this.state.shop_settled_week === V.RobinExpansion.week)
      return;
    for (const { recipe, amount } of this.shopSales) this.state.shop_stock[recipe] -= amount;
    this.state.shop_settled_week = V.RobinExpansion.week;
  }

  /** 销售统计只记 PC 实收，罗宾转售与玩家自己喝掉的酒不重复记为 PC 销售。 */
  private recordSale(recipe: WineRecipe, amount: number, source: 'wholesale' | 'robin'): void {
    const income = terms.recipes.find(item => item.id === recipe)!.wholesale * amount;
    this.orchard.core.SugarCube.Wikifier.wikifyEval(`<<money ${income} 'orchard'>>`);
    this.state.income += income;
    this.state.ledger.push({ day: Math.floor(Time.days), recipe, amount, income, source });
    if (this.state.ledger.length > terms.ledgerEntries) this.state.ledger.shift();
  }
}
