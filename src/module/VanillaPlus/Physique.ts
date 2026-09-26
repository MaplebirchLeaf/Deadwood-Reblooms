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

  public reset(): void {
    V.VanillaPlus.physique.breakUsed = false;
  }

  public use(): void {
    V.VanillaPlus.physique.breakUsed = true;
  }

  public get outsideBreakAvailable(): boolean {
    if (V.combat === 1 || !V.VanillaPlus.traits.physique) return false;
    this.reset();
    return window.breakableSoftBinding();
  }
}

export default Physique;
