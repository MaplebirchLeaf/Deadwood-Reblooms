// ./src/module/MoreTransformations.ts

import Fish from './MoreTransformations/Fish';
import Horse from './MoreTransformations/Horse';
import Raven from './MoreTransformations/Raven';

class MoreTransformations {
  public Fish: Fish;
  public Horse: Horse;
  public Raven: Raven;

  constructor(readonly core: typeof maplebirch) {
    this.Fish = new Fish();
    this.Horse = new Horse();
    this.Raven = new Raven();
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
