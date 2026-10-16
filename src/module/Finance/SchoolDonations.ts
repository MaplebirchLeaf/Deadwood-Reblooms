// ./src/module/Finance/SchoolDonations.ts

import type Donations from './Donations';

type Terms = 'accounts' | 'access';

export interface SchoolDonationState {
  terms: Terms | null;
  ordered_at: number | null;
  replacement_at: number | null;
  accounts: 'read' | 'corrected' | null;
  equipment: 'accepted' | 'replaced' | null;
  signed_at: number | null;
  followed: boolean;
  favour_used: boolean;
  practice_day: number;
  meeting_week: number;
}

/** 学校使用原募捐账目，这里只保存谈妥的条件与一次采购的验收。 */
export default class SchoolDonations {
  public static readonly defaults: SchoolDonationState = {
    terms: null,
    ordered_at: null,
    replacement_at: null,
    accounts: null,
    equipment: null,
    signed_at: null,
    followed: false,
    favour_used: false,
    practice_day: -1,
    meeting_week: -1
  };

  public constructor(private readonly donations: Donations) {}

  public get state(): SchoolDonationState {
    return this.donations.state.school;
  }

  public get funded(): boolean {
    return this.donations.projects.find(project => project.id === 'school')!.funded;
  }

  public get eligible(): boolean {
    return this.donations.state.named.school >= 500000;
  }

  public get due(): number | null {
    const state = this.state;
    if (state.ordered_at === null && state.replacement_at === null) return null;
    return Math.max(state.ordered_at === null ? 0 : state.ordered_at + 259200, state.replacement_at === null ? 0 : state.replacement_at + 86400);
  }

  public get ready(): boolean {
    // 旧存档已有足额募资时可直接验收，新募足的一笔在付款动作中记录采购时间。
    return this.funded && (this.due === null || Time.date.timeStamp >= this.due);
  }

  public get available(): boolean {
    return (
      Time.schoolDay &&
      Time.hour >= 7 &&
      Time.hour < 17 &&
      !['early', 'late', 'earlynoschool', 'latenoschool', 'daynoschool'].includes(V.schoolstate) &&
      C.npc.Leighton?.init === 1 &&
      C.npc.Leighton.state === 'active' &&
      V.pillory?.tenant?.special?.name !== 'Leighton' &&
      window.wearingSchoolOutfit?.() === true &&
      !window.pcAreArmsBound('any') &&
      !V.worn.feet.type.includes('shackle') &&
      (V.exposed <= 0 || this.donations.finance.core.get('LifeSimulation')?.school.allowsNudity === true) &&
      V.stress < V.stressmax &&
      !V.combat &&
      !V.possessed &&
      !V.nextPassageCheck &&
      !V.replayScene &&
      !V.statFreeze &&
      !window.isPregnancyEnding()
    );
  }

  private free(minutes: number): boolean {
    return this.available && V.daily.school.headInterrupted !== 1 && Time.hour * 60 + Time.minute + minutes <= 17 * 60;
  }

  public get canMeet(): boolean {
    return this.eligible && this.state.terms === null && this.free(10);
  }

  public agree(terms: Terms): boolean {
    if (V.passage !== 'Deadwood Reblooms School Donation Meeting' || !this.canMeet || !['accounts', 'access'].includes(terms)) return false;
    this.state.terms = terms;
    return true;
  }

  public get canAudit(): boolean {
    return this.eligible && this.state.terms === 'accounts' && this.state.accounts === null && this.ready && this.free(10);
  }

  public audit(correct: boolean): boolean {
    if (V.passage !== 'Deadwood Reblooms School Donation Accounts' || !this.canAudit || typeof correct !== 'boolean' || (correct && window.currentSkillValue('maths') < 400)) return false;
    this.state.accounts = correct ? 'corrected' : 'read';
    return true;
  }

  public get canInspect(): boolean {
    return this.eligible && this.state.terms !== null && this.state.equipment === null && this.ready && this.free(15);
  }

  public inspect(choice: 'accept' | 'replace'): boolean {
    if (
      V.passage !== 'Deadwood Reblooms School Donation Inspection' ||
      !this.canInspect ||
      !['accept', 'replace'].includes(choice) ||
      (choice === 'replace' && window.currentSkillValue('science') < 400)
    )
      return false;
    this.state.equipment = choice === 'replace' ? 'replaced' : 'accepted';
    if (choice === 'replace') this.state.replacement_at = Time.date.timeStamp;
    return true;
  }

  public get canSign(): boolean {
    const state = this.state;
    return this.eligible && state.terms !== null && (state.terms !== 'accounts' || state.accounts !== null) && state.equipment !== null && state.signed_at === null && this.ready && this.free(5);
  }

  public sign(): boolean {
    if (V.passage !== 'Deadwood Reblooms School Donation Receipt' || !this.canSign) return false;
    this.state.signed_at = Time.date.timeStamp;
    this.donations.reward('school', 'signed');
    return true;
  }

  public get canFollow(): boolean {
    const signed = this.state.signed_at;
    return signed !== null && signed < new DateTime(Time.year, Time.month, Time.monthDay).timeStamp && !this.state.followed && this.free(5);
  }

  public follow(): boolean {
    if (V.passage !== 'Deadwood Reblooms School Donation Followup' || !this.canFollow) return false;
    this.state.followed = true;
    this.donations.reward('school', 'followed');
    return true;
  }

  public get canFavour(): boolean {
    return this.state.signed_at !== null && !this.state.favour_used && V.detention > 0 && V.detention <= 10 && V.daily.school.detentionAttended !== 1 && V.headnodetention !== 1 && this.free(5);
  }

  public favour(): boolean {
    if (V.passage !== 'Deadwood Reblooms School Donation Review' || !this.canFavour) return false;
    this.state.favour_used = true;
    V.detention = 0;
    return true;
  }

  public get canPractice(): boolean {
    return (
      this.state.terms === 'access' &&
      this.state.signed_at !== null &&
      this.state.practice_day !== Math.floor(Time.days) &&
      Time.hour >= 15 &&
      this.available &&
      Time.hour * 60 + Time.minute + 15 <= 17 * 60
    );
  }

  public practice(subject: 'maths' | 'science'): boolean {
    if (V.passage !== 'Deadwood Reblooms School Donation Practice' || !this.canPractice || !['maths', 'science'].includes(subject)) return false;
    this.state.practice_day = Math.floor(Time.days);
    return true;
  }

  private get week(): number {
    return Math.floor((new DateTime(Time.year, Time.month, Time.monthDay).timeStamp / 86400 - Time.weekDay + 1) / 7);
  }

  public get canVisit(): boolean {
    return this.eligible && this.state.signed_at !== null && this.state.meeting_week !== this.week && this.available && Time.hour * 60 + Time.minute + 20 <= 17 * 60;
  }

  public visit(choice: 'access' | 'review' | 'project'): boolean {
    if (V.passage !== 'Deadwood Reblooms School Donation Visit' || !this.canVisit || !['access', 'review', 'project'].includes(choice)) return false;
    if (choice === 'review' && (this.state.favour_used || V.detention <= 0 || V.detention > 10 || V.daily.school.detentionAttended === 1 || V.headnodetention === 1)) return false;
    this.state.meeting_week = this.week;
    if (choice === 'access') this.state.terms = 'access';
    if (choice === 'review') {
      this.state.favour_used = true;
      V.detention = 0;
    }
    return true;
  }
}
