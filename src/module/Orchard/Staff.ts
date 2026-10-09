// ./src/module/Orchard/Staff.ts

import terms from '../../assets/orchard/staff.json';
import type Orchard from '../Orchard';

export interface OrchardStaffState {
  status: 'vacant' | 'hired' | 'injured' | 'missing' | 'quit';
  route: 'rest' | 'farm' | 'moor';
  paid_until: number;
  last_day: number;
  recover_day: number;
  search_day: number;
  experience: number;
  injuries: number;
  auto_renew: boolean;
  escort: boolean;
  destination: number | null;
  caught: number;
  delivered: number;
  spent: number;
  report: string;
}

export default class Staff {
  public readonly terms = terms;

  public static readonly defaults: OrchardStaffState = {
    status: 'vacant',
    route: 'rest',
    paid_until: -1,
    last_day: -1,
    recover_day: -1,
    search_day: -1,
    experience: 0,
    injuries: 0,
    auto_renew: false,
    escort: true,
    destination: null,
    caught: 0,
    delivered: 0,
    spent: 0,
    report: ''
  };

  public constructor(private readonly orchard: Orchard) {}

  public get state(): OrchardStaffState {
    return this.orchard.state.staff;
  }

  public get npc() {
    return V.per_npc?.deadwood_orchard_trapper ?? null;
  }

  public get unlocked(): boolean {
    return V.farm_stage >= 10 && !!V.farm;
  }

  public get available(): boolean {
    return this.unlocked && this.orchard.canWork && !V.replayScene && !V.gag && !this.orchard.farmInterrupted && !V.farm_assault;
  }

  public get employed(): boolean {
    return ['hired', 'injured', 'missing'].includes(this.state.status);
  }

  public act(action: 'hire' | 'pay' | 'dismiss' | 'search'): boolean {
    if (!this.available || !this.npc) return false;
    const state = this.state;
    const day = Math.floor(Time.days);
    if (action === 'hire') {
      if (this.orchard.core.passage.title !== 'Deadwood Orchard Trapper' || state.status !== 'vacant' || !this.charge(terms.weekly_wage)) return false;
      const destination = state.destination;
      const spent = state.spent;
      Object.assign(state, clone(Staff.defaults), { status: 'hired', destination, spent, paid_until: day + 7, last_day: day });
    } else if (this.orchard.core.passage.title !== 'Deadwood Orchard Staff') {
      return false;
    } else if (action === 'pay') {
      if (!this.employed || state.status === 'missing' || state.paid_until > day + 7 || !this.charge(terms.weekly_wage)) return false;
      state.paid_until = Math.max(day, state.paid_until) + 7;
    } else if (action === 'search') {
      if (state.status !== 'missing' || state.search_day >= 0 || !this.charge(terms.search_fee)) return false;
      state.search_day = day + 2;
    } else if (action === 'dismiss') {
      // 失踪记录留在原版持久 NPC 中，不能当作辞退释放姓名。
      if (!this.employed || state.status === 'missing') return false;
      state.status = 'quit';
      state.route = 'rest';
      state.auto_renew = false;
    }
    state.report = action;
    return true;
  }

  private charge(amount: number): boolean {
    const finance = this.orchard.core.get('Finance');
    if (!(finance?.canPay(amount, 'farm') ?? V.money >= amount)) return false;
    this.orchard.core.SugarCube.Wikifier.wikifyEval(`<<money -${amount} 'farm'>>`);
    this.state.spent += amount;
    return true;
  }

