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
  ledger: { day: number; recipe: WineRecipe; amount: number; income: number; source: 'wholesale' | 'robin'; fee?: number }[];
  automation: {
    installed: boolean;
    ready_at: number;
    bottle: boolean;
    recipe: WineRecipe | null;
    supply: boolean;
    day: number;
    supply_day: number;
    expenses: number;
    fees: number;
    report: {
      day: number;
      bottled: number;
      started: number;
      supplied: number;
      expenses: number;
      bottling: keyof typeof terms.automationStatus;
      brewing: keyof typeof terms.automationStatus;
      delivery: keyof typeof terms.automationStatus;
    };
  };
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
    ledger: [],
    automation: {
      installed: false,
      ready_at: 0,
      bottle: false,
      recipe: null,
      supply: false,
      day: -1,
      supply_day: -1,
      expenses: 0,
      fees: 0,
      report: { day: -1, bottled: 0, started: 0, supplied: 0, expenses: 0, bottling: 'off', brewing: 'off', delivery: 'off' }
    }
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
      !V.nextPassage &&
      !V.nextPassageCheck &&
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

  public get skilled(): boolean {
    return this.state.produced >= terms.skilledProduced && (this.state.supplied >= terms.skilledSupplied || this.state.sold >= terms.skilledSold);
  }

  public get bottleMinutes(): number {
    return this.skilled ? terms.skilledBottleMinutes : terms.bottleMinutes;
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
      !V.nextPassage &&
      !V.nextPassageCheck &&
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
    return this.canOperate && this.prepare(recipe, Time.date.timeStamp, Math.floor(Time.days));
  }

  /** 酿造、自动作业与界面共用可用原料，不占用保留量和有效订单。 */
  public spareFruit(recipe: WineRecipe, day: number): number {
    const data = terms.recipes.find(item => item.id === recipe);
    if (!data) return 0;
    const promised = [this.orchard.state.order, this.orchard.state.farm_contract].reduce(
      (total, order) => total + (order?.status === 'pending' && order.deadline >= day && order.type === data.fruit ? order.amount : 0),
      0
    );
    return Math.max(0, (V.foodstuff?.[data.fruit]?.amount ?? 0) - (this.orchard.state.reserve[data.fruit as OrchardFruit] ?? 0) - promised);
  }

  private prepare(recipe: WineRecipe, timestamp: number, day: number): boolean {
    const data = terms.recipes.find(item => item.id === recipe);
    if (!data || this.state.batches.length >= terms.barrelCapacity || this.spareFruit(recipe, day) < terms.fruitPerBatch) return false;
    const fruit = V.foodstuff?.[data.fruit];
    if (!fruit || !this.pay(terms.batchCost)) return false;
    fruit.amount -= terms.fruitPerBatch;
    this.state.batches.push({ id: this.state.next_id++, recipe, bottles: terms.bottlesPerBatch, ready_at: timestamp + data.days * 86400 });
    return true;
  }

  /** 只有实际装瓶才计产量，玻璃瓶费用是便士，准备时间留给 Twee 的点击结算。 */
  public bottle(id: number): boolean {
    if (!this.canOperate || !Number.isSafeInteger(id)) return false;
    return this.fill(id, Time.date.timeStamp);
  }

  private fill(id: number, timestamp: number): boolean {
    const index = this.state.batches.findIndex(batch => batch.id === id && batch.ready_at <= timestamp);
    if (index < 0) return false;
    const batch = this.state.batches[index];
    const cost = batch.bottles * terms.bottleCost;
    if (!this.pay(cost)) return false;
    this.state.batches.splice(index, 1);
    this.state.stock[batch.recipe] += batch.bottles;
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
    if (!this.canSupply || !this.deliver(recipe)) return false;
    const day = Math.floor(Time.date.timeStamp / 86400);
    if (this.state.supply_day !== day) {
      this.state.supply_day = day;
      this.orchard.core.SugarCube.Wikifier.wikifyEval('<<npcincr Robin love 1>>');
    }
    return true;
  }

  private deliver(recipe: WineRecipe, fee = 0): boolean {
    const data = terms.recipes.find(item => item.id === recipe);
    const shop = this.orchard.core.get('Robin')?.shop;
    if (!data || !shop || this.shopStock + terms.shopSupplyQuantity > terms.shopStockLimit || this.state.stock[recipe] - this.state.reserve[recipe] < terms.shopSupplyQuantity) return false;
    const income = data.wholesale * terms.shopSupplyQuantity;
    // 罗宾资金为英镑，先实际付款，才转移瓶装库存并结算 PC 的便士收入。
    if (!shop.spend(income / 100)) return false;
    this.state.stock[recipe] -= terms.shopSupplyQuantity;
    this.state.shop_stock[recipe] += terms.shopSupplyQuantity;
    this.state.supplied += terms.shopSupplyQuantity;
    this.recordSale(recipe, terms.shopSupplyQuantity, 'robin', fee);
    return true;
  }

  /** 与果园八点采收逐日交错，历史装瓶只取当时已熟的桶，不能把未来收成投进过去。 */
  public advance(day: number, timestamp = Time.date.timeStamp): void {
    if (!V.Orchard?.winery || !this.state.installed || !this.state.automation.installed || V.statFreeze || V.replayScene || !Number.isInteger(day)) return;
    const line = this.state.automation;
    const today = Math.floor(Time.date.timeStamp / 86400);
    const shift = day * 86400 + terms.automationHour * 3600;
    if (day > today || shift > timestamp || shift < line.ready_at || day < line.day) return;
    if (line.report.day !== day) {
      line.report = {
        day,
        bottled: 0,
        started: 0,
        supplied: 0,
        expenses: 0,
        bottling: line.bottle ? 'scheduled' : 'off',
        brewing: line.recipe ? 'scheduled' : 'off',
        delivery: line.supply ? 'deferred' : 'off'
      };
    }
    const report = line.report;
    const expenses = this.state.expenses;
    const stopped = !this.available ? 'unavailable' : day === today && (this.orchard.farmInterrupted || V.farm_assault) ? 'suspended' : null;
    if (line.day < day) {
      line.day = day;
      if (stopped) {
        if (line.bottle) report.bottling = stopped;
        if (line.recipe) report.brewing = stopped;
      } else {
        if (line.bottle) {
          report.bottling = 'waiting';
          for (const batch of [...this.state.batches].filter(batch => batch.ready_at <= shift)) {
            if (!this.fill(batch.id, shift)) {
              report.bottling = 'funds';
              break;
            }
            report.bottled += batch.bottles;
            report.bottling = 'bottled';
          }
        }
        if (line.recipe) {
          report.brewing = 'full';
          const gameDay = Math.floor((shift - Time.startDate.timeStamp) / 86400);
          while (this.state.batches.length < terms.barrelCapacity) {
            if (this.spareFruit(line.recipe, gameDay) < terms.fruitPerBatch) {
              report.brewing = 'fruit';
              break;
            }
            if (!this.prepare(line.recipe, shift, gameDay)) {
              report.brewing = 'funds';
              break;
            }
            report.started++;
            report.brewing = 'started';
          }
        }
      }
    }
    // 只跑实际当天的配送，不把新酒或今天的店铺资金倒填到已经过去的周结算。
    if (line.supply && day === today && line.supply_day < day) {
      const robin = this.orchard.core.get('Robin');
      if (stopped) report.delivery = stopped;
      else if (!this.state.shop_enabled || !V.RobinExpansion?.shop || !robin) report.delivery = 'shop';
      else if (!robin.available || C.npc.Robin?.trauma >= 80 || window.getRobinLocation() !== 'shop' || Time.hour < terms.automationHour || Time.hour >= 21) report.delivery = 'absent';
      else {
        line.supply_day = day;
        report.delivery = 'stock';
        for (let sent = 0; sent < terms.automationSupplyLimit; sent += terms.shopSupplyQuantity) {
          if (this.shopStock + terms.shopSupplyQuantity > terms.shopStockLimit) {
            report.delivery = 'cabinet';
            break;
          }
          const recipe = terms.recipes.find(item => this.state.stock[item.id as WineRecipe] - this.state.reserve[item.id as WineRecipe] >= terms.shopSupplyQuantity);
          if (!recipe) break;
          if (!this.deliver(recipe.id as WineRecipe, terms.automationHaulFee)) {
            report.delivery = 'payment';
            break;
          }
          line.fees += terms.automationHaulFee;
          report.supplied += terms.shopSupplyQuantity;
          report.delivery = 'delivered';
        }
      }
    }
    const spent = this.state.expenses - expenses;
    line.expenses += spent;
    report.expenses += spent;
  }

  private pay(cost: number): boolean {
    if (!(this.orchard.core.get('Finance')?.canPay(cost, 'orchard') ?? V.money >= cost)) return false;
    this.orchard.core.SugarCube.Wikifier.wikifyEval(`<<money -${cost} 'orchard'>>`);
    this.state.expenses += cost;
    return true;
  }

  /** 自用可取保留的酒，邀请、人物在场与同意由实际互动的 Twee 决定。 */
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

  /** 由罗宾原有周结算调用，这里只扣实售库存，不能再给罗宾发一笔钱。 */
  public settleShop(): void {
    if (!V.RobinExpansion?.shop || V.RobinExpansion.asylum.status === 'admitted' || !this.state.shop_enabled || V.statFreeze || V.replayScene || this.state.shop_settled_week === V.RobinExpansion.week)
      return;
    for (const { recipe, amount } of this.shopSales) this.state.shop_stock[recipe] -= amount;
    this.state.shop_settled_week = V.RobinExpansion.week;
  }

  /** 销售统计只记 PC 实收，罗宾转售与玩家自己喝掉的酒不重复记为 PC 销售。 */
  private recordSale(recipe: WineRecipe, amount: number, source: 'wholesale' | 'robin', fee = 0): void {
    const income = terms.recipes.find(item => item.id === recipe)!.wholesale * amount;
    this.orchard.core.SugarCube.Wikifier.wikifyEval(`<<money ${income - fee} 'orchard'>>`);
    this.state.income += income;
    this.state.expenses += fee;
    this.state.ledger.push({ day: Math.floor(Time.days), recipe, amount, income: income - fee, source, ...(fee ? { fee } : {}) });
    if (this.state.ledger.length > terms.ledgerEntries) this.state.ledger.shift();
  }
}
