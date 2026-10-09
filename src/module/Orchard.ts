// ./src/module/Orchard.ts

import Achievements from './Achievements';
import Module from './Module';
import type Robin from './Robin';
import trade from '../assets/orchard/trade.json';
import {
  species,
  harvestTiers,
  soilMultipliers,
  offSeasonYieldMultiplier,
  orchardSites,
  clearingStepMinutes,
  fruitingDays,
  harvestBatches,
  moistureDays,
  fertiliserDays,
  type OrchardSpecies,
  type OrchardFruit
} from './Orchard/Species';

export type OrchardSite = 'temple' | 'farm';
export type OrchardTool = 'plant' | 'water' | 'fertiliser' | 'harvest' | 'shovel';

export interface OrchardTree {
  species: OrchardSpecies;
  growth: number;
  moisture: number;
  fertiliser: number;
  harvests: number;
  /** 成熟后的结果进度。缺水或枝头已满时暂停，结出一批后归零。 */
  fruiting: number;
  /** 最多保留三批收成。果实种类在结果时确定，采收不会再改写。 */
  fruit: { type: OrchardFruit; amount: number }[];
}

interface OrchardSoil {
  base_quality: number;
  quality: number;
}

interface OrchardWorkerReport {
  day: number;
  watered: number;
  fertilised: number;
  no_fertiliser: boolean;
  kept: Partial<Record<OrchardFruit, number>>;
  irrigation: boolean;
  rain: boolean;
  off_season: boolean;
  left_fruit: boolean;
  delivered?: number;
  income?: number;
  renewal_failed?: boolean;
}

export interface OrchardReceipt {
  tool: OrchardTool;
  helped?: boolean;
  /** 开垦回执保存剩余工时，零表示这块土地刚刚整理完毕。 */
  clearing?: number;
  kept?: Partial<Record<OrchardFruit, number>>;
  donated?: number;
}

const fruitTypes = [...Object.keys(species), 'blood_lemon'] as OrchardFruit[];

interface OrchardSale {
  day: number;
  source?: 'farm' | 'shop' | 'market' | 'haul';
  type: OrchardFruit;
  amount: number;
  income: number;
}

interface OrchardState {
  site: OrchardSite;
  tool: OrchardTool;
  selected: number;
  day: number;
  order: { type: 'lemon' | 'orange'; amount: number; price: number; deadline: number; status: 'pending' | 'fulfilled' | 'cancelled' | 'late' } | null;
  order_day: number;
  orders_completed: number;
  last_supply_day: number;
  farm_contract: { type: OrchardFruit; amount: number; price: number; bond: number; deadline: number; status: 'pending' | 'fulfilled' | 'failed' } | null;
  contract_day: number;
  contracts_completed: number;
  contract_result: boolean;
  restock_credit: number;
  regular_day: number;
  regular_visits: number;
  regular_favourite: OrchardFruit | null;
  alex_delivery_day: number;
  sales: OrchardSale[];
  reserve: Partial<Record<OrchardFruit, number>>;
  sold_day: number;
  sold_today: number;
  sales_income: number;
  worker_expenses: number;
  seed_expenses: number;
  haul_expenses?: number;
  seed: OrchardSpecies;
  known: OrchardSpecies[];
  soil: Record<OrchardSite, OrchardSoil[]>;
  unlocked: Record<OrchardSite, boolean>;
  /** 各树位剩余开垦工时。零值的树位才可种植，铲树不会重置。 */
  clearing: Record<OrchardSite, number[]>;
  help_day: number;
  irrigation_since: number;
  worker: {
    hired: boolean;
    paid_from: number;
    paid_until: number;
    last_shift: number;
    pick: boolean;
    fertilise: boolean;
    auto_renew?: boolean;
    haul?: boolean;
  };
  temple: (OrchardTree | null)[];
  farm: (OrchardTree | null)[];
}

const defaults: OrchardState = {
  site: 'temple',
  tool: 'water',
  selected: 0,
  day: -1,
  order: null,
  order_day: -1,
  orders_completed: 0,
  last_supply_day: -1,
  farm_contract: null,
  contract_day: -1,
  contracts_completed: 0,
  contract_result: false,
  restock_credit: 0,
  regular_day: -1,
  regular_visits: 0,
  regular_favourite: null,
  alex_delivery_day: -1,
  sales: [],
  reserve: {},
  sold_day: -1,
  sold_today: 0,
  sales_income: 0,
  worker_expenses: 0,
  seed_expenses: 0,
  seed: 'apple',
  known: [],
  soil: { temple: [], farm: [] },
  unlocked: { temple: false, farm: false },
  clearing: { temple: [], farm: [] },
  help_day: -1,
  irrigation_since: -1,
  worker: { hired: false, paid_from: 0, paid_until: 0, last_shift: -1, pick: false, fertilise: false },
  temple: Array(orchardSites.temple.plots).fill(null),
  farm: Array(orchardSites.farm.plots).fill(null)
};

