// ./src/module/Whitney.ts

import Achievements from './Achievements';
import Module from './Module';
import { DEFAULT_WHITNEY_EXPANSION_STATE } from './constants';

class Whitney extends Module {
  public constructor(core: typeof maplebirch) {
    super(core, 'WhitneyExpansion', DEFAULT_WHITNEY_EXPANSION_STATE);
  }

  public override preInit(): void {
    super.preInit();
    Achievements.add(this.core, 'Whitney');
  }
}

export default Whitney;
