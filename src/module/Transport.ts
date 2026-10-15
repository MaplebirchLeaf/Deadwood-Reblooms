// ./src/module/Transport.ts

import Module from './Module';
import Catalog, { type Vehicle, type VehicleModel, type VehicleOutlet } from './Transport/Catalog';
import DrivingSchool from './Transport/DrivingSchool';
import Fuel from './Transport/Fuel';
import Repairs from './Transport/Repairs';
import Maintenance from './Transport/Maintenance';
import Companions from './Transport/Companions';
import Commute, { type AveryReply, type Ride } from './Transport/Commute';
import TravelEvents, { type RoadsideEvent } from './Transport/TravelEvents';
import Taxi, { type TaxiLeg, type TaxiState } from './Transport/Taxi';

interface Journey {
  vehicle: number;
  from: string;
  to: string;
  minutes: number;
  fuel: number;
  settled: boolean;
  interrupted: boolean;
  progress?: number;
  passengers: string[];
  dated: boolean;
  /** 本次行程已在路边独处过。 */
  fooled: boolean;
  /** 车厢亲密场景是否尚未初始化战斗。 */
  pullstart?: boolean;
  commute?: Ride['kind'];
  scene?: number;
  event?: RoadsideEvent;
  taxi?: TaxiLeg;
  taxi_job?: number;
}

export interface TransportState {
  vehicles: Vehicle[];
  selected: number | null;
  next_id: number;
  origin: string | null;
  return_passage: string;
  offer: string | null;
  shop: VehicleOutlet | 'motors' | 'garage' | 'petrol' | 'school' | null;
  driving: number;
  helmet: boolean;
  fuel_stores: Record<string, { cans: number; litres: number }>;
  repair_tools: { bicycle: boolean; motor: boolean };
  repair_parts: { bicycle: number; motor: number };
  passengers: string[];
  affection_days: Record<string, number>;
  commute: Ride | null;
  avery_reply: AveryReply | null;
  event_day: number;
  taxi: TaxiState;
  school: typeof DrivingSchool.defaults;
  trip: Journey | null;
  notice: 'bought' | 'repaired' | 'fuelled' | 'parked' | 'taken' | 'sold' | 'helmet' | 'recovered' | 'retrieved' | 'delivered' | 'refilled' | 'tools' | 'parts' | 'patched' | null;
}

class Transport extends Module {
  public static readonly defaults: TransportState = {
    vehicles: [],
    selected: null,
    next_id: 1,
    origin: null,
    return_passage: 'Harvest Street',
    offer: null,
    shop: null,
    driving: 0,
    helmet: false,
    fuel_stores: {},
    repair_tools: { bicycle: false, motor: false },
    repair_parts: { bicycle: 0, motor: 0 },
    passengers: [],
    affection_days: {},
    commute: null,
    avery_reply: null,
    event_day: -1,
    taxi: clone(Taxi.defaults),
    school: clone(DrivingSchool.defaults),
    trip: null,
    notice: null
  };

  public readonly catalog = Catalog;
  public readonly school = new DrivingSchool(this);
  public readonly fuel = new Fuel(this);
  public readonly repairs = new Repairs(this);
  public readonly maintenance = new Maintenance(this);
  public readonly companions = new Companions(this);
  public readonly commute = new Commute(this);
  public readonly events = new TravelEvents(this);
  public readonly taxi = new Taxi(this);
  public external_bicycle = false;
  private trail_menu = false;

  public constructor(core: typeof maplebirch) {
    super(core, 'Transport', Transport.defaults);
  }

  public override preInit(): void {
    super.preInit();
    this.core.dynamic.regTimeEvent('onDay', ':deadwood-transport-upkeep', { action: () => this.maintenance.settle() });
    this.core.dynamic.regTimeEvent('onTimeTravel', ':deadwood-transport-upkeep-travel', {
      cond: data => data.direction === 'forward' && !!V.Transport,
      action: () => this.maintenance.settle()
    });
    this.core.on(':passagestart', () => {
      V.Transport ??= clone(Transport.defaults);
      const title = this.core.passage.title;
      this.events.enterPassage();
      this.commute.enterPassage();
      // 原版正文末尾会清空 eventskip，在入口保留普通探索菜单的判定。
      this.trail_menu =
        V.eventskip >= 1 &&
        !V.nextPassageCheck &&
        (title === 'Forest' ? ![1, 3].includes(V.town_projects.road) && (V.foresthunt ?? 0) < 10 : title === 'Moor' && (V.moor_hunt ?? 0) < 10 && V.moormove !== 'horse');
    });
  }

