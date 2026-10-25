import terms from '../../assets/street/heist.json';
import Catalog from '../Transport/Catalog';
import type StreetLife from '../StreetLife';

export interface HeistFight {
  key: string;
  combatStarted: boolean;
  resume: 'vault' | 'escape';
}

interface HeistCase {
  stage: number;
  rolls: number[];
  alarm: boolean;
  method: string;
  result: string;
  loot: number;
  steps: string[];
}

interface HeistCampaign {
  dock: HeistCase;
  reception: HeistCase;
  bank_step: number;
  bank_rolls: number[];
  alarm: number;
  exit_method: string;
  clerk: string;
  team: { injured: string[]; separated: string[]; rejoined: string[]; aid: string[] };
  gold: {
    bars: number;
    sold: number;
    value: number;
    proceeds: number;
    ready_day: number;
    buyer: string;
    trade: { stage: number; amount: number; deposit: number; day: number; rolls: number[]; secured: boolean; handed_over: boolean; reason: string; reschedules: number };
  };
  aftermath: { stage: number; letter_read: boolean; leads: string[]; wren: string; landry: string; choice: string };
  fight: { keys: string[]; combat_started: boolean; return_passage: string; result: '' | 'won' | 'lost'; location: string; outside: number; tier: number } | null;
}
interface HeistState {
  stage: 'idle' | 'prep' | 'entry' | 'challenge' | 'vault' | 'escape' | 'settlement' | 'closed';
  appointment: boolean;
  approach: '' | 'quiet' | 'loud';
  preparations: string[];
  preparationChoices: Record<string, { method: string; quality: number }>;
  activity: string;
  candidate: string;
  mickeyReview: '' | 'information' | 'crew' | 'risk';
  crew: string[];
  candidates: string[];
  introduced: boolean;
  rehearsed: string[];
  vehicle: number | null;
  rolls: Record<'entry' | 'talk' | 'vault' | 'escape', number> | null;
  shares: { landry: number; wren: number; crew: number; pc: number } | null;
  loot: number;
  spent: number;
  vaultFailed: boolean;
  escapeFailure: '' | 'injury' | 'custody';
  informed: boolean;
  policePlan: boolean;
  raisedAlarm: boolean;
  talked: boolean;
  haul: '' | 'light' | 'full';
  escapeMode: '' | 'normal' | 'careful';
  bankClosedUntil: number;
  identified: boolean;
  bankReaction: boolean;
  entered: boolean;
  lateReport: boolean;
  betrayed: boolean;
  outcome: '' | 'success' | 'withdrawn' | 'failed' | 'reported' | 'sting' | 'arrested';
  settled: boolean;
  fight: HeistFight | null;
  campaign: HeistCampaign | null;
  feedback: { action: 'preparation' | 'negotiation' | 'recruitment' | 'meeting' | 'business'; outcome: 'completed' | 'too_late' | 'interrupted' | 'unavailable'; minutes: number; cost: number } | null;
}

/** 单次银行豪劫，筹备、人员与判定存档，关系仍使用原版 NPC 数据。 */
export default class Heist {
  public static readonly defaults: HeistState = {
    stage: 'idle',
    appointment: false,
    approach: '',
    preparations: [],
    preparationChoices: {},
    activity: '',
    candidate: '',
    mickeyReview: '',
    crew: [],
    candidates: [],
    introduced: false,
    rehearsed: [],
    vehicle: null,
    rolls: null,
    shares: null,
    loot: 0,
    spent: 0,
    vaultFailed: false,
    escapeFailure: '',
    informed: false,
    policePlan: false,
    raisedAlarm: false,
    talked: false,
    haul: '',
    escapeMode: '',
    bankClosedUntil: -1,
    identified: false,
    bankReaction: false,
    entered: false,
    lateReport: false,
    betrayed: false,
    outcome: '',
    settled: false,
    fight: null,
    campaign: null,
    feedback: null
  };
  public readonly terms = terms;
  public readonly catalog = Catalog;
  public constructor(private readonly street: StreetLife) {}

  public get state(): HeistState {
    return V.StreetLife.heist;
  }

  public get contacts() {
    const landry = C.npc.Landry?.love ?? 0;
    const earned = V.moneyStats?.pubStolenGoods?.earned ?? 0;
    // 旧存档的销赃与黑箱成绩同样有效，已确认的背叛不能靠旧成绩抵消。
    const landryTier = landry < 0 ? 0 : landry >= 60 || earned >= 800000 || V.pub_task_stat >= 25 ? 2 : landry >= 20 || earned >= 100000 ? 1 : 0;
    const wren = C.npc.Wren?.love ?? 0;
    const grant = C.npc.Grant?.love ?? 0;
    return {
      landryTier: this.state.betrayed ? Math.min(1, landryTier) : landryTier,
      wrenTier: this.state.betrayed ? 0 : wren >= 40 ? 2 : wren >= 20 ? 1 : 0,
      grantTier: grant >= 60 ? 2 : grant >= 20 ? 1 : 0
    };
  }

