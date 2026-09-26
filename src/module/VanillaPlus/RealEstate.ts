import propertiesSource from '@/assets/finance/properties.yaml';
import rivalsSource from '@/assets/finance/auction-rivals.yaml';
import residentsSource from '@/assets/finance/residents.yaml';
import type Finance from './Finance';
import Mortgage, { type MortgageState } from './Mortgage';

type PropertyId = string;
type LocalizedText = { EN: string; CN: string };
type PropertyRoom = 'bedroom' | 'bathroom' | 'kitchen' | 'desk' | 'guest' | 'retreat';

interface PropertyFloor {
  name: LocalizedText;
  description: LocalizedText;
}

interface Property {
  id: PropertyId;
  street: string;
  agency?: boolean;
  streetName: LocalizedText;
  price: number;
  dailyRentPercent: number;
  residentCapacity: number;
  bedId: string;
  bedUpgradeId?: string;
  name: LocalizedText;
  entryLabel: LocalizedText;
  description: LocalizedText;
  floors: PropertyFloor[];
  rooms: Record<'bedroom' | 'bathroom' | 'kitchen', number> & Partial<Record<'desk' | 'guest' | 'retreat', number>>;
  interior: {
    bedroomLabel: LocalizedText;
    bedroom: LocalizedText;
    bathroom: LocalizedText;
    kitchenLabel: LocalizedText;
    kitchen: LocalizedText;
    guest?: LocalizedText;
    retreatLabel?: LocalizedText;
    retreat?: LocalizedText;
    retreatRest?: LocalizedText;
    renovated: LocalizedText;
  };
}

interface RealEstateState {
  owned: Partial<Record<PropertyId, boolean>>;
  active: PropertyId | null;
  visiting: PropertyId | null;
  floor: number;
  orphanageRentTime: number | null;
  mortgage: MortgageState | null;
  management: Record<PropertyId, PropertyManagement>;
  lastManagedDay: number;
  lastAuction: AuctionRecord | null;
  rivalHoldings: Record<PropertyId, string>;
  residents: Record<PropertyId, string[]>;
  householdMessage: { name: string; result: 'joined' | 'declined' | 'full' | 'bed' | 'left' } | null;
  meetingResident: string | null;
}

interface ResidentProfile {
  id: string;
  minimumLove?: number;
  welcome?: LocalizedText;
  decline: LocalizedText;
  evening?: LocalizedText;
  together?: LocalizedText;
}

interface AuctionRival {
  id: string;
  name: { EN: string; CN: string };
  requiresIntroduction: boolean;
  unavailableStates?: string[];
  preferredStreets: string[];
  minimumBidPercent: number;
  maximumBidPercent: number;
  preferredBonusPercent: number;
}

interface PropertyManagement {
  condition: number;
  renovation: number;
  rented: boolean;
  leaseEndDay: number | null;
  auctionDay: number | null;
  bedId: string | null;
}

interface AuctionRecord {
  propertyId: PropertyId;
  kind: 'voluntary' | 'foreclosure';
  proceeds: number;
  debt: number;
  surplus: number;
  day: number;
  winnerId: string;
}

class RealEstate {
  public static readonly defaults: RealEstateState = {
    owned: {},
    active: null,
    visiting: null,
    floor: 1,
    orphanageRentTime: null,
    mortgage: null,
    management: {},
    lastManagedDay: -1,
    lastAuction: null,
    rivalHoldings: {},
    residents: {},
    householdMessage: null,
    meetingResident: null
  };
  private loadedProperties?: Property[];
  private loadedRivals?: AuctionRival[];
  private loadedResidents?: ResidentProfile[];
  public readonly mortgage: Mortgage;

  public constructor(
    private readonly core: typeof maplebirch,
    private readonly finance: Finance
  ) {
    this.mortgage = new Mortgage(core, finance, (id, debt) => this.sellByAuction(id, 'foreclosure', debt));
  }

  public get properties(): readonly Property[] {
    return (this.loadedProperties ??= RealEstate.loadProperties(this.core));
  }

  public get rivals(): readonly AuctionRival[] {
    return (this.loadedRivals ??= RealEstate.loadRivals(this.core));
  }

