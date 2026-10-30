// ./src/module/Transport/TravelEvents.ts

import type Transport from '../Transport';

export interface RoadsideEvent {
  kind: 'breakdown' | 'bags' | 'roadblock' | 'traffic' | 'puncture' | 'load' | 'molestation' | 'police' | 'skid';
  resolved: boolean;
  action?: 'help' | 'tools';
  point?: string;
  started?: boolean;
  roll?: number;
  combat?: 'pending' | 'active' | 'finished';
  caught?: boolean;
  /** 出发时的醉意，不随途中经过时间或界面重绘重新判定。 */
  drunk?: number;
  checked?: boolean;
  handover?: boolean;
  /** 本次路障战中实际协助过的乘客，供结束清理后的叙述使用。 */
  support?: string[];
  outcome?:
    | 'wait'
    | 'escape'
    | 'scraped'
    | 'observe'
    | 'force'
    | 'paid'
    | 'stolen'
    | 'fixed'
    | 'fixed_together'
    | 'force_together'
    | 'limped'
    | 'collected'
    | 'walk'
    | 'defended'
    | 'rescued'
    | 'warned'
    | 'dismissed'
    | 'repelled'
    | 'assaulted'
    | 'cleared'
    | 'fined'
    | 'evaded'
    | 'arrested';
}

export type RoadAction =
  | 'wait'
  | 'escape'
  | 'observe'
  | 'force'
  | 'force_together'
  | 'pay'
  | 'yield'
  | 'fight'
  | 'warn'
  | 'eject'
  | 'fix'
  | 'fix_together'
  | 'limp'
  | 'walk'
  | 'check'
  | 'fine'
  | 'surrender';

export default class TravelEvents {
  public constructor(private readonly transport: Transport) {}

  public roll(destination: string, minutes: number, commute: boolean): RoadsideEvent | undefined {
    if (commute) return;
    const from = this.transport.point!;
    if (destination.startsWith('home:')) {
      const property = this.transport.core.get('Finance')?.realEstate.properties.find(property => property.id === destination.slice(5));
      if (!property) return;
      destination = property.street === 'Office Lobby' ? 'high' : (this.transport.catalog.point(property.street) ?? destination);
    }
    const country = [from, destination].some(point => point === 'farmland' || /^farmroad[1-6]$/.test(point));
    const town = this.transport.catalog.routes.some(route => route.id === destination && route.terrain === 'road');
    if (!town && !country) return;
    if ([from, destination].some(point => /^(?:forest|moor):/.test(point))) return;
    const rand = this.transport.core.get('DeadwoodReblooms')!.rand;
    const drunk = Math.max(0, V.drunk ?? 0);
    const motor = this.transport.model?.kind === 'motorcycle' || this.transport.model?.kind === 'motor_vehicle';
    const position = (point: string) => (point === 'farmland' ? 160 : (this.transport.catalog.roads.find(road => road.id === point)?.position ?? 0));
    const middle = (position(from) + position(destination)) / 2;
    const point = country ? [...this.transport.catalog.roads].sort((a, b) => Math.abs(a.position - middle) - Math.abs(b.position - middle))[0].id : from;
    if (motor) {
      const evidence = window.crimeSumCurrent();
      // 临检独立于普通遭遇的每日次数，短途或此前遇过求助也不能保证免检。
      const policeChance = Math.min(
        30,
        2 + Math.min(8, Math.ceil(minutes / 3)) + (Time.dayState === 'night' ? 3 : 0) + Math.min(12, Math.floor(drunk / 120) * 3) + (evidence >= 5000 ? 10 : evidence >= 1000 ? 6 : 0)
      );
      if (rand.int(99) < policeChance) return { kind: 'police', point, drunk, roll: rand.int(99), resolved: false };
    }
    if (minutes < 5 || this.transport.state.event_day === Math.floor(Time.days)) return;
    const chance = Math.min(country ? 28 : 12, minutes) + (Time.dayState === 'night' ? 8 : 0) + (Weather.isSnow || Weather.precipitation === 'rain' ? 6 : 0);
    if (rand.int(99) >= chance) return;
    this.transport.state.event_day = Math.floor(Time.days);
    const kinds: RoadsideEvent['kind'][] = ['traffic', 'load', 'puncture'];
    const passenger = this.transport.taxi.state.job;
    if (passenger?.phase === 'riding') {
      kinds.push('molestation');
      if (passenger.event === 'drunk') kinds.push('molestation');
    }
    if (country || (Time.dayState === 'night' && [from, destination].some(point => ['harvest', 'elk'].includes(point)))) kinds.push('roadblock');
    if ((this.transport.vehicle?.condition ?? 100) < 40) kinds.push('puncture', 'puncture');
    if (motor && (drunk > 0 || Weather.isSnow || Weather.precipitation === 'rain')) kinds.push('skid');
    if (!this.transport.taxi.active && Time.dayState === 'day' && !Weather.isSnow && Weather.precipitation !== 'rain') kinds.push('breakdown', 'bags');
    const kind = kinds[rand.int(kinds.length - 1)];
    if (['breakdown', 'bags'].includes(kind)) return { kind, drunk, resolved: false };
    return { kind, point, drunk, roll: rand.int(99), resolved: false };
  }

