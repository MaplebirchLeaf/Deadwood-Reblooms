// ./src/module/VanillaPlus/RealEstate.ts

import paperhangings from './Paperhangings.json';
import PropertyCatalog, { type Property, type ResidentProfile } from './PropertyCatalog';
import type Finance from './Finance';
import Mortgage, { type MortgageState } from './Mortgage';

type PropertyId = string;
type PropertyRoom = 'bedroom' | 'bathroom' | 'kitchen' | 'desk' | 'guest' | 'retreat' | 'outdoor' | 'balcony';
type PaperKind = 'poster' | 'wallpaper';
type FurnitureKind = PaperKind | 'bed' | 'table' | 'chair' | 'desk' | 'wardrobe' | 'decoration' | 'windowsill';
type PropertyFurniture = { id: string; name: string; nameCap: string; cost: number; type: string[]; category: string[]; iconFile: string; description?: string; showCheck?: string; tier?: number };

export interface RealEstateState {
  // 每次从当前存档的 V 读取。房产表放在配置中，这里只保留产权与房屋的可变状态。
  owned: Partial<Record<PropertyId, boolean>>;
  visiting: PropertyId | null;
  floor: number;
  mortgage: MortgageState | null;
  management: Record<PropertyId, PropertyManagement>;
  last_managed_day: number;
  last_auction: AuctionRecord | null;
  residents: Record<PropertyId, string[]>;
  household_message: { name: string; result: 'joined' | 'full' | 'bed' | 'left' | 'conflict'; refused_by: string | null } | null;
  meeting_resident: string | null;
  daily_evening: string[];
  daily_night_wake: boolean;
  glide_scared_day: number;
  furniture_property: PropertyId | null;
  furniture_category: FurnitureKind;
  flight_street: string;
}

interface PropertyManagement {
  condition: number;
  renovation: number;
  rented: boolean;
  lease_end_day: number | null;
  auction_day: number | null;
  next_settlement_day: number;
  bed_id: string | null;
  wardrobe_id: string | null;
  furnishings?: Partial<Record<FurnitureKind, string>>;
  paperhangings?: Partial<Record<PaperKind, { design: string; custom: boolean }>>;
}

interface AuctionRecord {
  property_id: PropertyId;
  kind: 'voluntary' | 'foreclosure';
  proceeds: number;
  debt: number;
  surplus: number;
  day: number;
}

export class RealEstate {
  public static readonly defaults: RealEstateState = {
    owned: {},
    visiting: null,
    floor: 1,
    mortgage: null,
    management: {},
    last_managed_day: -1,
    last_auction: null,
    residents: {},
    household_message: null,
    meeting_resident: null,
    daily_evening: [],
    daily_night_wake: false,
    glide_scared_day: -1,
    furniture_property: null,
    furniture_category: 'bed',
    flight_street: 'High Street'
  };
  private loadedProperties?: Property[];
  private loadedResidents?: ResidentProfile[];
  public readonly mortgage: Mortgage;

  public constructor(
    private readonly core: typeof maplebirch,
    private readonly finance: Finance
  ) {
    this.mortgage = new Mortgage(finance, (id, debt, day) => this.sellByAuction(id, 'foreclosure', debt, day));
  }

  public get properties(): readonly Property[] {
    return (this.loadedProperties ??= PropertyCatalog.loadProperties(this.core));
  }

  public get residentProfiles(): readonly ResidentProfile[] {
    return (this.loadedResidents ??= PropertyCatalog.loadResidents(this.core));
  }

  public askingPrice(id: PropertyId): number {
    const property = this.properties.find(item => item.id === id);
    return property?.price ?? 0;
  }

  public preInit(): void {
    this.core.tool.onInit(() => {
      void this.properties;
      void this.residentProfiles;
    });
    // 读档只恢复 V 中的房产和结算游标，经济结算只由游戏时间跨日触发。
    // 优先于 Finance 收取其他贷款和信用卡款项，使当天租金能先入账。
    this.core.dynamic.regTimeEvent('onDay', ':deadwood-reblooms-property-management', {
      action: () => this.settleDays(),
      exact: true,
      priority: 1
    });
  }

  private get state(): RealEstateState {
    // 每次从当前 V 取房产状态，切换存档后不会继续操作上一份存档的对象。
    return V.VanillaPlus.real_estate as RealEstateState;
  }