  public get state(): TransportState {
    return (V.Transport ??= clone(Transport.defaults));
  }

  public get ready(): boolean {
    return !V.replayScene && !V.statFreeze && !V.combat && !V.possessed && (V.exposed <= 0 || this.core.get('VanillaPlus')?.exhibitionism.canRoamTown === true) && !window.pcAreArmsBound('both');
  }

  public get point(): string | null {
    if (this.atGarage) {
      const property = this.core.get('Finance')?.realEstate.current;
      return property ? (property.street === 'Office Lobby' ? 'high' : Catalog.point(property.street)) : null;
    }
    if (this.core.passage.title === 'Shopping Centre') return 'high';
    return Catalog.point(this.core.passage.title) ?? (this.core.passage.title.startsWith('Deadwood Transport') ? this.state.origin : null);
  }

  public get canApproach(): boolean {
    if (!this.ready || (!Catalog.point(this.core.passage.title) && this.core.passage.title !== 'Shopping Centre') || V.nextPassageCheck) return false;
    const links = new this.core.tool.link('passage-content', '.macro-link', this.core.tool.log);
    if (!links.detect()) return false;
    if (this.core.passage.title === 'Shopping Centre') {
      return Time.dayState !== 'night' && Time.hour !== 21 && links.links.some(link => ['Supermarket', 'Hairdressers', 'Furniture Shop'].includes(link.getAttribute('data-passage') ?? ''));
    }
    if (['Forest', 'Moor'].includes(this.core.passage.title)) {
      return this.trail_menu && links.links.filter(link => link.getAttribute('data-passage') === this.core.passage.title).length >= 3;
    }
    if (this.core.passage.title.endsWith(' Street') && Array.isArray(V.link_table)) {
      return V.link_table.some(entry => entry.includes('|Bus]]') || Catalog.routes.some(route => route.passage !== this.core.passage.title && entry.includes(`|${route.passage}]]`)));
    }
    return links.links.some(link => {
      const passage = link.getAttribute('data-passage');
      return passage === 'Bus' || (passage !== this.core.passage.title && passage != null && Catalog.point(passage) != null);
    });
  }

  public get shopPoint(): string {
    return this.state.shop === 'bicycle' ? 'high' : this.state.shop === 'school' ? 'elk' : 'harvest';
  }

  public get shopPassage(): string {
    switch (this.state.shop) {
      case 'motors':
        return 'Deadwood Transport Motors';
      case 'garage':
        return 'Deadwood Transport Service';
      case 'petrol':
        return 'Deadwood Transport Petrol';
      case 'school':
        return 'Deadwood Transport School';
      default:
        return 'Deadwood Transport Dealer';
    }
  }

  public get shopOpen(): boolean {
    return (
      this.state.shop !== null &&
      this.point === this.shopPoint &&
      !this.atGarage &&
      ['Deadwood Transport Motors', 'Deadwood Transport Dealer', 'Deadwood Transport Buy', 'Deadwood Transport Service', 'Deadwood Transport Sell', 'Deadwood Transport Petrol'].includes(
        this.core.passage.title
      ) &&
      (this.state.shop === 'petrol' || (Time.hour >= 8 && Time.hour < 18))
    );
  }

  public get dealerOpen(): boolean {
    return ['bicycle', 'motorcycle', 'car'].includes(this.state.shop ?? '') && this.shopOpen;
  }

  public get models(): readonly VehicleModel[] {
    return Catalog.models.filter(model => model.outlet === this.state.shop && (!this.external_bicycle || model.kind !== 'bicycle'));
  }

  public get shopVehicles(): Vehicle[] {
    return this.state.vehicles.filter(vehicle => {
      const model = Catalog.models.find(model => model.id === vehicle.model);
      if (!model) return false;
      if (this.state.shop === 'garage') return true;
      if (this.state.shop === 'petrol') return model.tank > 0 && vehicle.point === this.shopPoint && vehicle.garage === null;
      return model.outlet === this.state.shop;
    });
  }