  public get pending(): boolean {
    const trip = this.transport.state.trip;
    return !!trip && !trip.settled && !!trip.event?.point && !trip.event.resolved;
  }

  public get atHazard(): boolean {
    const trip = this.transport.state.trip;
    return (
      this.pending &&
      !!trip?.event?.started &&
      !trip.event.combat &&
      this.transport.core.passage.title === 'Deadwood Transport Travel' &&
      this.transport.ready &&
      !V.eventforced &&
      !V.frozenValues &&
      !V.nextPassage &&
      !V.nextPassageCheck &&
      this.transport.vehicle?.id === trip.vehicle
    );
  }

  public get escapeChance(): number {
    const transport = this.transport;
    const skill = transport.model?.kind === 'bicycle' ? window.currentSkillValue('athletics') : transport.state.driving;
    const fatigue = Math.clamp((V.tiredness ?? 0) / 2000, 0, 1);
    const stress = Math.clamp(V.stress / V.stressmax, 0, 1);
    const nimble = transport.model?.kind !== 'motor_vehicle' ? 8 : (transport.model?.cargo ?? 0) >= 100 ? -10 : 0;
    const drunk = transport.model?.kind === 'bicycle' ? 0 : Math.min(35, (transport.state.trip?.event?.drunk ?? 0) / 12);
    return Math.round(
      Math.clamp(
        25 + skill * 0.06 + (transport.vehicle?.condition ?? 0) * 0.1 + nimble - fatigue * 15 - stress * 15 - drunk - (Weather.isSnow ? 20 : Weather.precipitation === 'rain' ? 10 : 0),
        10,
        95
      )
    );
  }

  public get boundaryChance(): number {
    return Math.round(Math.clamp(30 + window.currentSkillValue('willpower') * 0.04 + window.currentSkillValue('english') * 0.02 - Math.clamp(V.stress / V.stressmax, 0, 1) * 15, 15, 95));
  }

  public get policeFine(): number {
    const event = this.transport.state.trip?.event;
    return event?.kind === 'police' && event.checked && !event.resolved && (event.drunk ?? 0) >= 120 && window.crimeSumCurrent() < 1000 ? Math.min(50000, Math.floor(event.drunk! / 120) * 10000) : 0;
  }

  public get policeArrested(): boolean {
    const event = this.transport.state.trip?.event;
    return (
      ['Deadwood Transport Travel', 'Deadwood Transport Road Fight Finish', 'Deadwood Transport Police Handover'].includes(this.transport.core.passage.title) &&
      event?.kind === 'police' &&
      event.resolved &&
      event.outcome === 'arrested' &&
      !event.handover
    );
  }

