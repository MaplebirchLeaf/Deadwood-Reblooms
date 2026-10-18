// ./src/module/Transport/Commute.ts

import type Transport from '../Transport';
import Catalog, { type Vehicle } from './Catalog';

export interface Ride {
  npc: string;
  kind: 'school' | 'home' | 'temple' | 'farm';
  from: string;
  to: string;
  arrival: string;
  source: string;
  walk: number;
  day: number;
  boarded: boolean;
  property?: string;
  home?: string;
  arrived?: boolean;
  until?: number;
}

export interface AveryReply {
  day: number;
  peer: boolean;
  robin: boolean;
}

export default class Commute {
  private whitney_reunion = false;

  public constructor(private readonly transport: Transport) {}

  public enterPassage(): void {
    this.whitney_reunion = this.transport.core.passage.title === 'School Leave Whitney' && V.whitneyReunionScene !== undefined;
  }

  private linksTo(...destinations: string[]): boolean {
    const links = new this.transport.core.tool.link('passage-content', '.macro-link', this.transport.core.tool.log);
    return links.detect() && links.links.some(link => destinations.includes(link.getAttribute('data-passage') ?? ''));
  }

  private healthy(name: string): boolean {
    const npc = C.npc[name];
    if (npc?.init !== 1 || !['active', 'rescued'].includes(npc.state)) return false;
    if (name === 'Alex') return V.farm_stage >= 2;
    if (!window.isLoveInterest(name)) return false;
    return name !== 'Robin' || (!V.robinmissing && V.robin.timer.hurt === 0 && V.RobinExpansion?.asylum?.status !== 'admitted');
  }

  public distance(plan: Ride): number {
    const estate = this.transport.core.get('Finance')?.realEstate;
    const home = plan.home ? estate?.properties.find(property => property.id === plan.home) : undefined;
    const point = home ? (home.street === 'Office Lobby' ? 'high' : Catalog.point(home.street)) : plan.to;
    return (point ? (Catalog.distance(plan.from, point) ?? Infinity) : Infinity) + (plan.property ? 2 : 0) + (home ? 2 : 0);
  }

  public get homeOffers(): Ride[] {
    const estate = this.transport.core.get('Finance')?.realEstate;
    const property = estate?.current;
    if (!estate || !property || !estate.outings.canLeave(property.id) || this.transport.taxi.active || !this.transport.ready || this.transport.state.commute || estate.outings.travelling) return [];
    const from = property.street === 'Office Lobby' ? 'high' : Catalog.point(property.street);
    if (!from) return [];
    return estate.residentsHome(property.id).flatMap(resident => {
      if (!this.healthy(resident.id)) return [];
      const temple = resident.id === 'Sydney' && Time.hour === 5;
      const school = resident.id !== 'Sydney' && Time.schoolDay && Time.hour === 6;
      if (!temple && !school) return [];
      return [
        {
          npc: resident.id,
          kind: temple ? 'temple' : 'school',
          from,
          to: temple ? 'wolf' : 'oxford',
          arrival: temple ? 'Temple' : 'School Front Courtyard',
          source: 'Deadwood Transport Menu',
          walk: 1,
          day: Math.floor(Time.days),
          until: Time.date.timeStamp + (24 * 60 - Time.hour * 60 - Time.minute) * 60,
          boarded: false,
          property: property.id
        }
      ];
    });
  }

  public prepareHome(name: string): boolean {
    const plan = this.homeOffers.find(ride => ride.npc === name);
    if (!plan || !this.transport.canDepart || !this.transport.vehicle || !this.vehicles(plan).includes(this.transport.vehicle)) return false;
    this.transport.state.commute = plan;
    return true;
  }

