// ./src/module/Whitney.ts

import Module from './Module';
import { DEFAULT_WHITNEY_EXPANSION_STATE } from './constants';

class Whitney extends Module {
  public constructor(core: typeof maplebirch) {
    super(core, 'WhitneyExpansion', DEFAULT_WHITNEY_EXPANSION_STATE);
  }
}

export default Whitney;