class Orchard extends Module {
  /** 只用于下一次界面的操作回执，不参与存档或生长结算。 */
  public notice?: OrchardReceipt;
  public constructor(core: typeof maplebirch) {
    super(core, 'Orchard', defaults);
  }

  public get state(): OrchardState {
    return V.Orchard;
  }

  public override preInit(): void {
    super.preInit();
    Achievements.add(this.core, 'Orchard');
    // 天气变化时及时补水。再次读入同一雨天存档不会重触发 onEnter，推进前仍需核对。
    this.core.dynamic.regWeatherEvent(':deadwood-orchard-rain', {
      condition: () => !!V.Orchard && !V.statFreeze,
      precip: 'rain',
      onEnter: () => this.advance()
    });
    this.core.dynamic.regTimeEvent('onBefore', ':deadwood-orchard-sync', {
      action: () => this.advance()
    });
    // 只在跨日时结算生长，单次跨过多天仍由 advance 按日期逐日处理。
    this.core.dynamic.regTimeEvent('onDay', ':deadwood-orchard-growth', {
      exact: true,
      action: () => {
        this.advance();
      }
    });
    this.core.dynamic.regTimeEvent('onHour', ':deadwood-orchard-worker', { exact: true, action: () => this.advance() });
    this.core.dynamic.regTimeEvent('onTimeTravel', ':deadwood-orchard-travel', {
      cond: data => data.direction === 'forward',
      action: () => this.advance()
    });
  }

  public get canSupplyRobin(): boolean {
    return (
      !!this.core.get('Robin') &&
      !!V.RobinExpansion?.shop &&
      C.npc.Robin?.init === 1 &&
      !V.robinmissing &&
      V.robin.timer.hurt === 0 &&
      V.RobinExpansion.asylum.status !== 'admitted' &&
      window.getRobinLocation() === 'shop' &&
      V.location === 'deadwood_robin_shop' &&
      Time.hour >= 9 &&
      Time.hour < 21 &&
      this.canTrade
    );
  }

  public get canOrder(): boolean {
    return this.canSupplyRobin && this.orderStatus !== 'pending' && (this.state.order_day < 0 || Time.days - this.state.order_day >= trade.orderInterval);
  }

  public get orderStatus(): 'pending' | 'fulfilled' | 'cancelled' | 'late' | null {
    const order = this.state.order;
    return order?.status === 'pending' && Time.days > order.deadline ? 'late' : (order?.status ?? null);
  }

  public get orderQuantity(): number {
    return this.state.orders_completed ? Math.max(1, Math.floor(trade.repeatQuantity * (Time.season === 'winter' ? trade.winterOrderMultiplier : 1))) : trade.trialQuantity;
  }

  private get canTrade(): boolean {
    return V.exposed <= 0 && V.stress < V.stressmax && V.combat !== 1 && !V.gag && !window.pcAreArmsBound('both') && (this.available('farm') || this.available('temple'));
  }

  public requestOrder(type: 'lemon' | 'orange'): boolean {
    if (!this.canOrder || !['lemon', 'orange'].includes(type)) return false;
    const price = setup.foodstuff[type]?.shop?.sell_price;
    if (typeof price !== 'number' || !Number.isFinite(price) || price <= 0) return false;
    this.state.order = {
      type,
      amount: this.orderQuantity,
      price: Math.max(1, Math.floor(price * trade.bulkPriceMultiplier)),
      deadline: Time.days + trade.orderDays,
      status: 'pending'
    };
    this.state.order_day = Time.days;
    return true;
  }

  public supplyRobin(): boolean {
    const order = this.state.order;
    const shop = (this.core.get('Robin') as Robin | undefined)?.shop;
    if (!this.canSupplyRobin || !shop || !order || this.orderStatus !== 'pending') return false;
    if ((V.foodstuff[order.type]?.amount ?? 0) - (this.state.reserve[order.type] ?? 0) < order.amount) return false;
    const income = order.price * order.amount;
    if (!shop.spend(income / 100)) return false;
    V.foodstuff[order.type].amount -= order.amount;
    order.status = 'fulfilled';
    this.state.orders_completed++;
    this.state.last_supply_day = Time.days;
    this.state.restock_credit = trade.restockDiscount;
    this.recordSale(order.type, order.amount, income, 'shop');
    if ([...this.state.temple, ...this.state.farm].some(tree => tree?.species === order.type && tree.harvests > 0)) this.core.SugarCube.Wikifier.wikifyEval('<<earnFeat "Deadwood Orchard Supply">>');
    this.core.SugarCube.Wikifier.wikifyEval('<<npcincr Robin love 1>>');
    return true;
  }

  public get freshSupplySales(): number {
    return this.state.last_supply_day >= 0 && Time.days - this.state.last_supply_day <= trade.orderInterval ? trade.freshSupplyWeeklySales : 0;
  }

