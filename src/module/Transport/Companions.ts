// ./src/module/Transport/Companions.ts

import type Transport from '../Transport';

export default class Companions {
  public constructor(private readonly transport: Transport) {}

  /** 普通随车名单绑定本次车辆，换车、中断和专用行程不会沿用。 */
  public get aboard(): string[] {
    const transport = this.transport;
    const trip = transport.state.trip;
    const estate = transport.core.get('Finance')?.realEstate;
    if (!trip || trip.interrupted || trip.vehicle !== transport.vehicle?.id || trip.taxi || trip.commute || transport.taxi.active || transport.state.commute || estate?.outings.travelling) return [];
    return trip.passengers.filter(name => {
      const property = estate?.residenceOf(name);
      return transport.state.passengers.includes(name) && !!property && estate!.outings.valid(name, property.id) && window.isLoveInterest(name);
    });
  }

  /** 开战后沿用本次乘车名单，跨日的新日程不会让已经在场的人突然消失。 */
  public get fighting(): string[] {
    const transport = this.transport;
    const trip = transport.state.trip;
    if (!trip || trip.interrupted || trip.vehicle !== transport.vehicle?.id || trip.taxi || trip.commute || V.combat !== 1 || trip.event?.kind !== 'roadblock' || trip.event.combat !== 'active')
      return [];
    return trip.passengers.filter(name => {
      const npc = C.npc[name];
      if (!transport.state.passengers.includes(name) || !window.isLoveInterest(name) || npc?.init !== 1 || !['active', 'rescued'].includes(npc.state)) return false;
      if (name === 'Robin') return !V.robinmissing && V.robin.timer.hurt === 0 && V.RobinExpansion?.asylum?.status !== 'admitted';
      if (name === 'Sydney') return V.daily.sydney.punish !== 1;
      return ['Whitney', 'Kylar'].includes(name);
    });
  }

  public get available(): string[] {
    const escort = this.transport.core.get('StreetLife')?.bounties.state.active;
    if (escort?.stage === 'escort' && escort.vehicle === this.transport.vehicle?.id) return [];
    if (this.transport.taxi.active) return [];
    if (this.transport.state.commute) return this.transport.commute.active && this.transport.state.commute.boarded ? [this.transport.state.commute.npc] : [];
    const estate = this.transport.core.get('Finance')?.realEstate;
    if (estate?.outings.travelling) return this.transport.vehicle?.id === estate.outings.plan?.vehicle ? [estate.outings.plan!.name] : [];
    const property = estate?.current;
    const home =
      this.transport.atGarage && property && this.transport.model?.kind === 'motor_vehicle' && this.transport.model.seats ? estate.residentsHome(property.id).map(profile => profile.id) : [];
    return [...new Set([...this.aboard, ...home])];
  }

  public invite(name: string): boolean {
    const state = this.transport.state;
    if (this.transport.core.passage.title !== 'Deadwood Transport Menu' || !this.transport.ready || !this.available.includes(name)) return false;
    if (state.passengers.includes(name)) state.passengers = state.passengers.filter(passenger => passenger !== name);
    else {
      if (state.passengers.length >= (this.transport.model?.seats ?? 0)) return false;
      state.passengers.push(name);
    }
    return true;
  }

  public get canDate(): boolean {
    const trip = this.transport.state.trip;
    const aboard = this.aboard;
    return (
      ['Deadwood Transport Travel', 'Deadwood Transport Date'].includes(this.transport.core.passage.title) &&
      this.transport.ready &&
      !!trip?.settled &&
      !trip.interrupted &&
      !V.eventforced &&
      !V.frozenValues &&
      this.transport.vehicle?.point === trip.to &&
      !trip.dated &&
      !V.nextPassage &&
      !V.nextPassageCheck &&
      !trip.commute &&
      !this.transport.core.get('Finance')?.realEstate.outings.travelling &&
      aboard.length > 0 &&
      ['cliff', 'starfish', 'danube', 'high'].includes(trip.to) &&
      aboard.some(name => this.transport.state.affection_days[name + ':date'] !== Time.days)
    );
  }

  public affection(convertible: boolean): void {
    if (!convertible) return;
    const trip = this.transport.state.trip;
    const passengers = trip?.commute || this.transport.core.get('Finance')?.realEstate.outings.travelling ? (trip?.passengers ?? []) : this.aboard;
    for (const name of passengers) {
      if (this.transport.state.affection_days[name + ':ride'] === Time.days) continue;
      this.transport.state.affection_days[name + ':ride'] = Time.days;
      this.transport.core.SugarCube.Wikifier.wikifyEval(`<<npcincr '${name}' love 1>>`);
    }
  }

  /** 能把车停在路边独处的目的地，且舱内还有没亲近过的同行者。 */
  public get canFoolAround(): boolean {
    const trip = this.transport.state.trip;
    const aboard = this.aboard;
    return (
      ['Deadwood Transport Travel', 'Deadwood Transport Date'].includes(this.transport.core.passage.title) &&
      this.transport.ready &&
      !!trip?.settled &&
      !trip.interrupted &&
      !trip.commute &&
      !this.transport.core.get('Finance')?.realEstate.outings.travelling &&
      !trip.fooled &&
      aboard.length === 1 &&
      ['cliff', 'starfish', 'danube', 'farmland'].includes(trip.to) &&
      (aboard[0] !== 'Robin' || C.npc.Robin.trauma < 50)
    );
  }

  public foolAround(): boolean {
    if (!this.canFoolAround) return false;
    const trip = this.transport.state.trip!;
    trip.passengers = this.transport.state.passengers = this.aboard;
    trip.fooled = true;
    if (trip.event) trip.event.resolved = true;
    return true;
  }

  public date(): boolean {
    if (!this.canDate) return false;
    const trip = this.transport.state.trip!;
    trip.passengers = this.transport.state.passengers = this.aboard;
    trip.dated = true;
    if (trip.event) trip.event.resolved = true;
    const location = V.location;
    const passage = this.transport.core.passage.title;
    const end = Time.date.timeStamp + 20 * 60;
    this.transport.core.SugarCube.Wikifier.wikifyEval('<<pass 20>>');
    const passengers = this.aboard;
    // 先消耗本次相处机会，完成后再结算，不覆盖原版中断或因重绘重复获益。
    if (
      this.transport.core.get('Transport') !== this.transport ||
      this.transport.state.trip !== trip ||
      this.transport.core.passage.title !== passage ||
      V.location !== location ||
      this.transport.vehicle?.point !== trip.to ||
      V.eventforced ||
      V.frozenValues ||
      !this.transport.ready ||
      V.nextPassage ||
      V.nextPassageCheck ||
      Time.date.timeStamp < end ||
      !passengers.length
    )
      return false;
    trip.passengers = this.transport.state.passengers = passengers;
    for (const name of passengers) {
      if (this.transport.state.affection_days[name + ':date'] === Time.days) continue;
      this.transport.state.affection_days[name + ':date'] = Time.days;
      this.transport.core.SugarCube.Wikifier.wikifyEval(`<<npcincr '${name}' love 2>>`);
    }
    this.transport.core.SugarCube.Wikifier.wikifyEval('<<stress -3>>');
    return true;
  }
}