  public get availableAtShop(): boolean {
    return !!this.vehicle && !this.vehicle.stolen && this.shopVehicles.includes(this.vehicle) && this.vehicle.point === this.shopPoint && this.vehicle.garage === null;
  }

  public get offer(): VehicleModel | null {
    return this.models.find(model => model.id === this.state.offer) ?? null;
  }

  public get nearby(): Vehicle[] {
    const property = this.core.get('Finance')?.realEstate.current;
    const vehicles = this.state.vehicles.filter(vehicle => {
      const model = Catalog.models.find(model => model.id === vehicle.model);
      return (
        !!model &&
        !vehicle.stolen &&
        (!this.taxi.active || vehicle.id === this.taxi.state.shift?.vehicle) &&
        !(this.external_bicycle && model.kind === 'bicycle') &&
        vehicle.point === this.point &&
        (vehicle.garage === null || (this.atGarage && vehicle.garage === property?.id))
      );
    });
    const fleet = this.taxi.fleet;
    if (fleet && !fleet.stolen && fleet.point === this.point && /^Deadwood Transport (?:Taxi|Travel|Road Fight)/.test(this.core.passage.title)) vehicles.push(fleet);
    return vehicles;
  }

  public get atGarage(): boolean {
    return (
      this.core.passage.title === 'Deadwood Reblooms Property Garage' || (this.core.passage.title.startsWith('Deadwood Transport') && this.state.return_passage === 'Deadwood Reblooms Property Garage')
    );
  }

  public get vehicle(): Vehicle | null {
    if (this.state.selected === -1) return this.taxi.fleet;
    return this.state.vehicles.find(vehicle => vehicle.id === this.state.selected) ?? null;
  }

  public get model(): VehicleModel | null {
    return Catalog.models.find(model => model.id === this.vehicle?.model) ?? null;
  }

  public get garage(): { id: string; capacity: number; used: number } | null {
    const estate = this.core.get('Finance')?.realEstate;
    const property = estate?.current;
    const parking = estate?.facilities.find(facility => facility.id === 'garage')?.parking;
    if (!property || !parking || !this.model || !this.atGarage) return null;
    return {
      id: property.id,
      capacity: parking[this.model.kind],
      used: this.state.vehicles.filter(vehicle => vehicle.garage === property.id && Catalog.models.find(model => model.id === vehicle.model)?.kind === this.model!.kind).length
    };
  }

  public get canDepart(): boolean {
    if (
      !this.ready ||
      !this.vehicle ||
      !this.model ||
      !this.nearby.includes(this.vehicle) ||
      this.vehicle.garage !== null ||
      this.vehicle.condition <= 0 ||
      (this.vehicle.arrears ?? 0) > 0 ||
      V.worn.feet.type.includes('shackle')
    )
      return false;
    if (this.model.kind === 'bicycle') return !this.external_bicycle;
    return V.drunk <= 0 && V.drugged <= 0 && V.stress < V.stressmax && this.qualified && (this.model.kind !== 'motorcycle' || this.state.helmet);
  }

  public journeyMinutes(model: VehicleModel, distance: number, trail = false): number {
    const slow = Weather.isSnow ? 1.5 : Weather.precipitation === 'rain' ? 1.2 : 1;
    const ratio = trail ? (model.kind === 'bicycle' ? 0.65 : 0.5) : model.travel_ratio;
    const skill = model.kind === 'bicycle' ? window.currentSkillValue('athletics') : this.state.driving;
    const proficiency = 1 - (Math.clamp(skill, 0, 1000) / 1000) * (model.kind === 'bicycle' ? 0.2 : trail ? 0.15 : 0.3);
    const minutes = Math.ceil(distance * ratio * slow) + (model.kind === 'bicycle' ? 1 : 2);
    return Math.max(2, Math.ceil(minutes * proficiency));
  }

  public journeyWear(model: VehicleModel, minutes: number, trail = false): number {
    return (minutes / 60) * model.wear_per_hour * (trail ? (model.trail_wear ?? 1.5) : 1);
  }

  public get forestRoad(): boolean {
    const trip = this.state.trip;
    return !!trip && V.town_projects.road >= 4 && trip.to.startsWith('forest:') && trip.from.startsWith('forest:') && Math.max(Number(trip.from.split(':')[1]), Number(trip.to.split(':')[1])) <= 25;
  }

