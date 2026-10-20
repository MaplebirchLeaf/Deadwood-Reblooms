// ./src/module/Finance/PropertyLife.ts

import type RealEstate from './RealEstate';
import type { StaffRole } from './PropertyStaff';
import type { WineRecipe } from '../Orchard/Winery';

type Activity = 'meal' | 'tea' | 'tidy' | 'music' | 'film' | 'wine';

export interface PropertyLifeState {
  days: Record<string, number>;
  bath: {
    property_id: string;
    partner: string;
    at: number;
    until: number;
    action: 'knock' | 'towel' | 'ask' | 'wait' | 'join' | 'barge' | 'sneak' | 'greet' | 'apologise';
    first: boolean;
    hidden?: boolean;
    intruded?: boolean;
  } | null;
  scene: {
    property_id: string;
    action: Activity;
    partner: string | null;
    quality: number;
    first: boolean;
    item: string | null;
    origin: string;
    floor: number;
    at?: number;
    followup?: 'talk' | 'close';
    /** 酒局前戏分层：0 未开始，1 已坐到一起，2 已有肢体接触，可转入卧室。 */
    stage?: number;
    /** 第二层由玩家选的那条路：嘴或手。 */
    tone?: 'mouth' | 'hands';
  } | null;
  daily_day: number;
  daily: {
    day: number;
    property: string;
    kind: 'resident' | 'staff' | 'house';
    variant: number;
    partner: string | null;
    role: StaffRole | null;
    choice: 'join' | 'help' | 'read' | 'leave' | null;
  } | null;
}

const rooms = ['Home', 'Landing', 'Lounge', 'Kitchen', 'Reception Room', 'Wine Cellar', 'Screening Room'].map(room => `Deadwood Reblooms Property ${room}`);
const minutes: Record<Activity, number> = { meal: 20, tea: 15, tidy: 20, music: 20, film: 45, wine: 20 };

/** 保存居家活动与当天机会，原版食物、技能与时间由点击回调结算。 */
export default class PropertyLife {
  public static readonly defaults: PropertyLifeState = { days: {}, bath: null, scene: null, daily_day: -1, daily: null };

  public constructor(
    private readonly estate: RealEstate,
    private readonly core: typeof maplebirch
  ) {}

  private get state(): PropertyLifeState {
    const state = (V.Finance.real_estate.life ??= structuredClone(PropertyLife.defaults));
    state.daily_day ??= -1;
    state.daily ??= null;
    return state;
  }

  public preInit(): void {
    this.core.on(':passagestart', () => {
      if (!this.core.passage.title.startsWith('Deadwood Reblooms Property Resident Bath') && V.Finance?.real_estate?.life) V.Finance.real_estate.life.bath = null;
      if (this.core.passage.title === 'Deadwood Reblooms Property Home') this.arrive();
    });
  }

  public get bathing(): { partner: string; until: number; minutes: number } | undefined {
    const property = this.estate.current;
    if (!property || V.replayScene || V.statFreeze || V.combat || V.possessed || V.nextPassage || V.nextPassageCheck) return;
    const now = Time.hour * 60 + Time.minute;
    const resident = this.estate.residentsHome(property.id).find(profile => {
      if (C.npc[profile.id]?.init !== 1 || !['active', 'rescued'].includes(C.npc[profile.id].state)) return false;
      if (profile.id === 'Robin' && (V.robinmissing || V.robin.timer.hurt > 0)) return false;
      const start = profile.bath.hour * 60 + profile.bath.minute;
      return now >= start && now < start + profile.bath.duration && this.state.days[`bath-finished:${property.id}:${profile.id}`] !== Math.floor(Time.days);
    });
    if (!resident) return;
    const minutes = resident.bath.hour * 60 + resident.bath.minute + resident.bath.duration - now;
    return { partner: resident.id, until: Time.date.timeStamp + minutes * 60 - Time.date.second, minutes };
  }

  public get bath(): PropertyLifeState['bath'] | undefined {
    const bath = this.state.bath;
    if (!bath || bath.property_id !== this.estate.current?.id || V.replayScene || V.statFreeze || V.combat || V.possessed || V.nextPassage || V.nextPassageCheck) return;
    if (C.npc[bath.partner]?.init !== 1 || !['active', 'rescued'].includes(C.npc[bath.partner].state) || (bath.partner === 'Robin' && (V.robinmissing || V.robin.timer.hurt > 0))) return;
    if (Time.date.timeStamp < bath.at || Time.date.timeStamp > bath.until + 600 || !this.estate.residentsHome(bath.property_id).some(profile => profile.id === bath.partner)) return;
    return bath;
  }

  public get daily(): PropertyLifeState['daily'] {
    return this.state.daily;
  }

  public get pending(): boolean {
    const daily = this.daily;
    const property = this.estate.current;
    if (!daily || daily.choice || !property || daily.property !== property.id || daily.day !== Math.floor(Time.days) || !this.core.get('Finance')?.company.available) return false;
    const outings = this.estate.outings;
    if (outings.note || outings.memory || outings.offer || outings.waiting || outings.travelling || this.estate.banquet.active) return false;
    if (this.estate.managementFor(property.id).auction_day !== null) return false;
    if (daily.kind === 'staff') return !!daily.role && this.estate.staff.active(daily.role) && !!V.per_npc?.[this.estate.staff.key(daily.role)];
    if (daily.kind === 'resident')
      return !!daily.partner && daily.partner !== this.bathing?.partner && this.estate.residentsHome(property.id).some(resident => resident.id === daily.partner) && this.free(daily.partner, 10);
    return true;
  }

