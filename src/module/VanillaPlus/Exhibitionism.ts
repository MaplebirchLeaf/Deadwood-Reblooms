// ./src/module/VanillaPlus/Exhibitionism.ts

import type VanillaPlus from '../VanillaPlus';

class Exhibitionism {
  public constructor(private readonly vanillaPlus: VanillaPlus) {}

  public get canRoamTown(): boolean {
    if (!V.VanillaPlus || !this.vanillaPlus.hasTrait('exhibitionism') || V.exposedRaw < 1) return false;
    return V.exposedRaw >= 2 ? V.uncomfortable.nude === false : V.uncomfortable.underwear === false;
  }

  public get unlock(): boolean {
    const exhibitionism = V.VanillaPlus.exhibitionism;
    return !V.VanillaPlus.lock.exhibitionism && V.exhibitionism >= this.vanillaPlus.normalCeiling('exhibitionism') && exhibitionism.swimming && exhibitionism.ballroom && exhibitionism.highStreet;
  }

  public get max(): boolean {
    return V.VanillaPlus.lock.exhibitionism && V.exhibitionism >= this.vanillaPlus.ceiling('exhibitionism');
  }

  public preInit(): void {
    this.vanillaPlus.core.dynamic.regStateEvent('gate', 'exhibitionism-unlock', {
      output: 'deadwood-reblooms-exhibitionism-unlock',
      cond: () => V.VanillaPlus != null && this.unlock
    });
  }
}

export default Exhibitionism;
