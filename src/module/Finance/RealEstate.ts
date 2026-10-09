// ./src/module/Finance/RealEstate.ts

import paperhangings from './Paperhangings.json';
import PropertyCatalog, { type Property, type ResidentProfile } from './PropertyCatalog';
import type Finance from '../Finance';
import Mortgage, { type MortgageState } from './Mortgage';
import rentalTerms from '../../assets/finance/rentals.json';

type PropertyId = string;
type PropertyRoom = keyof Property['rooms'] | Property['extensions'][number]['id'];
type PaperKind = 'poster' | 'wallpaper';
type FurnitureKind = PaperKind | 'bed' | 'table' | 'chair' | 'desk' | 'wardrobe' | 'decoration' | 'windowsill';
type PropertyFurniture = { id: string; name: string; nameCap: string; cost: number; type: string[]; category: string[]; iconFile: string; description?: string; showCheck?: string; tier?: number };

export interface RealEstateState {
  // 每次从当前存档的 V 读取。房产表放在配置中，这里只保留产权与房屋的可变状态。
  owned: Partial<Record<PropertyId, boolean>>;
  visiting: PropertyId | null;
  floor: number;
  mortgage: MortgageState | null;
  mortgage_term: number;
  collateral_property: PropertyId | null;
  tenant_property: PropertyId | null;
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
  room_companion: string | null;
  pool_clothing: 'clothed' | 'nude' | 'swimwear';
  /** 单人亲密场景的地点，泳池入口据此把同一段遭遇战放进水里。 */
  intimacy_place: 'bedroom' | 'pool';
  /** 已答应一起亲近的两位恋人，连同他们同意的地点，交给亲密场景读取。 */
  pair_request: { names: string[]; place: 'bedroom' | 'pool' } | null;
}

interface PropertyManagement {
  upgrades: string[];
  rest_day: number;
  affection_days: Record<string, number>;
  condition: number;
  renovation: number;
  rented: boolean;
  lease_end_day: number | null;
  auction_day: number | null;
  next_settlement_day: number;
  vacancy_until: number;
  rental_issue: { type: 'leak' | 'arrears'; rent: number; day: number } | null;
  bed_id: string | null;
  wardrobe_id: string | null;
  furnishings?: Partial<Record<FurnitureKind, string>>;
  paperhangings?: Partial<Record<PaperKind, { design: string; custom: boolean }>>;
  managed?: boolean;
  management_report?: { day: number; fee: number; repairs: number; recovered: number; blocked: boolean };
}

interface AuctionRecord {
  property_id: PropertyId;
  kind: 'voluntary' | 'foreclosure';
  proceeds: number;
  debt: number;
  surplus: number;
  shortfall: number;
  day: number;
}

class RealEstate {
  public static readonly defaults: RealEstateState = {
    owned: {},
    visiting: null,
    floor: 1,
    mortgage: null,
    mortgage_term: 30,
    collateral_property: null,
    tenant_property: null,
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
    flight_street: 'High Street',
    room_companion: null,
    pool_clothing: 'clothed',
    intimacy_place: 'bedroom',
    pair_request: null
  };
  private loadedProperties?: Property[];
  private loadedResidents?: ResidentProfile[];
  public readonly mortgage: Mortgage;
  public readonly rentalTerms = rentalTerms;

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

  public preInit(): void {
    this.core.tool.onInit(() => {
      void this.properties;
      void this.residentProfiles;
    });
    this.core.dynamic.regTimeEvent('onDay', ':deadwood-reblooms-property-management', {
      action: () => this.settleDays(),
      exact: true,
      priority: 1
    });
  }

  private get state(): RealEstateState {
    return V.Finance.real_estate as RealEstateState;
  }

  public get current(): Property | undefined {
    const property = this.properties.find(item => item.id === this.state.visiting);
    return property && this.owns(property.id) && !this.state.management[property.id]?.rented && !this.isFrozen(property.id) ? property : undefined;
  }

  public get currentFloor(): number {
    return this.state.floor ?? 1;
  }

  public floorOf(room: PropertyRoom): number | undefined {
    return this.facilities.find(facility => facility.id === (room === 'desk' ? 'study' : room))?.floor ?? this.current?.rooms[room as keyof Property['rooms']];
  }

  public get facilities(): Property['extensions'] {
    const property = this.current;
    if (!property) return [];
    const upgrades = this.state.management[property.id]?.upgrades ?? [];
    return property.extensions.filter(extension => extension.cost === 0 || upgrades.includes(extension.id));
  }