  public arrive(): void {
    const property = this.estate.current;
    if (
      !property ||
      !this.core.get('Finance')?.company.available ||
      this.estate.managementFor(property.id).auction_day !== null ||
      V.replayScene ||
      V.statFreeze ||
      V.combat ||
      V.possessed ||
      V.nextPassageCheck
    )
      return;
    const outings = this.estate.outings;
    if (outings.note || outings.memory || outings.offer || outings.waiting || outings.travelling || this.estate.banquet.active || outings.propose()) return;
    if (this.state.daily_day >= Math.floor(Time.days)) return;
    const residents = this.estate.household.home.filter(resident => (Time.hour >= 21 || (Time.hour >= 5 && Time.hour < 7)) && this.free(resident.id, 10));
    const roles = this.estate.staff.roles.filter(role => this.estate.staff.active(role) && V.per_npc?.[this.estate.staff.key(role)]);
    const kinds: Array<'resident' | 'staff' | 'house'> = ['house'];
    if (residents.length) kinds.push('resident');
    if (roles.length) kinds.push('staff');
    const pick = this.core.SugarCube.Scripting.evalJavaScript('random') as (min: number, max: number) => number;
    const kind = kinds[pick(0, kinds.length - 1)];
    this.state.daily_day = Math.floor(Time.days);
    this.state.daily = {
      day: this.state.daily_day,
      property: property.id,
      kind,
      variant: pick(0, 2),
      partner: kind === 'resident' ? residents[pick(0, residents.length - 1)].id : null,
      role: kind === 'staff' ? roles[pick(0, roles.length - 1)] : null,
      choice: null
    };
  }

  public finish(choice: NonNullable<PropertyLifeState['daily']>['choice']): boolean {
    if (!this.pending || !choice || !['join', 'help', 'read', 'leave'].includes(choice)) return false;
    if (choice !== 'leave' && choice !== ({ resident: 'join', staff: 'read', house: 'help' } as const)[this.daily!.kind]) return false;
    this.daily!.choice = choice;
    return true;
  }

  private free(name: string, duration: number): boolean {
    const end = name === 'Sydney' ? 6 : 7;
    return Time.hour >= end || Time.hour * 60 + Time.minute + duration <= end * 60;
  }

  public get scene(): PropertyLifeState['scene'] {
    return this.state.scene;
  }

  public ready(action: Activity): boolean {
    const property = this.estate.current;
    if (!property || !rooms.includes(V.passage) || V.replayScene || V.statFreeze || V.combat || window.pcAreArmsBound('both') || this.estate.managementFor(property.id).auction_day !== null)
      return false;
    const partner = V.Finance.real_estate.room_companion;
    if (partner && partner === this.bathing?.partner) return false;
    if (partner && !this.estate.residentsHome(property.id).some(resident => resident.id === partner)) return false;
    if (partner && !this.free(partner, minutes[action])) return false;
    if (['meal', 'tea'].includes(action) && !partner) return false;
    if (action === 'film') return this.estate.facilities.some(room => room.id === 'cinema');
    if (action === 'wine') {
      return (
        ['Home', 'Lounge', 'Kitchen', 'Wine Cellar'].some(room => V.passage === `Deadwood Reblooms Property ${room}`) &&
        !V.gag &&
        !V.possessed &&
        !V.nextPassage &&
        !V.nextPassageCheck &&
        V.stress < V.stressmax &&
        (V.drunk ?? 0) < 240 &&
        (V.drugged ?? 0) <= 0 &&
        (V.hallucinogen ?? 0) <= 0
      );
    }
    return ['meal', 'tea', 'tidy', 'music'].includes(action);
  }

  public begin(action: Activity, item: string | null = null): boolean {
    // 同一个开酒链接在页面跳转前不能再次消费，返回房间时由酒菜单结束旧场景。
    if (action === 'wine' && this.scene?.action === 'wine') return false;
    this.state.scene = null;
    if (!this.ready(action)) return false;
    if (['meal', 'tea', 'wine'].includes(action)) {
      const food = item ? setup.foodstuff[item] : undefined;
      const winery = action === 'wine' ? this.core.get('Orchard')?.winery : undefined;
      const recipe = winery?.terms.recipes.find(recipe => recipe.id === item);
      if (recipe) {
        if (!winery!.take(recipe.id as WineRecipe)) return false;
      } else {
        if (!food || (V.foodstuff[item!]?.amount ?? 0) < (action === 'wine' ? 1 : 2)) return false;
        if (food.food?.tags?.includes('tainted') || (action === 'tea' && food.food?.tags?.includes('alcohol'))) return false;
        if (action === 'wine' ? !['red_wine', 'white_wine'].includes(item!) : food.category !== 'dish' || (food.food?.tags?.includes('drink') ?? false) !== (action === 'tea')) return false;
      }
    }
    const property = this.estate.current!;
    const partner = V.Finance.real_estate.room_companion;
    const key = `${partner ?? 'pc'}:${action}`;
    const first = this.state.days[key] !== Time.days;
    this.state.days[key] = Time.days;
    const supported = this.estate.staff.active(action === 'tidy' ? 'housekeeper' : 'cook') && ['meal', 'tea', 'tidy'].includes(action);
    this.state.scene = {
      property_id: property.id,
      action,
      partner,
      quality: Math.min(2, Number(this.estate.managementFor(property.id).condition >= 60) + Number(supported)),
      first,
      item,
      origin: V.passage,
      floor: this.estate.currentFloor
    };
    if (action === 'wine') this.state.scene.at = Time.date.timeStamp;
    return true;
  }

  public clear(id: string): void {
    if (this.state.bath?.property_id === id) this.state.bath = null;
    if (this.state.scene?.property_id === id) this.state.scene = null;
    if (this.state.daily?.property === id) this.state.daily = null;
  }
}
