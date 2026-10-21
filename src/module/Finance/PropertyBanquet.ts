// ./src/module/Finance/PropertyBanquet.ts

import type Finance from '../Finance';
import type RealEstate from './RealEstate';

export type BanquetGuest = 'Robin' | 'Kylar' | 'Whitney' | 'Sydney' | 'Avery' | 'Remy' | 'Harper' | 'Leighton' | 'Quinn';
export type BanquetTopic = 'conversation' | 'history' | 'business' | 'service' | 'singing';
export interface BanquetMemory {
  day: number;
  property: string;
  topic: BanquetTopic | null;
  result: 'good' | 'mixed' | 'poor' | 'early';
  seen: boolean;
}
type Stage = 'none' | 'plan' | 'prepared' | 'reception' | 'dinner' | 'farewell' | 'finished';

export interface PropertyBanquetState {
  property: string | null;
  room: string | null;
  floor: number;
  last_day: number;
  stage: Stage;
  formal: boolean;
  invited: BanquetGuest[];
  accepted: BanquetGuest[];
  refused: BanquetGuest[];
  arrived: BanquetGuest[];
  left: BanquetGuest[];
  topic: BanquetTopic | null;
  result: 'good' | 'mixed' | 'poor' | null;
  interrupted: boolean;
  memories: Partial<Record<BanquetGuest, BanquetMemory>>;
}

const guests: readonly BanquetGuest[] = ['Robin', 'Kylar', 'Whitney', 'Sydney', 'Avery', 'Remy', 'Harper', 'Leighton', 'Quinn'];
const passages = ['Plan', 'Preparation', 'Reception', 'Dinner', 'Farewell', 'End'].map(name => `Deadwood Reblooms Property Banquet ${name}`);

/** 保存宴会进度与宾客记忆，房间、产权、付款、员工和名望沿用既有模块。 */
export default class PropertyBanquet {
  public static readonly defaults: PropertyBanquetState = {
    property: null,
    room: null,
    floor: 1,
    last_day: -7,
    stage: 'none',
    formal: false,
    invited: [],
    accepted: [],
    refused: [],
    arrived: [],
    left: [],
    topic: null,
    result: null,
    interrupted: false,
    memories: {}
  };

  public constructor(
    private readonly core: typeof maplebirch,
    private readonly finance: Finance,
    private readonly estate: RealEstate
  ) {}

  public preInit(): void {
    this.core.on(':passagestart', () => {
      if (!V.Finance?.real_estate || V.replayScene || V.statFreeze || !this.active || passages.includes(this.core.passage.title)) return;
      this.state.stage = 'finished';
      this.state.interrupted = true;
    });
  }

  public get state(): PropertyBanquetState {
    return V.Finance.real_estate.banquet;
  }

  public recall(name: BanquetGuest): BanquetMemory | undefined {
    const memory = this.state.memories[name];
    if (!memory || memory.seen || Math.floor(Time.days) < memory.day || Time.days - memory.day > 14 || V.nextPassageCheck || V.gag || !this.finance.company.available || !this.present(name)) return;
    const inReception = V.passage === 'Deadwood Reblooms Property Banquet Reception' && this.valid && this.state.stage === 'reception' && this.state.arrived.includes(name);
    return inReception || (Array.isArray(V.npc) && V.npc.includes(name)) ? memory : undefined;
  }

  public take(name: BanquetGuest): BanquetMemory | undefined {
    const memory = this.recall(name);
    if (memory) memory.seen = true;
    return memory;
  }

  public get room() {
    return this.estate.facilities.find(room => String(room.id) === 'reception') ?? this.estate.facilities.find(room => room.id === 'lounge' && !room.inline);
  }

  public get ready(): boolean {
    const property = this.estate.current;
    return !!property && !!this.room && this.estate.managementFor(property.id).auction_day === null && this.finance.company.available;
  }

  public get active(): boolean {
    return ['prepared', 'reception', 'dinner', 'farewell'].includes(this.state.stage);
  }

  public get canPlan(): boolean {
    return this.ready && !this.active && Math.floor(Time.days) >= this.state.last_day + 7;
  }

  public get valid(): boolean {
    return this.ready && this.state.property === this.estate.current?.id && this.estate.facilities.some(room => room.id === this.state.room && room.floor === this.state.floor);
  }

  public get capacity(): number {
    return this.estate.current?.id === 'cliff' ? 3 : 5;
  }

  public get candidates(): BanquetGuest[] {
    return guests.filter(name => this.known(name));
  }

  public get cost(): number {
    const count = this.state.stage === 'plan' ? this.state.invited.length : this.state.accepted.length;
    return this.state.formal ? 45000 + count * 12500 : 15000 + count * 7500;
  }

  public get canStart(): boolean {
    const minute = Time.hour * 60 + Time.minute;
    return this.canPlan && this.valid && this.state.stage === 'plan' && this.state.invited.length > 0 && minute >= 18 * 60 && minute <= 21 * 60;
  }

