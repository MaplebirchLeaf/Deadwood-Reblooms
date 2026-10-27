// ./src/module/Finance/PropertyOutings.ts

import type RealEstate from './RealEstate';
import Catalog from '../Transport/Catalog';

export type OutingActivity = 'meal' | 'shopping' | 'walk';
export interface OutingMemory {
  name: string;
  property: string;
  activity: OutingActivity;
  at: number;
  short: boolean;
  wet: boolean;
  seen: boolean;
}
export interface PropertyOutingState {
  plan: {
    name: string;
    property: string;
    day: number;
    hour: number;
    at: number;
    activity: OutingActivity;
    stage: 'offered' | 'booked' | 'out' | 'visit' | 'return' | 'done' | 'cancelled' | 'missed';
    vehicle: number | null;
    enjoyed: boolean;
    intimate?: boolean;
    source?: 'partner';
    offered_at?: number;
    moved?: number;
    wet?: boolean;
  } | null;
  visits: Record<string, { property: string; until: number; at: string }>;
  note: { name: string; property: string; day: number; kind: 'ride' | 'outing' | 'temple'; short: boolean; done: boolean } | null;
  offer_day: number;
  memories: Record<string, OutingMemory>;
}

/** 房屋只保存约定和短暂来访，道路、车辆、费用与正文沿用已有模块。 */
export default class PropertyOutings {
  public static readonly defaults: PropertyOutingState = { plan: null, visits: {}, note: null, offer_day: -7, memories: {} };

  public constructor(
    private readonly estate: RealEstate,
    private readonly core: typeof maplebirch
  ) {}

  public get state(): PropertyOutingState {
    return V.Finance.real_estate.outings;
  }

  public get plan(): PropertyOutingState['plan'] {
    return this.state.plan;
  }

  public preInit(): void {
    this.core.on(':passagestart', () => this.advance());
  }

  public valid(name: string, property: string): boolean {
    const npc = C.npc[name];
    if (V.replayScene || V.statFreeze || npc?.init !== 1 || !['active', 'rescued'].includes(npc.state) || this.estate.residenceOf(name)?.id !== property) return false;
    if (name === 'Robin') return !V.robinmissing && V.robin.timer.hurt === 0 && V.RobinExpansion?.asylum?.status !== 'admitted';
    if (name === 'Sydney') {
      const expansion = this.core.get('Sydney') ? V.SydneyExpansion : undefined;
      const festival = (Time.month === 10 && Time.monthDay === 31) || (Time.month === 12 && Time.monthDay === 25);
      const visit = expansion?.estate?.visitDay ?? -1;
      const estateVisit = visit >= 0 && (visit === Time.days || (visit === Time.days - 1 && Time.hour < 6));
      return V.daily.sydney.punish !== 1 && !festival && !estateVisit;
    }
    return ['Whitney', 'Kylar'].includes(name);
  }

  public get live(): boolean {
    return !!this.plan && ['offered', 'booked', 'out', 'visit', 'return'].includes(this.plan.stage) && this.valid(this.plan.name, this.plan.property);
  }

  public get travelling(): boolean {
    return this.live && ['out', 'visit', 'return'].includes(this.plan!.stage);
  }

  public get target(): string | null {
    if (!this.travelling || this.plan!.stage === 'visit') return null;
    return this.plan!.stage === 'return' ? 'home:' + this.plan!.property : { meal: 'cliff', shopping: 'high', walk: 'starfish' }[this.plan!.activity];
  }

  public get days(): number[] {
    return Array.from({ length: 7 }, (_, index) => Math.floor(Time.days) + index + 1).filter(day => [1, 7].includes(new DateTime(Time.startDate).addDays(day).weekDay));
  }

  public hour(name: string, day: number): number | null {
    const date = new DateTime(this.at(day, 18));
    const weekDay = date.weekDay;
    if (name === 'Robin' && this.core.get('Robin') && V.RobinExpansion?.shop) return 21;
    if (name !== 'Sydney') return 18;
    if ((date.month === 10 && date.day === 31) || (date.month === 12 && date.day === 25)) return null;
    if ((weekDay === 7 && V.adultshopopeningsydney) || (weekDay === 1 && V.sydney.rank === 'initiate')) return null;
    return weekDay === 7 ? 20 : 19;
  }

