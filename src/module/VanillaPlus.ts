// ./src/module/VanillaPlus.ts

import Module from './Module';
import AcademicHonours from './VanillaPlus/AcademicHonours';
import Beauty from './VanillaPlus/Beauty';
import Deviancy from './VanillaPlus/Deviancy';
import Exhibitionism from './VanillaPlus/Exhibitionism';
import Finance, { DEFAULT_FINANCE_STATE } from './VanillaPlus/Finance';
import NPCDoublePenetration, { type NPCDoublePenetrationState } from './VanillaPlus/NPCDoublePenetration';
import Physique from './VanillaPlus/Physique';
import Promiscuity from './VanillaPlus/Promiscuity';
import Willpower from './VanillaPlus/Willpower';

export type VanillaPlusAttribute = 'willpower' | 'physique' | 'beauty' | 'exhibitionism' | 'deviancy' | 'promiscuity';
export type VanillaPlusTrait = VanillaPlusAttribute | 'incorrigible';

class VanillaPlus extends Module {
  static readonly variables = {
    lock: {
      physique: false,
      willpower: false,
      beauty: false,
      promiscuity: false,
      exhibitionism: false,
      deviancy: false
    },
    traits: {
      willpower: false,
      physique: false,
      beauty: false,
      exhibitionism: false,
      deviancy: false,
      promiscuity: false,
      incorrigible: false
    },
    beauty: {
      alluring: false
    },
    finance: DEFAULT_FINANCE_STATE,
    historyProject: {
      status: 'none' as 'none' | 'ongoing' | 'done' | 'won',
      source: 'none' as 'none' | 'paintingward' | 'paintingsnake',
      availableDay: 0,
      deadline: 0,
      assistant: false,
      kylar: 'none' as 'none' | 'help' | 'sabotage',
      kylarStreet: false,
      kylarPrepared: false,
      archive: 0,
      museum: 0,
      recovery: 'none' as 'none' | 'recorded' | 'rushed',
      ruin: 0,
      draft: 0,
      final: 0
    },
    physique: {
      panic: false,
      heroic: false,
      farm: false,
      pound: false,
      breakUsed: false
    },
    exhibitionism: {
      swimming: false,
      ballroom: false,
      highStreetRun: false,
      highStreet: false,
      levelFiveProgress: 0
    },
    deviancy: {
      wildsong: false,
      conducting: false,
      conducted: false,
      levelFiveProgress: 0,
      mirrorOrigin: '',
      mirrors: {
        home: false,
        farm: false,
        tower: false
      }
    },
    promiscuity: {
      hands: false,
      feet: false,
      mouth: false,
      penis: false,
      vagina: false,
      anus: false,
      chest: false,
      thigh: false,
      levelFiveProgress: 0
    },
    npcDoublePenetration: null as NPCDoublePenetrationState | null,
    willpower: {
      kylar: false,
      wraith: false,
      schism: false,
      vigil: false
    }
  };

  public readonly exposed = true;
  public readonly academicHonours = new AcademicHonours();
  public readonly beauty = new Beauty();
  public readonly deviancy = new Deviancy();
  public readonly exhibitionism = new Exhibitionism();
  public readonly finance: Finance;
  public readonly NPCDoublePenetration = new NPCDoublePenetration();
  public readonly physique = new Physique();
  public readonly promiscuity = new Promiscuity();
  public readonly willpower = new Willpower();
  private readonly attributes: VanillaPlusAttribute[] = ['willpower', 'physique', 'beauty', 'exhibitionism', 'deviancy', 'promiscuity'];

  public constructor(core: typeof maplebirch) {
    super(core, 'VanillaPlus', VanillaPlus.variables);
    this.finance = new Finance(core);
  }

  public override preInit(): void {
    super.preInit();
    this.finance.preInit();
  }

  public hasTrait(trait: VanillaPlusTrait): boolean {
    return V.VanillaPlus.traits.incorrigible || V.VanillaPlus.traits[trait];
  }

  public get allMax(): boolean {
    return this.attributes.every(attribute => this[attribute].max);
  }

  public get traitsPending(): boolean {
    return this.attributes.some(attribute => this[attribute].max && !V.VanillaPlus.traits[attribute]) || (this.allMax && !V.VanillaPlus.traits.incorrigible);
  }

  public normalCeiling(attribute: VanillaPlusAttribute): number {
    const traits = (V as typeof V & { AMCTraits?: Partial<Record<VanillaPlusAttribute, number>> }).AMCTraits;
    const factor = traits?.[attribute];
    const multiplier = typeof factor === 'number' && Number.isFinite(factor) && factor > 0 ? factor : 1;
    switch (attribute) {
      case 'willpower':
        return V.willpowermax * multiplier;
      case 'physique':
        return V.physiquesize * multiplier;
      case 'beauty':
        return V.beautymax * multiplier;
      default:
        return 100;
    }
  }

  public ceiling(attribute: VanillaPlusAttribute): number {
    const ratio = attribute === 'willpower' || attribute === 'physique' || attribute === 'beauty' ? 1.25 : 1.5;
    return Math.floor(this.normalCeiling(attribute) * ratio);
  }

  // 开发准备只补齐该属性的突破条件，便于测试正常触发流程。
  public prepare(attribute: VanillaPlusAttribute): void {
    this[attribute].developer();
  }

  // 作弊完成会解锁扩展上限并将属性推至上限，后续特质仍可单独控制。
  public complete(attribute: VanillaPlusAttribute): void {
    this.prepare(attribute);
    V.VanillaPlus.lock[attribute] = true;
    V[attribute] = this.ceiling(attribute);
  }

  public setTrait(attribute: VanillaPlusAttribute, enabled: boolean): void {
    V.VanillaPlus.traits[attribute] = enabled;
    if (!enabled) V.VanillaPlus.traits.incorrigible = false;
  }

  public prepareAll(): void {
    for (const attribute of this.attributes) this.prepare(attribute);
  }

  public completeAll(): void {
    for (const attribute of this.attributes) this.complete(attribute);
  }

  public setAllTraits(enabled: boolean): void {
    if (enabled) this.completeAll();
    for (const attribute of this.attributes) V.VanillaPlus.traits[attribute] = enabled;
    V.VanillaPlus.traits.incorrigible = enabled;
    if (enabled) this.preserve();
  }

  public unlockTraits(): void {
    for (const attribute of this.attributes) {
      if (this[attribute].max) V.VanillaPlus.traits[attribute] = true;
    }
    if (this.allMax) {
      V.VanillaPlus.traits.incorrigible = true;
      this.preserve();
    }
  }

  public minimum(attribute: VanillaPlusAttribute): number {
    if (V.VanillaPlus.traits.incorrigible) return this.ceiling(attribute);
    return attribute === 'beauty' && V.VanillaPlus.traits.beauty ? this.normalCeiling('beauty') : 0;
  }

  public get belowMinimum(): boolean {
    return V.VanillaPlus.traits.incorrigible && this.attributes.some(attribute => V[attribute] < this.minimum(attribute));
  }

  public preserve(): void {
    if (!V.VanillaPlus.traits.incorrigible) return;
    for (const attribute of this.attributes) V[attribute] = Math.max(V[attribute], this.minimum(attribute));
  }
}

declare module '@scml-dol-maplebirch/types' {
  interface Extensions {
    readonly VP: VanillaPlus;
  }
}

export default VanillaPlus;