  public get returnPassage(): string {
    if (!this.estate.current || this.estate.current.id !== this.state.property) return 'Deadwood Reblooms Property Office';
    return this.state.room === 'lounge' ? 'Deadwood Reblooms Property Lounge' : 'Deadwood Reblooms Property Reception Room';
  }

  public get residents(): BanquetGuest[] {
    const id = this.estate.current?.id;
    return id ? this.estate.residentsAt(id).map(resident => resident.id as BanquetGuest) : [];
  }

  public staff(role: 'cook' | 'housekeeper' | 'steward' | 'guard'): boolean {
    return this.estate.staff.active(role) && !!V.per_npc?.[this.estate.staff.key(role)];
  }

  public plan(): boolean {
    if (!this.canPlan || !this.room) return false;
    Object.assign(this.state, {
      property: this.estate.current!.id,
      room: this.room.id,
      floor: this.room.floor,
      stage: 'plan',
      invited: [],
      accepted: [],
      refused: [],
      arrived: [],
      left: [],
      topic: null,
      result: null,
      interrupted: false
    });
    this.estate.setFloor(this.room.floor);
    return true;
  }

  public invite(name: BanquetGuest): boolean {
    if (!this.valid || this.state.stage !== 'plan' || !this.known(name)) return false;
    const selected = this.state.invited;
    if (selected.includes(name)) {
      this.state.invited = selected.filter(guest => guest !== name);
      return true;
    }
    if (selected.length >= this.capacity || this.estate.householdRefusal([...selected, name])) return false;
    selected.push(name);
    return true;
  }

  public begin(): boolean {
    if (!this.canStart) return false;
    const accepted = this.state.invited.filter(name => this.willing(name));
    this.state.accepted = accepted;
    this.state.refused = this.state.invited.filter(name => !accepted.includes(name));
    if (accepted.length === 0 || this.finance.payFromBankPennies(this.state.formal ? 45000 + accepted.length * 12500 : 15000 + accepted.length * 7500) !== 'ok') return false;
    this.state.last_day = Math.floor(Time.days);
    this.state.stage = 'prepared';
    return true;
  }

  public arrive(): boolean {
    if (!this.valid || this.state.stage !== 'prepared') return false;
    this.state.arrived = this.state.accepted.filter(name => this.willing(name));
    this.state.left = this.state.accepted.filter(name => !this.state.arrived.includes(name));
    this.state.stage = 'reception';
    return true;
  }

  public serve(): boolean {
    if (!this.valid || this.state.stage !== 'reception') return false;
    this.state.stage = 'dinner';
    return true;
  }

  public host(topic: BanquetTopic, skill: number): boolean {
    if (!this.valid || this.state.stage !== 'dinner' || !['conversation', 'history', 'business', 'service', 'singing'].includes(topic) || !Number.isFinite(skill)) return false;
    if (topic === 'business' && !this.state.formal) return false;
    this.state.topic = topic;
    const support = this.staff(topic === 'service' ? 'cook' : 'steward') ? 80 : 0;
    const condition = this.estate.managementFor(this.state.property!).condition;
    const score = Math.max(0, Math.min(1000, skill)) + support - (condition < 50 ? 150 : 0);
    this.state.result = score >= 600 ? 'good' : score >= 300 ? 'mixed' : 'poor';
    this.state.stage = 'farewell';
    return true;
  }

  public close(early = false): boolean {
    if (!this.active || (!early && this.state.stage !== 'farewell')) return false;
    // 离场重新检查产权、人物状态与原版安排。缺席者不会获关系收益。
    const present = this.valid ? this.state.arrived.filter(name => this.willing(name, true)) : [];
    this.state.left = this.state.arrived.filter(name => !present.includes(name));
    this.state.interrupted = early || !this.valid || present.length === 0;
    this.state.stage = 'finished';
    if (!V.replayScene && !V.statFreeze && this.state.property) {
      for (const name of this.state.arrived.filter(name => this.present(name))) {
        this.state.memories[name] = {
          day: Math.floor(Time.days),
          property: this.state.property,
          topic: this.state.topic,
          result: this.state.interrupted ? 'early' : (this.state.result ?? 'poor'),
          seen: false
        };
      }
    }
    if (this.state.interrupted || this.state.result === 'poor' || !this.state.result) return true;
    this.finance.recognition.award('social', 'private-banquet', this.state.result === 'good' ? 2 : 1);
    if (this.state.formal && present.some(name => ['Avery', 'Harper', 'Leighton', 'Quinn'].includes(name))) this.finance.recognition.award('business', 'private-banquet-business', 1);
    for (const name of present) {
      if (window.isLoveInterest(name)) this.core.SugarCube.Wikifier.wikifyEval(`<<npcincr '${name}' love 1>>`);
    }
    return true;
  }

