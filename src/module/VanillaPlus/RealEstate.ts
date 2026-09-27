import propertiesSource from '@/assets/finance/properties.yaml';
import residentsSource from '@/assets/finance/residents.yaml';
import type Finance from './Finance';
import Mortgage, { type MortgageState } from './Mortgage';

type PropertyId = string;
type LocalizedText = { EN: string; CN: string };
type PropertyRoom = 'bedroom' | 'bathroom' | 'kitchen' | 'desk' | 'guest' | 'retreat' | 'outdoor' | 'balcony';
type FurnitureKind = 'bed' | 'wardrobe';
type PropertyFurniture = { name: string; nameCap: string; cost: number; type: string[]; iconFile: string };

// YAML 是房源的唯一静态来源。价格和租金均以便士计；rooms 的数字是楼层编号。
interface PropertyFloor {
  name: LocalizedText;
  description: LocalizedText;
}

interface Property {
  id: PropertyId;
  street: string;
  streetName: LocalizedText;
  price: number;
  weeklyRentPercent: number;
  residentCapacity: number;
  bedId: string;
  bedUpgradeId?: string;
  wardrobeId: string;
  wardrobeUpgradeId?: string;
  name: LocalizedText;
  entryLabel: LocalizedText;
  mirrorLabel: LocalizedText;
  // 庭院、阳台的门从哪一处打开，不用楼层号推断动线。
  outdoorAccess: 'sitting' | 'landing' | 'retreat';
  description: LocalizedText;
  floors: PropertyFloor[];
  rooms: Record<'bedroom' | 'bathroom' | 'kitchen' | 'outdoor', number> & Partial<Record<'desk' | 'guest' | 'retreat' | 'balcony', number>>;
  interior: {
    bedroomLabel: LocalizedText;
    bedroom: LocalizedText;
    sittingRest?: LocalizedText;
    bathroom: LocalizedText;
    kitchenLabel: LocalizedText;
    kitchen: LocalizedText;
    outdoorLabel: LocalizedText;
    outdoor: LocalizedText;
    outdoorView: LocalizedText;
    balconyLabel?: LocalizedText;
    balcony?: LocalizedText;
    balconyView?: LocalizedText;
    guest?: LocalizedText;
    retreatLabel?: LocalizedText;
    retreat?: LocalizedText;
    retreatRest?: LocalizedText;
    renovated: LocalizedText;
  };
}

interface RealEstateState {
  // 每次从当前存档的 V 读取。房产表放在配置中，这里只保留产权与房屋的可变状态。
  owned: Partial<Record<PropertyId, boolean>>;
  visiting: PropertyId | null;
  floor: number;
  mortgage: MortgageState | null;
  management: Record<PropertyId, PropertyManagement>;
  last_managed_day: number;
  last_auction: AuctionRecord | null;
  residents: Record<PropertyId, string[]>;
  household_message: { name: string; result: 'joined' | 'full' | 'bed' | 'left' } | null;
  meeting_resident: string | null;
}

interface ResidentProfile {
  id: string;
  welcome: LocalizedText;
  evening: LocalizedText;
  together: LocalizedText;
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
  mirror_coordinates: { north: number; east: number };
}

interface AuctionRecord {
  property_id: PropertyId;
  kind: 'voluntary' | 'foreclosure';
  proceeds: number;
  debt: number;
  surplus: number;
  day: number;
}

