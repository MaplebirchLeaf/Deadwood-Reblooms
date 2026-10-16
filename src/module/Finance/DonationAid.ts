// ./src/module/Finance/DonationAid.ts

import type Donations from './Donations';

export type AidFund = 'temple' | 'hospital' | 'orphanage';
type Terms = 'accounts' | 'delivery';

export interface AidState {
  terms: Terms | null;
  ordered_at: number | null;
  replacement_at: number | null;
  accounts: 'read' | 'corrected' | null;
  equipment: 'accepted' | 'replaced' | null;
  signed_at: number | null;
  followed: boolean;
  privileges: boolean;
  privacy: boolean;
  privacy_asked: boolean;
  rest_day: number;
  visit_week: number;
  rent_used: boolean;
  priority: 'food' | 'blankets' | null;
}

const blank: AidState = {
  terms: null,
  ordered_at: null,
  replacement_at: null,
  accounts: null,
  equipment: null,
  signed_at: null,
  followed: false,
  privileges: false,
  privacy: false,
  privacy_asked: false,
  rest_day: -1,
  visit_week: -1,
  rent_used: false,
  priority: null
};
const projects = {
  temple: { name: 'Temple', npc: 'Jordan', days: 2, opens: 8, closes: 18, skill: 'maths' },
  hospital: { name: 'Hospital', npc: 'Harper', days: 3, opens: 9, closes: 17, skill: 'science' },
  orphanage: { name: 'Orphanage', npc: 'Bailey', days: 2, opens: 7, closes: 10, skill: 'housekeeping' }
} as const;

/** 三处公共采购沿用募捐账目，人物交涉与物资描写由各自 Twee 处理。 */
export default class DonationAid {
  public static readonly defaults: Record<AidFund, AidState> = { temple: { ...blank }, hospital: { ...blank }, orphanage: { ...blank } };

  public constructor(private readonly donations: Donations) {}

  public state(fund: AidFund): AidState {
    const states = this.donations.state.aid;
    return (states[fund] ??= { ...blank });
  }

  public funded(fund: AidFund): boolean {
    return this.donations.projects.find(project => project.id === fund)!.funded;
  }

  public eligible(fund: AidFund): boolean {
    return this.donations.state.named[fund] >= 500000;
  }

  public due(fund: AidFund): number | null {
    const state = this.state(fund);
    if (state.ordered_at === null && state.replacement_at === null) return null;
    return Math.max(state.ordered_at === null ? 0 : state.ordered_at + projects[fund].days * 86400, state.replacement_at === null ? 0 : state.replacement_at + 86400);
  }

  public ready(fund: AidFund): boolean {
    const due = this.due(fund);
    // 旧存档已完成的募资直接保留交付，新采购只在第一次募足时开始计时。
    return this.funded(fund) && (due === null || Time.date.timeStamp >= due);
  }

  public available(fund: AidFund): boolean {
    const project = projects[fund];
    const npc = C.npc[project.npc];
    if (
      !npc ||
      (npc.init === 1 && npc.state !== 'active') ||
      Time.hour < project.opens ||
      Time.hour >= project.closes ||
      V.exposed > 0 ||
      V.stress >= V.stressmax ||
      V.combat ||
      V.possessed ||
      V.nextPassageCheck ||
      V.replayScene ||
      V.statFreeze ||
      window.isPregnancyEnding()
    )
      return false;
    if (fund === 'temple') return Time.dayState !== 'night' && !V.daily.jordanMissing && !(Time.weekDay === 1 && [11, 12].includes(Time.hour) && V.daily.massAttended !== 1);
    if (fund === 'hospital') return !Time.isWeekEnd() && V.trauma < V.traumamax * 0.9;
    return !V.RobinExpansion?.bailey_defeated;
  }

  private free(fund: AidFund, minutes: number): boolean {
    return this.available(fund) && Time.hour * 60 + Time.minute + minutes <= projects[fund].closes * 60;
  }

  private scene(fund: AidFund, name: string): boolean {
    return V.passage === `Deadwood Reblooms ${projects[fund].name} Donation ${name}`;
  }

  public canMeet(fund: AidFund): boolean {
    return this.eligible(fund) && this.state(fund).terms === null && this.free(fund, 10);
  }

  public agree(fund: AidFund, terms: Terms): boolean {
    if (!this.scene(fund, 'Meeting') || !this.canMeet(fund) || !['accounts', 'delivery'].includes(terms)) return false;
    this.state(fund).terms = terms;
    return true;
  }

  public canAudit(fund: AidFund): boolean {
    const state = this.state(fund);
    return this.eligible(fund) && state.terms === 'accounts' && state.accounts === null && this.ready(fund) && this.free(fund, 10);
  }

