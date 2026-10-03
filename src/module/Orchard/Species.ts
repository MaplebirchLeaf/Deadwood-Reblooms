// ./src/module/Orchard/Species.ts

import data from '../../assets/orchard/trees.json';
import rules from '../../assets/orchard/rules.json';

export type OrchardSpecies = keyof typeof data;
export type OrchardFruit = OrchardSpecies | 'blood_lemon';

interface OrchardSpeciesData {
  name: string[];
  seedSource: 'pick' | 'garden' | 'shop';
  seedPrice?: number;
  yieldMultiplier: number;
  saplingDays: number;
  matureDays: number;
  fruitSeasons: string[];
  bloodMoonFruit?: OrchardFruit;
  images: Record<'seedling' | 'sapling' | 'mature', string>;
}

/** 树种配置集中管理，食品键沿用原版。界面、采收和贴图均读取这张表。 */
export const species = data as Record<OrchardSpecies, OrchardSpeciesData>;
export const harvestTiers = rules.harvestTiers;
export const soilMultipliers = rules.soilMultipliers;
export const offSeasonYieldMultiplier = rules.offSeasonYieldMultiplier;
export const orchardSites = rules.sites;
export const clearingStepMinutes = rules.clearingStepMinutes;
export const harvestDays = 3;
export const moistureDays = 3;
export const fertiliserDays = 3;
export const soilFertiliserDays = 7;
export const soilFertiliserHarvests = 2;
