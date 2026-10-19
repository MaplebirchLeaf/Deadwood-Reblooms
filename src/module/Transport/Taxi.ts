// ./src/module/Transport/Taxi.ts

import terms from '../../assets/transport/taxi.json';
import type Transport from '../Transport';
import type { Vehicle, VehicleModel } from './Catalog';

export type TaxiLeg = 'pickup' | 'dropoff' | 'return';
type PassengerEvent = 'quiet' | 'bags' | 'anxious' | 'talk' | 'drunk' | 'dispute';

interface Booking {
  id: number;
  kind: string;
  from: string;
  to: string;
  people: number;
  cargo: number;
  fare: number;
  expires: number;
  event: PassengerEvent;
}

interface TaxiJob extends Booking {
  phase: 'pickup' | 'boarding' | 'riding' | 'payment';
  pickup_by: number;
  arrive_by: number;
  service: 'ordinary' | 'help' | 'calm' | 'chat';
  tip: number;
}

interface Shift {
  mode: 'own' | 'fleet';
  vehicle: number;
  previous: number | null;
  fleet: Vehicle | null;
  gross: number;
  earned: number;
  jobs: number;
}

export interface TaxiState {
  registered: boolean;
  next_id: number;
  offers: Booking[];
  shift: Shift | null;
  job: TaxiJob | null;
  receipt: { gross: number; commission: number; net: number; tip: number; late: boolean } | null;
  last_shift: { jobs: number; net: number; recovery: number; mode: Shift['mode'] } | null;
  completed: number;
  earnings: number;
  fame_day: number;
  fame_count: number;
  notice: 'registered' | 'cancelled' | 'expired' | 'recovered' | 'reported' | 'ended' | null;
}

export default class Taxi {
  public static readonly defaults: TaxiState = {
    registered: false,
    next_id: 1,
    offers: [],
    shift: null,
    job: null,
    receipt: null,
    last_shift: null,
    completed: 0,
    earnings: 0,
    fame_day: -1,
    fame_count: 0,
    notice: null
  };

  public readonly terms = terms;
  private readonly passenger = 'deadwood_taxi_passenger';

  public constructor(private readonly transport: Transport) {}

  public get state(): TaxiState {
    return (this.transport.state.taxi ??= clone(Taxi.defaults));
  }

  private get now(): number {
    return Math.floor((Time.date.timeStamp - Time.startDate.timeStamp) / 60) + Time.startDate.hour * 60 + Time.startDate.minute;
  }

  public get active(): boolean {
    return this.state.shift !== null;
  }

  public get fleet(): Vehicle | null {
    return this.state.shift?.fleet ?? null;
  }

  public get atDesk(): boolean {
    return this.transport.core.passage.title === 'Deadwood Transport Taxi' && this.transport.point === 'harvest' && Time.hour >= 8 && Time.hour < 18;
  }

  private get scene(): boolean {
    return ['Deadwood Transport Taxi', 'Deadwood Transport Taxi Dispatch', 'Deadwood Transport Taxi Pickup', 'Deadwood Transport Travel'].includes(this.transport.core.passage.title);
  }

  public get canRegister(): boolean {
    return this.atDesk && this.transport.ready && !this.state.registered && V.id > 0 && this.transport.state.school.motor_vehicle.licensed && this.transport.canPay(terms.registration);
  }

  public register(): boolean {
    if (!this.canRegister) return false;
    this.state.registered = true;
    this.state.notice = 'registered';
    this.wikify(`<<money -${terms.registration} 'transport'>><<pass 15>>`);
    return true;
  }

  public suitable(model: VehicleModel): boolean {
    return terms.models.includes(model.id);
  }

  public get cars(): Vehicle[] {
    return this.transport.state.vehicles.filter(vehicle => {
      const model = this.transport.catalog.models.find(model => model.id === vehicle.model);
      return (
        !!model &&
        !vehicle.stolen &&
        this.suitable(model) &&
        vehicle.point === this.transport.point &&
        vehicle.garage === null &&
        vehicle.condition >= 50 &&
        vehicle.fuel > 0 &&
        !(vehicle.arrears ?? 0)
      );
    });
  }

  public get eligible(): boolean {
    return this.transport.ready && V.id > 0 && this.transport.state.school.motor_vehicle.licensed && V.drunk <= 0 && V.drugged <= 0 && V.stress < V.stressmax && !V.worn.feet.type.includes('shackle');
  }

