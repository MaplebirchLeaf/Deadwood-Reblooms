// ./src/module/MoreTransformations.ts

import Fish from './MoreTransformations/Fish';
import Horse from './MoreTransformations/Horse';
import Raven from './MoreTransformations/Raven';

interface Tentacle {
  type: string;
  shaft: string | number;
  tentaclehealth: number;
  fullDesc: string;
}

class MoreTransformations {
  public Fish: Fish;
  public Horse: Horse;
  public Raven: Raven;

  constructor(readonly core: typeof maplebirch) {
    this.Fish = new Fish();
    this.Horse = new Horse();
    this.Raven = new Raven();
  }

  public get foxfire(): boolean {
    return V.angel >= 6 && V.fox >= 6;
  }

  /** 只波及另一条存活触手，伤害跟随原版实际放逐结算，不再消耗次数。 */
  public flare(primary: Tentacle, damage: number) {
    if (!this.foxfire || V.combat !== 1 || !Number.isFinite(damage) || damage <= 0) return;
    const target = Object.values((V.tentacles ?? {}) as Record<string, Tentacle | number>).find(
      (target): target is Tentacle =>
        typeof target === 'object' &&
        target !== null &&
        target !== primary &&
        ['tentacle', 'vine', 'root', 'shoot', 'tendril'].includes(target.type) &&
        target.shaft !== 'finished' &&
        target.tentaclehealth > 0
    );
    if (!target) return;
    const splash = Math.floor(damage / 4);
    if (splash <= 0) return;
    target.tentaclehealth -= splash;
    return { target, damage: splash };
  }

  public preInit(): void {
    this.core.on(':variable', () => {
      V.MoreTransformations ??= { raven: { met: false, fed: -1, called: -1, preened: -1, action: '', disparaged: 0 } };
    });
    this.core.tool.onInit(() => {
      this.Fish.apply(this.core);
      this.Horse.apply(this.core);
      this.Raven.apply(this.core);
    });
  }
}

declare module '@scml-dol-maplebirch/types' {
  interface Extensions {
    readonly MoreTransformations: MoreTransformations;
  }
}

export default MoreTransformations;