class RealEstate {
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
    meeting_resident: null
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
    return (this.loadedProperties ??= RealEstate.loadProperties(this.core));
  }

  public get residentProfiles(): readonly ResidentProfile[] {
    return (this.loadedResidents ??= RealEstate.loadResidents(this.core));
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
    // 读档只恢复 V 中的房产和结算游标；经济结算只由游戏时间跨日触发。
    // 优先于 Finance 收取其他贷款和信用卡款项，使当天租金能先入账。
    this.core.dynamic.regTimeEvent('onDay', ':deadwood-reblooms-property-management', {
      action: () => this.advanceProperties(),
      exact: true,
      priority: 1
    });
  }

  private static loadProperties(core: typeof maplebirch): Property[] {
    const data = core.yaml.load(propertiesSource);
    if (!Array.isArray(data)) throw new Error('Real estate config must be an array.');
    const ids = new Set<string>();
    const localized = (value: LocalizedText | undefined): boolean => typeof value?.EN === 'string' && value.EN.length > 0 && typeof value.CN === 'string' && value.CN.length > 0;
    const properties = data.map((item, index) => {
      if (!item || typeof item !== 'object' || Array.isArray(item)) throw new Error(`Real estate property #${index + 1} is invalid.`);
      const property = item as Partial<Property>;
      if (
        !property.id ||
        !property.street ||
        !localized(property.streetName) ||
        typeof property.price !== 'number' ||
        !Number.isSafeInteger(property.price) ||
        property.price <= 0 ||
        typeof property.weeklyRentPercent !== 'number' ||
        !Number.isFinite(property.weeklyRentPercent) ||
        property.weeklyRentPercent <= 0 ||
        !Number.isSafeInteger(property.residentCapacity) ||
        property.residentCapacity! < 0 ||
        !property.bedId ||
        (property.bedUpgradeId !== undefined && property.bedUpgradeId === property.bedId) ||
        !property.wardrobeId ||
        (property.wardrobeUpgradeId !== undefined && property.wardrobeUpgradeId === property.wardrobeId) ||
        !localized(property.name) ||
        !localized(property.entryLabel) ||
        !localized(property.mirrorLabel) ||
        !['sitting', 'landing', 'retreat'].includes(property.outdoorAccess!) ||
        !localized(property.description) ||
        !Array.isArray(property.floors) ||
        property.floors.length === 0 ||
        property.floors.some(floor => !localized(floor?.name) || !localized(floor?.description)) ||
        !property.rooms ||
        (['bedroom', 'bathroom', 'kitchen', 'outdoor'] as const).some(
          room => !Number.isInteger(property.rooms?.[room]) || property.rooms![room] < 1 || property.rooms![room] > property.floors!.length
        ) ||
        (['desk', 'guest', 'retreat', 'balcony'] as const).some(
          room => property.rooms?.[room] !== undefined && (!Number.isInteger(property.rooms[room]) || property.rooms[room]! < 1 || property.rooms[room]! > property.floors!.length)
        ) ||
        (property.outdoorAccess === 'sitting' && property.rooms.outdoor !== 1) ||
        (property.outdoorAccess === 'landing' && property.rooms.outdoor === 1) ||
        (property.outdoorAccess === 'retreat' && property.rooms.retreat !== property.rooms.outdoor) ||
        !localized(property.interior?.bedroomLabel) ||
        !localized(property.interior?.bedroom) ||
        (property.rooms?.retreat === undefined && !localized(property.interior?.sittingRest)) ||
        !localized(property.interior?.bathroom) ||
        !localized(property.interior?.kitchenLabel) ||
        !localized(property.interior?.kitchen) ||
        !localized(property.interior?.outdoorLabel) ||
        !localized(property.interior?.outdoor) ||
        !localized(property.interior?.outdoorView) ||
        (property.rooms?.balcony !== undefined && (!localized(property.interior?.balconyLabel) || !localized(property.interior?.balcony) || !localized(property.interior?.balconyView))) ||
        (property.rooms?.guest !== undefined && !localized(property.interior?.guest)) ||
        (property.rooms?.retreat !== undefined && (!localized(property.interior?.retreatLabel) || !localized(property.interior?.retreat) || !localized(property.interior?.retreatRest))) ||
        !localized(property.interior?.renovated) ||
        ids.has(property.id)
      ) {
        throw new Error(`Real estate property #${index + 1} is incomplete or duplicated.`);
      }
      ids.add(property.id);
      return property as Property;
    });
    if (properties.some(property => property.residentCapacity > (property.rooms.guest === undefined ? 1 : 2))) throw new Error('Resident capacity exceeds the configured bedrooms.');
    return properties;
  }

  private static loadResidents(core: typeof maplebirch): ResidentProfile[] {
    const data = core.yaml.load(residentsSource);
    if (!Array.isArray(data)) throw new Error('Real estate residents config must be an array.');
    const ids = new Set<string>();
    const localized = (value: LocalizedText | undefined): boolean => typeof value?.EN === 'string' && value.EN.length > 0 && typeof value.CN === 'string' && value.CN.length > 0;
    return data.map((item, index) => {
      const profile = item as Partial<ResidentProfile> | null;
      if (!profile?.id || ids.has(profile.id) || !localized(profile.welcome) || !localized(profile.evening) || !localized(profile.together)) {
        throw new Error(`Real estate resident #${index + 1} is incomplete or duplicated.`);
      }
      ids.add(profile.id);
      return profile as ResidentProfile;
    });
  }

  private get state(): RealEstateState {
    // 每次从当前 V 取房产状态，切换存档后不会继续操作上一份存档的对象。
    return V.VanillaPlus.real_estate as RealEstateState;
  }

  public get current(): Property | undefined {
    // visiting 仅记录当前进入哪处房产，不决定其是否为住所。
    return this.properties.find(property => property.id === this.state.visiting);
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
  private reconcileResidents(): void {
    const residents = (this.state.residents ??= {});
    for (const [id, names] of Object.entries(residents)) {
      residents[id] = names.filter(name => this.owns(id) && !this.managementFor(id).rented && window.isLoveInterest(name) && this.residentProfiles.some(profile => profile.id === name));
    }
  }

  public residentsAt(id: PropertyId): ResidentProfile[] {
    this.reconcileResidents();
    return (this.state.residents[id] ?? []).flatMap(name => {
      const profile = this.residentProfiles.find(item => item.id === name);
      return profile ? [profile] : [];
    });
  }

  public residenceOf(name: string): Property | undefined {
    return this.properties.find(property => this.residentsAt(property.id).some(resident => resident.id === name));
  }

  public residentsHome(id: PropertyId): ResidentProfile[] {
    // Robin 与 Kylar 使用原版地点函数。Whitney 与 Sydney 没有同等的原版查询函数，
    // 因此按原版夜间时段与剧情状态判断；悉尼的排除日来自 sydneySchedule。
    return this.residentsAt(id).filter(profile => {
      switch (profile.id) {
        case 'Robin':
          return window.getRobinLocation() === 'sleep';
        case 'Whitney':
          return Time.hour < 7 && C.npc.Whitney?.init === 1 && ['active', 'rescued'].includes(C.npc.Whitney.state);
        case 'Kylar':
          return Time.hour < 7 && window.getKylarLocation().area === 'manor_bedroom';
        case 'Sydney':
          // 原版 sydneySchedule 在周一整天安排神殿值守，且剧情回放可以强制指定地点。
          return (
            C.npc.Sydney?.init === 1 &&
            (Time.hour >= 23 || Time.hour < 6) &&
            (V.daily.sydney.punish === 1 || (Time.weekDay !== 1 && (Time.weekDay !== 7 || Time.hour < 6))) &&
            !(V.sydney_location_override && V.replayScene && V.sydney_location_override !== 'home')
          );
        default:
          return false;
      }
    });
  }

  public inviteResident(name: string, id: PropertyId): boolean {
    this.reconcileResidents();
    const property = this.properties.find(item => item.id === id);
    if (!property || !this.owns(id) || this.managementFor(id).rented || this.isFrozen(id)) return false;
    const profile = this.residentProfiles.find(item => item.id === name);
    if (!profile || !window.isLoveInterest(name)) return false;
    const residents = (this.state.residents[id] ??= []);
    if (residents.includes(name)) return false;
    let result: 'joined' | 'full' | 'bed';
    if (residents.length >= property.residentCapacity) result = 'full';
    else if (!this.canShareBed(id)) result = 'bed';
    else {
      // 恋人只在一处住宅登记同住。玩家的其他空置房屋仍可随时自住。
      for (const [home, names] of Object.entries(this.state.residents)) {
        if (home !== id) this.state.residents[home] = names.filter(resident => resident !== name);
      }
      residents.push(name);
      result = 'joined';
    }
    this.state.household_message = { name, result };
    return result === 'joined';
  }

  public endCohabitation(name: string, id: PropertyId): boolean {
    if (!(this.state.residents?.[id] ?? []).includes(name)) return false;
    this.state.residents[id] = this.state.residents[id].filter(resident => resident !== name);
    this.state.household_message = { name, result: 'left' };
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
    if (this.state.last_managed_day < 0) this.state.last_managed_day = RealEstate.today();
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
    if (this.state.last_managed_day < 0) this.state.last_managed_day = RealEstate.today();
    return 'ok';
  }

  private static newManagement(): PropertyManagement {
    return {
      condition: 100,
      renovation: 0,
      rented: false,
      lease_end_day: null,
      auction_day: null,
      next_settlement_day: RealEstate.today() + 7,
      bed_id: null,
      wardrobe_id: null,
      mirror_coordinates: RealEstate.randomMirrorCoordinates()
    };
  }

  private static randomMirrorCoordinates(): PropertyManagement['mirror_coordinates'] {
    // 允许房产之间及房产与其他镜子重合。坐标只生成一次，之后随 V 存档。
    return { north: Math.floor(Math.random() * 9) - 4, east: Math.floor(Math.random() * 9) - 4 };
  }

  public managementFor(id: PropertyId): PropertyManagement {
    const management = (this.state.management[id] ??= RealEstate.newManagement());
    management.mirror_coordinates ??= RealEstate.randomMirrorCoordinates();
    return management;
  }

  public furniture(id: PropertyId, kind: FurnitureKind): PropertyFurniture | null {
    const property = this.properties.find(item => item.id === id);
    if (!property) return null;
    const installed = kind === 'bed' ? (this.managementFor(id).bed_id ?? property.bedId) : (this.managementFor(id).wardrobe_id ?? property.wardrobeId);
    return window.Furniture.get(installed, true);
  }

  public canShareBed(id: PropertyId): boolean {
    return this.furniture(id, 'bed')?.type.includes('double') === true;
  }

  public furnitureUpgrade(id: PropertyId, kind: FurnitureKind): { id: string; item: PropertyFurniture; cost: number } | null {
    const property = this.properties.find(item => item.id === id);
    if (!property) return null;
    const next = kind === 'bed' ? property.bedUpgradeId : property.wardrobeUpgradeId;
    const installed = kind === 'bed' ? this.managementFor(id).bed_id : this.managementFor(id).wardrobe_id;
    if (!next || installed === next) return null;
    const item = window.Furniture.get(next, true);
    return item ? { id: next, item, cost: window.Furniture.setPrice(item.cost) } : null;
  }

  public installFurniture(id: PropertyId, kind: FurnitureKind): void {
    if (!this.owns(id) || this.managementFor(id).rented || this.isFrozen(id)) return;
    const upgrade = this.furnitureUpgrade(id, kind);
    if (!upgrade) return;
    // 付款由家具店链接中的原版 money 宏完成。Furniture.set() 不认识新增的房产地点。
    if (kind === 'bed') this.managementFor(id).bed_id = upgrade.id;
    else this.managementFor(id).wardrobe_id = upgrade.id;
  }

  public visit(id: PropertyId): boolean {
    if (!this.properties.some(property => property.id === id) || !this.owns(id) || this.managementFor(id).rented) return false;
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
    return property ? Math.ceil((property.price * this.mortgage.terms.rental.weeklyMaintenancePercent) / 100) : 0;
  }

  public weeklyRent(id: PropertyId): number {
    const property = this.properties.find(item => item.id === id);
    if (!property) return 0;
    const management = this.managementFor(id);
    const { renovationRentBonusPercent } = this.mortgage.terms.rental;
    return Math.floor((this.baseWeeklyRent(id) * (1 + (management.renovation * renovationRentBonusPercent) / 100) * management.condition) / 100);
  }

  public baseWeeklyRent(id: PropertyId): number {
    const property = this.properties.find(item => item.id === id);
    return property ? Math.floor((property.price * property.weeklyRentPercent) / 100) : 0;
  }

  public renovationCost(id: PropertyId): number {
    const property = this.properties.find(item => item.id === id);
    return property ? Math.ceil(((property.price * this.mortgage.terms.rental.renovationCostPercent) / 100) * (this.managementFor(id).renovation + 1)) : 0;
  }

  public repairCost(id: PropertyId): number {
    const property = this.properties.find(item => item.id === id);
    if (!property) return 0;
    return Math.ceil(((property.price * this.mortgage.terms.rental.repairCostPerConditionPercent) / 100) * (100 - this.managementFor(id).condition));
  }

  public renovate(id: PropertyId): string {
    if (!this.owns(id)) return 'not-owned';
    const management = this.managementFor(id);
    if (management.rented || management.auction_day !== null || this.isFrozen(id)) return 'unavailable';
    if (management.renovation >= this.mortgage.terms.rental.maxRenovationLevel) return 'max-renovation';
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
    if (management.rented || management.auction_day !== null || management.condition < this.mortgage.terms.rental.minimumCondition) return false;
    management.rented = true;
    management.lease_end_day = null;
    return true;
  }

  public endLease(id: PropertyId): boolean {
    const management = this.managementFor(id);
    if (!this.owns(id) || !management.rented || management.lease_end_day !== null) return false;
    management.lease_end_day = RealEstate.today() + 7;
    return true;
  }

  public listAuction(id: PropertyId): boolean {
    if (!this.owns(id) || this.residentsAt(id).length > 0 || this.mortgage.current?.property_id === id) return false;
    const management = this.managementFor(id);
    if (management.rented || management.auction_day !== null) return false;
    management.auction_day = RealEstate.today() + this.mortgage.terms.voluntaryAuctionDays;
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

  private advanceProperties(): void {
    this.reconcileResidents();
    const state = this.state;
    const today = RealEstate.today();
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
          if (management.rented && management.condition >= this.mortgage.terms.rental.minimumCondition) {
            // 租客支付当周租金和维护费。冻结时净租金先抵房贷。
            const netRent = Math.max(0, this.weeklyRent(property.id) - upkeep);
            if (this.isFrozen(property.id)) this.mortgage.applySeizedRent(netRent);
            else this.finance.creditBankPennies(netRent);
            management.condition = Math.max(0, management.condition - this.mortgage.terms.rental.conditionLossPerWeek);
            if (management.condition < this.mortgage.terms.rental.minimumCondition) {
              management.rented = false;
              management.lease_end_day = null;
            }
          } else if (this.finance.collectBankPennies(upkeep) < upkeep) {
            management.condition = Math.max(0, management.condition - this.mortgage.terms.rental.conditionLossPerWeek);
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
    const percent = kind === 'foreclosure' ? this.mortgage.terms.foreclosureAuctionPercent : this.mortgage.terms.voluntaryAuctionPercent;
    const proceeds = Math.floor((assessedValue * percent) / 100);
    // 拍卖只把抵债后的余额存入银行；房贷状态由 Mortgage 在回调前结束。债务高于拍价时不产生负存款。
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
          item.residentCapacity >= displaced.length &&
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

  private static today(): number {
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
    // 拍卖曾锁住过这个衣柜；再次买下同一处房产时，保留衣物并恢复使用权。
    wardrobes[key].unlocked = true;
    wardrobes[key].name = name;
    const wardrobe = this.furniture(property.id, 'wardrobe');
    wardrobes[key].space = wardrobe?.type.includes('organiser') ? 40 : wardrobe?.type.includes('spacious') ? 30 : 20;
    V.wardrobe_location = key;
  }
}

export default RealEstate;
