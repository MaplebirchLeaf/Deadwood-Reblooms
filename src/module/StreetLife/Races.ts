import terms from '../../assets/street/races.json';
import Catalog, { type Vehicle, type VehicleModel } from '../Transport/Catalog';
import type StreetLife from '../StreetLife';

type Group = (typeof terms.groups)[number];
type Style = (typeof terms.styles)[number]['id'];
type Reason = 'closed' | 'snow' | 'busy' | 'unfit' | 'vehicle' | 'license' | 'condition' | 'fuel' | null;
interface Session {
  group: string;
  vehicle: number;
  step: number;
  point: string;
  scores: Record<string, number>;
  minutes: number;
  fuel: number;
  wear: number;
  noticed: boolean;
  incident: 'clear' | 'traffic' | 'slide' | 'crash';
  lastGain: number;
  lastWear: number;
}
interface Report extends Session {
  outcome: 'finished' | 'withdrawn' | 'crashed' | 'interrupted';
  place: number;
  payout: number;
  exitPassage: string;
}
interface RacesState {
  origin: string | null;
  played: Record<string, number>;
  watched: number;
  session: Session | null;
  last: Report | null;
  started: number;
  completed: number;
  wins: number;
  earned: number;
  fees: number;
}

/** 比赛拥有独立赛段结算；普通交通行程不参与赛事的油耗、计时或车辆移动。 */
export default class Races {
  public static readonly defaults: RacesState = { origin: null, played: {}, watched: -1, session: null, last: null, started: 0, completed: 0, wins: 0, earned: 0, fees: 0 };
  public readonly terms = terms;
  private working = false;

  public constructor(private readonly street: StreetLife) {}

  public get state(): RacesState {
    return V.StreetLife.races;
  }

  public get transport() {
    return this.street.core.get('Transport');
  }

  public get seasonedDriver(): boolean {
    return (this.transport?.state.driving ?? 0) >= terms.seasoned_driver.driving && this.state.completed >= terms.seasoned_driver.completed;
  }

  public get night(): number {
    // 原版 Time.days 从开局时刻计日；赛事按凌晨四点划分同一晚。
    return Math.floor((Time.date.timeStamp - 4 * TimeConstants.secondsPerHour) / TimeConstants.secondsPerDay);
  }

  public get nightOpen(): boolean {
    return Time.hour >= 20 || Time.hour < 4;
  }

  public get available(): boolean {
    const title = this.street.core.passage.title;
    return !!this.transport && (title === 'Farm Road 1' || (['Deadwood Street Races', 'Deadwood Street Race'].includes(title) && this.state.origin === 'farmroad1'));
  }

  public get nearby(): Vehicle[] {
    return (
      this.transport?.state.vehicles.filter(
        vehicle => vehicle.point === 'farmroad1' && vehicle.garage === null && !vehicle.stolen && Catalog.models.find(model => model.id === vehicle.model)?.kind === 'motor_vehicle'
      ) ?? []
    );
  }

  public get vehicle(): Vehicle | null {
    const id = this.state.session?.vehicle ?? this.transport?.state.selected;
    return this.transport?.state.vehicles.find(vehicle => vehicle.id === id) ?? null;
  }

  public get model(): VehicleModel | null {
    return Catalog.models.find(model => model.id === this.vehicle?.model) ?? null;
  }

  public get group(): Group | undefined {
    return terms.groups.find(group => group.id === (this.state.session?.group ?? this.state.last?.group));
  }

  public get stage() {
    return terms.stages[this.state.session?.step ?? 0];
  }

  public get fuelRequired(): number {
    return Math.round(terms.stages.reduce((total, stage) => total + Math.ceil(stage.distance * (this.model?.fuel_use ?? 0) * 1.6 * 100) / 100, 0) * 100) / 100;
  }

  private get fit(): boolean {
    return (
      !!this.transport?.ready &&
      !V.nextPassage &&
      !V.nextPassageCheck &&
      V.drunk <= 0 &&
      V.drugged <= 0 &&
      V.stress < V.stressmax &&
      !window.pcAreArmsBound('any') &&
      !V.worn.feet.type.includes('shackle')
    );
  }

  public get reason(): Reason {
    if (!this.available || !this.nightOpen) return 'closed';
    if (Weather.isSnow) return 'snow';
    const transport = this.transport!;
    if (
      this.state.session ||
      transport.taxi.active ||
      (transport.state.trip && !transport.state.trip.settled) ||
      transport.state.commute ||
      transport.state.passengers.length ||
      this.street.heist.inAction ||
      this.street.bounties.busy ||
      this.street.bounties.state.active ||
      this.street.jobs.state.active ||
      this.street.bailey.state.fight
    )
      return 'busy';
    if (!this.fit) return 'unfit';
    if (!this.vehicle || !this.model || !this.nearby.includes(this.vehicle) || (this.vehicle.arrears ?? 0) > 0) return 'vehicle';
    if (!transport.state.school.motor_vehicle.licensed) return 'license';
    if (this.vehicle.condition < terms.minimum_condition) return 'condition';
    return this.vehicle.fuel < this.fuelRequired ? 'fuel' : null;
  }

