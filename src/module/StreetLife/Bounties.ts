import terms from '../../assets/street/bounties.json';
import Catalog from '../Transport/Catalog';
import type StreetLife from '../StreetLife';
import type { Vehicle } from '../Transport/Catalog';
import type { CargoFight } from './Bailey';
import type { HeistFight } from './Heist';

type Site = keyof typeof terms.sites;
type Case = (typeof terms.cases)[number];
type Attempt = 'talk' | 'run' | 'drive';
interface Bounty {
  id: string;
  fee?: number;
  key: string;
  stage: 'search' | 'identified' | 'pursuit' | 'fight' | 'escort' | 'settlement' | 'failed';
  site: Site;
  due: number;
  searches: number;
  rolls: Record<Attempt, number>;
  vehicle: number | null;
  outcome: '' | Attempt | 'fight';
  combatStarted: boolean;
}
interface Hunter {
  stage: 'approach' | 'confrontation' | 'fight' | 'escaped' | 'caught';
  key: string;
  source: string;
  point: string;
  rolls: Record<'talk' | 'run', number>;
  outcome: '' | 'talk' | 'fight' | 'run' | 'surrender';
  combatStarted: boolean;
  amount: number;
  offence: number;
}
interface BountiesState {
  cooperating: boolean;
  active: Bounty | null;
  site: Site;
  cooldowns: Record<string, number>;
  day: number;
  board: string[];
  completed: number;
  leads: number;
  completedTypes: string[];
  earned: number;
  hunterDay: number;
  hunter: Hunter | null;
  arrested: number;
  last: { id: string; outcome: 'paid' | 'lead' | 'abandoned' | 'released' | 'interrupted'; fee: number } | null;
}
type Action =
  | 'cooperate'
  | 'quit'
  | 'accept'
  | 'investigate'
  | 'fight'
  | 'finish'
  | Attempt
  | 'load'
  | 'unload'
  | 'walk'
  | 'handover'
  | 'medical-handover'
  | 'pay'
  | 'report-lead'
  | 'abandon'
  | 'release'
  | 'face'
  | 'hunter-talk'
  | 'hunter-run'
  | 'hunter-resist'
  | 'hunter-surrender'
  | 'leave'
  | 'arrest';

/** 追缉状态保存目标身份和实际载人车辆；原版罪证、犯罪历史与判刑独立结算。 */
export default class Bounties {
  public static readonly defaults: BountiesState = {
    cooperating: false,
    active: null,
    site: 'police',
    cooldowns: {},
    day: -1,
    board: [],
    completed: 0,
    leads: 0,
    completedTypes: [],
    earned: 0,
    hunterDay: -1,
    hunter: null,
    arrested: 0,
    last: null
  };
  public readonly terms = terms;
  public constructor(private readonly street: StreetLife) {}

  public get state(): BountiesState {
    return V.StreetLife.bounties;
  }

  public get trust(): number {
    return C.npc.Grant?.love ?? 0;
  }

  public get bountyHunter(): boolean {
    return this.state.cooperating && terms.cases.every(item => this.state.completedTypes?.includes(item.id));
  }

  public get remainingTypes(): Case[] {
    return terms.cases.filter(item => !this.state.completedTypes?.includes(item.id));
  }

  public get payout(): number {
    const fee = this.state.active?.fee ?? this.contract?.fee ?? 0;
    return fee + (this.bountyHunter ? Math.floor((fee * 15) / 100) : 0);
  }

  public get leadFee(): number {
    return Math.floor(((this.state.active?.fee ?? this.contract?.fee ?? 0) * terms.lead_fee_percent) / 100);
  }

  /** 核实身份后可将追缉交给警方；线索报酬不冒充抓捕完成。 */
  public get canReportLead(): boolean {
    return (
      this.street.core.passage.title === 'Deadwood Street Bounties' &&
      this.available &&
      this.state.cooperating &&
      !this.wanted &&
      !this.busy &&
      !this.street.heist.inAction &&
      this.state.active?.stage === 'identified' &&
      !this.expired &&
      !!this.target &&
      Time.hour >= 8 &&
      Time.hour < 18 &&
      this.street.core.npc.Schedule.get('Grant').location === 'police_station'
    );
  }