  public get contractQuantities(): readonly number[] {
    return trade.contractQuantities;
  }

  public get contractFruit(): OrchardFruit[] {
    return this.state.known.filter(type => typeof setup.foodstuff[type]?.shop?.sell_price === 'number');
  }

  public get canContract(): boolean {
    return this.canDeliver && this.state.farm_contract?.status !== 'pending' && (this.state.contract_day < 0 || Time.days - this.state.contract_day >= trade.orderInterval);
  }

  public contractQuote(type: OrchardFruit, amount: number): { price: number; bond: number } | null {
    if (!fruitTypes.includes(type) || !trade.contractQuantities.includes(amount)) return null;
    const nativePrice = setup.foodstuff[type]?.shop?.sell_price;
    if (typeof nativePrice !== 'number' || !Number.isFinite(nativePrice) || nativePrice <= 0) return null;
    const price = Math.max(1, Math.floor(nativePrice * trade.contractPriceMultiplier));
    return { price, bond: Math.ceil(price * amount * trade.contractBondRate) };
  }

  /** 长单锁定单价，押金由玩家实际支付，不预支可反复领走的货款。 */
  public acceptContract(type: OrchardFruit, amount: number): boolean {
    const quote = this.contractQuote(type, amount);
    if (!this.canContract || !this.contractFruit.includes(type) || !quote || V.money < quote.bond) return false;
    this.core.SugarCube.Wikifier.wikifyEval(`<<money ${-quote.bond} 'farm'>>`);
    this.state.farm_contract = { type, amount, ...quote, deadline: Time.days + trade.contractDays, status: 'pending' };
    this.state.contract_day = Time.days;
    return true;
  }

  public fulfillContract(): boolean {
    const contract = this.state.farm_contract;
    if (!this.canDeliver || !contract || contract.status !== 'pending' || Time.days > contract.deadline) return false;
    const item = this.stock.find(fruit => fruit.type === contract.type);
    if (!item || item.amount - item.reserve < contract.amount) return false;
    V.foodstuff[contract.type].amount -= contract.amount;
    contract.status = 'fulfilled';
    this.state.contracts_completed++;
    this.core.get('Finance')?.recognition.award('business', 'orchard-contract', 3);
    this.recordSale(contract.type, contract.amount, contract.price * contract.amount, 'farm');
    this.core.SugarCube.Wikifier.wikifyEval(`<<money ${contract.bond} 'farm'>>`);
    this.core.SugarCube.Wikifier.wikifyEval('<<npcincr Alex love 2>>');
    return true;
  }

  public get canMeetRegular(): boolean {
    return V.location === 'market' && Time.hour < 21 && Time.dayState !== 'night' && this.canTrade && this.state.regular_day !== Time.days;
  }

  public get regularStock(): Orchard['stock'] {
    const displayed = this.stock.filter(item => item.amount - item.reserve >= 5 && V.foodstuff[item.type].marketStall !== false);
    const preferred = displayed.find(item => item.type === this.state.regular_favourite);
    return this.state.regular_visits >= 3 && preferred ? [preferred] : displayed;
  }

  public sellRegular(type: OrchardFruit): boolean {
    if (this.core.passage.title !== 'Deadwood Orchard Regular' || !this.canMeetRegular || !V.per_npc?.deadwood_orchard_regular) return false;
    const item = this.regularStock.find(item => item.type === type);
    if (!item) return false;
    const price = setup.foodstuff[type]?.shop?.sell_price;
    if (typeof price !== 'number' || !Number.isFinite(price) || price <= 0) return false;
    const income = Math.round(price) * 5;
    V.foodstuff[type].amount -= 5;
    this.state.regular_day = Time.days;
    this.state.regular_visits++;
    this.state.regular_favourite ??= type;
    this.recordSale(type, 5, income, 'market');
    return true;
  }

  private recordSale(type: OrchardFruit, amount: number, income: number, source: 'farm' | 'shop' | 'market' | 'haul', day = Time.days): void {
    if (source === 'haul') this.core.get('Finance')!.creditBankPennies(income);
    else this.core.SugarCube.Wikifier.wikifyEval(`<<money ${income} '${source}'>>`);
    this.state.sales_income += income;
    this.state.sales.push({ day, source, type, amount, income });
    if (this.state.sales.length > trade.ledgerEntries) this.state.sales.shift();
  }

  /** 直接读取原版食品库存，野外采摘与果园收成都可交货。 */
  public get stock(): { type: OrchardFruit; amount: number; price: number; reserve: number }[] {
    return fruitTypes.flatMap(type => {
      const amount = V.foodstuff[type]?.amount ?? 0;
      const price = setup.foodstuff[type]?.shop?.sell_price;
      if (amount < 1 || typeof price !== 'number' || !Number.isFinite(price) || price <= 0) return [];
      return [{ type, amount, price: Math.max(1, Math.floor(price * trade.bulkPriceMultiplier)), reserve: this.state.reserve[type] ?? 0 }];
    });
  }

