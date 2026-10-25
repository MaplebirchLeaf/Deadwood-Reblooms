import terms from '../../assets/street/jobs.json';
import type StreetLife from '../StreetLife';
import type { TransportState } from '../Transport';

type Site = keyof typeof terms.sites;
type Contract = (typeof terms.jobs)[number] | (typeof terms.contacts)[number];
interface CrewQuote {
  key: string;
  name: string;
  role: string;
  gross: number;
  share: number;
  fee: number;
}
interface Job {
  id: string;
  stage: 'pickup' | 'carrying' | 'return' | 'settlement';
  due: number;
  vehicle: number | null;
  searches: number;
  issue: 'none' | 'shortage' | 'price' | 'recognised' | 'queue' | 'label' | 'seized' | 'hassle';
  handled: '' | 'checked' | 'waited' | 'negotiated' | 'helped' | 'avoided';
  fee: number;
  late: boolean;
  crew?: CrewQuote;
}
interface JobsState {
  active: Job | null;
  offer: string;
  site: Site;
  cooldowns: Record<string, number>;
  day: number;
  board: string[];
  completed: number;
  deliveries?: Record<string, number>;
  earned: number;
  losses: number;
  report: { id: string; outcome: 'paid' | 'returned' | 'cancelled' | 'lost'; fee: number; late: boolean; crew?: CrewQuote } | null;
}

/** 委托只保存本批货物，原版 blackmoney、黑箱与警方记录继续各自结算。 */
export default class Jobs {
  public static readonly defaults: JobsState = { active: null, offer: '', site: 'pub', cooldowns: {}, day: -1, board: [], completed: 0, earned: 0, losses: 0, report: null };
  public readonly terms = terms;

  public constructor(private readonly street: StreetLife) {}

  public get state(): JobsState {
    return V.StreetLife.jobs;
  }

  public get contract(): Contract | undefined {
    return [...terms.jobs, ...terms.contacts].find(item => item.id === this.state.active?.id);
  }

  public get place(): Site | null {
    const title = this.street.core.passage.title;
    if (['Deadwood Street Jobs', 'Deadwood Street Job Offer', 'Deadwood Street Bailey Job'].includes(title)) return 'pub';
    if (title === 'Deadwood Street Heist Contacts') return 'smuggler';
    if (title === 'Deadwood Street Cargo') return this.state.site;
    return (Object.keys(terms.sites) as Site[]).find(site => terms.sites[site].passage === title) ?? null;
  }

  public get point(): string | null {
    return this.place ? terms.sites[this.place].point : (this.street.core.get('Transport')?.point ?? null);
  }

  public get available(): boolean {
    return this.street.available && !this.street.stories.busy && !this.street.heist.busy && !this.street.bounties.busy && !window.pcAreArmsBound('both');
  }

  public get offers(): Contract[] {
    if (this.state.active) return [];
    const candidates = this.state.board
      .map(id => terms.jobs.find(item => item.id === id)!)
      .filter(
        item =>
          (this.state.cooldowns[item.id] ?? -1) <= Math.floor(Time.days) &&
          this.street.reputation >= item.required_reputation &&
          (item.requires !== 'casino' || (!!this.street.core.get('LifeSimulation') && V.id > 0)) &&
          (item.requires !== 'finance' || !!this.street.core.get('Finance')) &&
          (item.requires !== 'underground' || V.smuggler_pub_known === 1) &&
          item.requires !== 'bailey'
      );
    // 当前条件过滤之后取三项合法、一项非法，当天随机顺序由委托页面保存。
    return [...candidates.filter(item => !item.illegal).slice(0, 3), ...candidates.filter(item => item.illegal).slice(0, 1)];
  }

