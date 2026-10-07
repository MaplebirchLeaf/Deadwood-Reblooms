// ./src/module/VanillaPlus/Beauty.ts

import type VanillaPlus from '../VanillaPlus';

class Beauty {
  public constructor(private readonly vanillaPlus: VanillaPlus) {}

  public get seductionBonus(): number {
    return V.VanillaPlus?.traits.beauty ? 2000 : 0;
  }

  private get unadorned(): boolean {
    const makeup = V.makeup ?? {};
    return !makeup.lipstick && !makeup.eyeshadow && !makeup.mascara && !makeup.blusher && !makeup.browscolour && !makeup.concealer && !makeup.eyelenses?.left && !makeup.eyelenses?.right;
  }

  public get alluring(): boolean {
    return V.baseAllure >= 7000 && V.outside === 1 && !Time.isBloodMoon();
  }

  public get unlock(): boolean {
    return (
      !V.VanillaPlus.lock.beauty &&
      V.beauty >= this.vanillaPlus.normalCeiling('beauty') &&
      V.VanillaPlus.beauty.alluring &&
      V.fame.model >= 1000 &&
      this.unadorned &&
      !V.worn.face.type.includes('mask')
    );
  }

  public get max(): boolean {
    return V.VanillaPlus.lock.beauty && V.beauty >= this.vanillaPlus.ceiling('beauty');
  }

  public get floor(): number {
    if (V.VanillaPlus.traits.incorrigible) return this.vanillaPlus.divineTransformations.beautyCeiling(this.vanillaPlus.ceiling('beauty'));
    return V.VanillaPlus.traits.beauty ? this.vanillaPlus.divineTransformations.beautyCeiling(this.vanillaPlus.normalCeiling('beauty')) : 0;
  }

  public preInit(): void {
    this.vanillaPlus.core.dynamic.regStateEvent('gate', 'beauty-unlock', {
      output: 'deadwood-reblooms-beauty-unlock',
      cond: () => V.VanillaPlus != null && this.unlock
    });

    this.vanillaPlus.core.dynamic.regStateEvent('gate', 'beauty-alluring', {
      action: () => {
        V.VanillaPlus.beauty.alluring = true;
      },
      cond: () => V.VanillaPlus != null && this.alluring && !V.VanillaPlus.beauty.alluring
    });
  }
}

export default Beauty;