  public get canDeliver(): boolean {
    return (
      ['Deadwood Reblooms Orchard Trade', 'Deadwood Orchard Farm Contract'].includes(this.core.passage.title) &&
      V.location === 'alex_farm' &&
      this.state.site === 'farm' &&
      this.available('farm') &&
      this.canWork &&
      V.combat !== 1 &&
      !this.farmInterrupted &&
      V.farm_work?.alex === 'admin'
    );
  }

  public get deliveryRemaining(): number {
    return Math.max(0, trade.bulkDailyLimit - (this.state.sold_day === Time.days ? this.state.sold_today : 0));
  }

  public get deliveryMinutes(): number {
    return trade.deliveryMinutes;
  }

  public keepFruit(type: OrchardFruit, amount: number): void {
    if (this.core.passage.title !== 'Deadwood Reblooms Orchard Trade' || !this.available(this.state.site)) return;
    if (!fruitTypes.includes(type) || !Number.isSafeInteger(amount) || amount < 0) return;
    this.state.reserve[type] = amount;
  }

  public displayFruit(type: OrchardFruit): void {
    if (this.core.passage.title !== 'Deadwood Reblooms Orchard Trade' || !this.available(this.state.site)) return;
    if (!fruitTypes.includes(type) || !V.foodstuff[type]) return;
    V.foodstuff[type].marketStall = V.foodstuff[type].marketStall === false;
  }

  /** 每日收购量有限，只交付超出保留数量的库存，不自动卖掉玩家的水果。 */
  public deliver(type: OrchardFruit, amount: number): boolean {
    if (!this.canDeliver || !Number.isSafeInteger(amount) || amount < 1 || amount > this.deliveryRemaining) return false;
    const item = this.stock.find(item => item.type === type);
    if (!item || amount > item.amount - item.reserve) return false;
    const income = item.price * amount;
    if (!Number.isSafeInteger(income)) return false;
    V.foodstuff[type].amount -= amount;

    if (this.state.sold_day !== Time.days) {
      this.state.sold_day = Time.days;
      this.state.sold_today = 0;
    }
    this.state.sold_today += amount;
    this.recordSale(type, amount, income, 'farm');
    if (this.state.alex_delivery_day !== Time.days) {
      this.state.alex_delivery_day = Time.days;
      this.core.SugarCube.Wikifier.wikifyEval('<<npcincr Alex love 1>>');
    }
    return true;
  }

  /** 果实使用原版食品目录，果树不写入原版作物地块。 */
  public available(site: OrchardSite): boolean {
    return this.state.unlocked[site] && (site === 'farm' ? V.farm_stage >= 12 : ['monk', 'priest'].includes(V.temple_rank));
  }

  public ready(site: OrchardSite): boolean {
    return (
      !this.state.unlocked[site] &&
      this.canWork &&
      (site === 'farm' ? V.farm_stage >= 12 && V.farm_work?.alex === 'admin' && !this.farmInterrupted : ['monk', 'priest'].includes(V.temple_rank) && V.temple_garden >= 100)
    );
  }

  public unlock(site: OrchardSite): boolean {
    if (!this.ready(site)) return false;
    this.advance();
    this.state.unlocked[site] = true;
    const data = orchardSites[site];
    this.state.clearing[site] = this.state[site].map((_, index) => (index < data.initialPlots ? 0 : data.clearingMinutes));
    this.state.soil[site] = this.state[site].map(() => {
      const quality = random(1, 3);
      return { base_quality: quality, quality };
    });
    // 神殿首次开放时保留一棵成树，果实仍由正常季节结算生成。
    if (site === 'temple') this.state.temple[0] ??= { species: 'plum', growth: species.plum.matureDays, moisture: moistureDays, fertiliser: 0, harvests: 0, fruiting: 0, fruit: [] };
    return true;
  }

  public cleared(site: OrchardSite, index: number): boolean {
    return this.state.unlocked[site] && this.state.clearing[site][index] === 0;
  }

  public get canWork(): boolean {
    return Weather.dayState !== 'night' && V.exposed <= 0 && V.stress < V.stressmax && !window.pcAreArmsBound('both');
  }

  public get farmInterrupted(): boolean {
    return !!V.farm_attacked || (V.farm_attack_timer === 0 && Time.hour >= 21);
  }

  /** 九块原版田地均已接通后，边缘果园才能共用农场水源。 */
  public get irrigated(): boolean {
    return this.available('farm') && V.farm?.irrigation >= 9;
  }

  public get canAskAlex(): boolean {
    return this.available('farm') && this.canWork && !this.farmInterrupted && V.farm_work?.alex === 'admin' && this.state.help_day < Math.floor(Time.date.timeStamp / 86400);
  }