  public get offer(): Ride | null {
    if (this.transport.taxi.active || !this.transport.ready || V.nextPassageCheck) return null;
    const source = this.transport.core.passage.title;
    const plan = (npc: string, kind: Ride['kind'], from: string, to: string, arrival: string, walk: number): Ride | null => {
      if (!this.healthy(npc) || this.transport.state.affection_days[npc + ':' + kind] === Time.days) return null;
      const home = kind === 'home' ? this.transport.core.get('Finance')?.realEstate.residenceOf(npc)?.id : undefined;
      return {
        npc,
        kind,
        from,
        to: home ? 'home:' + home : to,
        arrival: home ? 'Deadwood Reblooms Property Home' : arrival,
        source,
        walk,
        day: Math.floor(Time.days),
        until: Time.date.timeStamp + (24 * 60 - Time.hour * 60 - Time.minute) * 60,
        boarded: false,
        home
      };
    };
    const from = Catalog.point(source);
    if (from && source.endsWith(' Street') && Time.hour >= 6 && Time.hour < 21 && this.linksTo('Street Alex Cafe')) return plan('Alex', 'farm', from, 'farmland', 'Farmland', 1);
    if (
      source === 'Temple Sydney' &&
      Time.hour >= 17 &&
      Time.hour < 20 &&
      T.sydney_location === 'temple' &&
      V.sydney_templeWork === 'quarters' &&
      this.transport.core.get('Finance')?.realEstate.residenceOf('Sydney') &&
      V.NPCList?.[0]?.fullDescription === 'Sydney' &&
      this.linksTo('Temple')
    )
      return plan('Sydney', 'home', 'wolf', 'wolf', 'Temple', 1);
    if (!Time.schoolDay) return null;
    if (Time.hour >= 7 && Time.hour < 9 && this.linksTo('Robin Walk School')) return plan('Robin', 'school', 'domus', 'oxford', 'School Front Courtyard', 1);
    if (Time.hour >= 8 && Time.hour < 10 && this.linksTo('Whitney Home School Walk')) return plan('Whitney', 'school', 'barb', 'oxford', 'School Front Courtyard', 2);
    if (Time.hour >= 6 && Time.hour < 9 && this.linksTo('Sydney Walk School')) return plan('Sydney', 'school', 'wolf', 'oxford', 'School Front Courtyard', 1);
    if (Time.hour < 15 || Time.hour >= 17 || (V.detention >= 1 && V.daily.school.detentionAttended !== 1 && V.headnodetention !== 1 && V.pillory.tenant.special.name !== 'Leighton')) return null;
    if (((source === 'School Front Courtyard' && this.linksTo('Oxford Street')) || (source === 'Deadwood Transport Avery' && this.averyReply?.robin)) && window.getRobinLocation() === 'school')
      return plan('Robin', 'home', 'oxford', 'domus', 'Orphanage', 1);
    if (source === 'Kylar Courtyard' && V.syndromekylar >= 1 && window.getKylarLocation().area === 'rear_courtyard' && this.linksTo('School Rear Courtyard'))
      return plan('Kylar', 'home', 'oxford', 'danube', 'Danube Street', 3);
    if (source === 'School Leave Whitney' && V.whitneyromance === 1 && !this.whitney_reunion && !V.halloween && this.linksTo('Oxford Street'))
      return plan('Whitney', 'home', 'oxford', 'barb', 'Barb Street', 1);
    if (V.location === 'school' && ['schoollibrary', 'rehearsal'].includes(V.bus) && this.linksTo('Temple Sydney Walk'))
      return plan('Sydney', 'temple', 'oxford', 'wolf', 'Temple', V.bus === 'rehearsal' ? 1 : 5);
    return null;
  }

  public vehicles(plan = this.offer): Vehicle[] {
    if (this.transport.taxi.active || !plan || V.drunk > 0 || V.drugged > 0 || V.stress >= V.stressmax || V.worn.feet.type.includes('shackle') || !this.transport.state.school.motor_vehicle.licensed)
      return [];
    return this.transport.state.vehicles.filter(vehicle => {
      const model = Catalog.models.find(model => model.id === vehicle.model);
      const distance = this.distance(plan);
      return (
        model?.kind === 'motor_vehicle' &&
        model.seats > 0 &&
        !vehicle.stolen &&
        vehicle.point === plan.from &&
        vehicle.garage === null &&
        vehicle.condition > 0 &&
        !(vehicle.arrears ?? 0) &&
        Number.isFinite(distance) &&
        vehicle.fuel >= Math.ceil(distance * model.fuel_use * 100) / 100
      );
    });
  }

  public prepare(vehicleId: number): boolean {
    const plan = this.offer;
    if (!plan || !this.vehicles(plan).some(vehicle => vehicle.id === vehicleId)) return false;
    this.transport.state.commute = plan;
    this.transport.state.selected = vehicleId;
    return true;
  }