  public get wanted(): boolean {
    return window.crimeSumCurrent() >= terms.wanted_evidence;
  }

  public get available(): boolean {
    return this.street.available && !V.nextPassageCheck;
  }

  public get busy(): boolean {
    return this.fightingCargo || (!!this.state.hunter && ['approach', 'confrontation', 'fight', 'caught'].includes(this.state.hunter.stage));
  }

  public get fightingHeist(): boolean {
    return !!this.street.heist.state.fight;
  }

  public get fightingCargo(): boolean {
    return !!this.street.bailey.state.fight;
  }

  public get fightingHunter(): boolean {
    return this.state.hunter?.stage === 'fight';
  }

  public get fight(): Bounty | Hunter | CargoFight | HeistFight | null {
    if (this.fightingHeist) return this.street.heist.state.fight;
    if (this.fightingCargo) return this.street.bailey.state.fight;
    return this.fightingHunter ? this.state.hunter : this.state.active?.stage === 'fight' ? this.state.active : null;
  }

  public get combatStats() {
    return this.fightingHeist ? this.street.heist.terms.combat : this.fightingCargo ? this.street.bailey.terms.combat : this.fightingHunter ? terms.hunter.combat : this.contract?.combat;
  }

  public get inCombat(): boolean {
    return !!this.fight?.combatStarted && V.combat === 1 && V.enemytype === 'man' && V.NPCList[0]?.per === this.fight.key;
  }

  public get combatComplete(): boolean {
    return (
      this.inCombat &&
      !V.nextPassage &&
      !V.nextPassageCheck &&
      (V.enemyhealth <= 0 || V.enemyarousal >= V.enemyarousalmax || (V.alarm === 1 && V.rescue >= 1) || V.finish === 1 || (V.pain >= 100 && V.willpowerpain === 0))
    );
  }

  public get contract(): Case | undefined {
    return terms.cases.find(item => item.id === this.state.active?.id);
  }

  public get target() {
    return this.state.active ? V.per_npc[this.state.active.key] : null;
  }

  public get wounded(): boolean {
    return !!this.target?.deadwoodGunshot;
  }

  public get offers(): Case[] {
    if (!this.state.cooperating || this.wanted || this.state.active || this.street.heist.inAction) return [];
    const order = this.state.board.length ? this.state.board : terms.cases.map(item => item.id);
    return order
      .map(id => terms.cases.find(item => item.id === id)!)
      .filter(
        item =>
          (this.state.cooldowns[item.id] ?? -1) <= Math.floor(Time.days) &&
          this.trust >= item.required_trust &&
          (item.requires !== 'casino' || !!this.street.core.get('LifeSimulation')) &&
          (item.requires !== 'finance' || !!this.street.core.get('Finance')) &&
          (item.requires !== 'underground' || V.smuggler_pub_known === 1)
      )
      .slice(0, 4);
  }

  public get point(): string | null {
    const title = this.street.core.passage.title;
    if (['Deadwood Street Bounties', 'Deadwood Street Detective', 'Police Station'].includes(title)) return 'barb';
    if (title === 'Deadwood Street Bounty') return terms.sites[this.state.site]?.point ?? null;
    if (title === 'Deadwood Street Hunter') return this.state.hunter?.point ?? null;
    const site = Object.values(terms.sites).find(site => site.passage === title);
    return site ? site.point : (Catalog.point(title) ?? this.street.core.get('Transport')?.point ?? null);
  }

  public get expired(): boolean {
    return !!this.state.active && !['escort', 'settlement'].includes(this.state.active.stage) && Time.date.timeStamp > this.state.active.due;
  }

  public get vehicle(): Vehicle | undefined {
    return V.Transport?.vehicles.find(item => item.id === this.state.active?.vehicle);
  }