  public get qualified(): boolean {
    if (!this.model) return false;
    return this.model.kind === 'bicycle' || this.state.school[this.model.kind].licensed || (this.model.kind === 'motorcycle' && this.model.learner && this.school.motorcycleLearner);
  }

  public get destinations(): { id: string; name: string; minutes: number; fuel: number; affordable: boolean }[] {
    const from = this.point;
    const model = this.model;
    if (!from || !model) return [];
    let choices: { id: string; distance: number }[];
    const [area, value] = from.split(':');
    const depth = Number(value);
    if (area === 'forest' || area === 'moor') {
      choices = [];
      const forest = area === 'forest';
      const limit = forest ? (model.terrain.includes('forest_trail') ? 50 : V.town_projects.road >= 4 && model.kind === 'bicycle' ? 25 : 0) : model.terrain.includes('moor_track') ? 20 : 0;
      if (depth >= 0 && depth <= limit) {
        if (depth < limit && (forest || (!Weather.isSnow && Weather.precipitation !== 'rain'))) choices.push({ id: `${area}:${Math.min(limit, depth + 5)}`, distance: 10 });
        if (depth > 0) choices.push({ id: `${area}:${Math.max(0, depth - 5)}`, distance: 10 });
      }
      if (depth === 0) choices.push(...(forest ? ['nightingale', 'wolf', 'danube'] : ['farmland']).map(id => ({ id, distance: forest ? 10 : 5 })));
    } else {
      choices = Catalog.routes
        .filter(
          route =>
            (route.id !== from || this.state.commute?.to === route.id || this.core.get('Finance')?.realEstate.outings.target === route.id) && model.terrain.includes(route.terrain as 'road' | 'park')
        )
        .flatMap(route => {
          const distance = Catalog.distance(from, route.id, model.kind === 'bicycle');
          return distance == null
            ? []
            : [{ id: route.id, distance: distance + (this.atGarage || this.state.commute?.property || this.core.get('Finance')?.realEstate.outings.plan?.stage === 'out' ? 2 : 0) }];
        });
      if (model.kind === 'bicycle' && ['wolf', 'nightingale', 'danube'].includes(from)) choices.push({ id: 'forest:0', distance: 10 });
      if (model.terrain.includes('moor_track') && from === 'farmland' && !Weather.isSnow && Weather.precipitation !== 'rain') choices.push({ id: 'moor:0', distance: 5 });
      const estate = this.core.get('Finance')?.realEstate;
      for (const property of estate?.properties ?? []) {
        if (!estate!.owns(property.id) || estate!.isFrozen(property.id) || estate!.managementFor(property.id).rented) continue;
        const point = property.street === 'Office Lobby' ? 'high' : Catalog.point(property.street);
        const distance = point ? Catalog.distance(from, point, model.kind === 'bicycle') : null;
        if (distance !== null) choices.push({ id: 'home:' + property.id, distance: distance + 2 });
      }
    }
    return choices.map(({ id, distance }) => {
      const trail = /^(?:forest|moor):/.test(id) || /^(?:forest|moor):/.test(from);
      const minutes = this.journeyMinutes(model, distance, trail);
      const fuel = Math.ceil(distance * model.fuel_use * 100) / 100;
      return { id, name: Catalog.name(id), minutes, fuel, affordable: fuel <= (this.vehicle?.fuel ?? 0) };
    });
  }

  public canPay(amount: number): boolean {
    return this.core.get('Finance')?.canPay(amount, 'transport') ?? V.money >= amount;
  }

  public open(vehicle_id?: number): boolean {
    if (!this.ready || (!this.canApproach && !this.shopOpen && this.core.passage.title !== 'Deadwood Reblooms Property Garage')) return false;
    if (this.taxi.active && (vehicle_id === undefined || vehicle_id !== this.taxi.state.shift?.vehicle)) return false;
    const vehicle = vehicle_id === undefined ? this.nearby[0] : this.nearby.find(vehicle => vehicle.id === vehicle_id);
    if (vehicle_id !== undefined && (!vehicle || this.core.passage.title === 'Shopping Centre' || this.shopOpen)) return false;
    const shop = this.shopOpen ? this.state.shop : null;
    this.state.origin = this.point;
    if (!shop) this.state.return_passage = this.core.passage.title;
    this.state.notice = null;
    this.state.offer = null;
    this.state.shop = shop;
    this.state.trip = null;
    this.state.passengers = [];
    this.state.commute = null;
    this.state.selected = vehicle?.id ?? null;
    return this.state.origin !== null;
  }

