// ./src/module/VanillaPlus/Physique.ts

import type VanillaPlus from '../VanillaPlus';

class Physique {
  public constructor(private readonly vanillaPlus: VanillaPlus) {}

  public get unlock(): boolean {
    const physique = V.VanillaPlus.physique;
    return !V.VanillaPlus.lock.physique && V.physique >= this.vanillaPlus.normalCeiling('physique') && physique.panic && physique.heroic && physique.farm && physique.pound;
  }

  public get max(): boolean {
    return V.VanillaPlus.lock.physique && V.physique >= this.vanillaPlus.ceiling('physique');
  }

  public get canBreakBindings(): boolean {
    return V.VanillaPlus.traits.physique && !V.VanillaPlus.physique.breakUsed;
  }

  public outsideBreak(): boolean {
    if (V.combat === 1 || !V.VanillaPlus.traits.physique) return false;
    V.VanillaPlus.physique.breakUsed = false;
    return window.breakableSoftBinding();
  }

  public preInit(): void {
    this.vanillaPlus.core.dynamic.regStateEvent('gate', 'physique-unlock', {
      output: 'deadwood-reblooms-physique-unlock',
      cond: () => V.VanillaPlus != null && this.unlock
    });

    this.vanillaPlus.core.dynamic.regStateEvent('gate', 'physique-break-bindings', {
      output: 'deadwood-reblooms-physique-break-bindings',
      cond: () => V.VanillaPlus != null && this.outsideBreak()
    });
  }
}

export default Physique;