  public get ready(): boolean {
    return this.reason === null;
  }

  public get entries() {
    return terms.groups.map(group => ({
      ...group,
      reason: this.reason ?? (this.state.played[group.id] === this.night ? 'played' : this.transport!.state.driving < group.driving ? 'skill' : V.money < group.fee ? 'money' : null)
    }));
  }

  public get standings() {
    const scores = this.state.session?.scores ?? this.state.last?.scores;
    return scores
      ? Object.entries(scores)
          .sort(([a, scoreA], [b, scoreB]) => scoreB - scoreA || (a === 'pc' ? 1 : b === 'pc' ? -1 : a.localeCompare(b)))
          .map(([id, score], index) => ({ id, score, place: index + 1, name: id === 'pc' ? { EN: 'You', CN: '你' } : terms.rivals.find(rival => rival.id === id)!.name }))
      : [];
  }

  public get exitPassage(): string {
    return Catalog.passage(this.state.session?.point ?? this.state.origin ?? this.state.last?.point ?? 'farmroad1');
  }

  public open(): boolean {
    if (this.working || this.street.core.passage.title !== 'Farm Road 1' || !this.transport?.ready || !this.nightOpen || Weather.isSnow || V.nextPassage || V.nextPassageCheck) return false;
    this.state.origin = 'farmroad1';
    this.transport.state.origin = 'farmroad1';
    this.transport.state.return_passage = 'Farm Road 1';
    return true;
  }

  /** 离开赛事页面不领奖；强制转场时保留最后已经经过的道路节点。 */
  public enterPassage(): void {
    if (['Deadwood Street Races', 'Deadwood Street Race'].includes(this.street.core.passage.title)) return;
    if (this.state.session) this.finish('interrupted');
    this.state.origin = null;
  }

  public watch(): boolean {
    if (
      this.working ||
      this.street.core.passage.title !== 'Deadwood Street Races' ||
      !this.available ||
      !this.nightOpen ||
      Weather.isSnow ||
      this.state.session ||
      this.state.watched === this.night ||
      !this.transport?.ready ||
      V.nextPassage ||
      V.nextPassageCheck
    )
      return false;
    this.state.watched = this.night;
    this.street.core.SugarCube.Wikifier.wikifyEval(`<<pass ${terms.watch_minutes}>>`);
    return this.street.core.passage.title === 'Deadwood Street Races' && !V.nextPassage && !V.nextPassageCheck;
  }

  public begin(id: string): boolean {
    const group = this.entries.find(group => group.id === id);
    if (this.working || this.street.core.passage.title !== 'Deadwood Street Races' || !group || group.reason) return false;
    this.working = true;
    this.state.played[id] = this.night;
    this.state.started++;
    this.state.fees += group.fee;
    this.state.last = null;
    this.state.session = {
      group: id,
      vehicle: this.vehicle!.id,
      step: 0,
      point: 'farmroad1',
      scores: Object.fromEntries(['pc', ...terms.rivals.map(rival => rival.id)].map(id => [id, 0])),
      minutes: terms.entry_minutes,
      fuel: 0,
      wear: 0,
      noticed: false,
      incident: 'clear',
      lastGain: 0,
      lastWear: 0
    };
    try {
      this.street.core.SugarCube.Wikifier.wikifyEval(`<<money -${group.fee}>><<pass ${terms.entry_minutes}>>`);
    } finally {
      this.working = false;
    }
    if (!this.state.session || this.street.core.passage.title !== 'Deadwood Street Races' || !this.fit) {
      this.finish('interrupted');
      // 同页中断后刷新回执；原版强制转场或待处理事件继续接管页面。
      return this.street.core.passage.title === 'Deadwood Street Races' && !V.nextPassage && !V.nextPassageCheck;
    }
    return true;
  }