  public cancel(id: string): void {
    if (this.state.property !== id) return;
    if (this.active) {
      this.state.stage = 'finished';
      this.state.interrupted = true;
    } else if (this.state.stage === 'plan') this.state.stage = 'none';
  }

  private known(name: BanquetGuest): boolean {
    if (this.residents.includes(name)) return true;
    const company = this.finance.company;
    const business = !!company.state.name && (company.partner || company.shareholders.director || company.shareholders.controller);
    switch (name) {
      case 'Avery':
        return ((V.averydateattended === 1 || (V.dateCount?.Avery ?? 0) > 0) && window.isLoveInterest('Avery')) || (business && company.avery.state.talk_day >= 0);
      case 'Remy':
        return !!V.remySeen?.includes('riding_school') && V.Orchard?.remy?.romance === true;
      case 'Harper':
        return !!V.harperSeen?.includes('party') && (business || company.ascension.active);
      case 'Leighton':
      case 'Quinn':
        return business && V.avery_cards_intro === 1 && C.npc[name]?.init === 1;
      default:
        return false;
    }
  }

  private present(name: BanquetGuest): boolean {
    const npc = C.npc[name];
    if (!npc || npc.init !== 1 || !['active', 'rescued'].includes(npc.state)) return false;
    if (name === 'Avery') return !V.avery_injury && !['away', 'party', 'party_prepare', 'date'].includes(V.avery_mansion?.schedule) && !['fallen', 'kicked'].includes(V.avery_fate);
    if (name === 'Remy')
      return (
        !V.Orchard?.remy?.ended &&
        V.Orchard?.remy?.romance === true &&
        !(V.pregnancies ?? []).some(
          (record: { carrier: string; deliveredDate: number | null; waterBreaking?: boolean }) => record.carrier === 'Remy' && record.deliveredDate === null && record.waterBreaking
        )
      );
    if (name === 'Robin') return !['docks', 'landfill', 'dinner', 'pillory', 'mansion'].includes(V.robinmissing);
    if (name === 'Sydney') return V.daily?.sydney?.punish !== 1;
    if (name === 'Leighton') return V.pillory?.tenant?.special?.name !== 'Leighton';
    return true;
  }

  private willing(name: BanquetGuest, leaving = false): boolean {
    if (!this.known(name) || !this.present(name)) return false;
    const outings = this.estate.outings;
    const remaining = leaving ? 0 : this.state.stage === 'plan' ? 150 : 120;
    if (outings.live && outings.plan?.name === name && (outings.travelling || (outings.plan.at < Time.date.timeStamp + remaining * 60 && outings.plan.at + 1800 > Time.date.timeStamp))) return false;
    if (V.englishPlay === 'ongoing' && V.englishPlayDays === 0 && Time.hour >= 17 && Time.hour < 21 && ['Robin', 'Sydney', 'Kylar', 'Avery', 'Leighton'].includes(name)) return false;
    const npc = C.npc[name];
    switch (name) {
      case 'Robin':
        return ['orphanage', 'sleep'].includes(window.getRobinLocation() ?? '') && npc.love >= 40 && npc.trauma < 50 && !(Time.month === 10 && Time.monthDay === 31);
      case 'Kylar':
        return Time.hour >= 18 && !Time.schoolTime && npc.love >= 40 && npc.rage < 60;
      case 'Whitney':
        return npc.love >= 60 && !Time.schoolTime;
      case 'Sydney': {
        // 晚祷在 21 点，邀请时按整场时长判断，布置后再次核对剩余时间。
        if (Time.hour < 18 || Time.hour * 60 + Time.minute + remaining >= 21 * 60 || ![2, 3, 4, 5].includes(Time.weekDay) || npc.love < 60) return false;
        if (V.adultshophelped === 1) return true;
        const corruption = npc.corruption;
        return !(
          V.adultshopunlocked &&
          ((corruption > 10 && Time.weekDay === 4) ||
            (corruption > 20 && Time.weekDay === 5) ||
            (V.sydney?.rank === 'initiate' && ((corruption > 30 && Time.weekDay === 3) || (corruption > 40 && Time.weekDay === 2))))
        );
      }
      case 'Avery':
        if (
          npc.rage >= 60 ||
          (V.avery_valentines?.invite && !V.avery_valentines.done) ||
          (V.averydate === 1 && Time.weekDay === 7) ||
          (this.finance.company.avery.state.date_state === 'scheduled' && this.finance.company.avery.state.date_day === Math.floor(Time.days))
        )
          return false;
        if (Time.weekDay === 1) return !['waiting', 'started'].includes(V.avery_mansion?.party_state) && Time.hour >= 18;
        if (Time.weekDay === 7) return Time.hour >= 18;
        return Time.hour >= 21;
      case 'Remy':
        return npc.love >= 40 && !this.core.get('Orchard')?.remy.inLabour;
      default:
        return this.state.formal && (leaving || (Time.hour >= 18 && Time.hour <= 20));
    }
  }
}