  public start(mode: Shift['mode'], id?: number): boolean {
    const transport = this.transport;
    const menu = transport.core.passage.title === 'Deadwood Transport Menu' && !transport.state.commute && !transport.state.passengers.length;
    if ((!this.atDesk && !menu) || !this.eligible || this.active || !this.state.registered) return false;
    if (!transport.catalog.routes.some(route => route.id === transport.point && route.terrain === 'road' && route.id !== 'farmland')) return false;
    if (mode === 'fleet' && !this.atDesk) return false;
    const vehicle = mode === 'own' ? this.cars.find(car => car.id === id) : null;
    if (mode === 'own' && (!vehicle || vehicle.fuel <= 0)) return false;
    const model = transport.catalog.models.find(model => model.id === terms.fleet_model)!;
    this.state.shift = {
      mode,
      vehicle: vehicle?.id ?? -1,
      previous: transport.state.selected,
      fleet: mode === 'fleet' ? { id: -1, model: model.id, point: 'harvest', garage: null, condition: 100, fuel: model.tank, arrears: 0 } : null,
      gross: 0,
      earned: 0,
      jobs: 0
    };
    transport.state.origin = vehicle?.point ?? 'harvest';
    transport.state.return_passage = transport.catalog.passage(transport.state.origin);
    transport.state.selected = this.state.shift.vehicle;
    transport.state.passengers = [];
    transport.state.commute = null;
    transport.state.trip = null;
    transport.state.shop = null;
    this.state.receipt = null;
    this.state.last_shift = null;
    this.state.notice = null;
    this.state.offers = [];
    return true;
  }

  public get available(): boolean {
    return this.active && this.scene && this.transport.ready && !V.nextPassageCheck && this.transport.vehicle?.id === this.state.shift!.vehicle;
  }

  public get offers(): Booking[] {
    return this.state.offers.filter(offer => offer.expires > this.now);
  }

  public refresh(): boolean {
    if (this.transport.core.passage.title !== 'Deadwood Transport Taxi Dispatch' || !this.available || this.state.job || !this.transport.canDepart) return false;
    this.state.offers = [];
    this.state.receipt = null;
    this.state.notice = null;
    this.wikify(`<<pass ${terms.refresh_minutes}>>`);
    if (!this.available || this.transport.core.passage.title !== 'Deadwood Transport Taxi Dispatch' || !this.transport.canDepart) return false;
    const model = this.transport.model!;
    const requests = terms.requests.filter(request => {
      const open = request.start < request.end ? Time.hour >= request.start && Time.hour < request.end : Time.hour >= request.start || Time.hour < request.end;
      return open && request.people <= model.seats && request.cargo <= model.cargo && (request.kind !== 'appointment' || model.id === 'luxury_saloon');
    });
    const rand = this.transport.core.get('DeadwoodReblooms')!.rand;
    for (let index = 0; index < 3 && requests.length; index++) {
      const request = requests.splice(rand.int(requests.length - 1), 1)[0];
      const from = request.from[rand.int(request.from.length - 1)];
      const to = request.to[rand.int(request.to.length - 1)];
      const distance = this.transport.catalog.distance(from, to)!;
      const night = Time.hour >= 20 || Time.hour < 6;
      const events: PassengerEvent[] = ['quiet', 'anxious', 'talk', 'dispute'];
      const event = request.kind === 'pub' ? 'drunk' : ['shopping', 'group'].includes(request.kind) ? 'bags' : events[rand.int(events.length - 1)];
      this.state.offers.push({
        id: this.state.next_id++,
        kind: request.kind,
        from,
        to,
        people: request.people,
        cargo: request.cargo,
        fare: Math.round((terms.base_fare + distance * terms.distance_fare) * (night ? terms.night_multiplier : 1) * (request.kind === 'appointment' ? terms.luxury_multiplier : 1)),
        expires: this.now + terms.offer_minutes,
        event
      });
    }
    return true;
  }

  public canAccept(id: number): boolean {
    const offer = this.offers.find(offer => offer.id === id);
    const model = this.transport.model;
    const vehicle = this.transport.vehicle;
    if (!this.available || this.state.job || !this.transport.canDepart || !offer || !model || !vehicle || offer.people > model.seats || offer.cargo > model.cargo) return false;
    const pickup = this.transport.catalog.distance(this.transport.point!, offer.from);
    const delivery = this.transport.catalog.distance(offer.from, offer.to);
    return pickup !== null && delivery !== null && vehicle.fuel >= Math.ceil((pickup + delivery) * model.fuel_use * 100) / 100;
  }

  public quote(booking: Booking): { minutes: number; fuel: number; income: number } {
    const model = this.transport.model!;
    const pickup = this.transport.catalog.distance(this.transport.point!, booking.from) ?? 0;
    const delivery = this.transport.catalog.distance(booking.from, booking.to) ?? 0;
    return {
      minutes: (pickup > 0 ? this.transport.journeyMinutes(model, pickup) : 0) + 3 + this.transport.journeyMinutes(model, delivery),
      fuel: Math.ceil((pickup + delivery) * model.fuel_use * 100) / 100,
      income: booking.fare - Math.ceil(booking.fare * (1 - (this.state.shift?.mode === 'own' ? terms.own_share : terms.fleet_share)))
    };
  }

