// ./src/module/MoreTransformations.ts

import Fish from './MoreTransformations/Fish';
import Horse from './MoreTransformations/Horse';

class MoreTransformations {
  public Fish: Fish;
  public Horse: Horse;

  constructor(readonly core: typeof maplebirch) {
    this.Fish = new Fish();
    this.Horse = new Horse();
    this.core.tool.onInit(() => {
      this.Fish.apply(this.core);
      this.Horse.apply(this.core);
    });
  }
}

export default MoreTransformations;