  public get current(): Property | undefined {
    // visiting 仅记录当前进入哪处房产，不决定其是否为住所。
    const property = this.properties.find(item => item.id === this.state.visiting);
    return property && this.owns(property.id) && !this.managementFor(property.id).rented && !this.isFrozen(property.id) ? property : undefined;
  }

  public get currentFloor(): number {
    return this.state.floor ?? 1;
  }

  public floorOf(room: PropertyRoom): number | undefined {
    return this.current?.rooms[room];
  }

  public setFloor(floor: number): boolean {
    const property = this.current;
    if (!property || !this.owns(property.id) || !Number.isInteger(floor) || floor < 1 || floor > property.floors.length) return false;
    this.state.floor = floor;
    return true;
  }

  public owns(id: PropertyId): boolean {
    return this.state.owned[id] === true;
  }

  // 原版 isLoveInterest 读取当前存档的恋人槽位，模组已将扩展列表接入该函数。
  // 同住只关心是否为当前恋人，不用判断角色是否还能被选为恋人。
  private filterResidents(): void {
    const residents = (this.state.residents ??= {});
    for (const [id, names] of Object.entries(residents)) {
      residents[id] = names.filter(name => this.owns(id) && !this.managementFor(id).rented && window.isLoveInterest(name) && this.residentProfiles.some(profile => profile.id === name));
    }
  }

  public residentsAt(id: PropertyId): ResidentProfile[] {
    this.filterResidents();
    return (this.state.residents[id] ?? []).flatMap(name => {
      const profile = this.residentProfiles.find(item => item.id === name);
      return profile ? [profile] : [];
    });
  }

  public residenceOf(name: string): Property | undefined {
    return this.properties.find(property => !this.isFrozen(property.id) && this.residentsAt(property.id).some(resident => resident.id === name));
  }

  public residentsHome(id: PropertyId): ResidentProfile[] {
    // Robin 与 Kylar 使用原版地点函数。Whitney 与 Sydney 没有同等的原版查询函数，
    // 因此按原版夜间时段与剧情状态判断，悉尼的排除日来自 sydneySchedule。
    if (this.isFrozen(id)) return [];
    return this.residentsAt(id).filter(profile => {
      switch (profile.id) {
        case 'Robin':
          return window.getRobinLocation() === 'sleep';
        case 'Whitney':
          return Time.hour < 7 && C.npc.Whitney?.init === 1 && ['active', 'rescued'].includes(C.npc.Whitney.state);
        case 'Kylar':
          return Time.hour < 7 && window.getKylarLocation().area === 'manor_bedroom';
        case 'Sydney': {
          // 原版 sydneySchedule 的 home 不总是夜间：受罚和假日白天也会返回 home。
          // 同住只接管正常睡眠时段，节庆留宿与已约好的庄园探访优先。
          const expansion = this.core.get('Sydney') ? V.SydneyExpansion : undefined;
          const halloweenNight = (Time.month === 10 && Time.monthDay === 31 && Time.hour >= 21) || (Time.month === 11 && Time.monthDay === 1 && Time.hour < 7);
          const halloweenVisit =
            expansion?.halloweenYear === Time.year || (expansion?.robinHalloweenYear === Time.year && expansion?.whitneyHalloweenYear === Time.year && V.halloween_kylar_proposed === 1);
          const christmasNight = (Time.month === 12 && Time.monthDay === 25 && Time.hour >= 21) || (Time.month === 12 && Time.monthDay === 26 && Time.hour < 6);
          const estateVisit = (expansion?.estate.visitDay === Time.days && Time.hour >= 21) || (expansion?.estate.visitDay === Time.days - 1 && Time.hour < 6);
          return (
            C.npc.Sydney?.init === 1 &&
            !['prison', 'dungeon'].includes(C.npc.Sydney.state) &&
            V.daily.sydney.punish !== 1 &&
            (Time.hour >= 23 || Time.hour < 6) &&
            Time.weekDay !== 1 &&
            (Time.weekDay !== 7 || Time.hour < 6) &&
            !(halloweenNight && halloweenVisit) &&
            !(christmasNight && expansion?.christmasRestYear === Time.year) &&
            !estateVisit &&
            !V.replayScene
          );
        }
        default:
          return false;
      }
    });
  }

