// ./src/module/Transport/TravelEvents.ts

import type Transport from '../Transport';

export interface RoadsideEvent {
  kind: 'breakdown' | 'bags';
  resolved: boolean;
  action?: 'help' | 'tools';
}

export default class TravelEvents {
  public constructor(private readonly transport: Transport) {}

  public roll(destination: string, minutes: number, commute: boolean): RoadsideEvent | undefined {
    if (commute || minutes < 5 || this.transport.state.event_day === Math.floor(Time.days) || Time.dayState !== 'day' || Weather.isSnow || Weather.precipitation === 'rain') return;
    const town = this.transport.catalog.routes.some(route => route.id === destination && route.terrain === 'road');
    if (!town && destination !== 'farmland') return;
    const rand = this.transport.core.get('DeadwoodReblooms')!.rand;
    if (rand.int(99) >= 25) return;
    this.transport.state.event_day = Math.floor(Time.days);
    return { kind: destination === 'farmland' || rand.int(1) === 0 ? 'breakdown' : 'bags', resolved: false };
  }

  public get available(): boolean {
    const trip = this.transport.state.trip;
    return (
      this.transport.core.passage.title === 'Deadwood Transport Travel' &&
      this.transport.ready &&
      !!trip?.settled &&
      !trip.interrupted &&
      !V.nextPassageCheck &&
      !!trip.event &&
      !trip.event.resolved &&
      this.transport.vehicle?.id === trip.vehicle &&
      this.transport.vehicle?.point === trip.to
    );
  }

  public get canUseTools(): boolean {
    const state = this.transport.state;
    return this.available && state.trip!.event!.kind === 'breakdown' && state.repair_tools.motor && state.repair_parts.motor > 0 && window.currentSkillValue('housekeeping') >= 300;
  }

  public help(tools = false): boolean {
    if (!this.available || (tools && !this.canUseTools)) return false;
    const trip = this.transport.state.trip!;
    const event = trip.event!;
    event.resolved = true;
    if (tools) this.transport.state.repair_parts.motor--;
    this.transport.core.SugarCube.Wikifier.wikifyEval(`<<pass ${event.kind === 'bags' ? 2 : 5}>>`);
    if (this.transport.core.passage.title !== 'Deadwood Transport Travel' || !this.transport.ready || V.nextPassageCheck || this.transport.state.trip !== trip) return false;
    event.action = tools ? 'tools' : 'help';
    this.transport.core.SugarCube.Wikifier.wikifyEval(`<<stress -${tools ? 2 : 1}>>`);
    return true;
  }
}