  public get workerWage(): number {
    return 25000;
  }

  public get carrier() {
    return V.per_npc?.deadwood_orchard_carrier ?? null;
  }

  public get deliveryFee(): number {
    return trade.haulFee;
  }

  public get candidate(): boolean {
    return !this.state.worker.hired && !!V.per_npc?.deadwood_orchard_worker;
  }

  public get workerActive(): boolean {
    return this.state.worker.hired && !!V.per_npc?.deadwood_orchard_worker && this.state.worker.paid_until > Time.date.timeStamp;
  }

  /** 汇报跟随雇工本人保存，辞退后不会显示上一位的工作记录。 */
  public get workerReport(): OrchardWorkerReport | null {
    return V.per_npc?.deadwood_orchard_worker?.orchard_report ?? null;
  }

  public get canTalkWorker(): boolean {
    return (
      this.available('farm') &&
      this.workerActive &&
      this.canWork &&
      !this.farmInterrupted &&
      !V.farm_assault &&
      Time.hour >= 8 &&
      Time.hour < 12 &&
      this.workerReport?.day === Math.floor(Time.date.timeStamp / 86400)
    );
  }

  public get canPayWorker(): boolean {
    return this.available('farm') && this.state.worker.hired && !!V.per_npc?.deadwood_orchard_worker && V.money >= this.workerWage && this.state.worker.paid_until <= Time.date.timeStamp + 7 * 86400;
  }

  public hire(): boolean {
    if (this.core.passage.title !== 'Deadwood Reblooms Orchard Hire' || !this.available('farm') || !this.candidate || V.money < this.workerWage) return false;
    this.advance();
    this.core.SugarCube.Wikifier.wikifyEval(`<<money -${this.workerWage} 'farm'>>`);
    this.state.worker_expenses += this.workerWage;
    this.state.worker.hired = true;
    this.state.worker.paid_from = Time.date.timeStamp;
    this.state.worker.paid_until = Time.date.timeStamp + 7 * 86400;
    return true;
  }

  public payWorker(): boolean {
    if (!this.canPayWorker) return false;
    this.advance();
    this.core.SugarCube.Wikifier.wikifyEval(`<<money -${this.workerWage} 'farm'>>`);
    this.state.worker_expenses += this.workerWage;
    const worker = this.state.worker;
    if (worker.paid_until <= Time.date.timeStamp) worker.paid_from = Time.date.timeStamp;
    worker.paid_until = Math.max(Time.date.timeStamp, worker.paid_until) + 7 * 86400;
    return true;
  }

  public setWorkerPicking(pick: boolean): void {
    this.advance();
    this.state.worker.pick = pick;
  }

  public setWorkerFertilising(fertilise: boolean): void {
    this.advance();
    this.state.worker.fertilise = fertilise;
  }

  public arrangeWorker(task: 'auto_renew' | 'haul', enabled: boolean): void {
    this.advance();
    if (!this.state.worker.hired || !this.available('farm')) return;
    if (enabled && (!this.core.get('Finance') || !V.Finance?.bank.debit_card)) return;
    if (task === 'haul' && enabled && (this.core.passage.title !== 'Deadwood Reblooms Orchard Delivery' || !this.carrier)) return;
    this.state.worker[task] = enabled;
  }

  public dismissWorker(): boolean {
    if (this.core.passage.title !== 'Deadwood Reblooms Orchard Dismiss') return false;
    this.advance();
    this.core.SugarCube.Wikifier.wikifyEval("<<clearNPC 'deadwood_orchard_worker'>>");
    this.state.worker = clone(defaults.worker);
    return true;
  }

  public get varieties(): OrchardSpecies[] {
    return this.state.known.filter(key => !!setup.foodstuff[key]);
  }

  /** 采摘发现种源，神殿花园的酸橙另有入口。只在未知种源上掷骰。 */
  public discover(type: string, source: 'pick' | 'garden'): boolean {
    const key = type as OrchardSpecies;
    if (!species[key] || species[key].seedSource !== source || this.state.known.includes(key)) return false;
    if (source === 'pick' && random(1, 100) + window.currentSkillValue('tending') / 10 < 95) return false;
    return this.learn(key);
  }

  private learn(type: OrchardSpecies): boolean {
    if (!setup.foodstuff[type] || this.state.known.includes(type)) return false;
    if (!this.state.known.length) this.state.seed = type;
    this.state.known.push(type);
    return true;
  }

  /** 特殊种源只购买一次，之后可以反复播种。普通种源不出售。 */
  public buySeed(type: OrchardSpecies): boolean {
    const data = species[type];
    if (!data || data.seedSource !== 'shop' || !data.seedPrice || !setup.foodstuff[type] || this.state.known.includes(type)) return false;
    if (this.core.passage.title !== 'Supermarket' || Time.dayState === 'night' || Time.hour === 21 || !this.canWork || V.money < data.seedPrice) return false;
    this.core.SugarCube.Wikifier.wikifyEval(`<<money -${data.seedPrice} 'shopping'>>`);
    this.state.seed_expenses += data.seedPrice;
    return this.learn(type);
  }