  public can(action: RoadAction): boolean {
    if (!this.atHazard) return false;
    const event = this.transport.state.trip!.event!;
    const kind = event.kind;
    const twoWheels = this.transport.model!.kind !== 'motor_vehicle';
    if (['fix_together', 'force_together'].includes(action) && (!this.transport.canDepart || !this.transport.companions.aboard.some(name => name !== 'Robin' || C.npc.Robin.trauma < 40))) return false;
    if (kind === 'police') {
      if (action === 'check') return !event.checked;
      if (action === 'fine') return this.policeFine > 0 && V.money >= this.policeFine;
      return action === 'escape' || action === 'fight' || (action === 'surrender' && !!event.checked);
    }
    if (kind === 'skid') return action === 'wait' || action === 'escape';
    if (kind === 'molestation') return action === 'fight' || action === 'warn' || (action === 'eject' && window.currentSkillValue('physique') >= (V.physiquesize * 4) / 7);
    if (action === 'walk') return true;
    if (kind === 'puncture') {
      const repair = this.transport.model!.kind === 'bicycle' ? 'bicycle' : 'motor';
      return (
        action === 'limp' ||
        (action === 'wait' && V.money >= (repair === 'bicycle' ? 2000 : 5000)) ||
        ((action === 'fix' || (action === 'fix_together' && !twoWheels)) &&
          this.transport.state.repair_tools[repair] &&
          this.transport.state.repair_parts[repair] > 0 &&
          window.currentSkillValue('housekeeping') >= 300)
      );
    }
    if (action === 'wait' || action === 'escape') return true;
    if (action === 'observe') return kind === 'roadblock' && window.currentSkillValue('skulduggery') >= 400;
    if (action === 'force' || (action === 'force_together' && kind === 'load'))
      return (
        (kind === 'load' || (kind === 'roadblock' && twoWheels)) &&
        window.currentSkillValue('physique') >= (V.physiquesize * 4) / 7 &&
        (kind === 'load' || window.currentSkillValue('athletics') >= 300)
      );
    if (action === 'pay') return kind === 'roadblock' && V.money >= 5000;
    return (action === 'yield' || action === 'fight') && kind === 'roadblock';
  }