  public residentsInCommonRooms(id: PropertyId): ResidentProfile[] {
    const sleeping = [...this.residentsInBedroom(id), ...this.residentsInGuestRoom(id)];
    return this.residentsHome(id).filter(profile => !sleeping.some(resident => resident.id === profile.id));
  }

  public residentsInBedroom(id: PropertyId): ResidentProfile[] {
    const home = this.residentsHome(id);
    const selected = home.find(profile => profile.id === this.state.meeting_resident);
    // 选中的同住者离开后保持主卧空置，不把客房里的另一人自动换进来。
    if (this.state.meeting_resident) return selected ? [selected] : [];
    return Time.hour === 23 || this.residentsAt(id).length > 1 ? [] : home.slice(0, 1);
  }

  public residentsInGuestRoom(id: PropertyId): ResidentProfile[] {
    if (!this.properties.find(property => property.id === id)?.rooms.guest || Time.hour === 23) return [];
    const bedroom = this.residentsInBedroom(id);
    return this.residentsHome(id).filter(profile => !bedroom.some(resident => resident.id === profile.id));
  }

  // 拒绝来自受霸凌的一方，或不愿与别人分享伴侣的凯拉尔。
  public householdRefusal(names: readonly string[]): string | null {
    if (names.length < 2) return null;
    if (names.includes('Whitney')) {
      if (names.includes('Robin')) return 'Robin';
      if (names.includes('Kylar')) return 'Kylar';
    }
    return names.includes('Kylar') && C.npc.Kylar.rage >= 60 ? 'Kylar' : null;
  }

  public inviteResident(name: string, id: PropertyId): boolean {
    this.filterResidents();
    const property = this.properties.find(item => item.id === id);
    if (!property || !this.owns(id) || this.managementFor(id).rented || this.isFrozen(id)) return false;
    const profile = this.residentProfiles.find(item => item.id === name);
    if (!profile || !window.isLoveInterest(name)) return false;
    const residents = (this.state.residents[id] ??= []);
    if (residents.includes(name)) return false;
    const refusedBy = this.householdRefusal([...residents, name]);
    let result: 'joined' | 'full' | 'bed' | 'conflict';
    if (residents.length >= property.resident_capacity) result = 'full';
    else if (!this.canShareBed(id)) result = 'bed';
    else if (refusedBy) result = 'conflict';
    else {
      // 恋人只在一处住宅登记同住。玩家的其他空置房屋仍可随时自住。
      for (const [home, names] of Object.entries(this.state.residents)) {
        if (home !== id) this.state.residents[home] = names.filter(resident => resident !== name);
      }
      residents.push(name);
      result = 'joined';
    }
    this.state.household_message = { name, result, refused_by: result === 'conflict' ? refusedBy : null };
    return result === 'joined';
  }

  public endCohabitation(name: string, id: PropertyId): boolean {
    if (!(this.state.residents?.[id] ?? []).includes(name)) return false;
    this.state.residents[id] = this.state.residents[id].filter(resident => resident !== name);
    this.state.household_message = { name, result: 'left', refused_by: null };
    return true;
  }

  public takeHouseholdMessage(): RealEstateState['household_message'] {
    const message = this.state.household_message;
    this.state.household_message = null;
    return message;
  }

  public meetResident(name: string, id: PropertyId): boolean {
    if (!this.residentsHome(id).some(profile => profile.id === name)) return false;
    this.state.meeting_resident = name;
    return true;
  }

  /** 只在亲密互动开始前检查，进行中的遭遇战不因日程变化换人或中止。 */
  public canIntimate(name: string, id = this.current?.id): boolean {
    return (
      !!id &&
      this.owns(id) &&
      !this.managementFor(id).rented &&
      this.canShareBed(id) &&
      window.isLoveInterest(name) &&
      this.residentsHome(id).some(profile => profile.id === name) &&
      (name !== 'Robin' || C.npc.Robin.trauma < 50)
    );
  }

  public get currentCompanion(): ResidentProfile | undefined {
    const name = this.state.meeting_resident;
    // 互动开始时已检查夜间日程。对话或遭遇战跨过日程边界后，仍要认得本次选中的同住者。
    return name && this.current ? this.residentsAt(this.current.id).find(profile => profile.id === name) : undefined;
  }