  /** 每天下午一次。原版先结算取液，不能倒填错过的外出并凭空补出原液。 */
  public advance(): void {
    if (!V.Orchard || !this.unlocked || V.statFreeze || V.replayScene || Time.hour < 16) return;
    const state = this.state;
    const day = Math.floor(Time.days);
    if (state.last_day >= day) return;
    state.last_day = day;
    this.deliver(day);
    if (!this.employed || !this.npc) return;
    if (state.status === 'missing') {
      if (state.search_day >= 0 && day >= state.search_day) {
        state.search_day = -1;
        if (random(1, 100) <= 75) {
          state.status = 'injured';
          state.recover_day = day + 5;
          state.injuries++;
          state.report = 'found';
        } else state.report = 'search_failed';
      }
      return;
    }
    if (day >= state.paid_until + terms.unpaid_days) {
      state.status = 'quit';
      state.route = 'rest';
      state.auto_renew = false;
      state.report = 'unpaid_quit';
      return;
    }
    if (day >= state.paid_until) {
      const finance = this.orchard.core.get('Finance');
      if (!state.auto_renew || !finance || !V.Finance.bank.debit_card || finance.payFromBankPennies(terms.weekly_wage) !== 'ok') {
        state.report = 'unpaid';
        return;
      }
      state.paid_until = day + 7;
      state.spent += terms.weekly_wage;
    }
    if (state.status === 'injured') {
      if (day < state.recover_day) return;
      state.status = state.injuries >= 2 ? 'quit' : 'hired';
      state.report = state.status === 'quit' ? 'unsafe_quit' : 'recovered';
      // 康复当天不再派出；反复受伤的雇工会自行退出危险岗位。
      return;
    }
    if (state.route === 'rest') return;
    if (V.farm_attacked || V.farm_assault || V.farm_attack_timer === 0 || Weather.bloodMoon || !V.settings.bestialityEnabled || !V.settings.lurkersEnabled) {
      state.report = 'suspended';
      return;
    }
    if ((V.lurkers_stored ?? 0) >= terms.cage_limit) {
      state.report = 'cages_full';
      return;
    }
    const finance = this.orchard.core.get('Finance');
    if (state.escort) {
      if (!finance || !V.Finance.bank.debit_card || finance.payFromBankPennies(terms.escort_fee) !== 'ok') {
        state.report = 'escort_unpaid';
        return;
      }
      state.spent += terms.escort_fee;
    }
    state.experience = Math.clamp(state.experience + 1, 0, 80);
    const moor = state.route === 'moor';
    const danger = random(1, 100);
    const missing = moor ? terms.moor_missing * (state.escort ? 0.25 : 1) : 0;
    const injury = (moor ? terms.moor_injury : terms.farm_injury) * (state.escort ? 0.5 : 1);
    if (danger <= missing) {
      state.status = 'missing';
      state.route = 'rest';
      state.report = 'missing';
    } else if (danger <= missing + injury) {
      state.status = 'injured';
      state.injuries++;
      state.recover_day = day + random(3, 6);
      state.report = 'injured';
    } else if (random(1, 100) <= (moor ? terms.moor_encounter : terms.farm_encounter)) {
      if (random(1, 100) <= 60 + state.experience * 0.4) {
        V.lurkers_stored = (V.lurkers_stored ?? 0) + 1;
        if (!(V.farm.still_timer > 0)) V.farm.still_timer = 7;
        state.caught++;
        state.report = 'caught';
      } else state.report = 'escaped';
    } else state.report = 'empty';
  }

  private deliver(day: number): void {
    const state = this.state;
    if (state.destination === null || !this.orchard.carrier || V.farm_attacked || V.farm_assault || V.farm_attack_timer === 0 || Weather.bloodMoon) return;
    const finance = this.orchard.core.get('Finance');
    const factory = finance?.state.industry.factories[state.destination];
    if (!finance || !V.Finance.bank.debit_card || !factory?.owned || !factory.laboratory.installed || factory.ready_day > day) return;
    // 收货前结清此前厂房日期，不能把今天到的原液倒填进过去的自动生产。
    finance.industry.advance(day);
    const amount = Math.clamp(Math.min(V.phials_stored ?? 0, finance.industry.laboratory.terms.maximum_batch - factory.laboratory.raw.phial), 0, 3);
    if (amount <= 0) return;
    if (factory.cash < factory.reserve + terms.haul_fee) {
      this.orchard.carrier.laboratory_report = 'unpaid';
      return;
    }
    V.phials_stored -= amount;
    factory.laboratory.raw.phial += amount;
    factory.cash -= terms.haul_fee;
    factory.spent += terms.haul_fee;
    state.delivered += amount;
    this.orchard.carrier.laboratory_report = 'delivered';
  }
}
