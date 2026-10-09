// ./src/module/Finance/PropertyCatalog.ts

import propertiesSource from '@/assets/finance/properties.yaml';
import residentsSource from '@/assets/finance/residents.yaml';

type PropertyId = string;
type LocalizedText = { EN: string; CN: string };

// YAML 是房源的唯一静态来源。价格和租金均以便士计，rooms 的数字是楼层编号。
interface PropertyFloor {
  name: LocalizedText;
  description: LocalizedText;
}

export interface Property {
  id: PropertyId;
  street: string;
  street_name: LocalizedText;
  price: number;
  weekly_rent_percent: number;
  resident_capacity: number;
  bed_id: string;
  wardrobe_id: string;
  name: LocalizedText;
  entry_label: LocalizedText;
  mirror_label: LocalizedText;
  // 庭院、阳台的门从哪一处打开，不用楼层号推断动线。
  outdoor_access: 'sitting' | 'landing' | 'lounge';
  description: LocalizedText;
  floors: PropertyFloor[];
  rooms: Record<'bedroom' | 'bathroom' | 'kitchen' | 'outdoor', number> & Partial<Record<'desk' | 'guest' | 'balcony', number>>;
  extensions: {
    id: 'lounge' | 'study' | 'pool' | 'pool_heating' | 'garage';
    icon: string;
    floor: number;
    access: 'sitting' | 'landing' | 'bedroom' | 'outdoor' | 'lounge';
    inline?: boolean;
    cost: number;
    upkeep: number;
    name: LocalizedText;
    description: LocalizedText;
    requires?: 'pool';
    outdoor?: boolean;
    parking?: { bicycle: number; motorcycle: number; motor_vehicle: number };
  }[];
  interior: {
    bedroom_label: LocalizedText;
    bedroom: LocalizedText;
    bathroom: LocalizedText;
    kitchen_label: LocalizedText;
    kitchen: LocalizedText;
    outdoor_label: LocalizedText;
    outdoor: LocalizedText;
    outdoor_view: LocalizedText;
    balcony_label?: LocalizedText;
    balcony?: LocalizedText;
    balcony_view?: LocalizedText;
    guest?: LocalizedText;
    renovated: LocalizedText;
  };
}

export interface ResidentProfile {
  id: string;
  welcome: LocalizedText;
  evening: LocalizedText;
  together: LocalizedText;
}

/** 静态房源与住户目录的加载和校验。 */
export default class PropertyCatalog {
  public static loadProperties(core: typeof maplebirch): Property[] {
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
        !localized(property.street_name) ||
        typeof property.price !== 'number' ||
        !Number.isSafeInteger(property.price) ||
        property.price <= 0 ||
        typeof property.weekly_rent_percent !== 'number' ||
        !Number.isFinite(property.weekly_rent_percent) ||
        property.weekly_rent_percent <= 0 ||
        !Number.isSafeInteger(property.resident_capacity) ||
        property.resident_capacity! < 0 ||
        !property.bed_id ||
        !property.wardrobe_id ||
        !localized(property.name) ||
        !localized(property.entry_label) ||
        !localized(property.mirror_label) ||
        !['sitting', 'landing', 'lounge'].includes(property.outdoor_access!) ||
        !localized(property.description) ||
        !Array.isArray(property.floors) ||
        property.floors.length === 0 ||
        property.floors.some(floor => !localized(floor?.name) || !localized(floor?.description)) ||
        !property.rooms ||
        !Array.isArray(property.extensions) ||
        new Set(property.extensions.map(extension => extension.id)).size !== property.extensions.length ||
        property.extensions.some(
          extension =>
            !['lounge', 'study', 'pool', 'pool_heating', 'garage'].includes(extension.id) ||
            typeof extension.icon !== 'string' ||
            !/^(?:[a-z0-9-]+\/)*[a-z0-9-]+\.png$/.test(extension.icon) ||
            !Number.isInteger(extension.floor) ||
            extension.floor < 1 ||
            extension.floor > property.floors!.length ||
            !['sitting', 'landing', 'bedroom', 'outdoor', 'lounge'].includes(extension.access) ||
            (extension.access === 'sitting' && extension.floor !== 1) ||
            (extension.access === 'landing' && extension.floor === 1) ||
            (['bedroom', 'outdoor'].includes(extension.access) && extension.floor !== property.rooms![extension.access as 'bedroom' | 'outdoor']) ||
            (extension.access === 'lounge' &&
              (extension.id === 'lounge' || !property.extensions!.some(lounge => lounge.id === 'lounge' && lounge.floor === extension.floor && lounge.cost === 0 && !lounge.inline))) ||
            (extension.inline !== undefined && (typeof extension.inline !== 'boolean' || extension.id !== 'lounge' || extension.cost !== 0)) ||
            !Number.isSafeInteger(extension.cost) ||
            extension.cost < 0 ||
            !Number.isSafeInteger(extension.upkeep) ||
            extension.upkeep < 0 ||
            !localized(extension.name) ||
            !localized(extension.description) ||
            (extension.requires !== undefined && !property.extensions!.some(required => required.id === extension.requires)) ||
            (extension.id === 'garage' &&
              (!extension.parking || (['bicycle', 'motorcycle', 'motor_vehicle'] as const).some(vehicle => !Number.isSafeInteger(extension.parking![vehicle]) || extension.parking![vehicle] < 0)))
        ) ||
        (['bedroom', 'bathroom', 'kitchen', 'outdoor'] as const).some(
          room => !Number.isInteger(property.rooms?.[room]) || property.rooms![room] < 1 || property.rooms![room] > property.floors!.length
        ) ||
        (['desk', 'guest', 'balcony'] as const).some(
          room => property.rooms?.[room] !== undefined && (!Number.isInteger(property.rooms[room]) || property.rooms[room]! < 1 || property.rooms[room]! > property.floors!.length)
        ) ||
        (property.outdoor_access === 'sitting' && property.rooms.outdoor !== 1) ||
        (property.outdoor_access === 'landing' && property.rooms.outdoor === 1) ||
        (property.outdoor_access === 'lounge' &&
          !property.extensions.some(extension => extension.id === 'lounge' && extension.floor === property.rooms!.outdoor && extension.cost === 0 && !extension.inline)) ||
        !localized(property.interior?.bedroom_label) ||
        !localized(property.interior?.bedroom) ||
        !localized(property.interior?.bathroom) ||
        !localized(property.interior?.kitchen_label) ||
        !localized(property.interior?.kitchen) ||
        !localized(property.interior?.outdoor_label) ||
        !localized(property.interior?.outdoor) ||
        !localized(property.interior?.outdoor_view) ||
        (property.rooms?.balcony !== undefined && (!localized(property.interior?.balcony_label) || !localized(property.interior?.balcony) || !localized(property.interior?.balcony_view))) ||
        (property.rooms?.guest !== undefined && !localized(property.interior?.guest)) ||
        !localized(property.interior?.renovated) ||
        ids.has(property.id)
      ) {
        throw new Error(`Real estate property #${index + 1} is incomplete or duplicated.`);
      }
      ids.add(property.id);
      return property as Property;
    });
    if (properties.some(property => property.resident_capacity > (property.rooms.guest === undefined ? 1 : 2))) throw new Error('Resident capacity exceeds the configured bedrooms.');
    return properties;
  }

  public static loadResidents(core: typeof maplebirch): ResidentProfile[] {
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
}