  public buy(id: PropertyId): string {
    const property = this.properties.find(item => item.id === id);
    if (!property) return 'invalid';
    if (this.owns(id)) return 'owned';
    const result = this.finance.payFromBankPennies(this.askingPrice(id));
    if (result !== 'ok') return result;
    this.state.owned[id] = true;
    this.state.management[id] = RealEstate.newManagement();
    if (this.state.last_managed_day < 0) this.state.last_managed_day = RealEstate.today;
    return 'ok';
  }

  public buyWithMortgage(id: PropertyId, useCredit = false): string {
    const property = this.properties.find(item => item.id === id);
    if (!property) return 'invalid';
    if (this.owns(id)) return 'owned';
    const result = this.mortgage.start(id, this.askingPrice(id), useCredit);
    if (result !== 'ok') return result;
    this.state.owned[id] = true;
    this.state.management[id] = RealEstate.newManagement();
    if (this.state.last_managed_day < 0) this.state.last_managed_day = RealEstate.today;
    return 'ok';
  }

  private static newManagement(): PropertyManagement {
    return {
      condition: 100,
      renovation: 0,
      rented: false,
      lease_end_day: null,
      auction_day: null,
      next_settlement_day: RealEstate.today + 7,
      bed_id: null,
      wardrobe_id: null,
      furnishings: {}
    };
  }

  public managementFor(id: PropertyId): PropertyManagement {
    return (this.state.management[id] ??= RealEstate.newManagement());
  }

  public furniture(id: PropertyId, kind: FurnitureKind): PropertyFurniture | null {
    const property = this.properties.find(item => item.id === id);
    if (!property) return null;
    const state = this.managementFor(id);
    if (kind === 'poster' || kind === 'wallpaper') {
      const hanging = state.paperhangings?.[kind];
      const template = window.Furniture.get(kind, true);
      if (!hanging || !template) return null;
      const label = !hanging.custom ? (paperhangings[kind] as Record<string, { EN: string; CN: string }>)[hanging.design] : undefined;
      const name = label ? lanSwitch(label.EN, label.CN) : hanging.design;
      const iconFile =
        kind === 'poster'
          ? (this.core.get('MoreLoveInterestsAndNPCAvatars')?.icon(hanging.design, !hanging.custom) ?? (hanging.custom ? 'poster' : `poster-${hanging.design}`))
          : hanging.custom
            ? 'wallpaper-custom'
            : `wallpaper-${hanging.design.replaceAll(' ', '-')}`;
      return { ...template, id: hanging.custom ? 'custom' : hanging.design, name, nameCap: name, iconFile, description: undefined, category: [kind] };
    }
    const installed =
      state.furnishings?.[kind] ??
      (kind === 'bed' ? (state.bed_id ?? property.bed_id) : kind === 'wardrobe' ? (state.wardrobe_id ?? property.wardrobe_id) : kind === 'desk' && property.rooms.desk ? 'desk' : null);
    if (!installed) return null;
    const item = window.Furniture.get(installed, true);
    return item ? { ...item, id: installed, category: [] } : null;
  }

  public furnished(id: PropertyId): boolean {
    const property = this.properties.find(item => item.id === id);
    if (!property || !this.owns(id)) return false;
    const kinds: FurnitureKind[] = ['bed', 'wardrobe', 'table', 'chair', 'decoration'];
    if (property.rooms.desk) kinds.push('desk');
    return kinds.every(kind => this.furniture(id, kind) !== null);
  }

  public canShareBed(id: PropertyId): boolean {
    return this.furniture(id, 'bed')?.type.includes('double') === true;
  }

