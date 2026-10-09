// ./src/module/Finance/Industry/Laboratory.ts

import terms from '../../../assets/finance/laboratory.json';
import type Finance from '../../Finance';
import type Industry from '../Industry';
import type { FactoryState } from '../Industry';

type Ingredient = 'phial' | 'flower';
type Buyer = 'compound' | 'broker' | 'shop';
type Contact = 'remy' | 'harper' | 'sirris' | 'sydney';

interface Batch {
  units: number;
  expires_day: number;
  taint: number;
}

interface Sale {
  id: number;
  buyer: Buyer;
  units: number;
  price: number;
  deadline: number;
  pay_day: number;
  outcome: 'paid' | 'late' | 'default';
  total: number;
}

export interface LaboratoryState {
  installed: boolean;
  technician: boolean;
  automatic: Ingredient | null;
  raw: Record<Ingredient, number>;
  batches: Batch[];
  job: { ingredient: Ingredient; amount: number; progress: number; work: number } | null;
  offers: Sale[];
  invoices: Sale[];
  offer_week: number;
  spoiled: number;
  result: string;
}

export interface DistributionState {
  exclusive: boolean;
  independent_sales: number;
  compound_sales: number;
  pressure_until: number;
  pressure_level: number;
  corruption_remainder: number;
  remy_knows: boolean;
  harper_knows: boolean;
  harper_site: number | null;
  harper_until: number;
  sirris_knows: boolean;
  shop_approved: boolean;
  sydney_knows: boolean;
  inspected: boolean;
  talks: Partial<Record<Contact, { day: number; choice: 'ask' | 'accept' | 'hire' }>>;
}

export default class Laboratory {
  public readonly terms = terms;

  public static readonly defaults: LaboratoryState = {
    installed: false,
    technician: false,
    automatic: null,
    raw: { phial: 0, flower: 0 },
    batches: [],
    job: null,
    offers: [],
    invoices: [],
    offer_week: -1,
    spoiled: 0,
    result: ''
  };

  public static readonly distribution: DistributionState = {
    exclusive: false,
    independent_sales: 0,
    compound_sales: 0,
    pressure_until: 0,
    pressure_level: 0,
    corruption_remainder: 0,
    remy_knows: false,
    harper_knows: false,
    harper_site: null,
    harper_until: -1,
    sirris_knows: false,
    shop_approved: false,
    sydney_knows: false,
    inspected: false,
    talks: {}
  };

  public constructor(
    private readonly finance: Finance,
    private readonly industry: Industry
  ) {}

  public get state(): LaboratoryState {
    return this.industry.state.laboratory;
  }

  public get trade(): DistributionState {
    return this.finance.state.industry.distribution;
  }

  public get unlocked(): boolean {
    return V.farm_stage >= 9 && (!!V.farm || (V.phials_held ?? 0) > 0 || (V.phials_stored ?? 0) > 0);
  }

  public get available(): boolean {
    return this.industry.available && this.industry.open && this.industry.ready && this.unlocked;
  }

  public get stock(): number {
    return this.state.batches.reduce((sum, batch) => sum + (batch.expires_day > Math.floor(Time.days) ? batch.units : 0), 0);
  }

  public get shopStock(): number {
    return this.state.batches.reduce((sum, batch) => sum + (batch.expires_day > Math.floor(Time.days) && batch.taint === 0 ? batch.units : 0), 0);
  }

  public get competition(): boolean {
    return this.trade.pressure_until > Math.floor(Time.days);
  }

  public get harper(): boolean {
    return this.trade.harper_site === this.industry.state.site && this.trade.harper_until > Math.floor(Time.days) && C.npc.Harper?.state === 'active' && this.state.technician;
  }

  public get harperFee(): number {
    return this.trade.harper_site === this.industry.state.site ? terms.harper_weekly : terms.harper_fee;
  }

  public cost(ingredient: Ingredient, amount: number): number {
    return Math.round(terms[`${ingredient}_cost`] * amount * (1 - Math.clamp((amount - 1) * terms.bulk_discount, 0, terms.maximum_discount)));
  }