  public get residentProfiles(): readonly ResidentProfile[] {
    return (this.loadedResidents ??= RealEstate.loadResidents(this.core));
  }

  public rivalName(id: string): { EN: string; CN: string } | undefined {
    return this.rivals.find(rival => rival.id === id)?.name;
  }

  public askingPrice(id: PropertyId): number {
    const property = this.properties.find(item => item.id === id);
    if (!property) return 0;
    return this.state.rivalHoldings[id] ? Math.ceil(property.price * (1 + this.mortgage.terms.rivalBuyoutPremiumPercent / 100)) : property.price;
  }

  public preInit(): void {
    this.core.tool.onInit(() => {
      void this.properties;
      void this.rivals;
      void this.residentProfiles;
    });
    // 初始化读档与正常跨日都调用同一个补算入口，lastManagedDay 保证一天只结算一次。
    this.core.on(':variable', () => this.advanceProperties(), 'Vanilla Plus Real Estate');
    this.core.dynamic.regTimeEvent('onDay', ':deadwood-reblooms-property-management', {
      action: () => this.advanceProperties(),
      exact: true
    });
    this.mortgage.preInit();
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
        typeof property.dailyRentPercent !== 'number' ||
        !Number.isFinite(property.dailyRentPercent) ||
        property.dailyRentPercent <= 0 ||
        !Number.isSafeInteger(property.residentCapacity) ||
        property.residentCapacity! < 0 ||
        !property.bedId ||
        (property.bedUpgradeId !== undefined && property.bedUpgradeId === property.bedId) ||
        !localized(property.name) ||
        !localized(property.entryLabel) ||
        !localized(property.description) ||
        !Array.isArray(property.floors) ||
        property.floors.length === 0 ||
        property.floors.some(floor => !localized(floor?.name) || !localized(floor?.description)) ||
        !property.rooms ||
        (['bedroom', 'bathroom', 'kitchen'] as const).some(room => !Number.isInteger(property.rooms?.[room]) || property.rooms![room] < 1 || property.rooms![room] > property.floors!.length) ||
        (['desk', 'guest', 'retreat'] as const).some(
          room => property.rooms?.[room] !== undefined && (!Number.isInteger(property.rooms[room]) || property.rooms[room]! < 1 || property.rooms[room]! > property.floors!.length)
        ) ||
        !localized(property.interior?.bedroomLabel) ||
        !localized(property.interior?.bedroom) ||
        !localized(property.interior?.bathroom) ||
        !localized(property.interior?.kitchenLabel) ||
        !localized(property.interior?.kitchen) ||
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
    if (properties.filter(property => property.agency === true).length !== 1) throw new Error('Real estate config requires one agency location.');
    if (properties.some(property => property.residentCapacity > (property.rooms.guest === undefined ? 1 : 2))) throw new Error('Resident capacity exceeds the configured bedrooms.');
    if (properties.some(property => !window.Furniture.get(property.bedId, true)?.type.some(type => type === 'single' || type === 'double'))) {
      throw new Error('Real estate bed is missing from the vanilla furniture catalogue.');
    }
    if (properties.some(property => property.bedUpgradeId && !window.Furniture.get(property.bedUpgradeId, true)?.type.includes('double'))) {
      throw new Error('Real estate bed upgrade must be a vanilla double bed.');
    }
    return properties;
  }

  private static loadResidents(core: typeof maplebirch): ResidentProfile[] {
    const data = core.yaml.load(residentsSource);
    if (!Array.isArray(data)) throw new Error('Real estate residents config must be an array.');
    const ids = new Set<string>();
    const localized = (value: LocalizedText | undefined): boolean => typeof value?.EN === 'string' && value.EN.length > 0 && typeof value.CN === 'string' && value.CN.length > 0;
    return data.map((item, index) => {
      const profile = item as Partial<ResidentProfile> | null;
      if (
        !profile?.id ||
        ids.has(profile.id) ||
        !localized(profile.decline) ||
        (profile.minimumLove !== undefined &&
          (!Number.isFinite(profile.minimumLove) || profile.minimumLove < 0 || !localized(profile.welcome) || !localized(profile.evening) || !localized(profile.together)))
      ) {
        throw new Error(`Real estate resident #${index + 1} is incomplete or duplicated.`);
      }
      ids.add(profile.id);
      return profile as ResidentProfile;
    });
  }