  /** 原班雇员介绍的普通订单独立展示，不改变日常看板的三合法一非法。 */
  public get businessOffers() {
    if (this.state.active) return [];
    return terms.contacts.flatMap(contract => {
      const npc = this.street.heist.businessCrew.find(npc => npc.heist.role === contract.role && npc.heist.businessDay !== Math.floor(Time.days));
      if (!npc) return [];
      const gross = Math.floor(contract.fee * (1 + (Math.clamp(npc.skills[contract.role === 'scout' ? 'security' : 'athletics'], 0, 1000) / 1000) * terms.business.maximum_skill_bonus));
      const fee = Math.floor((gross * terms.business.crew_share) / 100);
      return [{ ...contract, crew: { key: npc.per, name: npc.name, role: contract.role, gross, share: terms.business.crew_share, fee } }];
    });
  }

  public get receiving(): boolean {
    switch (this.place) {
      case 'casino':
        return !!this.street.core.get('LifeSimulation')?.casino.open && V.id > 0;
      case 'cafe':
        return Time.openingHours() && V.chef_state !== 8 && !(V.chef_state === 7 && V.chef_rework <= 30);
      case 'docks':
      case 'townhall':
        return Time.dayState !== 'night';
      case 'tailor':
        return Time.dayState !== 'night' && Time.hour !== 21;
      case 'library':
        return Time.schoolDay && Time.hour >= 7 && Time.hour < 17;
      case 'finance':
        return Time.weekDay >= 2 && Time.weekDay <= 6 && Time.hour >= 9 && Time.hour < 17;
      default:
        return true;
    }
  }

  public get expired(): boolean {
    return !!this.state.active && !!this.contract && Time.date.timeStamp > this.state.active.due + this.contract.grace_hours * 3600;
  }

  public get fee(): number {
    const job = this.state.active;
    if (!job || !this.contract) return 0;
    if (job.stage === 'settlement') return job.fee;
    const gross = Math.round((job.crew?.gross ?? this.contract.fee) * (Time.date.timeStamp > job.due ? terms.late_ratio : 1) * (['shortage', 'price'].includes(job.issue) ? terms.dispute_ratio : 1));
    return gross - (job.crew ? Math.floor((gross * job.crew.share) / 100) : 0);
  }

  public get vehicle() {
    const transport: TransportState | undefined = V.Transport;
    return transport?.vehicles.find(item => item.id === this.state.active?.vehicle);
  }

  public get lost(): boolean {
    return this.state.active?.vehicle != null && (!this.vehicle || !!this.vehicle.stolen);
  }

  public get cargoHere(): boolean {
    const job = this.state.active;
    return !!job && (job.vehicle === null || (!!this.vehicle && !this.vehicle.stolen && this.vehicle.garage === null && this.vehicle.point === this.point));
  }

  public get vehicles() {
    const transport = this.street.core.get('Transport');
    return (
      transport?.state.vehicles.filter(item => {
        const model = transport.catalog.models.find(model => model.id === item.model);
        return (
          !!this.contract &&
          item.point === this.point &&
          item.garage === null &&
          !item.stolen &&
          item.condition > 0 &&
          (model?.cargo ?? 0) >= this.contract.cargo &&
          transport.taxi.state.shift?.vehicle !== item.id
        );
      }) ?? []
    );
  }