  public furnitureOffers(id: PropertyId, kind: FurnitureKind): { id: string; item: PropertyFurniture; cost: number }[] {
    const property = this.properties.find(item => item.id === id);
    if (!property || (kind === 'desk' && !property.rooms.desk)) return [];
    const current = this.furniture(id, kind);
    if (kind === 'poster' || kind === 'wallpaper') {
      const template = window.Furniture.get(kind, true);
      if (!template) return [];
      const cost = window.Furniture.setPrice(template.cost);
      const offers = Object.entries(paperhangings[kind])
        .filter(([design]) => design !== current?.id)
        .map(([design, label]) => ({
          id: design,
          cost,
          item: {
            ...template,
            id: design,
            category: [kind],
            name: lanSwitch(label.EN, label.CN),
            nameCap: lanSwitch(label.EN, label.CN),
            description: undefined,
            iconFile: `${kind}-${design.replaceAll(' ', '-')}`
          }
        }));
      if (Time.dayState !== 'night')
        offers.push({
          id: 'custom',
          cost: cost * 2,
          item: {
            ...template,
            id: 'custom',
            category: [kind],
            name: lanSwitch('Custom design', '定制图案'),
            nameCap: lanSwitch('Custom design', '定制图案'),
            description: undefined,
            iconFile: kind === 'wallpaper' ? 'wallpaper-custom' : 'poster'
          }
        });
      return offers;
    }
    // notBedroom 只限制原版孤儿院卧室，自购房仍可选购双人床。
    const stock = setup.furniture as Map<string, PropertyFurniture>;
    return Array.from(stock.entries())
      .filter(([key, item]) => item.category.includes(kind) && !item.type.includes('starter') && key !== current?.id && item.showCheck !== 'disabled')
      .filter(([, item]) => item.showCheck !== 'isWardrobeHigherTier' || (item.tier ?? 0) > (current?.tier ?? 0))
      .map(([key, item]) => ({ id: key, item, cost: window.Furniture.setPrice(item.cost) }));
  }

  public installFurniture(id: PropertyId, kind: FurnitureKind, itemId: string, design?: string): boolean {
    if (!this.owns(id) || this.managementFor(id).rented || this.isFrozen(id)) return false;
    const offer = this.furnitureOffers(id, kind).find(item => item.id === itemId);
    if (!offer || !this.finance.canPay(offer.cost, 'furniture')) return false;
    const management = this.managementFor(id);
    if (kind === 'poster' || kind === 'wallpaper') {
      const custom = itemId === 'custom';
      const name = custom
        ? this.core.host.sugarcube
            .require()
            .Util.escape(String(design ?? '').trim() || lanSwitch('a custom design', '定制图案'))
            .replaceAll('[', '&#91;')
            .replaceAll(']', '&#93;')
        : itemId;
      management.paperhangings ??= {};
      management.paperhangings[kind] = { design: name, custom };
      return true;
    }
    management.furnishings ??= {};
    management.furnishings[kind] = itemId;
    if (kind === 'bed') management.bed_id = itemId;
    if (kind === 'wardrobe') management.wardrobe_id = itemId;
    // 家具目录的默认目标只有原版住所，自购房的安装状态独立存档。
    return true;
  }

  public visit(id: PropertyId): boolean {
    if (!this.properties.some(property => property.id === id) || !this.owns(id) || this.managementFor(id).rented || this.isFrozen(id)) return false;
    if (this.state.visiting !== id) this.state.meeting_resident = null;
    this.state.visiting = id;
    this.state.floor = 1;
    return true;
  }

  public enter(): void {
    V.outside = 0;
    V.location = 'deadwood_home';
    V.bus = 'deadwood_home';
  }

  public maintenanceCost(id: PropertyId): number {
    const property = this.properties.find(item => item.id === id);
    return property ? Math.ceil((property.price * this.mortgage.terms.rental.weekly_maintenance_percent) / 100) : 0;
  }

  public weeklyRent(id: PropertyId): number {
    const property = this.properties.find(item => item.id === id);
    if (!property) return 0;
    const management = this.managementFor(id);
    const { renovation_rent_bonus_percent } = this.mortgage.terms.rental;
    return Math.floor((this.baseWeeklyRent(id) * (1 + (management.renovation * renovation_rent_bonus_percent) / 100) * management.condition) / 100);
  }

  public baseWeeklyRent(id: PropertyId): number {
    const property = this.properties.find(item => item.id === id);
    return property ? Math.floor((property.price * property.weekly_rent_percent) / 100) : 0;
  }

  public renovationCost(id: PropertyId): number {
    const property = this.properties.find(item => item.id === id);
    return property ? Math.ceil(((property.price * this.mortgage.terms.rental.renovation_cost_percent) / 100) * (this.managementFor(id).renovation + 1)) : 0;
  }