  private static loadRivals(core: typeof maplebirch): AuctionRival[] {
    const data = core.yaml.load(rivalsSource);
    if (!Array.isArray(data)) throw new Error('Auction rivals config must be an array.');
    const ids = new Set<string>();
    return data.map((item, index) => {
      const rival = item as Partial<AuctionRival> | null;
      if (
        !rival ||
        !rival.id ||
        ids.has(rival.id) ||
        !rival.name?.EN ||
        !rival.name.CN ||
        typeof rival.requiresIntroduction !== 'boolean' ||
        !Array.isArray(rival.preferredStreets) ||
        !Number.isFinite(rival.minimumBidPercent) ||
        !Number.isFinite(rival.maximumBidPercent) ||
        !Number.isFinite(rival.preferredBonusPercent) ||
        rival.minimumBidPercent! <= 0 ||
        rival.maximumBidPercent! < rival.minimumBidPercent! ||
        rival.preferredBonusPercent! < 0
      ) {
        throw new Error(`Auction rival #${index + 1} is incomplete or duplicated.`);
      }
      ids.add(rival.id);
      return rival as AuctionRival;
    });
  }

  private get state(): RealEstateState {
    return V.VanillaPlus.realEstate;
  }

  public get current(): Property | undefined {
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

  private isCurrentLoveInterest(name: string): boolean {
    const selected = Array.isArray(V.loveInterestList) ? V.loveInterestList : Object.values(V.loveInterest ?? {});
    return selected.includes(name) && typeof window.isPossibleLoveInterest === 'function' && window.isPossibleLoveInterest(name);
  }

  // 恋人列表由原版/恋爱对象模块管理；住宅只保存入住关系，失去恋爱资格时清除旧住户。
  private reconcileResidents(): void {
    if (typeof window.isPossibleLoveInterest !== 'function') return;
    if (!Array.isArray(V.loveInterestList) && !V.loveInterest) return;
    const residents = (this.state.residents ??= {});
    for (const [id, names] of Object.entries(residents)) {
      residents[id] = names.filter(name => this.owns(id) && this.isCurrentLoveInterest(name) && this.residentProfiles.some(profile => profile.id === name && profile.minimumLove !== undefined));
    }
  }

  public householdCandidates(): ResidentProfile[] {
    return this.residentProfiles.filter(profile => this.isCurrentLoveInterest(profile.id));
  }

  public residentsAt(id: PropertyId): ResidentProfile[] {
    this.reconcileResidents();
    return (this.state.residents[id] ?? []).flatMap(name => {
      const profile = this.residentProfiles.find(item => item.id === name);
      return profile ? [profile] : [];
    });
  }

  public residentsHome(id: PropertyId): ResidentProfile[] {
    // 白天保留原版 NPC 日程；同住场景仅在玩家的当前住所和夜间出现。
    return this.state.active === id && (Time.hour >= 20 || Time.hour < 7) ? this.residentsAt(id) : [];
  }

  public inviteResident(name: string, id: PropertyId): boolean {
    this.reconcileResidents();
    const property = this.properties.find(item => item.id === id);
    if (!property || this.state.active !== id || !this.owns(id) || this.managementFor(id).rented) return false;
    const profile = this.residentProfiles.find(item => item.id === name);
    if (!profile || !this.isCurrentLoveInterest(name)) return false;
    const residents = (this.state.residents[id] ??= []);
    if (residents.includes(name)) return false;
    const love = Number((C.npc as Record<string, { love?: number } | undefined>)[name]?.love ?? 0);
    let result: 'joined' | 'declined' | 'full' | 'bed';
    if (profile.minimumLove === undefined || love < profile.minimumLove) result = 'declined';
    else if (residents.length >= property.residentCapacity) result = 'full';
    else if (!this.canShareBed(id)) result = 'bed';
    else {
      residents.push(name);
      result = 'joined';
    }
    this.state.householdMessage = { name, result };
    return result === 'joined';
  }

  public endCohabitation(name: string, id: PropertyId): boolean {
    if (this.state.active !== id || !(this.state.residents?.[id] ?? []).includes(name)) return false;
    this.state.residents[id] = this.state.residents[id].filter(resident => resident !== name);
    this.state.householdMessage = { name, result: 'left' };
    return true;
  }

  public takeHouseholdMessage(): RealEstateState['householdMessage'] {
    const message = this.state.householdMessage;
    this.state.householdMessage = null;
    return message;
  }

  public meetResident(name: string, id: PropertyId): boolean {
    if (!this.residentsHome(id).some(profile => profile.id === name)) return false;
    this.state.meetingResident = name;
    return true;
  }

  public get currentCompanion(): ResidentProfile | undefined {
    const name = this.state.meetingResident;
    return name && this.current && this.residentsAt(this.current.id).some(profile => profile.id === name) ? this.residentProfiles.find(profile => profile.id === name) : undefined;
  }

  public buy(id: PropertyId): string {
    const property = this.properties.find(item => item.id === id);
    if (!property) return 'invalid';
    if (this.owns(id)) return 'owned';
    const result = this.finance.payFromBankPennies(this.askingPrice(id));
    if (result !== 'ok') return result;
    this.state.owned[id] = true;
    delete this.state.rivalHoldings[id];
    this.state.management[id] = RealEstate.newManagement();
    return 'ok';
  }

  public buyWithMortgage(id: PropertyId, useCredit = false): string {
    const property = this.properties.find(item => item.id === id);
    if (!property) return 'invalid';
    if (this.owns(id)) return 'owned';
    const result = this.mortgage.start(id, this.askingPrice(id), useCredit);
    if (result !== 'ok') return result;
    this.state.owned[id] = true;
    delete this.state.rivalHoldings[id];
    this.state.management[id] = RealEstate.newManagement();
    return 'ok';
  }

  private static newManagement(): PropertyManagement {
    return { condition: 100, renovation: 0, rented: false, leaseEndDay: null, auctionDay: null, bedId: null };
  }

  public managementFor(id: PropertyId): PropertyManagement {
    return (this.state.management[id] ??= RealEstate.newManagement());
  }

  public bed(id: PropertyId): { name: string; nameCap: string; cost: number; type: string[]; iconFile: string } | null {
    const property = this.properties.find(item => item.id === id);
    return property ? window.Furniture.get(this.managementFor(id).bedId ?? property.bedId, true) : null;
  }

  public canShareBed(id: PropertyId): boolean {
    return this.bed(id)?.type.includes('double') === true;
  }

  public bedUpgradeCost(id: PropertyId): number {
    const property = this.properties.find(item => item.id === id);
    if (!property?.bedUpgradeId || this.managementFor(id).bedId === property.bedUpgradeId) return 0;
    const furniture = window.Furniture.get(property.bedUpgradeId, true);
    return furniture ? window.Furniture.setPrice(furniture.cost) : 0;
  }

  public upgradeBed(id: PropertyId): string {
    if (!this.owns(id) || this.managementFor(id).rented || this.isFrozen(id)) return 'unavailable';
    const property = this.properties.find(item => item.id === id);
    const cost = this.bedUpgradeCost(id);
    if (!property?.bedUpgradeId || cost <= 0) return 'unavailable';
    const result = this.finance.payFromBankPennies(cost);
    if (result !== 'ok') return result;
    // 原版 Furniture.set() 只识别预置地点；新房的床放在自己的房产存档里。
    this.managementFor(id).bedId = property.bedUpgradeId;
    return 'ok';
  }

  public visit(id: PropertyId): boolean {
    if (!this.properties.some(property => property.id === id) || !this.owns(id) || this.managementFor(id).rented) return false;
    this.state.visiting = id;
    this.state.floor = 1;
    return true;
  }

  public canMoveIn(id: PropertyId): boolean {
    const property = this.properties.find(item => item.id === id);
    const companions = this.state.active ? this.residentsAt(this.state.active).length : 0;
    return (
      !!property &&
      this.owns(id) &&
      !this.managementFor(id).rented &&
      !this.isFrozen(id) &&
      this.managementFor(id).auctionDay === null &&
      companions <= property.residentCapacity &&
      (companions === 0 || this.canShareBed(id))
    );
  }

  public moveIn(id: PropertyId): boolean {
    if (!this.canMoveIn(id)) return false;
    const former = this.state.active;
    const companions = former ? this.residentsAt(former).map(profile => profile.id) : [];
    if (!this.visit(id)) return false;
    if (this.state.active === null) {
      this.state.orphanageRentTime = Number(V.renttime);
      V.renttime = 7;
    }
    // 搬家转移的是同住关系，不改变恋爱关系或 NPC 的原版白天行程。
    if (former && former !== id) {
      this.state.residents[former] = [];
      this.state.residents[id] = companions;
    }
    this.state.active = id;
    return true;
  }

  public moveBack(): void {
    if (this.state.active === null) return;
    (this.state.residents ??= {})[this.state.active] = [];
    const remaining = this.state.orphanageRentTime;
    if (remaining !== null && Number.isFinite(remaining)) V.renttime = remaining;
    this.state.active = null;
    this.state.orphanageRentTime = null;
  }

  public enter(): void {
    V.outside = 0;
    V.location = 'deadwood_home';
    V.bus = 'deadwood_home';
  }

  public maintenanceCost(id: PropertyId): number {
    const property = this.properties.find(item => item.id === id);
    return property ? Math.ceil((property.price * this.mortgage.terms.rental.dailyMaintenancePercent) / 100) : 0;
  }

  public dailyRent(id: PropertyId): number {
    const property = this.properties.find(item => item.id === id);
    if (!property) return 0;
    const management = this.managementFor(id);
    const { renovationRentBonusPercent } = this.mortgage.terms.rental;
    return Math.floor((this.baseDailyRent(id) * (1 + (management.renovation * renovationRentBonusPercent) / 100) * management.condition) / 100);
  }

  public baseDailyRent(id: PropertyId): number {
    const property = this.properties.find(item => item.id === id);
    return property ? Math.floor((property.price * property.dailyRentPercent) / 100) : 0;
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
    if (management.rented || management.auctionDay !== null || this.isFrozen(id)) return 'unavailable';
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
    if (management.auctionDay !== null || this.isFrozen(id)) return 'unavailable';
    const cost = this.repairCost(id);
    if (cost <= 0) return 'nothing-due';
    const result = this.finance.payFromBankPennies(cost);
    if (result !== 'ok') return result;
    management.condition = 100;
    return 'ok';
  }

  public rentOut(id: PropertyId): boolean {
    if (!this.owns(id) || this.state.active === id || this.isFrozen(id)) return false;
    const management = this.managementFor(id);
    if (management.rented || management.auctionDay !== null || management.condition < this.mortgage.terms.rental.minimumCondition) return false;
    management.rented = true;
    management.leaseEndDay = null;
    return true;
  }

  public endLease(id: PropertyId): boolean {
    const management = this.managementFor(id);
    if (!this.owns(id) || !management.rented || management.leaseEndDay !== null) return false;
    management.leaseEndDay = RealEstate.today() + 7;
    return true;
  }

  public listAuction(id: PropertyId): boolean {
    if (!this.owns(id) || this.state.active === id || this.mortgage.current?.propertyId === id) return false;
    const management = this.managementFor(id);
    if (management.rented || management.auctionDay !== null) return false;
    management.auctionDay = RealEstate.today() + this.mortgage.terms.voluntaryAuctionDays;
    return true;
  }

  public cancelAuction(id: PropertyId): boolean {
    if (!this.owns(id)) return false;
    const management = this.managementFor(id);
    if (management.auctionDay === null) return false;
    management.auctionDay = null;
    return true;
  }

  public isFrozen(id: PropertyId): boolean {
    const loan = this.mortgage.current;
    return loan?.propertyId === id && loan.stage === 'frozen';
  }

  private advanceProperties(): void {
    this.reconcileResidents();
    const state = this.state;
    const today = RealEstate.today();
    if (state.lastManagedDay < 0) {
      state.lastManagedDay = today;
      return;
    }
    // 游戏可一次跳过多天；逐日处理房屋和房贷，避免把未来的租金提前用于旧分期。
    for (let day = state.lastManagedDay + 1; day <= today; day++) {
      for (const property of this.properties) {
        if (!this.owns(property.id)) continue;
        const management = this.managementFor(property.id);
        if (management.auctionDay !== null && day >= management.auctionDay) {
          this.sellByAuction(property.id, 'voluntary', 0);
          continue;
        }
        if (management.leaseEndDay !== null && day >= management.leaseEndDay) {
          management.rented = false;
          management.leaseEndDay = null;
        }
        const upkeep = this.maintenanceCost(property.id);
        if (management.rented && management.condition >= this.mortgage.terms.rental.minimumCondition) {
          const netRent = Math.max(0, this.dailyRent(property.id) - upkeep);
          if (this.isFrozen(property.id)) this.mortgage.applySeizedRent(netRent);
          else this.finance.creditBankPennies(netRent);
          management.condition = Math.max(0, management.condition - this.mortgage.terms.rental.conditionLossPerDay);
          if (management.condition < this.mortgage.terms.rental.minimumCondition) {
            management.rented = false;
            management.leaseEndDay = null;
          }
        } else if (this.finance.collectBankPennies(upkeep) < upkeep) {
          management.condition = Math.max(0, management.condition - this.mortgage.terms.rental.conditionLossPerDay);
        }
      }
      this.mortgage.advanceThrough(day);
    }
    state.lastManagedDay = today;
  }

  private sellByAuction(id: PropertyId, kind: 'voluntary' | 'foreclosure', debt: number): void {
    const property = this.properties.find(item => item.id === id);
    if (!property || !this.owns(id)) return;
    const management = this.managementFor(id);
    const conditionFactor = 0.8 + management.condition / 500;
    const renovationFactor = 1 + management.renovation * 0.1;
    const assessedValue = Math.floor(property.price * conditionFactor * renovationFactor);
    let proceeds = Math.floor((assessedValue * (kind === 'foreclosure' ? this.mortgage.terms.foreclosureAuctionPercent : this.mortgage.terms.rivalAuctionReservePercent)) / 100);
    let winnerId = 'market';
    for (const rival of this.rivals) {
      if (!this.rivalCanBid(rival)) continue;
      const percent =
        rival.minimumBidPercent + Math.random() * (rival.maximumBidPercent - rival.minimumBidPercent) + (rival.preferredStreets.includes(property.street) ? rival.preferredBonusPercent : 0);
      const bid = Math.floor((assessedValue * percent) / 100);
      if (bid > proceeds) {
        proceeds = bid;
        winnerId = rival.id;
      }
    }
    // 拍卖只把抵债后的余额存入银行；房贷状态由 Mortgage 在回调前结束。
    const surplus = Math.max(0, proceeds - debt);
    this.finance.creditBankPennies(surplus);
    this.state.lastAuction = { propertyId: id, kind, proceeds, debt, surplus, day: RealEstate.today(), winnerId };
    if (winnerId === 'market') delete this.state.rivalHoldings[id];
    else this.state.rivalHoldings[id] = winnerId;
    this.state.owned[id] = false;
    const displaced = this.state.residents?.[id] ?? [];
    if (this.state.residents) this.state.residents[id] = [];
    management.rented = false;
    management.leaseEndDay = null;
    management.auctionDay = null;
    const wardrobe = (V.wardrobes as Record<string, Record<string, unknown>> | undefined)?.[`deadwood_${id}`];
    if (wardrobe) wardrobe.unlocked = false;
    if (this.state.active === id) {
      const alternative = this.properties.find(item => this.owns(item.id) && !this.managementFor(item.id).rented && item.residentCapacity >= displaced.length);
      if (alternative) {
        this.state.active = alternative.id;
        this.state.residents[alternative.id] = displaced;
      } else this.moveBack();
    }
  }

  private rivalCanBid(rival: AuctionRival): boolean {
    const npc = (C.npc as Record<string, { init?: number; state?: string } | undefined>)[rival.id];
    if (rival.requiresIntroduction && npc?.init !== 1) return false;
    if (rival.unavailableStates?.includes(npc?.state ?? '')) return false;
    if (rival.id === 'Avery' && ['fallen', 'kicked'].includes(String(V.avery_fate ?? ''))) return false;
    return true;
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
      space: 50,
      name
    };
    wardrobes[key].name = name;
    V.wardrobe_location = key;
  }
}

export default RealEstate;