  public get lost(): boolean {
    return this.state.active?.vehicle != null && (!this.vehicle || !!this.vehicle.stolen);
  }

  public get here(): boolean {
    const job = this.state.active;
    if (!job) return false;
    if (job.stage === 'escort') return job.vehicle === null || (!!this.vehicle && !this.vehicle.stolen && this.vehicle.garage === null && this.vehicle.point === this.point);
    const title = this.street.core.passage.title;
    return title === terms.sites[job.site].passage || (title === 'Deadwood Street Bounty' && this.state.site === job.site);
  }

  public get vehicles(): Vehicle[] {
    const transport = this.street.core.get('Transport');
    if (!transport || transport.taxi.active || transport.state.commute || this.street.core.get('Finance')?.realEstate.outings.travelling || transport.state.passengers.length) return [];
    return transport.state.vehicles.filter(item => {
      const model = Catalog.models.find(model => model.id === item.model);
      return item.point === this.point && !item.stolen && item.garage === null && item.condition > 0 && model?.kind === 'motor_vehicle' && model.seats >= 1;
    });
  }

  /** 装载允许停在原地；追车还需满足交通模块的上路条件，并预留短途燃油。 */
  public get drivers(): Vehicle[] {
    const transport = this.street.core.get('Transport');
    if (!transport?.ready || !transport.state.school.motor_vehicle.licensed || V.drunk > 0 || V.drugged > 0 || V.stress >= V.stressmax || V.worn.feet.type.includes('shackle')) return [];
    return this.vehicles.filter(item => (item.arrears ?? 0) <= 0 && item.fuel >= Catalog.models.find(model => model.id === item.model)!.fuel_use * 5);
  }

  public get chances(): Record<Attempt, number> {
    // 猎人的判定独立于 PC 正在承办的案件，技能、装备及身体状态仍共用。
    const item = this.state.hunter ? terms.hunter : this.contract;
    const stress = Math.clamp(V.stress / V.stressmax, 0, 1) * 15;
    const fatigue = Math.clamp(V.tiredness / 2000, 0, 1) * 20;
    return {
      talk: V.worn.face.type.includes('gag') ? 0 : Math.round(Math.clamp((item?.talk ?? 15) + window.currentSkillValue('english') * 0.04 + this.trust * 0.1 - stress, 5, 95)),
      run: V.worn.feet.type.includes('shackle') ? 0 : Math.round(Math.clamp((item?.run ?? 20) + window.currentSkillValue('athletics') * 0.05 - fatigue - (Weather.isSnow ? 15 : 0), 5, 95)),
      drive: Math.round(
        Math.clamp((item?.drive ?? 25) + (this.street.core.get('Transport')?.state.driving ?? 0) * 0.04 - stress - (Weather.isSnow ? 15 : Weather.precipitation === 'rain' ? 8 : 0), 5, 95)
      )
    };
  }

  public get hunterChances() {
    const chance = this.chances;
    return { talk: chance.talk > 0 && window.crimeSumCurrent() < terms.wanted_evidence ? 100 : Math.min(60, chance.talk), run: chance.run };
  }

  public get walkMinutes(): number {
    return ((this.point ? Catalog.distance(this.point, 'barb') : null) ?? 30) + 5;
  }

  /** append 确认原版普通街道菜单后调用；先记日期，刷新及强制事件不会重抽。 */
  public checkHunter(): void {
    if (this.state.hunter || this.state.hunterDay === Math.floor(Time.days) || !this.available || !this.point || this.street.heist.inAction) return;
    const offence = window.crimeSumCurrent();
    if (offence < terms.hunter_evidence) return;
    this.state.hunterDay = Math.floor(Time.days);
    if (random(1, 100) > Math.min(terms.hunter_max_chance, terms.hunter_chance + Math.floor((offence - terms.hunter_evidence) / 500))) return;
    this.state.hunter = {
      stage: 'approach',
      key: 'deadwood_bounty_hunter',
      source: this.street.core.passage.title,
      point: this.point,
      rolls: { talk: random(1, 100), run: random(1, 100) },
      outcome: '',
      combatStarted: false,
      amount: Math.round(offence / 5) * 100,
      offence
    };
  }