  public resolve(action: RoadAction): boolean {
    if (!this.can(action)) return false;
    const transport = this.transport;
    const trip = transport.state.trip!;
    const event = trip.event!;
    const vehicle = transport.vehicle!;
    if (action === 'fix_together' || action === 'force_together') {
      const helpers = transport.companions.aboard.filter(name => name !== 'Robin' || C.npc.Robin.trauma < 40);
      const location = V.location;
      const point = vehicle.point;
      const minutes = action === 'fix_together' ? 20 : 3;
      const end = Time.date.timeStamp + minutes * 60;
      // 先消耗本次事件和耗材；协作者离场时，补足单人耗时，不保留协作优惠。
      event.resolved = true;
      if (action === 'fix_together') transport.state.repair_parts.motor--;
      transport.core.SugarCube.Wikifier.wikifyEval(`<<pass ${minutes}>>`);
      const valid = () =>
        transport.core.get('Transport') === transport &&
        transport.state.trip === trip &&
        trip.event === event &&
        transport.vehicle === vehicle &&
        vehicle.point === point &&
        transport.canDepart &&
        transport.core.passage.title === 'Deadwood Transport Travel' &&
        V.location === location &&
        !V.eventforced &&
        !V.frozenValues &&
        !V.nextPassage &&
        !V.nextPassageCheck;
      if (!valid() || Time.date.timeStamp < end) {
        if (transport.state.trip === trip && trip.event === event) this.stop(false);
        return false;
      }
      const helped = helpers.some(name => transport.companions.aboard.includes(name) && (name !== 'Robin' || C.npc.Robin.trauma < 40));
      if (!helped) {
        const rest = action === 'fix_together' ? 10 : 1;
        const finish = Time.date.timeStamp + rest * 60;
        transport.core.SugarCube.Wikifier.wikifyEval(`<<pass ${rest}>>`);
        if (!valid() || Time.date.timeStamp < finish) {
          if (transport.state.trip === trip && trip.event === event) this.stop(false);
          return false;
        }
      }
      event.outcome = action === 'fix_together' ? (helped ? 'fixed_together' : 'fixed') : helped ? 'force_together' : 'force';
      transport.core.SugarCube.Wikifier.wikifyEval(action === 'fix_together' ? '<<housekeeping 2>>' : `<<physique 1>><<tiredness ${helped ? 1 : 3}>>`);
      return true;
    }
    if (event.kind === 'police' && action === 'check') {
      event.checked = true;
      transport.core.SugarCube.Wikifier.wikifyEval('<<pass 3>>');
      if (transport.state.trip !== trip) return false;
      const interrupted = !!V.nextPassage || !!V.nextPassageCheck || transport.core.passage.title !== 'Deadwood Transport Travel';
      if (!transport.canDepart || interrupted) this.stop(!interrupted);
      else if (window.crimeSumCurrent() < 1000 && (event.drunk ?? 0) < 120) {
        // 核查结束时读取当前罪证。醉驾仍按出发快照，不因途中醒酒放行。
        event.resolved = true;
        event.outcome = 'cleared';
      }
      return true;
    }
    if (
      action === 'fight' ||
      (action === 'escape' && ['roadblock', 'police'].includes(event.kind) && (event.roll ?? 99) >= this.escapeChance) ||
      (action === 'warn' && (event.roll ?? 99) >= this.boundaryChance)
    ) {
      event.combat = 'pending';
      event.caught = action === 'escape';
      if (event.kind === 'police') transport.core.SugarCube.Wikifier.wikifyEval(action === 'fight' ? '<<crimeUp 200 "assault">>' : '<<crimeUp 200 "resisting">>');
      return true;
    }
    const fine = action === 'fine' ? this.policeFine : 0;
    event.resolved = true;
    let minutes = 0;
    let effects = '';
    if (action === 'fine') {
      // 先读取并消费本次处罚，重绘或重复点击不会再次扣款。
      event.outcome = 'fined';
      effects = `<<money -${fine} 'transport' {cashOnly: true}>>`;
    } else if (action === 'surrender') {
      event.outcome = 'arrested';
    } else if (action === 'warn') {
      event.outcome = 'warned';
      effects = '<<willpower 1>>';
      minutes = 1;
    } else if (action === 'eject') {
      event.outcome = 'dismissed';
      effects = '<<physique 1>>';
      minutes = 3;
    } else if (action === 'escape') {
      if ((event.roll ?? 99) < this.escapeChance) {
        event.outcome = event.kind === 'police' ? 'evaded' : 'escape';
        effects = transport.model!.kind === 'bicycle' ? '<<athletics 2>><<tiredness 3>>' : '';
        if (event.kind === 'police') effects += '<<crimeUp 200 "resisting">>';
        if (transport.model!.kind !== 'bicycle') transport.state.driving = Math.min(1000, transport.state.driving + 3);
      } else {
        event.outcome = 'scraped';
        vehicle.condition = Math.max(0, vehicle.condition - 3);
        minutes = 4;
        effects = '<<stress 6>>' + (transport.model!.kind !== 'motor_vehicle' ? '<<pain 2>>' : '');
      }
    } else if (action === 'yield') event.outcome = 'stolen';
    else if (action === 'walk') event.outcome = 'walk';
    else if (action === 'observe') {
      event.outcome = 'observe';
      minutes = 3;
      effects = '<<skulduggery 1>>';
    } else if (action === 'force') {
      event.outcome = 'force';
      minutes = event.kind === 'load' ? 4 : 1;
      effects = '<<physique 1>><<tiredness 3>>';
    } else if (action === 'pay') {
      event.outcome = 'paid';
      minutes = 2;
      effects = '<<money -5000>><<stress 3>>';
    } else if (action === 'fix') {
      const repair = transport.model!.kind === 'bicycle' ? 'bicycle' : 'motor';
      transport.state.repair_parts[repair]--;
      event.outcome = 'fixed';
      minutes = repair === 'bicycle' ? 15 : 30;
      effects = '<<housekeeping 2>>';
    } else if (action === 'limp') {
      event.outcome = 'limped';
      minutes = 15;
      vehicle.condition = Math.max(0, vehicle.condition - 6);
      effects = '<<stress 3>>';
    } else if (event.kind === 'puncture') {
      event.outcome = 'collected';
      minutes = 30;
      effects = `<<money -${transport.model!.kind === 'bicycle' ? 2000 : 5000}>>`;
    } else {
      event.outcome = 'wait';
      minutes = event.kind === 'roadblock' ? 10 : event.kind === 'load' ? 8 : event.kind === 'skid' ? 3 : 4;
    }
    const stop = ['stolen', 'walk', 'dismissed', 'fined', 'arrested'].includes(event.outcome!);
    if (event.outcome === 'stolen') {
      vehicle.stolen = true;
      effects = '<<stress 12>>';
    }
    this.transport.core.SugarCube.Wikifier.wikifyEval(effects + (minutes ? `<<pass ${minutes}>>` : ''));
    if (transport.state.trip !== trip) return false;
    const interrupted = !!V.nextPassage || !!V.nextPassageCheck || transport.core.passage.title !== 'Deadwood Transport Travel';
    if (stop || !transport.canDepart || interrupted) this.stop(!interrupted);
    return true;
  }