  public accept(id: number): boolean {
    if (this.transport.core.passage.title !== 'Deadwood Transport Taxi Dispatch' || !this.canAccept(id)) return false;
    const offer = this.offers.find(offer => offer.id === id)!;
    const minutes = this.transport.journeyMinutes(this.transport.model!, this.transport.catalog.distance(this.transport.point!, offer.from)!);
    this.state.job = { ...offer, phase: this.transport.point === offer.from ? 'boarding' : 'pickup', pickup_by: this.now + minutes + 15, arrive_by: 0, service: 'ordinary', tip: 0 };
    this.state.offers = [];
    this.state.receipt = null;
    this.transport.state.trip = null;
    return true;
  }

  public destination(leg: TaxiLeg): string | null {
    const job = this.state.job;
    if (leg === 'return') return this.state.shift?.mode === 'fleet' && !job ? 'harvest' : null;
    return job?.phase === (leg === 'pickup' ? 'pickup' : 'riding') ? (leg === 'pickup' ? job.from : job.to) : null;
  }

  public validLeg(leg: TaxiLeg, destination: string): boolean {
    const title = this.transport.core.passage.title;
    return this.available && !this.expired && this.destination(leg) === destination && (leg === 'return' ? title === 'Deadwood Transport Taxi Dispatch' : title === 'Deadwood Transport Taxi Pickup');
  }

  public arrive(leg: TaxiLeg): void {
    const job = this.state.job;
    if (leg === 'pickup' && job?.phase === 'pickup') job.phase = 'boarding';
    if (leg === 'dropoff' && job?.phase === 'riding') job.phase = 'payment';
  }

  public get waiting(): boolean {
    return (
      this.transport.core.passage.title === 'Deadwood Transport Taxi Pickup' &&
      this.available &&
      this.state.job?.phase === 'boarding' &&
      this.transport.point === this.state.job.from &&
      this.now <= this.state.job.pickup_by
    );
  }

  public get expired(): boolean {
    const job = this.state.job;
    return !!job && ['pickup', 'boarding'].includes(job.phase) && this.now > job.pickup_by;
  }

  public passengerNPC(): void {
    const trip = this.transport.state.trip;
    const encounter = trip?.taxi === 'dropoff' && trip.taxi_job === this.state.job?.id && this.state.job?.phase === 'riding' && trip.event?.kind === 'molestation' && this.transport.events.pending;
    if (!this.waiting && !(this.available && this.state.job?.phase === 'payment') && !encounter) return;
    if (!V.per_npc[this.passenger]) {
      this.wikify(`<<endevent>><<generateNPC 1>><<saveNPC 0 '${this.passenger}'>><<endevent>>`);
    }
    if (V.NPCList[0]?.per !== this.passenger) this.wikify(`<<loadNPC 0 '${this.passenger}'>>`);
    this.wikify('<<person1>>');
  }

  public board(service: TaxiJob['service']): boolean {
    const job = this.state.job;
    if (!this.waiting || !job || !this.transport.canDepart) return false;
    if ((service === 'help' && job.event !== 'bags') || (service === 'calm' && job.event !== 'anxious') || (service === 'chat' && job.event !== 'talk')) return false;
    this.passengerNPC();
    job.phase = 'riding';
    job.service = service;
    job.tip = service === 'help' ? (window.currentSkillValue('housekeeping') >= 300 ? 300 : 150) : service === 'calm' || service === 'chat' ? 200 : 0;
    const distance = this.transport.catalog.distance(job.from, job.to)!;
    job.arrive_by = this.now + 3 + this.transport.journeyMinutes(this.transport.model!, distance) + 10;
    this.wikify(`<<pass ${service === 'help' ? 5 : 3}>>`);
    return this.waitingForRoad;
  }

  public get waitingForRoad(): boolean {
    return this.available && this.transport.core.passage.title === 'Deadwood Transport Taxi Pickup' && this.state.job?.phase === 'riding' && this.transport.point === this.state.job.from;
  }

