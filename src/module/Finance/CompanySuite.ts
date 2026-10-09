// ./src/module/Finance/CompanySuite.ts

import type Company from './Company';

export interface CompanySuiteState {
  signed: boolean;
  notice_day: number | null;
  next_upkeep_day: number;
  arrears: number;
  visit_day: number;
  visit_topic: 'personal' | 'boundary' | 'work' | null;
}

export default class CompanySuite {
  public static readonly defaults: CompanySuiteState = { signed: false, notice_day: null, next_upkeep_day: -1, arrears: 0, visit_day: -1, visit_topic: null };

  public constructor(private readonly company: Company) {}

  public get state(): CompanySuiteState {
    return this.company.state.suite;
  }

  public get eligible(): boolean {
    return V.avery_fate === 'ascended' && (this.company.shareholders.director || this.company.shareholders.controller);
  }

  public get occupied(): boolean {
    return this.company.finance.realEstate.owns('penthouse');
  }

  public get canSign(): boolean {
    return this.company.available && this.company.open && this.eligible && !this.occupied && this.state.arrears === 0;
  }

  public get upkeep(): number {
    return this.company.finance.realEstate.maintenanceCost('penthouse');
  }

  public get canInvite(): boolean {
    return this.occupied && this.state.notice_day === null && this.company.shareholders.available && (V.dateCount?.Avery ?? 0) > 0 && this.state.visit_day !== Math.floor(Time.days);
  }

  public invite(): boolean {
    if (!this.canInvite) return false;
    this.state.visit_day = Math.floor(Time.days);
    this.state.visit_topic = null;
    return true;
  }

  public preInit(): void {
    const core = this.company.finance.core;
    core.on(':passagestart', () => this.sync(), 'Company suite');
    core.dynamic.regStateEvent('gate', 'deadwood-company-suite-expired', {
      forceExit: true,
      cond: () =>
        !!V.Finance?.company &&
        !V.replayScene &&
        !V.statFreeze &&
        V.combat !== 1 &&
        !V.possessed &&
        V.Finance.real_estate.visiting === 'penthouse' &&
        !this.occupied &&
        core.passage.title.startsWith('Deadwood Reblooms Property ') &&
        (V.location === 'deadwood_home' || core.passage.title === 'Deadwood Reblooms Property Home'),
      output: 'deadwood-company-suite-expired'
    });
  }

  public sign(): boolean {
    if (!this.canSign || !this.company.finance.realEstate.occupy('penthouse')) return false;
    this.state.signed = true;
    this.state.notice_day = null;
    this.state.next_upkeep_day = Math.floor(Time.days) + 7;
    return true;
  }

  public pay(): boolean {
    if (!this.company.available || this.state.arrears <= 0 || this.company.finance.payFromBankPennies(this.state.arrears) !== 'ok') return false;
    this.state.arrears = 0;
    this.sync();
    return true;
  }

  public sync(): void {
    if (!V.Finance?.company || V.replayScene || V.statFreeze || !this.occupied) return;
    const state = this.state;
    const today = Math.floor(Time.days);
    if (!this.eligible && state.notice_day === null) state.notice_day = today;
    if (this.eligible && state.arrears === 0) state.notice_day = null;
    if (state.notice_day !== null && today >= state.notice_day + 7) this.revoke();
  }

  public advance(day: number): void {
    if (!V.Finance?.company || V.replayScene || V.statFreeze || !this.occupied || !Number.isInteger(day) || day > Math.floor(Time.days)) return;
    const state = this.state;
    while (state.next_upkeep_day >= 0 && state.next_upkeep_day <= day && (state.notice_day === null || state.next_upkeep_day < state.notice_day + 7)) {
      const due = state.arrears + this.upkeep;
      state.arrears = due - this.company.finance.collectBankPennies(due);
      if (state.arrears > 0 && state.notice_day === null) state.notice_day = state.next_upkeep_day;
      state.next_upkeep_day += 7;
    }
    if (this.eligible && state.arrears === 0) state.notice_day = null;
    if (state.notice_day !== null && day >= state.notice_day + 7) this.revoke();
  }

  private revoke(): void {
    this.company.finance.realEstate.vacate('penthouse');
    this.state.next_upkeep_day = -1;
  }
}
