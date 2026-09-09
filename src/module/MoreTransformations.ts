// ./src/module/MoreTransformations.ts

import Horse from './MoreTransformations/Horse';

class MoreTransformations {
  public Horse: Horse;

  constructor(readonly core: typeof maplebirch) {
    this.Horse = new Horse();
    this.core.tool.onInit(() => {
      this.Horse.apply(this.core);
    });
  }
}

export default MoreTransformations;
