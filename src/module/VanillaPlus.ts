// ./src/module/VanillaPlus.ts

import Module from './Module';
import Beauty from './VanillaPlus/Beauty';
import Deviancy from './VanillaPlus/Deviancy';
import DivineTransformations from './VanillaPlus/DivineTransformations';
import Exhibitionism from './VanillaPlus/Exhibitionism';
import Finance, { DEFAULT_FINANCE_STATE } from './VanillaPlus/Finance';
import HandGrip from './VanillaPlus/HandGrip';
import NPCDoublePenetration, { type NPCDoublePenetrationData } from './VanillaPlus/NPCDoublePenetration';
import Physique from './VanillaPlus/Physique';
import Promiscuity from './VanillaPlus/Promiscuity';
import RealEstate from './VanillaPlus/RealEstate';
import Willpower from './VanillaPlus/Willpower';

type VanillaPlusAttribute = 'willpower' | 'physique' | 'beauty' | 'exhibitionism' | 'deviancy' | 'promiscuity';
type VanillaPlusTrait = VanillaPlusAttribute | 'incorrigible';

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
    divineTransformations: {
      beautyBonus: 0,
      expungeUsed: false
    },
    finance: DEFAULT_FINANCE_STATE,
    real_estate: RealEstate.defaults,
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
      levelFive: 0
    },
    deviancy: {
      wildsong: false,
      conducting: false,
      conducted: false,
      levelFive: 0,
      mirrorOrigin: '',
      mirror_property: null as string | null,
      mirror_locations: {} as Record<string, { north: number; east: number }>,
      mirrors: {
        home: false,
        property: {} as Record<string, boolean>,
        farm: false,
        tower: false,
        temple: false,
        sirris: false,
        kylar: false
      }
    },
    promiscuity: {
      levelFive: 0
    },
    handGrip: {
      left: null as number | null,
      right: null as number | null
    },
    npcDoublePenetration: null as NPCDoublePenetrationData | null,
    willpower: {
      wraith: false,
      schism: false,
      vigil: false,
      painShield: {
        remaining: 0,
        ready: true
      }
    }
  };

  public readonly exposed = true;
  public readonly beauty: Beauty;
  public readonly deviancy: Deviancy;
  public readonly divineTransformations = new DivineTransformations();
  public readonly exhibitionism: Exhibitionism;
  public readonly finance: Finance;
  public readonly realEstate: RealEstate;
  public readonly handGrip = new HandGrip();
  public readonly NPCDoublePenetration = new NPCDoublePenetration();
  public readonly physique: Physique;
  public readonly promiscuity: Promiscuity;
  public readonly willpower: Willpower;
  private readonly attributes: VanillaPlusAttribute[] = ['willpower', 'physique', 'beauty', 'exhibitionism', 'deviancy', 'promiscuity'];

  public constructor(core: typeof maplebirch) {
    super(core, 'VanillaPlus', VanillaPlus.variables);
    this.beauty = new Beauty(this);
    this.deviancy = new Deviancy(this);
    this.exhibitionism = new Exhibitionism(this);
    this.finance = new Finance(core);
    this.realEstate = new RealEstate(core, this.finance);
    this.physique = new Physique(this);
    this.promiscuity = new Promiscuity(this);
    this.willpower = new Willpower(this);
  }

  public override preInit(): void {
    super.preInit();
    this.finance.preInit();
    this.realEstate.preInit();
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

  public unlockTraits(): VanillaPlusTrait[] {
    const unlocked: VanillaPlusTrait[] = [];
    for (const attribute of this.attributes) {
      if (this[attribute].max && !V.VanillaPlus.traits[attribute]) {
        V.VanillaPlus.traits[attribute] = true;
        unlocked.push(attribute);
      }
    }
    if (this.allMax && !V.VanillaPlus.traits.incorrigible) {
      V.VanillaPlus.traits.incorrigible = true;
      unlocked.push('incorrigible');
      this.preserve();
    }
    return unlocked;
  }

  public minimum(attribute: VanillaPlusAttribute): number {
    if (attribute === 'beauty') return this.beauty.floor;
    if (V.VanillaPlus.traits.incorrigible) return this.ceiling(attribute);
    return 0;
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