  public advance(styleId: Style, expectedStep: number): boolean {
    const session = this.state.session;
    const style = terms.styles.find(style => style.id === styleId);
    const stage = this.stage;
    const vehicle = this.vehicle;
    const model = this.model;
    if (this.working || this.street.core.passage.title !== 'Deadwood Street Race' || !session || session.step !== expectedStep || !style || !stage) return false;
    if (!vehicle || !model) {
      this.finish('interrupted');
      return !V.nextPassage && !V.nextPassageCheck;
    }
    if (
      !this.fit ||
      !this.transport?.state.school.motor_vehicle.licensed ||
      Weather.isSnow ||
      vehicle.point !== session.point ||
      vehicle.stolen ||
      vehicle.garage !== null ||
      vehicle.fuel < Math.ceil(stage.distance * model.fuel_use * style.fuel * 100) / 100 ||
      vehicle.condition <= 0
    ) {
      this.finish('interrupted');
      return !V.nextPassage && !V.nextPassageCheck;
    }
    this.working = true;
    const driving = Math.clamp(this.transport!.state.driving, 0, 1000);
    const rain = Weather.precipitation === 'rain';
    const risk = Math.clamp(style.risk + stage.risk + (rain ? 8 : 0) + Math.max(0, 70 - vehicle.condition) / 3 - driving / 125, 1, 45);
    const slip = random(1, 100) <= risk;
    const crash = slip && random(1, 100) <= (style.id === 'risk' ? 12 : 4);
    const traffic = !slip && random(1, 100) <= 12;
    const performance = (terms.performance as Record<string, number>)[model.id] ?? 0;
    session.lastGain =
      40 +
      driving / 50 +
      performance +
      style.pace +
      (style.id === 'risk' ? stage.risk_bonus : stage[style.id as 'steady' | 'press']) +
      random(-6, 6) -
      (rain ? 2 : 0) -
      (100 - vehicle.condition) / 8 -
      (traffic ? 3 : 0) -
      (slip ? random(18, 30) : 0);
    session.scores.pc += session.lastGain;
    for (const rival of terms.rivals) session.scores[rival.id] += rival.pace + this.group!.pace + random(-rival.spread, rival.spread) - (rain ? 2 : 0);
    const fuel = Math.min(vehicle.fuel, Math.ceil(stage.distance * model.fuel_use * style.fuel * 100) / 100);
    session.lastWear = Math.min(vehicle.condition, style.wear + this.transport!.journeyWear(model, stage.minutes) + (slip ? random(1, 3) / 10 : 0) + (crash ? random(5, 10) : 0));
    vehicle.fuel = Math.max(0, Math.round((vehicle.fuel - fuel) * 100) / 100);
    vehicle.condition = Math.max(0, Math.round((vehicle.condition - session.lastWear) * 1000) / 1000);
    session.fuel = Math.round((session.fuel + fuel) * 100) / 100;
    session.wear = Math.round((session.wear + session.lastWear) * 1000) / 1000;
    session.incident = crash ? 'crash' : slip ? 'slide' : traffic ? 'traffic' : 'clear';
    session.minutes += stage.minutes;
    session.step++;
    session.point = stage.point;
    this.state.origin = stage.point;
    vehicle.point = stage.point;
    this.transport!.state.origin = stage.point;
    this.transport!.state.return_passage = Catalog.passage(stage.point);
    V.bus = stage.point === 'farmland' ? 'farm' : stage.point;
    V.outside = 1;
    V.location = stage.point === 'farmroad3' ? 'forest' : ['farmroad6', 'farmland'].includes(stage.point) ? 'farm' : 'moor';
    this.transport!.state.driving = Math.min(1000, driving + (style.id === 'steady' ? 1 : 2));
    const noticed = !session.noticed && random(1, 100) <= (this.group!.id === 'open' ? 4 : 2) + (style.id === 'risk' ? 2 : 0);
    if (noticed) session.noticed = true;
    try {
      this.street.core.SugarCube.Wikifier.wikifyEval(`${noticed ? `<<crimeUp ${this.group!.crime} 'petty'>>` : ''}<<pass ${stage.minutes}>>`);
    } finally {
      this.working = false;
    }
    if (!this.state.session) return false;
    if (this.street.core.passage.title !== 'Deadwood Street Race' || !this.fit) {
      this.finish('interrupted');
      return this.street.core.passage.title === 'Deadwood Street Race' && !V.nextPassage && !V.nextPassageCheck;
    } else if (crash) this.finish('crashed');
    else if (session.step === terms.stages.length) this.finish('finished');
    return true;
  }

  public withdraw(expectedStep: number): boolean {
    if (this.working || !['Deadwood Street Races', 'Deadwood Street Race'].includes(this.street.core.passage.title) || !this.state.session || this.state.session.step !== expectedStep) return false;
    this.finish('withdrawn');
    return true;
  }

  private finish(outcome: Report['outcome']): void {
    const session = this.state.session;
    const group = this.group;
    if (!session || !group) return;
    const place = this.standings.find(item => item.id === 'pc')!.place;
    const payout = outcome === 'finished' ? (group.prizes[place - 1] ?? 0) : 0;
    this.state.last = { ...session, outcome, place, payout, exitPassage: Catalog.passage(session.point) };
    this.state.session = null;
    if (outcome !== 'finished') return;
    this.state.completed++;
    this.state.wins += Number(place === 1);
    this.state.earned += payout;
    this.street.reputation += Math.max(0, 4 - place);
    if (payout > 0) this.street.core.SugarCube.Wikifier.wikifyEval(`<<money ${payout}>>`);
  }
}