  public get unlocked(): boolean {
    return (
      !!this.street.core.get('Finance') &&
      this.street.stories.ready &&
      V.smuggler_pub_known === 1 &&
      this.street.reputation >= terms.requiredReputation &&
      C.npc.Landry?.init === 1 &&
      C.npc.Wren?.init === 1 &&
      this.contacts.landryTier === 2 &&
      this.contacts.wrenTier >= 1
    );
  }

  public get inAction(): boolean {
    return ['entry', 'challenge', 'vault', 'escape'].includes(this.state.stage);
  }

  /** 两桩前案与银行现场共用排他规则，收尾调查允许暂离后继续。 */
  public get busy(): boolean {
    const campaign = this.state.campaign;
    return this.inAction || !!campaign?.fight || [campaign?.dock.stage, campaign?.reception.stage].some(stage => stage !== undefined && stage > 0 && stage < 5);
  }

  public get available(): boolean {
    return this.street.available && !this.street.jobs.state.active && !this.street.bounties.state.active && !this.street.bounties.busy && !window.pcAreArmsBound('both');
  }

  public get crew() {
    return this.state.crew.map(key => V.per_npc[key]).filter(npc => !!npc?.heist);
  }

  public get candidates() {
    return this.state.candidates.map(key => V.per_npc[key]).filter(npc => !!npc?.heist);
  }

  /** 成功分账后仍自由、能够工作的原班雇员，接续普通委托，不重开豪劫。 */
  public get businessCrew() {
    if (this.state.stage !== 'closed' || !this.state.settled || this.state.outcome !== 'success') return [];
    return this.crew.filter(
      npc =>
        npc.health > 0 &&
        npc.heist.status !== 'arrested' &&
        ['scout', 'carrier'].includes(npc.heist.role) &&
        (!this.state.campaign?.team.separated.includes(npc.per) || this.state.campaign.team.rejoined.includes(npc.per))
    );
  }

  /** 普通差事开始前便可认识人手，正在进行的安排不能中途换人。 */
  public get recruitmentAvailable(): boolean {
    return (
      this.available &&
      !this.busy &&
      this.atMeeting &&
      this.meetingAvailable &&
      ['idle', 'prep'].includes(this.state.stage) &&
      (this.street.stories.unlocked.landry || this.state.stage === 'prep') &&
      !this.street.stories.busy
    );
  }

  /** 分工只读取原版技能。初值和成长记录不反向覆盖当前本领。 */
  public get roleSkills(): Record<string, { scout: number; carrier: number }> {
    return Object.fromEntries([...this.crew, ...this.candidates].map(npc => [npc.per, { scout: Math.clamp(npc.skills.security, 0, 1000), carrier: Math.clamp(npc.skills.athletics, 0, 1000) }]));
  }

  public get roster(): string {
    return this.crew
      .map(npc => `${npc.per}:${npc.heist.role}`)
      .sort()
      .join('|');
  }

  public get familiarity(): number {
    if (!this.crewReady) return 0;
    const [first, second] = this.crew;
    return Math.clamp(Math.min(first.heist.familiarity?.[second.per] ?? 0, second.heist.familiarity?.[first.per] ?? 0), 0, 100);
  }

  public get crewReady(): boolean {
    const team = this.state.campaign?.team;
    return (
      this.crew.length === 2 &&
      ['scout', 'carrier'].every(role =>
        this.crew.some(npc => npc.heist.role === role && npc.health > 0 && npc.heist.status !== 'arrested' && (!team?.separated.includes(npc.per) || team.rejoined.includes(npc.per)))
      )
    );
  }

  /** 排演已经落实，两种分工仍有人能够参加，才发挥统筹的收益。 */
  public get crewLeader(): boolean {
    return this.state.preparations.includes('rehearsal') && (this.state.preparationChoices.rehearsal?.quality ?? 0) >= terms.crewLeader.quality && this.crewReady;
  }

