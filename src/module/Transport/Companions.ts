// ./src/module/Transport/Companions.ts

import type Transport from '../Transport';

export default class Companions {
  public constructor(private readonly transport: Transport) {}

  public get available(): string[] {
    if (this.transport.state.commute) return this.transport.commute.active && this.transport.state.commute.boarded ? [this.transport.state.commute.npc] : [];
    const estate = this.transport.core.get('Finance')?.realEstate;
    const property = estate?.current;
    return this.transport.atGarage && property && this.transport.model?.kind === 'motor_vehicle' && this.transport.model.seats ? estate.residentsHome(property.id).map(profile => profile.id) : [];
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
    return (
      this.transport.core.passage.title === 'Deadwood Transport Travel' &&
      this.transport.ready &&
      !!trip?.settled &&
      !trip.interrupted &&
      !trip.dated &&
      !trip.commute &&
      (trip.passengers?.length ?? 0) > 0 &&
      ['cliff', 'starfish', 'danube', 'high'].includes(trip.to) &&
      trip.passengers.some(name => this.transport.state.affection_days[name + ':date'] !== Time.days)
    );
  }

  public affection(convertible: boolean): void {
    if (!convertible) return;
    for (const name of this.transport.state.trip?.passengers ?? []) {
      if (this.transport.state.affection_days[name + ':ride'] === Time.days) continue;
      this.transport.state.affection_days[name + ':ride'] = Time.days;
      this.transport.core.SugarCube.Wikifier.wikifyEval(`<<npcincr '${name}' love 1>>`);
    }
  }

  /** 能把车停在路边独处的目的地，且舱内还有没亲近过的同行者。 */
  public get canFoolAround(): boolean {
    const trip = this.transport.state.trip;
    return (
      this.transport.core.passage.title === 'Deadwood Transport Travel' &&
      this.transport.ready &&
      !!trip?.settled &&
      !trip.interrupted &&
      !trip.commute &&
      !trip.fooled &&
      (trip.passengers?.length ?? 0) === 1 &&
      ['cliff', 'starfish', 'danube', 'farmland'].includes(trip.to) &&
      window.isLoveInterest(trip.passengers[0]) &&
      (trip.passengers[0] !== 'Robin' || C.npc.Robin.trauma < 50)
    );
  }

  public foolAround(): boolean {
    if (!this.canFoolAround) return false;
    const trip = this.transport.state.trip!;
    trip.fooled = true;
    if (trip.event) trip.event.resolved = true;
    return this.transport.core.passage.title === 'Deadwood Transport Travel';
  }

  public date(): boolean {
    if (!this.canDate) return false;
    const trip = this.transport.state.trip!;
    trip.dated = true;
    if (trip.event) trip.event.resolved = true;
    for (const name of trip.passengers) {
      if (this.transport.state.affection_days[name + ':date'] === Time.days) continue;
      this.transport.state.affection_days[name + ':date'] = Time.days;
      this.transport.core.SugarCube.Wikifier.wikifyEval(`<<npcincr '${name}' love 2>>`);
    }
    this.transport.core.SugarCube.Wikifier.wikifyEval('<<stress -3>><<pass 20>>');
    return this.transport.core.passage.title === 'Deadwood Transport Travel';
  }
}
