// ./src/module/VanillaPlus/Deviancy.ts

import type VanillaPlus from '../VanillaPlus';

type MirrorId = 'home' | 'farm' | 'tower' | 'temple';
type MirrorDiscovery = Record<MirrorId, boolean> & { property: Record<string, boolean> };

class Deviancy {
  public constructor(private readonly vanillaPlus: VanillaPlus) {}

  private get mirrors(): MirrorDiscovery {
    const mirrors = (V.VanillaPlus.deviancy.mirrors ??= { home: false, property: {}, farm: false, tower: false, temple: false });
    if (typeof mirrors.property !== 'object' || mirrors.property === null) mirrors.property = {};
    return mirrors;
  }

  public discover(mirror: MirrorId | 'property', propertyId?: string): void {
    if (mirror === 'property') {
      if (propertyId) this.mirrors.property[propertyId] = true;
    } else this.mirrors[mirror] = true;
  }

  public discovered(mirror: MirrorId | 'property', propertyId?: string): boolean {
    return V.VanillaPlus.traits.deviancy && (mirror === 'property' ? Boolean(propertyId && this.mirrors.property[propertyId]) : this.mirrors[mirror] === true);
  }

  public enter(): void {
    // 在点击入口时重排出口，而不是在入口 Passage 渲染时重排，以免读档后坐标移动。
    const locations: typeof V.VanillaPlus.deviancy.mirror_locations = {};
    V.VanillaPlus.deviancy.mirror_locations = locations;
    const randomLocation = () => ({ north: Math.floor(Math.random() * 9) - 4, east: Math.floor(Math.random() * 9) - 4 });
    for (const mirror of ['home', 'farm', 'tower', 'temple']) locations[mirror] = randomLocation();
    for (const property of this.vanillaPlus.realEstate.properties) locations[`property:${property.id}`] = randomLocation();
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