  public pay(accept_short = false): boolean {
    const job = this.state.job;
    const trip = this.transport.state.trip;
    const shift = this.state.shift;
    if (
      !this.available ||
      this.transport.core.passage.title !== 'Deadwood Transport Travel' ||
      !job ||
      !shift ||
      job.phase !== 'payment' ||
      trip?.taxi !== 'dropoff' ||
      trip.taxi_job !== job.id ||
      !trip.settled ||
      trip.interrupted ||
      this.transport.point !== job.to
    )
      return false;
    const late = this.now > job.arrive_by;
    const disputed = job.event === 'dispute';
    const recovered = !disputed || (!accept_short && window.currentSkillValue('skulduggery') >= 300);
    const fare = recovered ? job.fare : Math.floor(job.fare * (accept_short ? 0.6 : 0.8));
    const tip = late || disputed ? 0 : job.tip + (this.transport.state.driving >= 600 ? 100 : 0);
    const commission = Math.ceil(fare * (1 - (shift.mode === 'own' ? terms.own_share : terms.fleet_share)));
    const net = fare - commission + tip;
    this.state.receipt = { gross: fare, commission, net, tip, late };
    shift.gross += fare;
    shift.earned += net;
    shift.jobs++;
    this.state.completed++;
    if (shift.mode === 'own') this.state.earnings += net;
    this.state.job = null;
    this.clearPassenger();
    this.wikify(`${shift.mode === 'own' ? `<<money ${net}>>` : ''}<<tiredness 2>><<stress ${job.event === 'drunk' || disputed ? 2 : 1}>>`);
    const day = Math.floor(Time.days);
    if (this.state.fame_day !== day) {
      this.state.fame_day = day;
      this.state.fame_count = 0;
    }
    if (this.state.fame_count < 5) {
      this.state.fame_count++;
      this.wikify('<<famebusiness 1>>');
    }
    if (disputed && !accept_short) this.wikify('<<pass 3>>');
    return true;
  }

  public cancel(): boolean {
    if (!this.available || !this.state.job || !['Deadwood Transport Taxi Pickup', 'Deadwood Transport Taxi Dispatch', 'Deadwood Transport Travel'].includes(this.transport.core.passage.title))
      return false;
    this.state.notice = this.now > this.state.job.pickup_by && ['pickup', 'boarding'].includes(this.state.job.phase) ? 'expired' : 'cancelled';
    this.state.job = null;
    this.transport.state.trip = null;
    this.clearPassenger();
    return true;
  }

  public interrupt(): void {
    this.state.notice = 'cancelled';
    this.state.job = null;
    this.clearPassenger();
  }

  public finish(recovery = false): boolean {
    if (this.transport.core.passage.title !== 'Deadwood Transport Taxi Dispatch' || !this.available || this.state.job) return false;
    const shift = this.state.shift!;
    const fleet = shift.fleet;
    if (fleet && (fleet.point !== 'harvest' || fleet.stolen)) {
      if (!recovery) return false;
      this.state.notice = fleet.stolen ? 'reported' : 'recovered';
    } else this.state.notice = 'ended';
    const point = this.transport.point!;
    const recovery_charge = fleet && (fleet.point !== 'harvest' || fleet.stolen) ? Math.min(shift.earned, terms.recovery_cost) : 0;
    const payout = fleet ? shift.earned - recovery_charge : 0;
    this.state.last_shift = { jobs: shift.jobs, net: fleet ? payout : shift.earned, recovery: recovery_charge, mode: shift.mode };
    if (fleet) {
      this.state.earnings += payout;
      this.wikify(`<<money ${payout}>>`);
    }
    this.state.shift = null;
    this.state.offers = [];
    this.transport.state.selected = shift.mode === 'own' ? shift.vehicle : shift.previous;
    this.transport.state.origin = point;
    this.transport.state.return_passage = this.transport.catalog.passage(point);
    this.transport.state.trip = null;
    if (fleet && (fleet.point !== 'harvest' || fleet.stolen)) this.wikify('<<pass 20>>');
    return true;
  }

  public resume(): boolean {
    if (!this.active || !this.transport.ready || (!this.atDesk && this.transport.core.passage.title !== 'Deadwood Transport Menu' && !this.transport.canApproach)) return false;
    const vehicle = this.state.shift!.fleet ?? this.transport.state.vehicles.find(vehicle => vehicle.id === this.state.shift!.vehicle);
    if (!vehicle || vehicle.point !== this.transport.point || vehicle.garage !== null) return false;
    this.transport.state.selected = vehicle.id;
    this.transport.state.return_passage = this.transport.catalog.passage(vehicle.point);
    this.transport.state.shop = null;
    return true;
  }

  private clearPassenger(): void {
    if (V.NPCList[0]?.per === this.passenger) this.wikify('<<endevent>>');
    if (V.per_npc[this.passenger]) this.wikify(`<<clearNPC '${this.passenger}'>>`);
  }

  private wikify(source: string): void {
    this.transport.core.SugarCube.Wikifier.wikifyEval(source);
  }
}
