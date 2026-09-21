// ./src/module/VanillaPlus.ts

import Module from './Module';
import AcademicHonours from './VanillaPlus/AcademicHonours';
import Beauty from './VanillaPlus/Beauty';
import Deviancy from './VanillaPlus/Deviancy';
import Exhibitionism from './VanillaPlus/Exhibitionism';
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
      highStreet: false
    },
    deviancy: {
      wildsong: false,
      conducting: false,
      conducted: false,
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
      thigh: false
    },
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
  public readonly physique = new Physique();
  public readonly promiscuity = new Promiscuity();
  public readonly willpower = new Willpower();
  private readonly attributes: VanillaPlusAttribute[] = ['willpower', 'physique', 'beauty', 'exhibitionism', 'deviancy', 'promiscuity'];

  public constructor(core: typeof maplebirch) {
    super(core, 'VanillaPlus', VanillaPlus.variables);
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
    if (V.VanillaPlus.traits.incorrigible) {
      switch (attribute) {
        case 'willpower':
          return Math.floor(V.willpowermax * 1.25);
        case 'physique':
          return Math.floor(V.physiquesize * 1.25);
        case 'beauty':
          return Math.floor(V.beautymax * 1.25);
        default:
          return 150;
      }
    }
    return attribute === 'beauty' && V.VanillaPlus.traits.beauty ? V.beautymax : 0;
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