  public act(action: 'install' | 'technician' | 'phial' | 'flower' | 'return_phial' | 'return_flower' | 'produce_phial' | 'produce_flower' | 'take' | 'dispatch', amount = 1): boolean {
    const factory = this.industry.state;
    const state = this.state;
    state.result = 'failed';
    if (!this.available || !Number.isSafeInteger(amount) || amount < 0) return false;
    if (action === 'install') {
      if (
        state.installed ||
        !factory.lines.includes('packaging') ||
        factory.lines.length >= factory.line_limit ||
        factory.order ||
        factory.issue ||
        factory.wage_arrears > 0 ||
        factory.overhead_arrears > 0 ||
        factory.cash < terms.installation
      )
        return false;
      factory.cash -= terms.installation;
      factory.spent += terms.installation;
      state.installed = true;
      factory.ready_day = Math.floor(Time.days) + 3;
    } else {
      if (!state.installed) return false;
      if (action === 'technician') {
        if (state.technician || factory.cash < terms.technician_fee || factory.wage_arrears > 0) return false;
        factory.cash -= terms.technician_fee;
        factory.spent += terms.technician_fee;
        state.technician = true;
      } else if (action === 'phial' || action === 'flower') {
        if (!amount || amount > terms.maximum_batch) return false;
        if (action === 'phial') {
          if ((V.phials_held ?? 0) < amount) return false;
          V.phials_held -= amount;
        } else {
          if (!V.plants_known?.includes('strange_flower') || (V.foodstuff.strange_flower?.amount ?? 0) < amount * terms.flower_input) return false;
          V.foodstuff.strange_flower.amount -= amount * terms.flower_input;
        }
        state.raw[action] += amount;
      } else if (action === 'return_phial' || action === 'return_flower') {
        const ingredient = action === 'return_phial' ? 'phial' : 'flower';
        if (!amount || state.raw[ingredient] < amount || (ingredient === 'flower' && !V.foodstuff.strange_flower)) return false;
        state.raw[ingredient] -= amount;
        if (ingredient === 'phial') V.phials_held = (V.phials_held ?? 0) + amount;
        else V.foodstuff.strange_flower.amount += amount * terms.flower_input;
      } else if (action === 'produce_phial' || action === 'produce_flower') {
        if (!this.start(factory, action === 'produce_phial' ? 'phial' : 'flower', amount)) return false;
      } else if (action === 'take') {
        const toys = this.finance.core.SugarCube.setup.sextoys as { index: number; name: string; uses?: number }[] | undefined;
        const item = toys?.find(toy => toy.name === 'aphrodisiac pills');
        if (amount !== 1 || this.stock < 1 || !item || typeof window.sexShopOnBuyClick !== 'function') return false;
        window.sexShopOnBuyClick(item.index, false, 'pink', false);
        this.consume(factory, 1, false);
      } else if (action === 'dispatch') {
        const sale = state.offers.find(offer => offer.id === amount);
        if (
          !sale ||
          sale.deadline < Math.floor(Time.days) ||
          sale.units > (sale.buyer === 'shop' ? this.shopStock : this.stock) ||
          (sale.buyer !== 'compound' && (this.trade.exclusive || this.competition))
        )
          return false;
        this.consume(factory, sale.units, true, sale.buyer === 'shop');
        const total = sale.units * sale.price;
        state.invoices.push({ ...sale, total, pay_day: Math.floor(Time.days) + (sale.outcome === 'late' ? 14 : sale.buyer === 'compound' ? 2 : 5) });
        state.offers = state.offers.filter(offer => offer !== sale);
        if (sale.buyer === 'compound') this.trade.compound_sales += sale.units;
        else {
          this.trade.independent_sales += sale.units;
          const level = Math.floor(this.trade.independent_sales / terms.pressure_threshold);
          if (level > this.trade.pressure_level) {
            this.trade.pressure_level = level;
            this.trade.pressure_until = Math.floor(Time.days) + terms.pressure_days;
          }
        }
        factory.delivered++;
        state.result = 'dispatched';
        return true;
      } else return false;
    }
    state.result = 'ok';
    return true;
  }