  public get combatPending(): boolean {
    return this.pending && this.transport.state.trip!.event!.combat === 'pending';
  }

  public get inCombat(): boolean {
    return this.pending && this.transport.state.trip!.event!.combat === 'active';
  }

  public get combatComplete(): boolean {
    return (
      this.inCombat &&
      !!V.combat &&
      !V.nextPassage &&
      !V.nextPassageCheck &&
      !V.possessed &&
      (V.enemyhealth <= 0 ||
        this.transport.core.combat.climax ||
        (V.alarm === 1 && V.rescue >= 1) ||
        V.finish === 1 ||
        (['roadblock', 'police'].includes(this.transport.state.trip!.event!.kind) && V.pain >= 100 && V.willpowerpain === 0))
    );
  }

  public beginCombat(): boolean {
    const transport = this.transport;
    if (!this.combatPending || transport.core.passage.title !== 'Deadwood Transport Road Fight' || !transport.ready || transport.vehicle?.id !== transport.state.trip!.vehicle) return false;
    // 同行者保留在行程状态中，战斗只载入当前对手。
    transport.core.SugarCube.Wikifier.wikifyEval('<<endevent>>');
    if (transport.state.trip!.event!.kind === 'molestation') {
      transport.taxi.passengerNPC();
      V.outside = 0;
      transport.core.SugarCube.Wikifier.wikifyEval('<<molested>><<neutral 1>><<maninit>><<set $enemytrust -= 100>>');
    } else if (transport.state.trip!.event!.kind === 'police') {
      transport.core.SugarCube.Wikifier.wikifyEval('<<generatePolice 1>><<generatePolice 2>><<neutral 1>><<maninit>><<set $enemytrust -= 100>><<set $enemyanger += 200>><<npcidlegenitals>>');
    } else {
      transport.core.SugarCube.Wikifier.wikifyEval('<<generateNPC 1 a>><<generateNPC 2 a>><<neutral 1>><<maninit>><<set $enemytrust -= 100>><<set $enemyanger += 200>><<npcidlegenitals>>');
    }
    transport.state.trip!.event!.combat = 'active';
    return true;
  }

  public finishCombat(): boolean {
    const transport = this.transport;
    if (transport.core.passage.title !== 'Deadwood Transport Road Fight Finish' || !this.combatComplete) return false;
    // 本场战斗照常结束，冻结与回放不结算行程、车辆和犯罪。
    if (V.statFreeze || V.frozenValues || V.replayScene) {
      transport.core.SugarCube.Wikifier.wikifyEval('<<clotheson>><<endcombat>>');
      return true;
    }
    const trip = transport.state.trip!;
    const event = trip.event!;
    const satisfied = this.transport.core.combat.climax;
    const molestation = event.kind === 'molestation';
    const police = event.kind === 'police';
    if (police) event.outcome = satisfied || V.enemyhealth <= 0 || (V.alarm === 1 && V.rescue >= 1) ? 'evaded' : 'arrested';
    else if (satisfied) event.outcome = molestation ? 'assaulted' : 'defended';
    else if (V.enemyhealth <= 0) event.outcome = molestation ? 'repelled' : 'defended';
    else if (V.alarm === 1 && V.rescue >= 1) event.outcome = 'rescued';
    else event.outcome = molestation ? 'assaulted' : 'stolen';
    event.resolved = true;
    event.combat = 'finished';
    if (event.outcome === 'stolen') transport.vehicle!.stolen = true;
    const injury = police && V.enemyhealth < V.enemyhealthmax ? '<<crimeUp 400 "assault">>' : '';
    transport.core.SugarCube.Wikifier.wikifyEval(`${injury}<<clotheson>><<endcombat>>${event.outcome === 'stolen' ? '<<stress 12>>' : ''}`);
    V.outside = 1;
    const interrupted = !!V.nextPassage || !!V.nextPassageCheck || transport.core.passage.title !== 'Deadwood Transport Road Fight Finish';
    if (transport.state.trip === trip && (molestation || event.outcome === 'stolen' || event.outcome === 'arrested' || !transport.canDepart || interrupted)) this.stop(!interrupted);
    return true;
  }