  private at(day: number, hour: number): number {
    const date = new DateTime(Time.startDate).addDays(day);
    return new DateTime(date.year, date.month, date.day, hour).timeStamp;
  }

  private day(at: number): number {
    const start = Time.startDate;
    const midnight = new DateTime(start.year, start.month, start.day).timeStamp;
    return Math.floor((at - midnight) / 86400);
  }

  private present(name: string, property: string): boolean {
    const end = name === 'Sydney' ? 6 : 7;
    return (
      !V.combat &&
      !V.possessed &&
      !V.nextPassageCheck &&
      this.valid(name, property) &&
      this.estate.current?.id === property &&
      this.estate.residentsHome(property).some(resident => resident.id === name) &&
      (Time.hour >= end || Time.hour * 60 + Time.minute + 5 <= end * 60)
    );
  }

  public get choices(): OutingActivity[] {
    if (!this.plan) return [];
    return this.plan.hour < 20 ? ['meal', 'shopping', 'walk'] : this.plan.hour < 21 ? ['shopping', 'walk'] : ['walk'];
  }

  public get cafeOpen(): boolean {
    return V.chef_state !== 8 && !(V.chef_state === 7 && V.chef_rework <= 30);
  }

  public get offer(): PropertyOutingState['plan'] {
    const plan = this.plan;
    return plan?.stage === 'offered' &&
      plan.at > Time.date.timeStamp &&
      Time.date.timeStamp < (plan.offered_at ?? 0) + 86400 &&
      this.hour(plan.name, this.day(plan.at)) === plan.hour &&
      this.present(plan.name, plan.property)
      ? plan
      : null;
  }

  /** 由既有的居家日常入口提出邀约，刷新正文不会重新抽选。 */
  public propose(): boolean {
    const property = this.estate.current;
    const transport = this.core.get('Transport');
    if (
      !property ||
      this.core.passage.title !== 'Deadwood Reblooms Property Home' ||
      this.live ||
      this.note ||
      this.memory ||
      this.estate.banquet.active ||
      this.state.offer_day > Math.floor(Time.days) - 7 ||
      !transport?.state.school.motor_vehicle.licensed ||
      !transport.state.vehicles.some(vehicle => !vehicle.stolen && Catalog.models.some(model => model.id === vehicle.model && model.kind === 'motor_vehicle' && model.seats > 0))
    )
      return false;
    const candidates = this.estate.residentsHome(property.id).flatMap(resident => {
      if (!window.isLoveInterest(resident.id) || !this.present(resident.id, property.id) || (resident.id === 'Robin' && C.npc.Robin.trauma >= 80)) return [];
      const day = this.days.find(day => this.hour(resident.id, day) !== null);
      return day === undefined ? [] : [{ name: resident.id, day, hour: this.hour(resident.id, day)! }];
    });
    if (!candidates.length) return false;
    const pick = this.core.SugarCube.Scripting.evalJavaScript('random') as (min: number, max: number) => number;
    const { name, day, hour } = candidates[pick(0, candidates.length - 1)];
    const activity: OutingActivity = hour >= 21 ? 'walk' : name === 'Robin' && hour < 20 ? 'meal' : name === 'Sydney' || name === 'Whitney' ? 'shopping' : 'walk';
    this.state.plan = { name, property: property.id, day, hour, at: this.at(day, hour), activity, stage: 'offered', source: 'partner', offered_at: Time.date.timeStamp, vehicle: null, enjoyed: false };
    this.state.offer_day = Math.floor(Time.days);
    return true;
  }

  public accept(activity: OutingActivity): boolean {
    const plan = this.offer;
    if (V.passage !== 'Deadwood Reblooms Property Outing Invitation' || !plan || !this.choices.includes(activity)) return false;
    // 邀约跨过 07:00 后重算游戏日标签，约好的实际日期保持不变。
    const day = this.day(plan.at);
    if (this.hour(plan.name, day) !== plan.hour) return false;
    plan.day = day;
    plan.activity = activity;
    plan.stage = 'booked';
    return true;
  }