  /** 返回 true 表示一次有效选择；失败的追逐也会推进阶段，不能反复点同一选项重抽。 */
  public act(action: Action, value?: string | number): boolean {
    const state = this.state;
    const title = this.street.core.passage.title;
    const wiki = (source: string) => this.street.core.SugarCube.Wikifier.wikifyEval(source);
    // 原版 endcombat 会清空遭遇槽；在清理之前保存演员并读取结果，刷新不能再结算。
    if (action === 'finish') {
      const fight = this.fight;
      if (title !== 'Deadwood Street Fight Finish' || !fight || !this.combatComplete || V.replayScene || V.statFreeze) return false;
      const hunter = this.fightingHunter;
      const cargo = this.fightingCargo;
      const heist = this.fightingHeist;
      const won = V.enemyhealth <= 0;
      const escaped = won || (!(V.pain >= 100 && V.willpowerpain === 0) && (V.enemyarousal >= V.enemyarousalmax || (V.alarm === 1 && V.rescue >= 1) || V.finish === 1));
      if (V.enemyarousal >= V.enemyarousalmax) wiki('<<ejaculation "short">>');
      wiki(`<<saveNPC 0 '${fight.key}'>><<clotheson>><<endcombat>>`);
      fight.combatStarted = false;
      if (heist) {
        const state = this.street.heist.state;
        state.stage = won ? (fight as HeistFight).resume : 'settlement';
        if (!won) {
          state.outcome = 'failed';
          state.loot = 0;
        }
        state.fight = null;
        if (V.per_npc[fight.key]) wiki(`<<clearNPC '${fight.key}'>>`);
      } else if (cargo) {
        const job = this.street.jobs.state.active;
        if (job?.id === 'bailey_cargo' && job.stage === 'pickup' && job.issue === 'seized') {
          this.street.bailey.state.resolution = won ? 'fight' : 'failed';
          if (won) job.issue = 'none';
        }
        this.street.bailey.state.fight = null;
        if (V.per_npc[fight.key]) wiki(`<<clearNPC '${fight.key}'>>`);
      } else if (hunter) {
        (fight as Hunter).outcome = 'fight';
        (fight as Hunter).stage = escaped ? 'escaped' : 'caught';
      } else {
        (fight as Bounty).stage = won ? 'escort' : 'failed';
        if (!won) (fight as Bounty).vehicle = null;
      }
      return true;
    }
    if (!this.available) return false;
    if (['face', 'hunter-talk', 'hunter-run', 'hunter-resist', 'hunter-surrender', 'leave', 'arrest'].includes(action)) {
      const hunter = state.hunter;
      if (!hunter || (title !== 'Deadwood Street Hunter' && title !== hunter.source && !(action === 'arrest' && title === 'Deadwood Street Hunter Handover'))) return false;
      if (action === 'face') {
        if (hunter.stage !== 'approach') return false;
        wiki(`<<endevent>><<generateNPC 1 'a'>><<saveNPC 0 '${hunter.key}'>><<endevent>>`);
        if (!V.per_npc[hunter.key]) return false;
        hunter.stage = 'confrontation';
      } else if (action === 'leave') {
        if (hunter.stage !== 'escaped') return false;
        if (V.per_npc[hunter.key]) wiki(`<<endevent>><<clearNPC '${hunter.key}'>>`);
        state.hunter = null;
      } else if (action === 'arrest') {
        if (hunter.stage !== 'caught') return false;
        if (state.active) {
          if (V.per_npc[state.active.key]) wiki(`<<endevent>><<clearNPC '${state.active.key}'>>`);
          state.last = { id: state.active.id, outcome: 'interrupted', fee: 0 };
          state.active = null;
        }
        if (V.per_npc[hunter.key]) wiki(`<<endevent>><<clearNPC '${hunter.key}'>>`);
        state.hunter = null;
        state.arrested++;
      } else if (action === 'hunter-surrender') {
        if (hunter.stage !== 'confrontation') return false;
        hunter.outcome = 'surrender';
        hunter.stage = 'caught';
      } else if (action === 'hunter-resist') {
        if (hunter.stage !== 'confrontation' || window.pcAreArmsBound('both')) return false;
        hunter.outcome = 'fight';
        hunter.stage = 'fight';
      } else {
        if (hunter.stage !== 'confrontation') return false;
        const kind = action === 'hunter-talk' ? 'talk' : 'run';
        if (this.hunterChances[kind] <= 0) return false;
        hunter.outcome = kind;
        hunter.stage = hunter.rolls[kind] <= this.hunterChances[kind] ? 'escaped' : 'fight';
      }
      return true;
    }
    if (this.busy || this.street.heist.inAction) return false;
    if (action === 'cooperate' || action === 'quit') {
      if (title !== 'Deadwood Street Detective' || this.wanted || state.active || Time.hour < 8 || Time.hour >= 18) return false;
      state.cooperating = action === 'cooperate';
      return true;
    }
    if (action === 'accept') {
      const offer = this.offers.find(item => item.id === value);
      if (title !== 'Deadwood Street Bounties' || !offer || Time.hour < 8 || Time.hour >= 18) return false;
      const key = `deadwood_bounty_${offer.id}`;
      wiki(`<<endevent>><<generateNPC 1 'a'>><<saveNPC 0 '${key}'>><<endevent>>`);
      if (!V.per_npc[key]) return false;
      state.active = {
        id: offer.id,
        fee: offer.fee,
        key,
        stage: 'search',
        site: offer.site as Site,
        due: Time.date.timeStamp + terms.deadline_hours * 3600,
        searches: 0,
        rolls: { talk: random(1, 100), run: random(1, 100), drive: random(1, 100) },
        vehicle: null,
        outcome: '',
        combatStarted: false
      };
      state.cooldowns[offer.id] = Math.floor(Time.days) + terms.cooldown_days;
      state.last = null;
      return true;
    }
    const job = state.active;
    const contract = this.contract;
    if (!job || !contract) return false;
    if (action === 'report-lead') {
      if (!this.canReportLead) return false;
      const fee = this.leadFee;
      state.last = { id: job.id, outcome: 'lead', fee };
      state.active = null;
      state.leads = (state.leads ?? 0) + 1;
      state.earned += fee;
      C.npc.Grant.love = Math.clamp(this.trust + 1, 0, 100);
      // 清除本次演员与委托后才付款，同一线索重绘或重复点击不再领取。
      if (V.per_npc[job.key]) wiki(`<<endevent>><<clearNPC '${job.key}'>>`);
      wiki(`<<money ${fee} 'police'>>`);
      return true;
    }
    if (action === 'pay') {
      if (title !== 'Deadwood Street Bounties' || job.stage !== 'settlement' || this.wanted || Time.hour < 8 || Time.hour >= 18) return false;
      const fee = this.payout;
      state.last = { id: job.id, outcome: 'paid', fee };
      state.active = null;
      state.completed++;
      state.earned += fee;
      C.npc.Grant.love = Math.clamp(this.trust + 3, 0, 100);
      if (V.per_npc[job.key]) wiki(`<<endevent>><<clearNPC '${job.key}'>>`);
      wiki(`<<money ${fee} 'police'>>`);
      // 先按付款前资格结算；完成最后一种委托的这单不提前获得奖金。
      const completedTypes = (state.completedTypes ??= []);
      if (!completedTypes.includes(job.id)) completedTypes.push(job.id);
      return true;
    }
    if (action === 'abandon' || action === 'release') {
      const missing = this.lost || !V.per_npc[job.key];
      if (
        !['Deadwood Street Bounties', 'Deadwood Street Bounty'].includes(title) ||
        (action === 'release' ? job.stage !== 'escort' || !this.here : job.stage === 'settlement' || (job.stage === 'escort' && !(title === 'Deadwood Street Bounties' && missing)))
      )
        return false;
      state.last = { id: job.id, outcome: action === 'release' ? 'released' : 'abandoned', fee: 0 };
      state.active = null;
      C.npc.Grant.love = Math.clamp(this.trust - (action === 'release' ? 6 : 2), 0, 100);
      if (V.per_npc[job.key]) wiki(`<<endevent>><<clearNPC '${job.key}'>>`);
      return true;
    }
    if (!V.per_npc[job.key] || this.expired) return false;
    if (action === 'unload' && title === 'Deadwood Street Bounties') {
      if (job.stage !== 'escort' || job.vehicle === null || !this.here) return false;
      job.vehicle = null;
      return true;
    }
    if (action === 'medical-handover') {
      if (!['Deadwood Street Bounties', 'Deadwood Street Bounty'].includes(title) || job.stage !== 'escort' || !this.here || !this.wounded || !this.point || job.vehicle !== null) return false;
      // 伤者由医护和警员接走；PC 留在原地，不借用原版针对 PC 的 ambulance。
      wiki('<<pass 30>>');
      if (state.active !== job || title !== this.street.core.passage.title || !this.available || !this.here) return false;
      job.stage = 'settlement';
    } else if (action === 'handover') {
      if (!['Deadwood Street Bounties', 'Deadwood Street Bounty'].includes(title) || this.point !== 'barb' || job.stage !== 'escort' || !this.here || this.wounded) return false;
      job.stage = 'settlement';
      job.vehicle = null;
    } else if (title !== 'Deadwood Street Bounty' || !this.here) return false;
    else if (action === 'investigate') {
      if (job.stage !== 'search' || this.state.site !== job.site || (job.site === 'docks' && Time.dayState === 'night')) return false;
      if (++job.searches >= 2 || window.currentSkillValue('skulduggery') >= 400) job.stage = 'identified';
    } else if (action === 'fight') {
      if (job.stage !== 'identified' || window.pcAreArmsBound('both')) return false;
      job.outcome = 'fight';
      job.stage = 'fight';
    } else if (action === 'talk' || action === 'run' || action === 'drive') {
      const chance = this.chances[action];
      if ((action === 'talk' ? job.stage !== 'identified' : job.stage !== 'pursuit') || chance <= 0) return false;
      if (action === 'drive') {
        const vehicle = this.drivers.find(item => item.id === value);
        if (!vehicle) return false;
        const transport = this.street.core.get('Transport')!;
        const model = Catalog.models.find(model => model.id === vehicle.model)!;
        vehicle.fuel = Math.max(0, vehicle.fuel - model.fuel_use * 5);
        vehicle.condition = Math.max(0, vehicle.condition - transport.journeyWear(model, 5));
        transport.state.driving = Math.min(1000, transport.state.driving + 1);
      }
      job.outcome = action;
      if (job.rolls[action] <= chance) {
        job.stage = action === 'talk' ? 'escort' : 'fight';
        job.vehicle = action === 'drive' ? Number(value) : null;
      } else job.stage = action === 'talk' ? 'pursuit' : 'failed';
    } else if (action === 'load' || action === 'unload') {
      if (job.stage !== 'escort') return false;
      if (action === 'load') {
        if (this.wounded || job.vehicle !== null || !this.vehicles.some(item => item.id === value)) return false;
        job.vehicle = Number(value);
      } else {
        if (job.vehicle === null) return false;
        job.vehicle = null;
      }
    } else if (action === 'walk') {
      if (this.wounded || job.stage !== 'escort' || job.vehicle !== null || !this.point || Catalog.distance(this.point, 'barb') === null) return false;
      wiki(`<<pass ${this.walkMinutes}>><<tiredness 4>>`);
      if (state.active !== job || title !== this.street.core.passage.title || !this.available) return false;
      state.site = 'police';
      V.location = 'police_station';
      V.outside = 0;
    } else return false;
    return true;
  }
}