  public buy(): boolean {
    const model = this.offer;
    if (
      this.core.passage.title !== 'Deadwood Transport Buy' ||
      !this.ready ||
      !this.dealerOpen ||
      !model ||
      this.state.vehicles.some(vehicle => vehicle.model === model.id) ||
      (model.kind !== 'bicycle' && V.id <= 0) ||
      !this.canPay(model.price)
    )
      return false;
    this.state.offer = null;
    this.core.SugarCube.Wikifier.wikifyEval(`<<money -${model.price} 'transport'>>`);
    const id = this.state.next_id++;
    this.state.vehicles.push({ id, model: model.id, point: this.shopPoint, garage: null, condition: 100, fuel: model.tank, upkeep_day: Math.floor(Time.days), arrears: 0 });
    this.state.selected = id;
    this.state.notice = 'bought';
    this.core.SugarCube.Wikifier.wikifyEval(`<<pass ${model.kind === 'bicycle' ? 5 : 15}>>`);
    return true;
  }

  public get repairCost(): number {
    return this.vehicle && this.model ? Math.ceil((100 - this.vehicle.condition) * this.model.price * 0.0008) : 0;
  }

  public get repairMinutes(): number {
    return this.vehicle ? Math.max(10, Math.ceil((100 - this.vehicle.condition) / 10) * 5 + 10) : 0;
  }

  public get recoveryMinutes(): number {
    return this.vehicle?.stolen ? 180 : 60;
  }

  public get fuelCost(): number {
    return this.vehicle && this.model ? Math.ceil((this.model.tank - this.vehicle.fuel) * this.fuel.terms.price_per_litre) : 0;
  }

  public get recoveryCost(): number {
    if (!this.vehicle || !this.model || (!this.vehicle.stolen && this.vehicle.point === this.shopPoint && this.vehicle.garage === null)) return 0;
    const [area, depth] = this.vehicle.point.split(':');
    const distance = Catalog.distance(this.shopPoint, this.vehicle.point) ?? (area === 'forest' ? 30 + Number(depth) * 2 : 165 + Number(depth) * 2);
    return (this.model.kind === 'bicycle' ? 1500 : this.model.kind === 'motorcycle' ? 3500 : 10000) + distance * 50 + (this.vehicle.stolen ? 5000 : 0);
  }

  public service(action: 'repair' | 'fuel' | 'sell' | 'helmet' | 'recover'): boolean {
    if (!this.ready || !this.shopOpen) return false;
    const passage = this.core.passage.title;
    if (action === 'helmet') {
      if (passage !== 'Deadwood Transport Dealer' || this.state.shop !== 'motorcycle' || this.state.helmet || !this.canPay(8000)) return false;
      this.core.SugarCube.Wikifier.wikifyEval("<<money -8000 'transport'>>");
      this.state.helmet = true;
      this.state.notice = 'helmet';
      return true;
    }
    const vehicle = this.vehicle;
    const model = this.model;
    if (!vehicle || !model || !this.shopVehicles.includes(vehicle)) return false;
    if (action === 'repair' || action === 'recover') {
      if (passage !== 'Deadwood Transport Service' || !['bicycle', 'garage'].includes(this.state.shop!)) return false;
    } else if (action === 'fuel') {
      if (passage !== 'Deadwood Transport Petrol' || this.state.shop !== 'petrol' || model.tank <= 0) return false;
    } else if (passage !== 'Deadwood Transport Sell' || !['bicycle', 'motorcycle', 'car'].includes(this.state.shop!) || model.outlet !== this.state.shop) return false;
    if (action === 'recover') {
      const cost = this.recoveryCost;
      const minutes = this.recoveryMinutes;
      if (!cost || !this.canPay(cost)) return false;
      this.core.SugarCube.Wikifier.wikifyEval(`<<money -${cost} 'transport'>>`);
      this.state.notice = vehicle.stolen ? 'retrieved' : 'recovered';
      if (vehicle.stolen) vehicle.condition = Math.max(0, vehicle.condition - 8);
      delete vehicle.stolen;
      vehicle.point = this.shopPoint;
      vehicle.garage = null;
      this.core.SugarCube.Wikifier.wikifyEval(`<<pass ${minutes}>>`);
      return true;
    }
    if (!this.availableAtShop) return false;
    if (action === 'sell') {
      if ((vehicle.arrears ?? 0) > 0 || this.taxi.state.shift?.vehicle === vehicle.id) return false;
      this.core.SugarCube.Wikifier.wikifyEval(`<<money ${Math.floor((model.price * vehicle.condition) / 200)}>>`);
      this.state.vehicles = this.state.vehicles.filter(item => item.id !== vehicle.id);
      this.state.selected = null;
      this.state.notice = 'sold';
      return true;
    }
    const cost = action === 'repair' ? this.repairCost : this.fuelCost;
    const minutes = action === 'repair' ? this.repairMinutes : 5;
    if (cost <= 0 || !this.canPay(cost)) return false;
    this.core.SugarCube.Wikifier.wikifyEval(`<<money -${cost} 'transport'>>`);
    if (action === 'repair') vehicle.condition = 100;
    else vehicle.fuel = model.tank;
    this.state.notice = action === 'repair' ? 'repaired' : 'fuelled';
    this.core.SugarCube.Wikifier.wikifyEval(`<<pass ${minutes}>>`);
    return true;
  }