  public discuss(person: Contact, choice: 'ask' | 'accept' | 'hire' = 'ask'): boolean {
    const passage = this.finance.core.passage.title;
    const talk = this.trade.talks[person];
    const present =
      person === 'remy'
        ? this.finance.core.get('Orchard')?.remy.available && passage === 'Deadwood Remy Laboratory'
        : person === 'harper'
          ? V.location === 'hospital' && passage === 'Deadwood Harper Laboratory' && !!V.harperSeen?.includes('hospital') && C.npc.Harper?.state === 'active'
          : V.location === 'adult_shop' && passage === (person === 'sirris' ? 'Deadwood Sirris Laboratory' : 'Deadwood Sydney Laboratory');
    if (
      !this.unlocked ||
      !this.industry.available ||
      !present ||
      !this.industry.state.owned ||
      !this.state.installed ||
      (talk?.day === Math.floor(Time.days) && (choice === 'ask' || talk.choice === choice))
    )
      return false;
    if (choice === 'hire') {
      if (person !== 'harper' || !this.trade.inspected || this.trade.harper_until > Math.floor(Time.days) || !this.industry.ready) return false;
      // 先结清已过去的生产日，再开始顾问合约，不能倒填旧批次的加成。
      this.industry.advance(Math.floor(Time.days));
      const factory = this.industry.state;
      if (!this.state.technician || factory.issue || factory.wage_arrears > 0 || factory.overhead_arrears > 0 || factory.cash < this.harperFee) return false;
      const fee = this.harperFee;
      factory.cash -= fee;
      factory.spent += fee;
      this.trade.harper_site = factory.site;
      this.trade.harper_until = Math.floor(Time.days) + terms.harper_days;
    } else if (choice === 'accept') {
      if (
        !['harper', 'sirris'].includes(person) ||
        (person === 'harper' ? this.trade.inspected || this.industry.state.cash < terms.inspection_fee || this.stock < 1 : !this.trade.inspected || this.trade.shop_approved || this.shopStock < 1)
      )
        return false;
      if (person === 'harper') {
        this.industry.state.cash -= terms.inspection_fee;
        this.industry.state.spent += terms.inspection_fee;
        this.trade.inspected = true;
      } else {
        this.trade.shop_approved = true;
        this.state.offers.push({ id: this.industry.state.next_id++, buyer: 'shop', units: 20, price: 2600, deadline: Math.floor(Time.days) + 6, pay_day: 0, outcome: 'paid', total: 0 });
      }
      this.consume(this.industry.state, 1, false, person === 'sirris');
    }
    this.trade[`${person}_knows`] = true;
    this.trade.talks[person] = { day: Math.floor(Time.days), choice };
    return true;
  }

  private start(factory: FactoryState, ingredient: Ingredient, amount: number): boolean {
    const state = factory.laboratory;
    const cost = this.cost(ingredient, amount);
    if (
      !amount ||
      amount > terms.maximum_batch ||
      !state.technician ||
      state.job ||
      factory.order ||
      factory.issue ||
      factory.workers < 2 ||
      factory.morale < 20 ||
      factory.wage_arrears > 0 ||
      factory.overhead_arrears > 0 ||
      state.raw[ingredient] < amount ||
      factory.cash < cost
    )
      return false;
    state.raw[ingredient] -= amount;
    factory.cash -= cost;
    factory.spent += cost;
    state.job = { ingredient, amount, progress: 0, work: Math.max(4, amount * (ingredient === 'phial' ? 5 : 1)) };
    return true;
  }