  public get active(): boolean {
    const plan = this.transport.state.commute;
    if (!plan || (plan.until ? Time.date.timeStamp >= plan.until : plan.day !== Math.floor(Time.days)) || !this.healthy(plan.npc)) return false;
    if (plan.home && this.transport.core.get('Finance')?.realEstate.residenceOf(plan.npc)?.id !== plan.home) return false;
    if (plan.property)
      return (
        (plan.kind === 'temple' ? Time.hour >= 5 && Time.hour < 7 : Time.schoolDay && Time.hour >= 6 && Time.hour < 9) &&
        this.transport.core.get('Finance')?.realEstate.residenceOf(plan.npc)?.id === plan.property
      );
    if (plan.source === 'Temple Sydney') return Time.hour >= 17 && Time.hour < 21;
    if (plan.kind === 'farm') return plan.npc === 'Alex' && Time.hour >= 6 && Time.hour < 21;
    return (
      Time.schoolDay &&
      (plan.kind === 'school'
        ? Time.hour >= 6 && Time.hour < 10
        : Time.hour >= 15 && Time.hour < 17 && !(V.detention >= 1 && V.daily.school.detentionAttended !== 1 && V.headnodetention !== 1 && V.pillory.tenant.special.name !== 'Leighton'))
    );
  }

  public board(): boolean {
    const state = this.transport.state;
    const plan = state.commute;
    if (
      this.transport.core.passage.title !== 'Deadwood Transport Boarding' ||
      !this.transport.ready ||
      !this.active ||
      !plan ||
      plan.boarded ||
      !this.vehicles(plan).some(vehicle => vehicle.id === state.selected)
    )
      return false;
    if (plan.kind === 'home' || plan.kind === 'temple') this.transport.core.SugarCube.Wikifier.wikifyEval('<<schoolclothesreset>>');
    V.outside = 1;
    V.location = 'town';
    V.bus = plan.from;
    this.transport.core.SugarCube.Wikifier.wikifyEval(`<<pass ${plan.walk}>>`);
    if (this.transport.core.passage.title !== 'Deadwood Transport Boarding' || !this.transport.ready || !this.active) return false;
    plan.boarded = true;
    state.origin = plan.from;
    state.return_passage = Catalog.passage(plan.from);
    state.shop = null;
    state.trip = null;
    state.passengers = [plan.npc];
    return true;
  }

  public arrive(): void {
    const plan = this.transport.state.commute;
    if (!plan?.boarded || plan.arrived || this.transport.state.trip?.to !== plan.to) return;
    plan.arrived = true;
    this.transport.state.return_passage = plan.arrival;
    const estate = this.transport.core.get('Finance')?.realEstate;
    if (plan.home && estate?.current?.id === plan.home) estate.outings.receive(plan.npc, plan.home, 'ride');
    else if (plan.property && estate) estate.outings.drop(plan.npc, plan.property, plan.kind === 'temple' ? 'temple' : 'school');
    else if (plan.npc === 'Robin') this.transport.core.SugarCube.Wikifier.wikifyEval(`<<run setRobinLocationOverride('${plan.kind === 'school' ? 'school' : 'orphanage'}', ${Time.hour})>>`);
    if (plan.npc === 'Sydney' && plan.kind === 'temple') {
      V.daily.sydney.templeSkip = true;
      delete V.sydneyExit;
    }
    const key = plan.npc + ':' + plan.kind;
    if (this.transport.state.affection_days[key] !== Time.days) {
      this.transport.state.affection_days[key] = Math.floor(Time.days);
      this.transport.core.SugarCube.Wikifier.wikifyEval(`<<npcincr '${plan.npc}' love 1>>`);
    }
  }

  public get avery(): boolean {
    return (
      this.transport.core.passage.title === 'Oxford Street' &&
      this.transport.ready &&
      C.npc.Avery?.state === 'active' &&
      !V.avery_injury &&
      this.linksTo('Avery School Pickup Accept', 'Avery Pub Winter') &&
      this.transport.state.vehicles.some(vehicle => vehicle.point === 'oxford' && vehicle.garage === null)
    );
  }

  public get averyPeer(): boolean {
    const company = this.transport.core.get('Finance')?.company;
    return !!company?.meeting && (company.shareholders.director || company.shareholders.controller);
  }

  public answerAvery(): boolean {
    if (!this.avery) return false;
    this.transport.state.avery_reply = {
      day: Math.floor(Time.days),
      peer: this.averyPeer,
      robin: V.pickupRobinPresent === 1 && this.linksTo('Avery School Pickup Accept')
    };
    if (!this.transport.state.avery_reply.peer) this.transport.core.SugarCube.Wikifier.wikifyEval('<<npcincr Avery rage 5>><<npcincr Avery love -1>>');
    return true;
  }

  public get averyReply(): AveryReply | null {
    const reply = this.transport.state.avery_reply;
    return this.transport.core.passage.title === 'Deadwood Transport Avery' && reply?.day === Math.floor(Time.days) ? reply : null;
  }
}