  public decline(): boolean {
    if (V.passage !== 'Deadwood Reblooms Property Outing Invitation' || !this.offer) return false;
    this.plan!.stage = 'cancelled';
    return true;
  }

  public get weather(): boolean {
    return this.waiting && this.plan!.activity === 'walk' && Weather.precipitation !== 'none' && this.present(this.plan!.name, this.plan!.property);
  }

  public get alternatives(): OutingActivity[] {
    return this.weather ? this.choices.filter(activity => activity !== 'walk' && this.indoor(activity)) : [];
  }

  public reschedule(day: number, activity: OutingActivity): boolean {
    const plan = this.plan;
    if (V.passage !== 'Deadwood Reblooms Property Outing Weather' || !this.weather || !plan || !['meal', 'shopping', 'walk'].includes(activity)) return false;
    const today = day === Math.floor(Time.days);
    const hour = today ? plan.hour : this.hour(plan.name, day);
    if ((!today && !this.days.includes(day)) || hour === null || (activity === 'meal' && hour >= 20) || (activity === 'shopping' && hour >= 21)) return false;
    if (today && (activity === 'walk' || !this.indoor(activity))) return false;
    plan.moved ??= plan.at;
    if (!today) {
      plan.day = day;
      plan.hour = hour;
      plan.at = this.at(day, hour);
    } else {
      plan.at = Time.date.timeStamp + 120;
      plan.day = day;
      plan.hour = new DateTime(plan.at).hour;
    }
    plan.activity = activity;
    return true;
  }

  private indoor(activity: OutingActivity): boolean {
    if (activity === 'meal' && !this.cafeOpen) return false;
    const property = this.estate.current;
    const transport = this.core.get('Transport');
    const from = property?.street === 'Office Lobby' ? 'high' : property && Catalog.point(property.street);
    const distance = from ? Catalog.distance(from, activity === 'meal' ? 'cliff' : 'high') : null;
    if (!property || !transport || distance === null) return false;
    return transport.state.vehicles.some(vehicle => {
      const model = Catalog.models.find(model => model.id === vehicle.model);
      if (
        !model ||
        model.kind !== 'motor_vehicle' ||
        !model.seats ||
        vehicle.stolen ||
        vehicle.condition <= 0 ||
        (vehicle.arrears ?? 0) > 0 ||
        vehicle.fuel < Math.ceil((distance * 2 + 4) * model.fuel_use * 100) / 100 ||
        (vehicle.garage !== property.id && !(vehicle.garage === null && vehicle.point === from))
      )
        return false;
      const drive = transport.journeyMinutes(model, distance + 2);
      const now = Time.hour * 60 + Time.minute + 3;
      return now + drive + 20 < (activity === 'meal' ? 20 : 21) * 60 && (this.plan!.name !== 'Sydney' || now + drive * 2 + 20 < 21 * 60);
    });
  }

  public get memory(): OutingMemory | undefined {
    if (this.note || this.waiting || this.travelling || this.estate.banquet.active) return;
    const midnight = new DateTime(Time.year, Time.month, Time.monthDay).timeStamp;
    return Object.values(this.state.memories).find(memory => !memory.seen && memory.at < midnight && Time.date.timeStamp - memory.at < 259200 && this.present(memory.name, memory.property));
  }

  public recall(name: string): boolean {
    const memory = this.memory;
    if (V.passage !== 'Deadwood Reblooms Property Outing Recall' || memory?.name !== name) return false;
    memory.seen = true;
    return true;
  }

  public book(name: string, day: number, activity: OutingActivity): boolean {
    const property = this.estate.current;
    const hour = this.hour(name, day);
    if (
      V.passage !== 'Deadwood Reblooms Property Outing Plan' ||
      !property ||
      this.live ||
      !this.days.includes(day) ||
      hour === null ||
      (hour >= 20 && activity === 'meal') ||
      (hour >= 21 && activity === 'shopping') ||
      !['meal', 'shopping', 'walk'].includes(activity) ||
      !this.estate.residentsHome(property.id).some(resident => resident.id === name) ||
      !this.valid(name, property.id)
    )
      return false;
    const at = this.at(day, hour);
    this.state.plan = { name, property: property.id, day, hour, at, activity, stage: 'booked', vehicle: null, enjoyed: false };
    return true;
  }

