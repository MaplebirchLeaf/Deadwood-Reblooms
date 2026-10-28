import type StreetLife from '../StreetLife';

export interface CargoFight {
  key: string;
  combatStarted: boolean;
}
interface BaileyState {
  resolution: '' | 'negotiated' | 'paid' | 'fight' | 'reported' | 'withdrawn' | 'failed';
  finished: boolean;
  witnessed: boolean;
  discussed: boolean;
  invitation: '' | 'interested' | 'declined' | 'accepted' | 'paid' | 'failed' | 'closed';
  fight: CargoFight | null;
}

/** 一批货物、一场争议，运输与报酬仍由 Jobs 处理，战斗共用街头遭遇。 */
export default class Bailey {
  public static readonly defaults: BaileyState = { resolution: '', finished: false, witnessed: false, discussed: false, invitation: '', fight: null };
  public constructor(private readonly street: StreetLife) {}

  public get state(): BaileyState {
    return V.StreetLife.bailey;
  }

  public get jobs() {
    return this.street.jobs;
  }

  public get terms() {
    return this.jobs.terms.seizure;
  }

  public get available(): boolean {
    return this.jobs.available && !this.state.fight;
  }

  public get offer() {
    if (!this.available || this.jobs.state.active || this.street.bounties.state.active?.stage === 'escort' || this.state.finished || this.state.resolution || this.street.reputation < 10) return;
    return this.jobs.terms.jobs.find(item => item.id === 'bailey_cargo');
  }

  public get seized(): boolean {
    const job = this.jobs.state.active;
    return job?.id === 'bailey_cargo' && job.stage === 'pickup' && job.issue === 'seized' && this.state.resolution !== 'failed';
  }

  public get defeated(): boolean {
    return V.RobinExpansion?.bailey_defeated === true;
  }

  public get free(): boolean {
    return this.defeated || this.street.core.get('Finance')?.orphanage.pcFree === true;
  }

  public get peer(): boolean {
    return this.street.core.get('Finance')?.company.avery.guest === true;
  }

  public get home(): string {
    return this.defeated ? 'Flats' : "Bailey's Office";
  }

  public get atHome(): boolean {
    return Time.hour >= 7 && Time.hour < (this.defeated ? 21 : 10);
  }

  /** 办公室沿用原版当天拜访限制，战败后的住所沿用既有会面时段。 */
  public get atDesk(): boolean {
    return this.atHome && (this.defeated || (V.daily.baileyVisit >= 1 && V.daily.baileyVisit <= 3));
  }

  public get delivery() {
    if (!this.available || !this.atDesk || !this.state.finished || this.state.invitation !== 'interested' || this.jobs.state.active) return;
    return this.jobs.terms.jobs.find(item => item.id === 'bailey_delivery');
  }

  public get canNegotiate(): boolean {
    return window.currentSkillValue('english') >= 400 || this.peer || (this.free && this.street.reputation >= 50);
  }
}