  public enterPassage(): void {
    const transport = this.transport;
    // 原版昏迷等分支可能在别处结束战斗，不能把旧行程再次送达。
    if (!this.inCombat || V.combat || /^Deadwood Transport Road Fight(?: Finish)?$/.test(transport.core.passage.title)) return;
    const trip = transport.state.trip!;
    const vehicle = trip.vehicle === transport.taxi.fleet?.id ? transport.taxi.fleet : transport.state.vehicles.find(vehicle => vehicle.id === trip.vehicle);
    if (vehicle && trip.event!.kind === 'roadblock') vehicle.stolen = true;
    trip.event!.resolved = true;
    trip.event!.combat = 'finished';
    trip.event!.outcome = trip.event!.kind === 'police' ? 'arrested' : trip.event!.kind === 'roadblock' ? 'stolen' : 'assaulted';
    // 昏迷、医院或原版拘捕已经接管场景，不再从旧行程补演一次移交。
    if (trip.event!.kind === 'police') trip.event!.handover = true;
    this.stop(false);
  }

  public stop(resetPhase = true): void {
    const transport = this.transport;
    const trip = transport.state.trip;
    if (!trip) return;
    const phase = V.phase;
    const eventskip = V.eventskip;
    trip.interrupted = true;
    trip.settled = true;
    // 载客途中停驶时，释放订单，不结算未送达的车费。
    if (trip.taxi) transport.taxi.interrupt();
    transport.core.get('Finance')?.realEstate.outings.abandon();
    transport.state.passengers = [];
    transport.state.commute = null;
    if (resetPhase) {
      V.phase = 0;
      V.eventskip = 1;
    } else {
      V.phase = phase;
      V.eventskip = eventskip;
    }
  }

  public get available(): boolean {
    const trip = this.transport.state.trip;
    return (
      this.transport.core.passage.title === 'Deadwood Transport Travel' &&
      this.transport.ready &&
      !V.eventforced &&
      !V.frozenValues &&
      !V.nextPassage &&
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
    const minutes = event.kind === 'bags' ? 2 : tools && window.currentSkillValue('housekeeping') >= 600 ? 3 : 5;
    const vehicle = this.transport.vehicle;
    const location = V.location;
    const end = Time.date.timeStamp + minutes * 60;
    this.transport.core.SugarCube.Wikifier.wikifyEval(`<<pass ${minutes}>>`);
    if (
      this.transport.core.get('Transport') !== this.transport ||
      this.transport.core.passage.title !== 'Deadwood Transport Travel' ||
      !this.transport.ready ||
      V.eventforced ||
      V.frozenValues ||
      V.nextPassage ||
      V.nextPassageCheck ||
      this.transport.state.trip !== trip ||
      trip.event !== event ||
      this.transport.vehicle !== vehicle ||
      this.transport.vehicle?.point !== trip.to ||
      V.location !== location ||
      Time.date.timeStamp < end
    )
      return false;
    event.action = tools ? 'tools' : 'help';
    this.transport.core.SugarCube.Wikifier.wikifyEval(`<<stress -${tools ? 2 : 1}>>`);
    return true;
  }
}