  public park(store: boolean): boolean {
    if (this.core.passage.title !== 'Deadwood Transport Menu' || !this.ready || !this.vehicle || !this.nearby.includes(this.vehicle)) return false;
    const garage = this.garage;
    if (!garage || (store ? this.vehicle.garage !== null || garage.used >= garage.capacity : this.vehicle.garage !== garage.id)) return false;
    this.vehicle.garage = store ? garage.id : null;
    this.state.notice = store ? 'parked' : 'taken';
    return true;
  }

  public startTrip(destination: string, taxi?: TaxiLeg): boolean {
    const route = this.destinations.find(route => route.id === destination);
    if (
      (taxi ? !this.taxi.validLeg(taxi, destination) : this.core.passage.title !== 'Deadwood Transport Menu' || this.taxi.active) ||
      !this.canDepart ||
      !route?.affordable ||
      (this.state.trip && !this.state.trip.settled)
    )
      return false;
    const commute = this.state.commute;
    if (commute && (!this.commute.active || !commute.boarded || destination !== commute.to)) return false;
    const outings = this.core.get('Finance')?.realEstate.outings;
    const escort = this.core.get('StreetLife')?.bounties.state.active;
    if (escort?.stage === 'escort' && escort.vehicle === this.vehicle?.id && (taxi || commute || outings?.travelling || this.state.passengers.length)) return false;
    if (outings?.travelling && (destination !== outings.target || outings.plan?.stage === 'visit' || this.vehicle?.id !== outings.plan?.vehicle)) return false;
    const passengers = this.state.passengers.filter(name => this.companions.available.includes(name)).slice(0, this.model!.seats);
    if (commute && !passengers.includes(commute.npc)) return false;
    this.state.trip = {
      vehicle: this.vehicle!.id,
      from: this.point!,
      to: destination,
      minutes: route.minutes + (taxi === 'dropoff' && this.taxi.state.job?.service === 'calm' ? 2 : 0),
      fuel: route.fuel,
      settled: false,
      interrupted: false,
      passengers,
      dated: false,
      fooled: false,
      commute: commute?.kind,
      taxi,
      taxi_job: taxi ? this.taxi.state.job?.id : undefined,
      scene: this.core.get('DeadwoodReblooms')!.rand.int(2),
      event: this.events.roll(destination, route.minutes, !!commute)
    };
    return true;
  }