  public get poolOpen(): boolean {
    const facilities = this.facilities;
    const pool = facilities.find(facility => facility.id === 'pool');
    return !!pool && (!pool.outdoor || (!['rain', 'snow'].includes(Weather.precipitation) && (Time.season !== 'winter' || facilities.some(facility => facility.id === 'pool_heating'))));
  }

  public upgrade(id: PropertyId, extensionId: string): string {
    const property = this.properties.find(item => item.id === id);
    if (!property || !this.owns(id)) return 'not-owned';
    const management = this.managementFor(id);
    const extension = property.extensions.find(item => item.id === extensionId);
    if (!extension || extension.cost === 0 || management.upgrades.includes(extensionId)) return 'unavailable';
    if (management.rented || management.auction_day !== null || this.isFrozen(id)) return 'unavailable';
    if (extension.requires && !property.extensions.some(item => item.id === extension.requires && (item.cost === 0 || management.upgrades.includes(item.id)))) return 'unavailable';
    if (!this.finance.canPay(extension.cost, 'furniture')) return 'insufficient-funds';
    this.core.SugarCube.Wikifier.wikifyEval(`<<money ${-extension.cost} 'furniture'>>`);
    management.upgrades.push(extensionId);
    return 'ok';
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
  private pruneResidents(): void {
    for (const id of Object.keys(this.state.residents)) this.state.residents[id] = this.residentsAt(id).map(profile => profile.id);
  }

  public residentsAt(id: PropertyId): ResidentProfile[] {
    if (!this.owns(id) || this.state.management[id]?.rented) return [];
    return (this.state.residents[id] ?? []).flatMap(name => {
      const profile = this.residentProfiles.find(item => item.id === name);
      return profile && window.isLoveInterest(name) ? [profile] : [];
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

  public get household(): Record<'home' | 'bedroom' | 'guest' | 'common', ResidentProfile[]> {
    const property = this.current;
    if (!property) return { home: [], bedroom: [], guest: [], common: [] };
    const home = this.residentsHome(property.id);
    const selected = home.find(profile => profile.id === this.state.meeting_resident);
    // 选中的同住者离开后保持主卧空置，不把客房里的另一人自动换进来。
    let bedroom: ResidentProfile[] = [];
    if (this.state.meeting_resident) bedroom = selected ? [selected] : [];
    else if (Time.hour !== 23 && this.residentsAt(property.id).length < 2) bedroom = home.slice(0, 1);
    const guest = property.rooms.guest && Time.hour !== 23 ? home.filter(profile => !bedroom.includes(profile)) : [];
    const common = home.filter(profile => !bedroom.includes(profile) && !guest.includes(profile));
    return { home, bedroom, guest, common };
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
    this.pruneResidents();
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

  /** 邀约开始前检查在家时段；卧室要求双人床，进行中的场景不随日程中止。 */
  public canIntimate(name: string, id = this.current?.id, place: 'bedroom' | 'pool' = 'bedroom'): boolean {
    return (
      !!id &&
      this.owns(id) &&
      !this.state.management[id]?.rented &&
      (place === 'pool' || this.canShareBed(id)) &&
      window.isLoveInterest(name) &&
      this.residentsHome(id).some(profile => profile.id === name) &&
      (name !== 'Robin' || C.npc.Robin.trauma < 50)
    );
  }

  public get currentCompanion(): ResidentProfile | undefined {
    const name = this.state.meeting_resident;
    const property = this.current;
    // 互动开始时已检查夜间日程。对话或遭遇战跨过日程边界后，仍要认得本次选中的同住者。
    return name && property ? this.residentsAt(property.id).find(profile => profile.id === name) : undefined;
  }

  /** 两位同住恋人是否愿意三人局：都在家、不互相拒绝，且属于有相应分支的组合。 */
  public pairEligible(names: readonly string[], place: 'bedroom' | 'pool' = 'bedroom'): boolean {
    const pair = [...names].sort();
    if (pair.length !== 2 || pair[0] === pair[1]) return false;
    if (this.householdRefusal(pair)) return false;
    if (!['Robin:Sydney'].some(entry => entry === pair.join(':'))) return false;
    return pair.every(name => this.canIntimate(name, this.current?.id, place));
  }

  /** 泳池或卧室能否作为本次亲密地点：泳池还要求已扩建且水可用。 */
  public placeOpen(place: 'bedroom' | 'pool'): boolean {
    return place === 'bedroom' || this.poolOpen;
  }

  /** 记录单人亲密场景的对象与地点；入口一律经此登记，读档或跨回合后仍能返回原处。 */
  public requestIntimacy(name: string, place: 'bedroom' | 'pool' = 'bedroom'): boolean {
    if (!this.placeOpen(place)) return false;
    if (!this.canIntimate(name, this.current?.id, place)) return false;
    if (!this.meetResident(name, this.current!.id)) return false;
    this.state.intimacy_place = place;
    // 单人邀约作废尚未使用的三人局邀请，避免离开牌桌后又进入三人场景。
    this.state.pair_request = null;
    return true;
  }

  public get intimacyPlace(): 'bedroom' | 'pool' {
    return this.state.intimacy_place ?? 'bedroom';
  }

  /** 记下已答应三人局的两位恋人及地点，交给亲密场景读取。 */
  public requestPair(names: readonly string[], place: 'bedroom' | 'pool'): boolean {
    if (!this.pairEligible(names, place) || !this.placeOpen(place)) return false;
    this.state.pair_request = { names: [...names].sort(), place };
    return true;
  }

  /** 战斗回合跨段落后仍要认得本次地点，因此整段场景只在结束时清空。 */
  public get pairRequest(): RealEstateState['pair_request'] {
    return this.state.pair_request;
  }

  public clearPairRequest(): void {
    this.state.pair_request = null;
  }

  public buy(id: PropertyId): string {
    const property = this.properties.find(item => item.id === id);
    if (!property) return 'invalid';
    if (this.owns(id)) return 'owned';
    const result = this.finance.payFromBankPennies(property.price);
    if (result !== 'ok') return result;
    this.state.owned[id] = true;
    this.state.management[id] = RealEstate.newManagement();
    if (this.state.last_managed_day < 0) this.state.last_managed_day = RealEstate.today;
    return 'ok';
  }

  public buyWithMortgage(id: PropertyId, useCredit = false, days = this.mortgage.terms.term_days): string {
    const property = this.properties.find(item => item.id === id);
    if (!property) return 'invalid';
    if (this.owns(id)) return 'owned';
    const result = this.mortgage.start(id, property.price, useCredit, days);
    if (result !== 'ok') return result;
    this.state.owned[id] = true;
    this.state.management[id] = RealEstate.newManagement();
    if (this.state.last_managed_day < 0) this.state.last_managed_day = RealEstate.today;
    return 'ok';
  }

  public appraisal(id: PropertyId): number {
    const property = this.properties.find(item => item.id === id);
    if (!property) return 0;
    const management = this.managementFor(id);
    return Math.floor(property.price * (0.8 + management.condition / 500) * (1 + management.renovation * 0.1));
  }

  public collateralLimit(id: PropertyId): number {
    if (!this.owns(id) || this.mortgage.current || this.managementFor(id).auction_day !== null || this.isFrozen(id)) return 0;
    return Math.floor((this.appraisal(id) * this.mortgage.terms.collateral_percent) / 100);
  }

  public borrowAgainst(id: PropertyId, pounds: number, days = this.mortgage.terms.term_days): string {
    const maximum = this.collateralLimit(id);
    if (!maximum) return 'mortgage-ineligible';
    return this.mortgage.borrowAgainst(id, Math.round(pounds * 100), maximum, days);
  }

  private static newManagement(): PropertyManagement {
    return {
      upgrades: [],
      rest_day: -1,
      affection_days: {},
      condition: 100,
      renovation: 0,
      rented: false,
      vacancy_until: 0,
      rental_issue: null,
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
    const desk = property.rooms.desk || property.extensions.some(extension => extension.id === 'study' && (extension.cost === 0 || state.upgrades.includes(extension.id)));
    const installed =
      state.furnishings?.[kind] ?? (kind === 'bed' ? (state.bed_id ?? property.bed_id) : kind === 'wardrobe' ? (state.wardrobe_id ?? property.wardrobe_id) : kind === 'desk' && desk ? 'desk' : null);
    if (!installed) return null;
    const item = window.Furniture.get(installed, true);
    return item ? { ...item, id: installed, category: [] } : null;
  }

  public furnished(id: PropertyId): boolean {
    const property = this.properties.find(item => item.id === id);
    if (!property || !this.owns(id)) return false;
    const kinds: FurnitureKind[] = ['bed', 'wardrobe', 'table', 'chair', 'decoration'];
    if (this.furniture(id, 'desk')) kinds.push('desk');
    return kinds.every(kind => this.furniture(id, kind) !== null);
  }

  public canShareBed(id: PropertyId): boolean {
    return this.furniture(id, 'bed')?.type.includes('double') === true;
  }

  public furnitureOffers(id: PropertyId, kind: FurnitureKind): { id: string; item: PropertyFurniture; cost: number }[] {
    const property = this.properties.find(item => item.id === id);
    if (!property || (kind === 'desk' && !this.furniture(id, 'desk'))) return [];
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

  public enter(room?: PropertyRoom): void {
    const floor = room && this.floorOf(room);
    if (floor) this.state.floor = floor;
    V.outside = 0;
    V.location = 'deadwood_home';
    V.bus = 'deadwood_home';
  }

  public maintenanceCost(id: PropertyId): number {
    const property = this.properties.find(item => item.id === id);
    if (!property) return 0;
    const upgrades = this.managementFor(id).upgrades;
    return (
      Math.ceil((property.price * this.mortgage.terms.rental.weekly_maintenance_percent) / 100) +
      property.extensions.reduce((sum, extension) => sum + (extension.cost === 0 || upgrades.includes(extension.id) ? extension.upkeep : 0), 0)
    );
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
    management.vacancy_until = RealEstate.today + rentalTerms.vacancyDays;
    management.rental_issue = null;
    management.lease_end_day = null;
    return true;
  }

  public tenantKey(id: PropertyId): string {
    return `deadwood_property_tenant_${id}`;
  }

  public rentalRepairCost(id: PropertyId): number {
    const property = this.properties.find(item => item.id === id);
    return property ? Math.ceil(property.price * rentalTerms.repairPriceRate) : 0;
  }

  public resolveIssue(id: PropertyId, choice: 'repair' | 'wait' | 'negotiate', day = RealEstate.today): boolean {
    if (!this.owns(id)) return false;
    const management = this.managementFor(id);
    const issue = management.rental_issue;
    if (!management.rented || !issue) return false;
    if (issue.type === 'leak') {
      if (this.isFrozen(id)) return false;
      if (choice !== 'repair' || this.finance.payFromBankPennies(this.rentalRepairCost(id)) !== 'ok') return false;
      management.condition = Math.min(100, management.condition + rentalTerms.neglectedConditionLoss);
    } else {
      if (choice === 'wait' && day - issue.day < 7) return false;
      if (!['wait', 'negotiate'].includes(choice)) return false;
      const payment = Math.floor(issue.rent * (choice === 'negotiate' ? rentalTerms.arrearsNegotiationRate : 1));
      if (this.isFrozen(id)) this.mortgage.applySeizedRent(payment);
      else this.finance.creditBankPennies(payment);
    }
    management.rental_issue = null;
    return true;
  }

  public get manager() {
    const npc = V.per_npc?.deadwood_property_manager;
    return npc?.property_employed ? npc : null;
  }

  /** 一名管理员承接多处房源，签约前先结清旧日期，不补做未受雇期间的工作。 */
  public employManager(enabled: boolean): boolean {
    const npc = V.per_npc?.deadwood_property_manager;
    if (this.core.passage.title !== 'Deadwood Reblooms Property Manager' || !npc) return false;
    if (enabled && (!this.properties.some(property => this.owns(property.id)) || !V.Finance.bank.debit_card)) return false;
    this.settleDays();
    npc.property_employed = enabled;
    if (!enabled) for (const property of this.properties) this.managementFor(property.id).managed = false;
    return true;
  }

  public manage(id: PropertyId, enabled: boolean): boolean {
    if (!this.owns(id) || (enabled && (!this.manager || this.isFrozen(id) || this.managementFor(id).auction_day !== null))) return false;
    this.settleDays();
    this.managementFor(id).managed = enabled;
    return true;
  }

  /** 周结算后执行已委托的工作，全部使用当时的存款，不透支、不自动续租或装修。 */
  private manageWeek(id: PropertyId, day: number): void {
    const management = this.managementFor(id);
    if (!management.managed || management.management_report?.day === day || this.isFrozen(id) || management.auction_day !== null) return;
    const fee = Math.max(rentalTerms.managementMinimumPennies, Math.ceil(this.weeklyRent(id) * rentalTerms.managementFeeRate));
    const report = { day, fee: 0, repairs: 0, recovered: 0, blocked: false };
    management.management_report = report;
    if (!this.manager || this.finance.payFromBankPennies(fee) !== 'ok') {
      report.blocked = true;
      return;
    }
    report.fee = fee;
    const issue = management.rental_issue;
    if (issue?.type === 'leak') {
      const cost = this.rentalRepairCost(id);
      if (this.resolveIssue(id, 'repair', day)) report.repairs += cost;
      else report.blocked = true;
    } else if (issue?.type === 'arrears' && day - issue.day >= 7 && this.resolveIssue(id, 'wait', day)) report.recovered = issue.rent;
    if (management.condition <= rentalTerms.repairCondition) {
      const cost = this.repairCost(id);
      if (this.repair(id) === 'ok') report.repairs += cost;
      else report.blocked = true;
    }
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
    this.pruneResidents();
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
          if (management.rented && day < management.vacancy_until) {
            if (this.finance.collectBankPennies(upkeep) < upkeep) management.condition = Math.max(0, management.condition - this.mortgage.terms.rental.condition_loss_per_week);
          } else if (management.rented && management.condition >= this.mortgage.terms.rental.minimum_condition) {
            // 租客支付当周租金和维护费。冻结时净租金先抵房贷。
            let netRent = Math.max(0, this.weeklyRent(property.id) - upkeep);
            if (!management.rental_issue && random(1, 100) <= rentalTerms.issueChance) {
              management.rental_issue = { type: random(0, 1) ? 'leak' : 'arrears', rent: netRent, day };
            }
            if (management.rental_issue?.type === 'leak') {
              netRent = Math.floor(netRent * rentalTerms.leakRentMultiplier);
              management.condition = Math.max(0, management.condition - rentalTerms.neglectedConditionLoss);
            } else if (management.rental_issue?.type === 'arrears') {
              // 只暂扣发生问题的这一周租金，后续正常租金不会继续累积为同一笔欠租。
              if (management.rental_issue.day === day) netRent = 0;
            }
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
          this.manageWeek(property.id, day);
          management.next_settlement_day = day + 7;
        }
        if (management.lease_end_day !== null && day >= management.lease_end_day) {
          management.rented = false;
          management.lease_end_day = null;
          management.rental_issue = null;
          delete V.per_npc?.[this.tenantKey(property.id)];
        }
        if (management.auction_day !== null && day >= management.auction_day) this.sellByAuction(property.id, 'voluntary', 0, day);
      }
      // 各业务按同一历史日期入账，再支付当天到期的债务。
      this.core.get('Orchard')?.advance(day);
      this.core.get('Robin')?.shop.investment.advance(day);
      this.mortgage.advanceThrough(day);
      this.finance.advanceBankThrough(day);
    }
    state.last_managed_day = today;
  }

  private sellByAuction(id: PropertyId, kind: 'voluntary' | 'foreclosure', debt: number, day: number): void {
    const property = this.properties.find(item => item.id === id);
    if (!property || !this.owns(id)) return;
    const management = this.managementFor(id);
    const assessedValue = this.appraisal(id);
    const percent = kind === 'foreclosure' ? this.mortgage.terms.foreclosure_auction_percent : this.mortgage.terms.voluntary_auction_percent;
    const proceeds = Math.floor((assessedValue * percent) / 100);
    // 拍卖只返还抵债后的余额，不足部分单独追偿，不清空或透支银行账户。
    const surplus = Math.max(0, proceeds - debt);
    const shortfall = Math.max(0, debt - proceeds);
    this.finance.creditBankPennies(surplus);
    this.finance.addCollectionDebt(shortfall, 'mortgage', day);
    this.state.last_auction = { property_id: id, kind, proceeds, debt, surplus, shortfall, day };
    this.state.owned[id] = false;
    // 地块沿用原版 $plots。产权拍卖后清掉这处房屋的作物，避免重新购买时接手旧存档的苗圃。
    if (V.plots) delete V.plots[id];
    const displaced = this.state.residents?.[id] ?? [];
    if (this.state.residents) this.state.residents[id] = [];
    management.rented = false;
    management.managed = false;
    management.management_report = undefined;
    management.rental_issue = null;
    delete V.per_npc?.[this.tenantKey(id)];
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