  public stage(tree: OrchardTree | null): number {
    if (!tree) return -1;
    const data = species[tree.species];
    return tree.growth < data.saplingDays ? 0 : tree.growth < data.matureDays ? 1 : 2;
  }

  public ripe(tree: OrchardTree | null): boolean {
    return !!tree?.fruit.length;
  }

  /** 沿用旧果园的树龄、技能、树种和土壤产量，接入当前原版的收成倍率字段。 */
  public yield(tree: OrchardTree, quality: number, season = Time.season): number {
    const tier = harvestTiers.filter(tier => tree.harvests >= tier.harvests).at(-1)!;
    const upper = Math.floor(window.currentSkillValue('tending') / tier.skillDivisor + tier.upperBase);
    const amount = random(10, Math.max(10, upper));
    const data = species[tree.species];
    const multiplier = data.yieldMultiplier * soilMultipliers[Math.clamp(quality - 1, 0, 3)] * (data.fruitSeasons.includes(season) ? 1 : offSeasonYieldMultiplier);
    return Math.trunc(amount * multiplier * (V.backgroundTraits.includes('greenthumb') ? 1.2 : 1) * (V.settings.tendingYieldModifier / 5));
  }

  /** 按午夜跨日逐天结算，不能用从开局时刻计算的 Time.days 代替日历日期。 */
  public advance(day = Math.floor(Time.days)): void {
    // 回忆与画中场景使用冻结的玩家状态，不能让这些场景的日期影响果园。
    if (!V.Orchard || V.statFreeze || !Number.isInteger(day) || day < 0 || day > Math.floor(Time.days)) return;
    const state = this.state;
    const current = Math.floor(Time.date.timeStamp / 86400);
    const today = current - (Math.floor(Time.days) - day);
    const timestamp = Math.min(Time.date.timeStamp, (today + 1) * 86400 - 1);
    if (state.day < 0) state.day = today;
    // 原版先补算整次 pass 的施工。刚观察到的竣工不能倒推到过去每一天。
    if (this.irrigated && state.irrigation_since < 0) state.irrigation_since = Time.date.timeStamp;
    if (!this.irrigated) state.irrigation_since = -1;
    while (state.day < today) {
      // 先结算这一天的早班，再结算随后的午夜。长时间跳过不能提前采到未来的水果。
      this.workShift(state.day, timestamp);
      const midnight = new window.DateTime((state.day + 1) * 86400);
      const season = Time.getSeason(new window.DateTime(midnight).addDays(-1));
      const bloodMoon = Weather.getBloodMoon(midnight);
      for (const site of ['temple', 'farm'] as const) {
        for (const [index, tree] of state[site].entries()) {
          const soil = state.soil[site][index];
          if (!tree) continue;
          const data = species[tree.species];
          if (site === 'farm' && this.irrigated && state.irrigation_since < midnight.timeStamp) tree.moisture = moistureDays;
          const wasMature = tree.growth >= data.matureDays;
          if (tree.growth < data.matureDays) {
            if (tree.moisture > 0) tree.growth = Math.min(data.matureDays, tree.growth + (tree.fertiliser > 0 ? 2 : 1));
          }
          tree.fruiting ??= 0;
          if (wasMature && tree.moisture > 0 && tree.fruit.length < harvestBatches) tree.fruiting++;
          if (tree.fruiting >= fruitingDays && tree.fruit.length < harvestBatches) {
            const type = bloodMoon && data.bloodMoonFruit ? data.bloodMoonFruit : tree.species;
            if (setup.foodstuff[type]) {
              const amount = this.yield(tree, soil.quality, season);
              tree.fruit.push({ type, amount });
              tree.fruiting = 0;
            }
          }
          tree.moisture = Math.max(0, tree.moisture - 1);
          if (tree.fertiliser > 0 && --tree.fertiliser === 0 && !V.backgroundTraits.includes('greenthumb')) soil.quality = soil.base_quality;
        }
      }
      state.day++;
    }
    if (state.day === today) this.workShift(today, timestamp);
    // 补算到期前的早班后才判违约，避免一次跳过多天时丢失预留的合约货物。
    if (state.farm_contract?.status === 'pending' && day > state.farm_contract.deadline) {
      state.farm_contract.status = 'failed';
      this.core.SugarCube.Wikifier.wikifyEval('<<npcincr Alex love -2>>');
    }
    // 只应用当前已知的雨水，不捏造原版未保存的历史降雨。
    if (state.day !== current) return;
    for (const site of ['temple', 'farm'] as const) {
      if (Weather.precipitation !== 'rain' && !(site === 'farm' && this.irrigated)) continue;
      for (const tree of state[site]) {
        if (!tree) continue;
        tree.moisture = moistureDays;
      }
    }
  }

