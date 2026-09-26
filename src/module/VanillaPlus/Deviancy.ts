// ./src/module/VanillaPlus/Deviancy.ts

import type VanillaPlus from '../VanillaPlus';

type MirrorId = 'home' | 'property' | 'farm' | 'tower' | 'temple';

class Deviancy {
  public constructor(private readonly vanillaPlus: VanillaPlus) {}

  private get mirrors(): Record<MirrorId, boolean> {
    return (V.VanillaPlus.deviancy.mirrors ??= { home: false, property: false, farm: false, tower: false, temple: false });
  }

  public discover(mirror: MirrorId): void {
    this.mirrors[mirror] = true;
  }

  public discovered(mirror: MirrorId): boolean {
    return V.VanillaPlus.traits.deviancy && this.mirrors[mirror] === true;
  }

  public get mirrorOpen(): boolean {
    return V.VanillaPlus.traits.deviancy && Time.hour === 3 && V.settings.tentaclesEnabled && (V.hallucinations >= 2 || V.daily?.mirrorTentacles === 1);
  }

  public get canConduct(): boolean {
    return (
      !V.VanillaPlus.lock.deviancy &&
      !V.VanillaPlus.deviancy.conducted &&
      V.deviancy >= this.vanillaPlus.normalCeiling('deviancy') &&
      V.VanillaPlus.deviancy.wildsong &&
      V.gwylan.purged >= 20 &&
      V.dateCount.GwylanSex >= 3 &&
      V.dateCount.GwylanBeast >= 3
    );
  }

  public begin(): void {
    if (this.canConduct) V.VanillaPlus.deviancy.conducting = true;
  }

  public finish(ritual: { purge?: number; sealed?: boolean } | undefined): void {
    if (!V.VanillaPlus.deviancy.conducting) return;
    V.VanillaPlus.deviancy.conducting = false;
    if (ritual?.sealed && (ritual.purge ?? 0) >= 9) V.VanillaPlus.deviancy.conducted = true;
  }

  public get unlock(): boolean {
    return !V.VanillaPlus.lock.deviancy && V.deviancy >= this.vanillaPlus.normalCeiling('deviancy') && V.VanillaPlus.deviancy.wildsong && V.VanillaPlus.deviancy.conducted;
  }

  public get max(): boolean {
    return V.VanillaPlus.lock.deviancy && V.deviancy >= this.vanillaPlus.ceiling('deviancy');
  }
}

export default Deviancy;