  public cancel(): boolean {
    if (!this.plan || !['offered', 'booked'].includes(this.plan.stage)) return false;
    this.plan.stage = 'cancelled';
    return true;
  }

  public abandon(): void {
    const plan = this.plan;
    if (!plan || !['out', 'visit', 'return'].includes(plan.stage)) return;
    plan.stage = 'cancelled';
    const transport = this.core.get('Transport');
    if (transport) {
      transport.state.passengers = transport.state.passengers.filter(name => name !== plan.name);
      if (transport.state.trip) transport.state.trip.passengers = transport.state.trip.passengers.filter(name => name !== plan.name);
    }
  }

  public get waiting(): boolean {
    return this.live && this.plan!.stage === 'booked' && Time.date.timeStamp >= this.plan!.at && Time.date.timeStamp < this.plan!.at + 1800;
  }

  public get due(): boolean {
    return this.waiting && this.home(this.plan!.name, this.plan!.property) === true;
  }

  public canLeave(id: string): boolean {
    if (!['Deadwood Reblooms Property Garage', 'Deadwood Transport Menu'].includes(V.passage)) return false;
    const transport = this.core.get('Transport');
    const property = this.estate.properties.find(item => item.id === id);
    if (!transport || !property) return false;
    if (transport.atGarage) return this.estate.current?.id === id;
    const street = property.street === 'Office Lobby' ? 'High Street' : property.street;
    return V.passage === 'Deadwood Transport Menu' && !transport.state.shop && transport.state.return_passage === street && transport.point === Catalog.point(street);
  }

  public begin(vehicleId: number): boolean {
    const plan = this.plan;
    const transport = this.core.get('Transport');
    if (
      !this.due ||
      (plan!.activity === 'meal' && !this.cafeOpen) ||
      !transport ||
      !this.canLeave(plan!.property) ||
      transport.taxi.active ||
      transport.state.commute ||
      !transport.ready ||
      V.nextPassageCheck ||
      V.worn.feet.type.includes('shackle') ||
      V.drunk > 0 ||
      V.drugged > 0 ||
      V.stress >= V.stressmax ||
      !transport.state.school.motor_vehicle.licensed
    )
      return false;
    const vehicle = transport.nearby.find(item => item.id === vehicleId);
    const model = Catalog.models.find(item => item.id === vehicle?.model);
    const destination = { meal: 'cliff', shopping: 'high', walk: 'starfish' }[plan!.activity];
    const distance = vehicle ? Catalog.distance(vehicle.point, destination) : null;
    if (
      !vehicle ||
      model?.kind !== 'motor_vehicle' ||
      !model.seats ||
      vehicle.stolen ||
      vehicle.condition <= 0 ||
      (vehicle.arrears ?? 0) > 0 ||
      distance === null ||
      vehicle.fuel < Math.ceil((distance * 2 + 4) * model.fuel_use * 100) / 100 ||
      (plan!.activity === 'walk' && Weather.precipitation !== 'none')
    )
      return false;
    if (plan!.name === 'Sydney' && Time.hour * 60 + Time.minute + 1 + transport.journeyMinutes(model, distance + 2) * 2 + 20 >= 21 * 60) return false;
    if (plan!.activity !== 'walk' && Time.hour * 60 + Time.minute + 1 + transport.journeyMinutes(model, distance + 2) + 20 > (plan!.activity === 'meal' ? 20 : 21) * 60) return false;
    if (V.passage === 'Deadwood Reblooms Property Garage') {
      if (!transport.open(vehicleId)) return false;
    } else {
      transport.state.selected = vehicleId;
      transport.state.trip = null;
    }
    vehicle.garage = null;
    plan!.stage = 'out';
    plan!.vehicle = vehicleId;
    transport.state.passengers = [plan!.name];
    return true;
  }