  /** 普通雇员直接照料果树，不载入战斗 NPC 槽，也不消耗玩家时间或授予玩家经验。 */
  private workShift(day: number, timestamp = Time.date.timeStamp): void {
    const worker = this.state.worker;
    const morning = day * 86400 + 8 * 3600;
    if (!worker.hired || day <= worker.last_shift || morning > timestamp) return;
    worker.last_shift = day;
    if (morning < worker.paid_from || !V.per_npc?.deadwood_orchard_worker || !this.available('farm') || V.farm_assault) return;
    const npc = V.per_npc.deadwood_orchard_worker;
    const finance = this.core.get('Finance');
    if (morning >= worker.paid_until) {
      if (!worker.auto_renew || !finance || !V.Finance.bank.debit_card || finance.payFromBankPennies(this.workerWage) !== 'ok') {
        npc.orchard_report = {
          day,
          watered: 0,
          fertilised: 0,
          no_fertiliser: false,
          kept: {},
          irrigation: false,
          rain: false,
          off_season: false,
          left_fruit: false,
          renewal_failed: !!worker.auto_renew
        };
        return;
      }
      // 从实际恢复早班起算，不补收停工期间的工资，也不补做停工期间的工作。
      worker.paid_from = morning;
      worker.paid_until = morning + 7 * 86400;
      this.state.worker_expenses += this.workerWage;
    }
    const season = Time.getSeason(new window.DateTime(morning));
    const report: OrchardWorkerReport = {
      day,
      watered: 0,
      fertilised: 0,
      no_fertiliser: false,
      kept: {},
      irrigation: this.irrigated && this.state.irrigation_since <= morning,
      // 跨过八点的 pass 会在结束时结算。只使用当天早班时段的雨水，不倒填历史天气。
      rain: day === Math.floor(Time.date.timeStamp / 86400) && Time.date.hour === 8 && Weather.precipitation === 'rain',
      off_season: false,
      left_fruit: false
    };
    this.state.farm.forEach((tree, index) => {
      if (!tree || !this.cleared('farm', index)) return;
      if (tree.moisture === 0) {
        tree.moisture = moistureDays;
        if (!report.irrigation && !report.rain) report.watered++;
      }
      if (worker.fertilise && tree.fertiliser === 0 && (this.stage(tree) < 2 || (window.currentSkillValue('tending') >= 400 && this.state.soil.farm[index].quality < 4))) {
        if (this.fertilise(tree, this.state.soil.farm[index])) report.fertilised++;
        else if (V.fertiliser.current < 1) report.no_fertiliser = true;
      }
      if (this.stage(tree) === 2 && !species[tree.species].fruitSeasons.includes(season)) report.off_season = true;
      if (!worker.pick && this.ripe(tree)) report.left_fruit = true;
      if (worker.pick && this.ripe(tree)) {
        const receipt = this.collect('farm', index);
        for (const [type, amount] of Object.entries(receipt?.kept ?? {})) report.kept[type as OrchardFruit] = (report.kept[type as OrchardFruit] ?? 0) + amount!;
      }
    });
    if (worker.haul && this.carrier && finance && V.Finance.bank.debit_card) {
      const gameDay = Math.floor(Time.days) - (Math.floor(Time.date.timeStamp / 86400) - day);
      let remaining = Math.max(0, trade.bulkDailyLimit - (this.state.sold_day === gameDay ? this.state.sold_today : 0));
      const cargo = this.stock
        .filter(item => item.type !== 'blood_lemon')
        .flatMap(item => {
          const orders = [this.state.order, this.state.farm_contract];
          const promised = orders.reduce((total, order) => total + (order?.status === 'pending' && order.deadline >= gameDay && order.type === item.type ? order.amount : 0), 0);
          const amount = Math.clamp(item.amount - item.reserve - promised, 0, remaining);
          remaining -= amount;
          return amount > 0 ? [{ ...item, amount }] : [];
        });
      const income = cargo.reduce((total, item) => total + item.amount * item.price, 0);
      if (income > trade.haulFee) {
        if (this.state.sold_day !== gameDay) {
          this.state.sold_day = gameDay;
          this.state.sold_today = 0;
        }
        for (const item of cargo) {
          V.foodstuff[item.type].amount -= item.amount;
          this.state.sold_today += item.amount;
          this.recordSale(item.type, item.amount, item.price * item.amount, 'haul', gameDay);
        }
        finance.payFromBankPennies(trade.haulFee);
        this.state.haul_expenses = (this.state.haul_expenses ?? 0) + trade.haulFee;
        report.delivered = cargo.reduce((total, item) => total + item.amount, 0);
        report.income = income - trade.haulFee;
        this.carrier.orchard_deliveries = (this.carrier.orchard_deliveries ?? 0) + 1;
      }
      this.carrier.orchard_delivery = { day, amount: report.delivered ?? 0, income: report.income ?? 0 };
    }
    npc.orchard_report = report;
    npc.orchard_shifts = (npc.orchard_shifts ?? 0) + 1;
  }