  /** 页面仅展示，接货、交货、归还和付款都在点击时验证当前批次及地点。 */
  public act(action: 'accept' | 'collect' | 'check' | 'wait' | 'avoid' | 'negotiate' | 'load' | 'unload' | 'deliver' | 'return' | 'cancel' | 'pay', value?: string | number): boolean {
    if (!this.available) return false;
    const state = this.state;
    const title = this.street.core.passage.title;
    if (action === 'accept') {
      const business = title === 'Deadwood Street Heist Contacts';
      const businessOffer = business ? this.businessOffers.find(item => item.id === value) : undefined;
      const offer = business ? businessOffer : (this.offers.find(item => item.id === value) ?? (value === 'bailey_cargo' ? this.street.bailey.offer : undefined));
      if (!['Deadwood Street Job Offer', 'Deadwood Street Bailey Job', 'Deadwood Street Heist Contacts'].includes(title) || !offer || state.offer !== value) return false;
      if (business && (!this.street.heist.atMeeting || !this.street.heist.meetingAvailable)) return false;
      // 货物问题只在接单时抽取一次，种类与概率留在目录中维护。
      const issue = offer.issues[random(1, offer.issues.length) - 1] as Job['issue'];
      state.active = { id: offer.id, stage: 'pickup', due: Time.date.timeStamp + offer.deadline_hours * 3600, vehicle: null, searches: 0, issue, handled: '', fee: offer.fee, late: false };
      if (businessOffer) {
        state.active.crew = { ...businessOffer.crew };
        state.active.fee = businessOffer.crew.gross - businessOffer.crew.fee;
        V.per_npc[businessOffer.crew.key].heist.businessDay = Math.floor(Time.days);
      } else state.cooldowns[offer.id] = Math.floor(Time.days) + terms.cooldown_days;
      state.report = null;
      return true;
    }
    const job = state.active;
    const contract = this.contract;
    if (!job || !contract) return false;
    if (action === 'check' || action === 'wait' || action === 'avoid' || action === 'negotiate') {
      // 现场问题只在当前地点处理一次，展示页面与日志不会推进事件。
      if (title !== 'Deadwood Street Cargo' || this.expired || !this.cargoHere || job.handled || !this.receiving) return false;
      const pickup = job.stage === 'pickup' && this.place === contract.source;
      const delivery = job.stage === 'carrying' && this.place === contract.target;
      if (action === 'check') {
        if (!pickup || !['shortage', 'label'].includes(job.issue)) return false;
        job.handled = 'checked';
      } else if (action === 'wait') {
        if (job.issue === 'hassle') {
          if (!delivery) return false;
          job.handled = 'helped';
        } else {
          if (job.issue !== 'queue' || !(job.id === 'recovery' ? pickup : delivery)) return false;
          job.handled = 'waited';
        }
      } else if (action === 'avoid') {
        if (!delivery || job.issue !== 'hassle' || window.currentSkillValue('skulduggery') < 400) return false;
        job.handled = 'avoided';
      } else {
        if (!delivery || job.issue !== 'price' || window.currentSkillValue('english') < 400) return false;
        job.handled = 'negotiated';
      }
      job.issue = 'none';
    } else if (action === 'collect') {
      if (
        title !== 'Deadwood Street Cargo' ||
        this.place !== contract.source ||
        job.stage !== 'pickup' ||
        this.expired ||
        !this.receiving ||
        ['label', 'seized'].includes(job.issue) ||
        (job.id === 'recovery' && job.issue === 'queue')
      )
        return false;
      if (
        contract.id === 'recovery' &&
        ++job.searches === 1 &&
        random(1, 100) > Math.clamp(terms.search_chance_base + window.currentSkillValue('skulduggery') / terms.search_skill_divisor, terms.search_chance_base, terms.search_chance_max)
      )
        return true;
      job.stage = 'carrying';
    } else if (action === 'load' || action === 'unload') {
      if (!['carrying', 'return'].includes(job.stage) || this.lost) return false;
      if (action === 'load') {
        if (job.vehicle !== null || !this.vehicles.some(item => item.id === value)) return false;
        job.vehicle = Number(value);
      } else {
        if (job.vehicle === null || !this.cargoHere) return false;
        job.vehicle = null;
      }
    } else if (action === 'deliver') {
      if (
        title !== 'Deadwood Street Cargo' ||
        this.place !== contract.target ||
        job.stage !== 'carrying' ||
        !this.cargoHere ||
        this.expired ||
        ['queue', 'label', 'seized', 'hassle'].includes(job.issue)
      )
        return false;
      if (!this.receiving) return false;
      const end = Time.date.timeStamp + 10 * 60;
      this.street.core.SugarCube.Wikifier.wikifyEval('<<pass 10>>');
      // 完成交接后才结算，同一批货物在中断、超时或柜台关闭后仍由玩家保管。
      if (
        this.state.active !== job ||
        this.contract !== contract ||
        this.street.core.passage.title !== title ||
        !this.available ||
        this.place !== contract.target ||
        job.stage !== 'carrying' ||
        !this.cargoHere ||
        this.expired ||
        !this.receiving ||
        Time.date.timeStamp < end ||
        ['queue', 'label', 'seized', 'hassle'].includes(job.issue)
      )
        return false;
      job.late = Time.date.timeStamp > job.due;
      job.fee = this.fee;
      if (job.crew) {
        const gross = Math.round(job.crew.gross * (job.late ? terms.late_ratio : 1) * (['shortage', 'price'].includes(job.issue) ? terms.dispute_ratio : 1));
        job.crew.fee = gross - job.fee;
      }
      job.stage = 'settlement';
      job.vehicle = null;
      if (!contract.illegal && !job.late && job.issue === 'none') {
        const deliveries = (state.deliveries ??= {});
        deliveries[contract.target] = (deliveries[contract.target] ?? 0) + 1;
      }
      if (job.issue === 'recognised') this.street.core.SugarCube.Wikifier.wikifyEval(`<<crimeUp ${terms.witness_crime} 'thievery'>>`);
    } else if (action === 'return') {
      if (title !== 'Deadwood Street Cargo' || job.stage !== 'carrying' || !this.cargoHere) return false;
      job.stage = 'return';
    } else {
      if (!['Deadwood Street Jobs', 'Deadwood Street Cargo'].includes(title)) return false;
      if (action === 'pay') {
        if (this.place !== 'pub' || job.stage !== 'settlement') return false;
        state.report = { id: job.id, outcome: 'paid', fee: job.fee, late: job.late, ...(job.crew ? { crew: { ...job.crew } } : {}) };
        state.active = null;
        state.completed++;
        state.earned += job.fee;
        this.street.reputation += job.late ? 1 : contract.reputation;
        this.street.core.SugarCube.Wikifier.wikifyEval(`<<money ${job.fee} 'pub'>>`);
        // 合法委托也建立业务关系，原版宏保留 Landry 的 −100～100 上限。
        this.street.core.SugarCube.Wikifier.wikifyEval(`<<npcincr Landry love ${job.late ? 0 : contract.illegal ? 2 : 1}>>`);
        const quote = job.crew;
        const colleague = quote && V.per_npc[quote.key];
        if (quote && colleague?.heist) {
          colleague.heist.businessEarned = (colleague.heist.businessEarned ?? 0) + quote.fee;
          colleague.heist.businessCompleted = (colleague.heist.businessCompleted ?? 0) + 1;
        }
        if (quote && this.street.heist.businessCrew.some(npc => npc.per === quote.key && npc.heist.role === quote.role)) {
          const skill = quote.role === 'scout' ? 'security' : 'athletics';
          colleague.skills[skill] = Math.min(1000, colleague.skills[skill] + Math.round((terms.business.skill_gain * (colleague.heist.growth?.[quote.role] ?? 100)) / 100));
        }
      } else {
        const returnSite = job.stage === 'pickup' || this.lost ? 'pub' : contract.return_to;
        if (this.place !== returnSite) return false;
        if (job.stage === 'return' && !this.lost && !this.receiving) return false;
        if (job.stage === 'settlement' || (!this.lost && job.stage !== 'pickup' && (job.stage !== 'return' || !this.cargoHere))) return false;
        state.report = { id: job.id, outcome: this.lost ? 'lost' : job.stage === 'pickup' ? 'cancelled' : 'returned', fee: 0, late: false };
        state.active = null;
        if (state.report.outcome === 'lost') {
          state.losses++;
          this.street.reputation -= contract.reputation;
          this.street.core.SugarCube.Wikifier.wikifyEval('<<npcincr Landry love -3>>');
        }
      }
      if (job.id === 'bailey_cargo') {
        const bailey = this.street.bailey.state;
        bailey.finished = true;
        if (action !== 'pay' && bailey.resolution !== 'failed') bailey.resolution = 'withdrawn';
      }
    }
    return true;
  }
}