  private consume(factory: FactoryState, amount: number, sold: boolean, flowersOnly = false): void {
    const state = factory.laboratory;
    state.batches.sort((a, b) => a.expires_day - b.expires_day);
    let taint = 0;
    for (const batch of state.batches) {
      if (!amount || batch.expires_day <= Math.floor(Time.days) || (flowersOnly && batch.taint > 0)) continue;
      const taken = Math.min(batch.units, amount);
      const share = (batch.taint * taken) / batch.units;
      batch.units -= taken;
      batch.taint -= share;
      taint += share;
      amount -= taken;
    }
    state.batches = state.batches.filter(batch => batch.units > 0);
    if (sold && taint > 0) {
      this.trade.corruption_remainder += taint;
      const corruption = Math.floor(this.trade.corruption_remainder + 1e-9);
      this.trade.corruption_remainder = Math.max(0, this.trade.corruption_remainder - corruption);
      if (corruption) {
        V.stat_aphrodisiacs_sold = (V.stat_aphrodisiacs_sold ?? 0) + corruption;
        this.finance.core.SugarCube.Wikifier.wikifyEval(`<<world_corruption "soft" ${corruption}>><<earnFeat "Dealing">>`);
      }
    }
  }

  public advance(factory: FactoryState, day: number, capacity: number): void {
    const state = factory.laboratory;
    if (!state.installed) return;
    for (const invoice of state.invoices.filter(sale => sale.pay_day <= day)) {
      if (invoice.outcome === 'default') factory.defaults++;
      else {
        factory.cash += invoice.total;
        factory.earned += invoice.total;
      }
      factory.report = {
        day,
        event: invoice.outcome,
        seen: false,
        amount: invoice.total,
        customer: invoice.buyer === 'shop' ? 'Adult shop' : invoice.buyer === 'compound' ? 'Elk compound' : 'Private buyer'
      };
    }
    state.invoices = state.invoices.filter(sale => sale.pay_day > day);
    for (const batch of state.batches.filter(batch => batch.expires_day <= day)) state.spoiled += batch.units;
    state.batches = state.batches.filter(batch => batch.expires_day > day);
    const week = Math.floor(day / 7);
    if (state.offer_week !== week) {
      state.offer_week = week;
      state.offers = (['compound', 'broker', ...(this.trade.shop_approved ? ['shop'] : [])] as Buyer[]).map(buyer => {
        const roll = random(1, 100);
        return {
          id: factory.next_id++,
          buyer,
          units: random(2, 6) * 20,
          price: buyer === 'compound' ? 1800 : buyer === 'shop' ? 2600 : random(1900, 3600),
          deadline: day + 6,
          pay_day: 0,
          total: 0,
          outcome: buyer === 'compound' || buyer === 'shop' ? 'paid' : roll <= 15 ? 'default' : roll <= 40 ? 'late' : 'paid'
        };
      });
      if (this.trade.exclusive) state.offers = state.offers.filter(sale => sale.buyer === 'compound');
    }
    if (capacity <= 0 || !state.technician || factory.issue || day < factory.ready_day || factory.order) return;
    if (!state.job && state.automatic && factory.manager) {
      const amount = Math.min(state.raw[state.automatic], terms.maximum_batch);
      if (amount && factory.cash - this.cost(state.automatic, amount) >= factory.reserve) this.start(factory, state.automatic, amount);
    }
    if (!state.job) return;
    const supervised = this.trade.harper_site === factory.site && day < this.trade.harper_until && C.npc.Harper?.state === 'active';
    state.job.progress += capacity * (supervised ? terms.harper_capacity : 1);
    if (state.job.progress < state.job.work) return;
    const { ingredient, amount } = state.job;
    const failed = random(1, 100) <= (supervised ? terms.harper_failure : this.trade.inspected ? 5 : factory.rush ? 22 : 12);
    const units = Math.floor(amount * terms[`${ingredient}_yield`] * (failed ? random(35, 60) / 100 : random(supervised ? terms.harper_yield : 85, 100) / 100));
    state.batches.push({ units, expires_day: day + terms.shelf_days, taint: ingredient === 'phial' ? amount : 0 });
    state.job = null;
    state.result = failed ? 'loss' : 'finished';
  }
}