  /** 返回成功时的耗时。无效操作不扣材料、不增加技能、不推进时间。 */
  public act(site: OrchardSite, index: number, tool: OrchardTool, helped = false): number {
    if (!this.available(site) || !this.canWork || (site === 'farm' && this.farmInterrupted)) return 0;
    this.advance();
    if (helped && (site !== 'farm' || !this.canAskAlex || !['shovel', 'water', 'harvest'].includes(tool))) return 0;
    const plots = this.state[site];
    if (!Number.isInteger(index) || index < 0 || index >= plots.length) return 0;
    const clearing = this.state.clearing[site];
    if (!this.cleared(site, index)) {
      // 从已整理土地向外扩展，只能开垦紧邻的下一树位。每次工作保留进度。
      if (tool !== 'shovel' || index !== clearing.findIndex(minutes => minutes > 0)) return 0;
      const work = Math.min(clearingStepMinutes, clearing[index]);
      const minutes = helped ? work / 2 : work;
      clearing[index] -= work;
      if (helped) this.state.help_day = Math.floor(Time.date.timeStamp / 86400);
      this.notice = { tool, helped, clearing: clearing[index] };
      return minutes;
    }
    const tree = plots[index];
    const soil = this.state.soil[site][index];
    switch (tool) {
      case 'plant':
        if (tree || !this.varieties.includes(this.state.seed)) return 0;
        plots[index] = {
          species: this.state.seed,
          growth: 0,
          moisture: Weather.precipitation === 'rain' || (site === 'farm' && this.irrigated) ? moistureDays : 0,
          fertiliser: 0,
          harvests: 0,
          fruiting: 0,
          fruit: []
        };
        return 10;
      case 'water':
        if (!tree || tree.moisture > 0) return 0;
        tree.moisture = moistureDays;
        if (helped) this.state.help_day = Math.floor(Time.date.timeStamp / 86400);
        this.notice = { tool, helped };
        return helped ? 2.5 : 5;
      case 'fertiliser':
        return tree && this.fertilise(tree, soil) ? 5 : 0;
      case 'harvest': {
        const receipt = this.collect(site, index);
        if (!receipt) return 0;
        if (helped) this.state.help_day = Math.floor(Time.date.timeStamp / 86400);
        this.notice = { ...receipt, helped };
        return helped ? 5 : 10;
      }
      case 'shovel':
        if (!tree || helped) return 0;
        plots[index] = null;
        // 铲树不能重新抽取这块土地的基础质量。
        if (!V.backgroundTraits.includes('greenthumb')) soil.quality = soil.base_quality;
        return 15;
    }
  }

  /** 玩家和雇员共用采收规则。调用者负责时间、经验和回执。 */
  private collect(site: OrchardSite, index: number): OrchardReceipt | undefined {
    const tree = this.state[site][index];
    if (!tree || !this.ripe(tree) || tree.fruit.some(crop => !setup.foodstuff[crop.type])) return;
    const totals: Partial<Record<OrchardFruit, number>> = {};
    for (const crop of tree.fruit) totals[crop.type] = (totals[crop.type] ?? 0) + crop.amount;
    const kept: Partial<Record<OrchardFruit, number>> = {};
    let donated = 0;
    // 分别分配各类水果，普通柠檬与血柠可以同时留在同一棵树上。
    for (const [type, amount] of Object.entries(totals)) {
      const share = site === 'temple' ? Math.max(1, Math.floor(amount / 2)) : amount;
      kept[type as OrchardFruit] = share;
      donated += amount - share;
      this.core.SugarCube.Wikifier.wikifyEval(`<<tending_give '${type}' ${share}>>`);
    }
    if (donated > 0) this.core.SugarCube.Wikifier.wikifyEval('<<grace 1 monk>>');
    tree.fruit = [];
    tree.harvests++;
    return { tool: 'harvest', kept, donated };
  }

  /** 玩家与雇工共用同一份肥料和肥效规则，雇工不领取玩家经验。 */
  private fertilise(tree: OrchardTree, soil: OrchardSoil): boolean {
    if (tree.fertiliser > 0 || V.fertiliser.current < 1) return false;
    if (this.stage(tree) === 2) {
      if (window.currentSkillValue('tending') < 400 || soil.quality >= 4) return false;
      soil.quality++;
    }
    tree.fertiliser = fertiliserDays;
    V.fertiliser.current--;
    V.fertiliser.used++;
    return true;
  }
}

declare module '@scml-dol-maplebirch/types' {
  interface Extensions {
    readonly Orchard: Orchard;
  }
}

export default Orchard;
