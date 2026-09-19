// ./src/module/VanillaPlus/Physique.ts

class Physique {
  public get unlock(): boolean {
    const physique = V.VanillaPlus.physique;
    return !V.VanillaPlus.lock.physique && V.physique >= V.physiquesize && physique.panic && physique.heroic && physique.farm && physique.pound;
  }

  public get max(): boolean {
    return V.VanillaPlus.lock.physique && V.physique >= Math.floor(V.physiquesize * 1.25);
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
    return (window as any).breakableSoftBinding();
  }

  public developer(): void {
    V.VanillaPlus.lock.physique = false;
    Object.assign(V.VanillaPlus.physique, {
      panic: true,
      heroic: true,
      farm: true,
      pound: true
    });
    V.physique = V.physiquesize;
  }
}

export default Physique;