  public arrive(destination: string): void {
    const plan = this.plan;
    if (!this.travelling || !plan || destination !== this.target) return;
    if (plan.stage === 'out') plan.stage = 'visit';
    else if (plan.stage === 'return' && this.estate.current?.id === plan.property) {
      plan.stage = 'done';
      this.receive(plan.name, plan.property, 'outing');
      this.state.memories[plan.name] = { name: plan.name, property: plan.property, activity: plan.activity, at: Time.date.timeStamp, short: !plan.enjoyed, wet: !!plan.wet, seen: false };
    }
  }

  public get canStay(): boolean {
    const plan = this.plan;
    const transport = this.core.get('Transport');
    if (!this.travelling || plan!.stage !== 'visit' || !transport?.model || !transport.vehicle) return false;
    if (plan!.name !== 'Sydney') return true;
    const property = this.estate.properties.find(item => item.id === plan!.property);
    const point = property?.street === 'Office Lobby' ? 'high' : property && Catalog.point(property.street);
    const distance = point ? Catalog.distance(transport.vehicle.point, point) : null;
    return distance !== null && Time.hour * 60 + Time.minute + 20 + transport.journeyMinutes(transport.model, distance + 2) < 21 * 60;
  }

  public get canIntimate(): boolean {
    const plan = this.plan;
    return this.canStay && !V.combat && !V.nextPassageCheck && !plan!.intimate && window.isLoveInterest(plan!.name) && (plan!.name !== 'Robin' || C.npc.Robin.trauma < 50);
  }

  public back(enjoyed = false): boolean {
    const transport = this.core.get('Transport');
    if (
      !this.travelling ||
      !transport ||
      !['Deadwood Reblooms Property Outing', 'Deadwood Transport Travel', 'Deadwood Transport Menu'].includes(V.passage) ||
      !['visit', 'out'].includes(this.plan!.stage) ||
      transport.state.trip?.interrupted ||
      !transport.ready ||
      transport.vehicle?.id !== this.plan!.vehicle ||
      transport.vehicle.stolen
    )
      return false;
    if (enjoyed && (!this.canStay || (this.plan!.activity === 'meal' && !this.cafeOpen))) return false;
    if (this.plan!.stage === 'out' && !transport.state.trip?.settled) return false;
    this.plan!.stage = 'return';
    this.plan!.enjoyed = enjoyed;
    this.plan!.wet = !enjoyed && this.plan!.activity === 'walk' && Weather.precipitation !== 'none';
    transport.state.trip = null;
    transport.state.return_passage = Catalog.passage(transport.vehicle.point);
    return true;
  }

  public receive(name: string, property: string, kind: 'ride' | 'outing' | 'temple'): void {
    if (!this.valid(name, property)) return;
    const end = name === 'Sydney' ? 21 : kind === 'temple' && Time.hour >= 20 ? 31 : kind === 'ride' && name === 'Robin' && Time.hour < 16 ? 16 : 24;
    this.state.visits[name] = { property, until: Time.date.timeStamp + Math.max(0, end * 60 - Time.hour * 60 - Time.minute) * 60, at: 'deadwood_home' };
    this.state.note = { name, property, day: Math.floor(Time.days), kind, short: kind === 'outing' && !this.plan?.enjoyed, done: false };
  }

  public drop(name: string, property: string, destination: 'school' | 'temple'): void {
    if (!this.valid(name, property)) return;
    const end = destination === 'temple' ? 7 : name === 'Robin' ? 8 : 9;
    this.state.visits[name] = { property, until: Time.date.timeStamp + Math.max(0, end * 60 - Time.hour * 60 - Time.minute) * 60, at: name === 'Kylar' ? 'front_courtyard' : destination };
  }

  public get note(): PropertyOutingState['note'] {
    const note = this.state.note;
    return note && !note.done && note.property === this.estate.current?.id && note.day === Math.floor(Time.days) && this.home(note.name, note.property) === true ? note : null;
  }

  public finish(): boolean {
    if (V.passage !== 'Deadwood Reblooms Property Return' || !this.note || V.combat || V.possessed || V.nextPassageCheck) return false;
    this.note.done = true;
    return true;
  }