  public completeTrip(): boolean {
    const trip = this.state.trip;
    if (
      this.core.passage.title !== 'Deadwood Transport Travel' ||
      !trip ||
      trip.settled ||
      (trip.taxi && (!this.taxi.available || this.taxi.destination(trip.taxi) !== trip.to || (trip.taxi !== 'return' && trip.taxi_job !== this.taxi.state.job?.id))) ||
      (trip.commute && (!this.commute.active || !this.state.commute?.boarded || trip.to !== this.state.commute.to || !trip.passengers.includes(this.state.commute.npc))) ||
      !this.canDepart ||
      this.vehicle?.id !== trip.vehicle ||
      this.point !== (trip.event?.started ? trip.event.point : trip.from) ||
      this.vehicle.fuel < Math.max(0, trip.fuel * (1 - (trip.progress ?? 0) / trip.minutes) - 0.01)
    )
      return false;
    if (this.events.pending && trip.event?.started) return false;
    const pending = this.events.pending;
    const progress = trip.progress ?? 0;
    const minutes = pending ? Math.max(1, Math.floor(trip.minutes / 2)) : trip.minutes - progress;
    trip.progress = progress + minutes;
    if (pending) trip.event!.started = true;
    else trip.settled = true;
    const vehicle = this.vehicle;
    const model = this.model!;
    vehicle.fuel = Math.max(0, Math.round((vehicle.fuel - (trip.fuel * minutes) / trip.minutes) * 100) / 100);
    const trail = /^(?:forest|moor):/.test(trip.from) || /^(?:forest|moor):/.test(trip.to);
    const wear = this.journeyWear(model, minutes, trail && !this.forestRoad);
    vehicle.condition = Math.max(0, Math.round((vehicle.condition - wear) * 1000) / 1000);
    this.core.SugarCube.Wikifier.wikifyEval(`<<pass ${minutes}>>`);
    if (pending) {
      vehicle.point = trip.event!.point!;
      vehicle.garage = null;
      this.state.origin = vehicle.point;
      this.state.return_passage = Catalog.passage(vehicle.point);
      V.bus = vehicle.point;
      V.outside = 1;
      V.location = vehicle.point === 'farmroad3' ? 'forest' : vehicle.point === 'farmroad6' ? 'farm' : /^farmroad[245]$/.test(vehicle.point) ? 'moor' : 'town';
    }
    if (this.core.passage.title !== 'Deadwood Transport Travel' || !this.ready || V.nextPassageCheck) {
      trip.interrupted = true;
      trip.settled = true;
      if (pending) this.events.stop();
      return false;
    }
    if (pending) return false;
    const estate = this.core.get('Finance')?.realEstate;
    const home = trip.to.startsWith('home:') ? estate?.properties.find(property => property.id === trip.to.slice(5)) : null;
    vehicle.point = home ? (home.street === 'Office Lobby' ? 'high' : Catalog.point(home.street))! : trip.to;
    vehicle.garage = null;
    this.state.origin = vehicle.point;
    this.state.return_passage = Catalog.passage(trip.to);
    if (home && !estate!.visit(home.id)) this.state.return_passage = Catalog.passage(vehicle.point);
    if (trip.from.startsWith('forest:') && !trip.to.startsWith('forest:')) V.foresthunt = 0;
    if (trip.from.startsWith('moor:') && !trip.to.startsWith('moor:')) {
      V.moor = 0;
      V.forestmod = 1;
      delete V.moor_hunt;
    }
    if (trip.to.startsWith('forest:')) {
      V.forest = Number(trip.to.split(':')[1]);
      V.forestmod = this.forestRoad ? 1 : 1.5;
      V.forestmove = 0;
      V.forest_search = false;
      V.eventskip = this.forestRoad ? 1 : 0;
      if (V.foresthunt >= 1) V.foresthunt++;
      V.location = 'forest';
      V.bus = 'forest';
      V.outside = 1;
    } else if (trip.to.startsWith('moor:')) {
      V.moor = Number(trip.to.split(':')[1]);
      V.forestmod = 1;
      V.eventskip = 0;
      delete V.moormove;
      if (V.moor_hunt >= 1) V.moor_hunt++;
      V.location = 'moor';
      V.bus = 'moor';
      V.outside = 1;
    }
    if (model.kind === 'bicycle') this.core.SugarCube.Wikifier.wikifyEval(`<<tiredness ${Math.max(1, Math.ceil(trip.minutes / 10))}>><<athletics 1>>`);
    else this.state.driving = Math.min(1000, this.state.driving + Math.min(10, Math.ceil(trip.minutes / 5)));
    this.companions.affection(model.id === 'convertible');
    this.commute.arrive();
    this.core.get('Finance')?.realEstate.outings.arrive(trip.to);
    if (trip.taxi) this.taxi.arrive(trip.taxi);
    return true;
  }

  public get arrival(): string {
    return this.state.return_passage;
  }
}

declare module '@scml-dol-maplebirch/types' {
  interface Extensions {
    readonly Transport: Transport;
  }
}

export default Transport;