  /** 原版体能上限随体型变化，其它技能使用原版有效值，统一成 0～1000 参与判定。 */
  public get skills() {
    return {
      english: Math.clamp(window.currentSkillValue('english'), 0, 1000),
      maths: Math.clamp(window.currentSkillValue('maths'), 0, 1000),
      science: Math.clamp(window.currentSkillValue('science'), 0, 1000),
      housekeeping: Math.clamp(window.currentSkillValue('housekeeping'), 0, 1000),
      skulduggery: Math.clamp(window.currentSkillValue('skulduggery'), 0, 1000),
      physique: Math.clamp(window.currentSkillValue('physique') / V.physiquesize, 0, 1) * 1000,
      athletics: Math.clamp(window.currentSkillValue('athletics'), 0, 1000),
      willpower: Math.clamp(window.currentSkillValue('willpower'), 0, 1000)
    };
  }

  /** 意志只缓解压力，不抹去伤痛、疲劳或醉药状态。 */
  public get conditionPenalty(): number {
    return (
      Math.clamp(V.tiredness / 2000, 0, 1) * 15 +
      Math.clamp(V.stress / V.stressmax, 0, 1) * 10 * (1 - this.skills.willpower / 2000) +
      Math.clamp(V.pain / 200, 0, 1) * 12 +
      Math.clamp(V.drunk / V.drunkmax, 0, 1) * 12 +
      Math.clamp(V.drugged / 1000, 0, 1) * 12
    );
  }

  /** 正式会面沿用原版地下酒馆的发现标记，不搬动 NPC 的原有日程。 */
  public get atMeeting(): boolean {
    return V.smuggler_pub_known === 1 && V.location === 'underground';
  }

  /** 约好的筹备会面放在日间，不占用伦恩原版晚间行动。 */
  public get meetingAvailable(): boolean {
    return Time.hour >= 9 && Time.hour < 18;
  }

  public get preparations() {
    const skills = this.skills;
    const factory = this.street.core
      .get('Finance')
      ?.industry.owned.some(item => item.ready_day <= Math.floor(Time.days) && item.wage_arrears === 0 && item.overhead_arrears === 0 && item.lines.includes('packaging'));
    return terms.preparations.map(preparation => ({
      ...preparation,
      options: preparation.options.map(option => {
        const primary = skills[option.skill as keyof typeof skills];
        const ability = option.secondSkill ? (primary + skills[option.secondSkill as keyof typeof skills]) / 2 : primary;
        return {
          ...option,
          available:
            (preparation.place !== 'smuggler' || (this.atMeeting && this.meetingAvailable)) &&
            (!option.requiresFactory || !!factory) &&
            (!option.requiresCrew || (this.crewReady && !this.street.stories.busy)) &&
            (option.skill !== 'english' || !V.worn.face.type.includes('gag')),
          quality: Math.round(Math.clamp(option.qualityBase + ((option.qualityMax - option.qualityBase) * ability) / 1000 - this.conditionPenalty / 10, 0, option.qualityMax))
        };
      })
    }));
  }

  public get bankClosed(): boolean {
    return Math.floor(Time.days) < this.state.bankClosedUntil;
  }

  public get mickeyAvailable(): boolean {
    return (
      this.atMeeting && this.meetingAvailable && this.street.available && !this.inAction && !this.street.bounties.busy && V.mickeyPub >= 2 && !['hiding', 'hidingKnown'].includes(V.pubfame?.status)
    );
  }

  public get vehicle() {
    return V.Transport?.vehicles.find(item => item.id === this.state.vehicle);
  }

  /** seats 为乘客位：Wren 与两名雇员占三席，Landry 留在酒馆协调。 */
  public get vehicles() {
    const transport = this.street.core.get('Transport');
    if (
      !transport?.ready ||
      transport.taxi.active ||
      (transport.state.trip && !transport.state.trip.settled) ||
      transport.state.commute ||
      transport.state.passengers.length ||
      this.street.core.get('Finance')?.realEstate.outings.travelling ||
      !transport.state.school.motor_vehicle.licensed ||
      V.drunk > 0 ||
      V.drugged > 0 ||
      V.stress >= V.stressmax ||
      V.worn.feet.type.includes('shackle')
    )
      return [];
    return transport.state.vehicles.filter(item => {
      const model = Catalog.models.find(model => model.id === item.model);
      return (
        model?.kind === 'motor_vehicle' &&
        model.seats >= this.crew.length + 1 &&
        item.point === 'high' &&
        item.garage === null &&
        !item.stolen &&
        item.condition > 0 &&
        (item.arrears ?? 0) <= 0 &&
        item.fuel >= model.fuel_use * terms.escapeMinutes
      );
    });
  }

  public get vehicleReady(): boolean {
    return this.state.vehicle !== null && this.vehicles.some(item => item.id === this.state.vehicle);
  }