  public home(name: string, property: string): boolean | null {
    const plan = this.plan;
    if (!this.valid(name, property)) return null;
    if (this.travelling && plan!.name === name) return false;
    if (this.core.get('Transport')?.companions.aboard.includes(name)) return false;
    const visit = this.state.visits[name];
    const held = visit?.property === property && visit.until > Time.date.timeStamp;
    if (held && visit.at !== 'deadwood_home') return false;
    if (!held && (plan?.name !== name || plan.property !== property || !this.waiting)) return null;
    if (name === 'Robin') return window.getRobinLocation() === 'deadwood_home';
    if (name === 'Kylar') return window.getKylarLocation().area === 'deadwood_home';
    if (name === 'Sydney') {
      window.sydneySchedule?.();
      return T.sydney_location === 'deadwood_home';
    }
    return true;
  }

  /** 在原版函数返回位置前应用约定，囚禁、伤病和节庆安排仍有优先权。 */
  public location(name: string, original: string): string {
    if (!V.Finance?.real_estate) return original;
    const property = this.estate.residenceOf(name)?.id;
    if (!property || !this.valid(name, property)) return original;
    const ride = this.core.get('Transport')?.state.commute;
    if (ride?.boarded && !ride.arrived && ride.npc === name && ride.property === property) return 'deadwood_outing';
    if (this.travelling && this.plan!.name === name) return 'deadwood_outing';
    if (this.core.get('Transport')?.companions.aboard.includes(name)) return 'deadwood_outing';
    const visit = this.state.visits[name];
    if (visit?.property === property && visit.until > Time.date.timeStamp) {
      // 接回家只覆盖空闲时段，店铺、家教、排练和神殿事务仍按原日程进行。
      const free =
        name === 'Robin'
          ? ['orphanage', 'sleep'].includes(original)
          : name === 'Kylar'
            ? ['unknown', 'park', 'arcade', 'manor_bedroom'].includes(original)
            : original === 'home' || (original === 'library' && Time.hour >= 16) || (original === 'temple' && V.sydney_templeWork === 'quarters');
      return visit.at !== 'deadwood_home' || free ? visit.at : original;
    }
    const plan = this.plan;
    if (plan?.name !== name || !this.waiting) return original;
    const free =
      name === 'Robin'
        ? ['orphanage', 'sleep'].includes(original)
        : name === 'Kylar'
          ? original === 'unknown' && Time.hour >= 18
          : original === 'temple' && Time.hour >= 17 && Time.hour <= 20 && !(Time.weekDay === 1 && V.sydney.rank === 'initiate');
    return free ? 'deadwood_home' : original;
  }

  private advance(): void {
    if (!V.Finance?.real_estate || V.replayScene || V.statFreeze) return;
    for (const [name, visit] of Object.entries(this.state.visits)) if (visit.until <= Time.date.timeStamp || !this.valid(name, visit.property)) delete this.state.visits[name];
    for (const [name, memory] of Object.entries(this.state.memories)) if (Time.date.timeStamp - memory.at >= 259200 || !this.valid(name, memory.property)) delete this.state.memories[name];
    const plan = this.plan;
    if (!plan || !['offered', 'booked', 'out', 'visit', 'return'].includes(plan.stage)) return;
    if (plan.stage === 'offered' && Time.date.timeStamp >= Math.min(plan.at, (plan.offered_at ?? 0) + 86400)) {
      plan.stage = 'cancelled';
      return;
    }
    if (!this.valid(plan.name, plan.property)) {
      this.abandon();
      plan.stage = 'cancelled';
    } else if (plan.stage !== 'offered' && Time.date.timeStamp >= plan.at + (plan.stage === 'booked' ? 1800 : 21600)) {
      this.abandon();
      plan.stage = 'missed';
    }
  }

  public clear(property: string): void {
    if (this.plan?.property === property) {
      this.abandon();
      this.plan.stage = 'cancelled';
    }
    if (this.state.note?.property === property) this.state.note = null;
    for (const [name, visit] of Object.entries(this.state.visits)) if (visit.property === property) delete this.state.visits[name];
    for (const [name, memory] of Object.entries(this.state.memories)) if (memory.property === property) delete this.state.memories[name];
  }
}