  public audit(fund: AidFund, correct: boolean): boolean {
    if (!this.scene(fund, 'Accounts') || !this.canAudit(fund) || typeof correct !== 'boolean' || (correct && window.currentSkillValue('maths') < 400)) return false;
    this.state(fund).accounts = correct ? 'corrected' : 'read';
    return true;
  }

  public canInspect(fund: AidFund): boolean {
    const state = this.state(fund);
    return this.eligible(fund) && state.terms !== null && state.equipment === null && this.ready(fund) && this.free(fund, 15);
  }

  public inspect(fund: AidFund, choice: 'accept' | 'replace'): boolean {
    if (!this.scene(fund, 'Inspection') || !this.canInspect(fund) || !['accept', 'replace'].includes(choice) || (choice === 'replace' && window.currentSkillValue(projects[fund].skill) < 400))
      return false;
    const state = this.state(fund);
    state.equipment = choice === 'replace' ? 'replaced' : 'accepted';
    if (choice === 'replace') state.replacement_at = Time.date.timeStamp;
    return true;
  }

  public canSign(fund: AidFund): boolean {
    const state = this.state(fund);
    return (
      this.eligible(fund) &&
      state.terms !== null &&
      (state.terms !== 'accounts' || state.accounts !== null) &&
      state.equipment !== null &&
      state.signed_at === null &&
      this.ready(fund) &&
      this.free(fund, 5)
    );
  }

  public sign(fund: AidFund): boolean {
    if (!this.scene(fund, 'Receipt') || !this.canSign(fund)) return false;
    this.state(fund).signed_at = Time.date.timeStamp;
    this.donations.reward(fund, 'signed');
    return true;
  }

  public canFollow(fund: AidFund): boolean {
    const state = this.state(fund);
    return state.signed_at !== null && state.signed_at < new DateTime(Time.year, Time.month, Time.monthDay).timeStamp && !state.followed && this.free(fund, 5);
  }

  public follow(fund: AidFund): boolean {
    if (!this.scene(fund, 'Followup') || !this.canFollow(fund)) return false;
    this.state(fund).followed = true;
    this.donations.reward(fund, 'followed');
    return true;
  }

  public has(fund: AidFund): boolean {
    return this.eligible(fund) && this.state(fund).signed_at !== null && this.state(fund).privileges;
  }

  public canGrant(fund: AidFund): boolean {
    return this.eligible(fund) && this.state(fund).signed_at !== null && !this.state(fund).privileges && this.free(fund, 10);
  }

  public grant(fund: AidFund): boolean {
    if (!this.scene(fund, 'Privileges') || !this.canGrant(fund)) return false;
    this.state(fund).privileges = true;
    return true;
  }

  public get fee(): number {
    return this.has('hospital') ? 18750 : 25000;
  }

  private get week(): number {
    return Math.floor((new DateTime(Time.year, Time.month, Time.monthDay).timeStamp / 86400 - Time.weekDay + 1) / 7);
  }

  public canUse(fund: AidFund, action: 'rest' | 'visit' | 'delay'): boolean {
    if (!this.has(fund)) return false;
    const state = this.state(fund);
    if (action === 'rest') return fund === 'temple' && state.rest_day !== Math.floor(Time.days) && this.free(fund, 30);
    if (action === 'visit') return state.visit_week !== this.week && this.free(fund, 20);
    return fund === 'orphanage' && !state.rent_used && !this.donations.finance.orphanage.pcFree && V.renttime >= 0 && V.renttime <= 7 && this.free(fund, 5);
  }

  public use(fund: AidFund, action: 'rest' | 'visit' | 'delay'): boolean {
    if (!['rest', 'visit', 'delay'].includes(action) || !this.scene(fund, action === 'rest' ? 'Rest' : 'Privileges') || !this.canUse(fund, action)) return false;
    const state = this.state(fund);
    if (action === 'rest') state.rest_day = Math.floor(Time.days);
    else if (action === 'visit') state.visit_week = this.week;
    else {
      state.rent_used = true;
      V.renttime += 7;
    }
    return true;
  }

  public get canPrivacy(): boolean {
    return (
      this.has('temple') &&
      !this.state('temple').privacy &&
      ['initiate', 'monk', 'priest'].includes(V.temple_rank) &&
      this.donations.finance.core.get('VanillaPlus')?.hasTrait('exhibitionism') === true &&
      V.uncomfortable.nude === false &&
      this.free('temple', 5)
    );
  }

  public privacy(): boolean {
    if (!this.scene('temple', 'Privileges') || !this.canPrivacy || !this.state('temple').privacy_asked) return false;
    this.state('temple').privacy = true;
    return true;
  }
}