  public repairCost(id: PropertyId): number {
    const property = this.properties.find(item => item.id === id);
    if (!property) return 0;
    return Math.ceil(((property.price * this.mortgage.terms.rental.repair_cost_per_condition_percent) / 100) * (100 - this.managementFor(id).condition));
  }

  public renovate(id: PropertyId): string {
    if (!this.owns(id)) return 'not-owned';
    const management = this.managementFor(id);
    if (management.rented || management.auction_day !== null || this.isFrozen(id)) return 'unavailable';
    if (management.renovation >= this.mortgage.terms.rental.max_renovation_level) return 'max-renovation';
    const result = this.finance.payFromBankPennies(this.renovationCost(id));
    if (result !== 'ok') return result;
    management.renovation++;
    management.condition = 100;
    return 'ok';
  }

  public repair(id: PropertyId): string {
    if (!this.owns(id)) return 'not-owned';
    const management = this.managementFor(id);
    if (management.auction_day !== null || this.isFrozen(id)) return 'unavailable';
    const cost = this.repairCost(id);
    if (cost <= 0) return 'nothing-due';
    const result = this.finance.payFromBankPennies(cost);
    if (result !== 'ok') return result;
    management.condition = 100;
    return 'ok';
  }

  public rentOut(id: PropertyId): boolean {
    if (!this.owns(id) || this.isFrozen(id) || this.residentsAt(id).length > 0) return false;
    const management = this.managementFor(id);
    if (management.rented || management.auction_day !== null || management.condition < this.mortgage.terms.rental.minimum_condition) return false;
    management.rented = true;
    management.lease_end_day = null;
    return true;
  }

  public endLease(id: PropertyId): boolean {
    const management = this.managementFor(id);
    if (!this.owns(id) || !management.rented || management.lease_end_day !== null) return false;
    management.lease_end_day = RealEstate.today + 7;
    return true;
  }

  public listAuction(id: PropertyId): boolean {
    if (!this.owns(id) || this.residentsAt(id).length > 0 || this.mortgage.current?.property_id === id) return false;
    const management = this.managementFor(id);
    if (management.rented || management.auction_day !== null) return false;
    management.auction_day = RealEstate.today + this.mortgage.terms.voluntary_auction_days;
    return true;
  }

  public cancelAuction(id: PropertyId): boolean {
    if (!this.owns(id)) return false;
    const management = this.managementFor(id);
    if (management.auction_day === null) return false;
    management.auction_day = null;
    return true;
  }

  public isFrozen(id: PropertyId): boolean {
    const loan = this.mortgage.current;
    return loan?.property_id === id && loan.stage === 'frozen';
  }

  private settleDays(): void {
    this.filterResidents();
    const state = this.state;
    state.daily_evening = [];
    state.daily_night_wake = false;
    const today = RealEstate.today;
    if (state.last_managed_day < 0) {
      // 没有房产也要推进个人债务。具体到期日仍由各账户自己的 V 游标决定。
      state.last_managed_day = today - 1;
    }
    // 跨日循环只为检查通知、拍卖到期和周结算日期，不会每日扣维护费或收租。
    for (let day = state.last_managed_day + 1; day <= today; day++) {
      for (const property of this.properties) {
        if (!this.owns(property.id)) continue;
        const management = this.managementFor(property.id);
        if (day >= management.next_settlement_day) {
          const upkeep = this.maintenanceCost(property.id);
          if (management.rented && management.condition >= this.mortgage.terms.rental.minimum_condition) {
            // 租客支付当周租金和维护费。冻结时净租金先抵房贷。
            const netRent = Math.max(0, this.weeklyRent(property.id) - upkeep);
            if (this.isFrozen(property.id)) this.mortgage.applySeizedRent(netRent);
            else this.finance.creditBankPennies(netRent);
            management.condition = Math.max(0, management.condition - this.mortgage.terms.rental.condition_loss_per_week);
            if (management.condition < this.mortgage.terms.rental.minimum_condition) {
              management.rented = false;
              management.lease_end_day = null;
            }
          } else if (this.finance.collectBankPennies(upkeep) < upkeep) {
            management.condition = Math.max(0, management.condition - this.mortgage.terms.rental.condition_loss_per_week);
          }
          management.next_settlement_day = day + 7;
        }
        if (management.lease_end_day !== null && day >= management.lease_end_day) {
          management.rented = false;
          management.lease_end_day = null;
        }
        if (management.auction_day !== null && day >= management.auction_day) this.sellByAuction(property.id, 'voluntary', 0, day);
      }
      this.mortgage.advanceThrough(day);
      this.finance.advanceBankThrough(day);
    }
    state.last_managed_day = today;
  }