  public get ready(): boolean {
    return (
      this.state.stage === 'prep' &&
      (!this.state.campaign ||
        (this.state.campaign.dock.stage === 6 && this.state.campaign.dock.result !== 'failed' && this.state.campaign.reception.stage === 6 && this.state.campaign.reception.result !== 'failed')) &&
      this.street.stories.ready &&
      ['quiet', 'loud'].includes(this.state.approach) &&
      terms.preparations.every(prep => this.state.preparations.includes(prep.id)) &&
      this.crewReady &&
      !this.bankClosed &&
      (this.state.vehicle === null || this.vehicleReady)
    );
  }

  public get grantAvailable(): boolean {
    return this.street.available && Time.hour >= 8 && Time.hour < 18 && this.street.bounties.state.cooperating && !this.street.bounties.wanted;
  }

  public get chances() {
    const skills = this.skills;
    const scout = this.crew.find(npc => npc.heist.role === 'scout');
    const carrier = this.crew.find(npc => npc.heist.role === 'carrier');
    const story = this.street.stories.modifiers;
    // 已交齐并核实的账户文件帮助辨认与交涉，前案失败或残缺文件不能冒充成果。
    const reception = this.state.campaign?.reception;
    const account = reception?.stage === 6 && reception.result !== 'failed' && reception.method.includes('-verified') ? 5 : 0;
    const dock = this.state.campaign?.dock;
    const loading = this.state.campaign?.clerk === 'loading' && dock?.stage === 6 && dock.result !== 'failed' && dock.steps.includes('loading_route') ? 5 : 0;
    const missing = this.state.campaign?.team.separated.filter(key => !this.state.campaign!.team.rejoined.includes(key)) ?? [];
    const coordination = 1 + (this.crewLeader ? terms.crewLeader.skillBonus : 0) + (this.familiarity / 100) * terms.crewLeader.familiarityBonus;
    const scoutSkill = scout && !missing.includes(scout.per) ? Math.clamp(this.roleSkills[scout.per].scout * coordination, 0, 1000) * Math.clamp(scout.health / scout.healthmax, 0, 1) : 0;
    const carrierSkill =
      carrier && !missing.includes(carrier.per) ? Math.clamp(this.roleSkills[carrier.per].carrier * coordination, 0, 1000) * Math.clamp(carrier.health / carrier.healthmax, 0, 1) : 0;
    const briefing = this.state.preparationChoices.briefing?.quality ?? 0;
    const equipment = this.state.preparationChoices.equipment?.quality ?? 0;
    const rehearsal = this.state.preparationChoices.rehearsal?.quality ?? 0;
    const penalty = this.conditionPenalty;
    const escape = (driving: boolean) =>
      Math.round(
        Math.clamp(
          25 +
            story.escape +
            (!driving ? skills.athletics : Math.clamp(this.street.core.get('Transport')?.state.driving ?? 0, 0, 1000)) * 0.04 +
            scoutSkill * 0.015 +
            (this.state.mickeyReview === 'risk' ? terms.mickey.bonus : 0) +
            rehearsal * 0.5 -
            penalty -
            (this.state.haul === 'full' ? (driving ? 3 : 10) : 0) -
            (this.state.policePlan ? 25 : 0) -
            (this.state.raisedAlarm ? 10 : 0) -
            (Weather.isSnow ? 15 : 0),
          5,
          95
        )
      );
    return {
      entry: Math.round(
        Math.clamp(
          25 +
            story.entry +
            account +
            loading +
            skills.skulduggery * 0.03 +
            skills.willpower * 0.01 +
            scoutSkill * 0.02 +
            briefing +
            (this.state.mickeyReview === 'information' ? terms.mickey.bonus : 0) -
            penalty,
          5,
          95
        )
      ),
      talk: V.worn.face.type.includes('gag') ? 0 : Math.round(Math.clamp(20 + story.talk + account + skills.english * 0.04 + skills.willpower * 0.015 + briefing - penalty, 5, 95)),
      vault: Math.round(
        Math.clamp(25 + story.vault + skills.physique * 0.025 + carrierSkill * 0.025 + equipment + rehearsal * 0.5 + (this.state.mickeyReview === 'crew' ? terms.mickey.bonus : 0) - penalty, 5, 95)
      ),
      escape: escape(this.state.vehicle !== null),
      escapeOnFoot: escape(false),
      escapeByCar: escape(true)
    };
  }

  public get split() {
    if (this.state.shares) return this.state.shares;
    const landry = terms.cuts.landry;
    const wren = terms.cuts.wren[this.contacts.wrenTier];
    const crew = this.crew.reduce((sum, npc) => sum + npc.heist.cut, 0);
    return { landry, wren, crew, pc: Math.max(0, 100 - landry - wren - crew) };
  }

  public get payout(): number {
    return Math.floor(((this.state.campaign ? this.state.campaign.gold.proceeds : this.state.loot) * this.split.pc) / 100);
  }
}