  private sellByAuction(id: PropertyId, kind: 'voluntary' | 'foreclosure', debt: number, day: number): void {
    const property = this.properties.find(item => item.id === id);
    if (!property || !this.owns(id)) return;
    const management = this.managementFor(id);
    const conditionFactor = 0.8 + management.condition / 500;
    const renovationFactor = 1 + management.renovation * 0.1;
    const assessedValue = Math.floor(property.price * conditionFactor * renovationFactor);
    const percent = kind === 'foreclosure' ? this.mortgage.terms.foreclosure_auction_percent : this.mortgage.terms.voluntary_auction_percent;
    const proceeds = Math.floor((assessedValue * percent) / 100);
    // 拍卖只把抵债后的余额存入银行，房贷状态由 Mortgage 在回调前结束。债务高于拍价时不产生负存款。
    const surplus = Math.max(0, proceeds - debt);
    this.finance.creditBankPennies(surplus);
    this.state.last_auction = { property_id: id, kind, proceeds, debt, surplus, day };
    this.state.owned[id] = false;
    // 地块沿用原版 $plots。产权拍卖后清掉这处房屋的作物，避免重新购买时接手旧存档的苗圃。
    if (V.plots) delete V.plots[id];
    const displaced = this.state.residents?.[id] ?? [];
    if (this.state.residents) this.state.residents[id] = [];
    management.rented = false;
    management.lease_end_day = null;
    management.auction_day = null;
    const wardrobe = (V.wardrobes as Record<string, Record<string, unknown>> | undefined)?.[`deadwood_${id}`];
    if (wardrobe) wardrobe.unlocked = false;
    let alternative: Property | undefined;
    if (displaced.length > 0) {
      // 被强制拍卖后，恋人只搬到另一处有足够床位的未出租房屋。
      alternative = this.properties.find(
        item =>
          this.owns(item.id) &&
          !this.managementFor(item.id).rented &&
          !this.isFrozen(item.id) &&
          this.managementFor(item.id).auction_day === null &&
          (this.state.residents?.[item.id] ?? []).length === 0 &&
          item.resident_capacity >= displaced.length &&
          this.canShareBed(item.id)
      );
      if (alternative) this.state.residents[alternative.id] = displaced;
    }
    if (this.state.visiting === id) {
      this.state.visiting = alternative?.id ?? null;
      this.state.floor = 1;
      this.state.meeting_resident = null;
    }
  }

  private static get today(): number {
    return Math.max(0, Math.floor(Number(Time.days) || 0));
  }

  public openWardrobe(): void {
    const property = this.current;
    if (!property || !this.owns(property.id) || !V.wardrobes) return;
    const key = `deadwood_${property.id}`;
    const name = lanSwitch(property.name.EN, property.name.CN);
    const wardrobes = V.wardrobes as Record<string, Record<string, unknown>>;
    wardrobes[key] ??= {
      face: [],
      feet: [],
      hands: [],
      handheld: [],
      head: [],
      legs: [],
      lower: [],
      neck: [],
      over_head: [],
      over_lower: [],
      over_upper: [],
      genitals: [],
      under_lower: [],
      under_upper: [],
      upper: [],
      unlocked: true,
      shopSend: true,
      transfer: true,
      isolated: true,
      locationRequirement: [],
      space: 20,
      name
    };
    // 拍卖曾锁住过这个衣柜，再次买下同一处房产时，保留衣物并恢复使用权。
    wardrobes[key].unlocked = true;
    wardrobes[key].name = name;
    const wardrobe = this.furniture(property.id, 'wardrobe');
    wardrobes[key].space = wardrobe?.type.includes('organiser') ? 40 : wardrobe?.type.includes('spacious') ? 30 : 20;
    V.wardrobe_location = key;
  }
}

export default RealEstate;
