import Module from './Module';
import { DEFAULT_WHITNEY_EXPANSION_STATE } from './constants';

class WhitneyExpansion extends Module {
  public constructor(core: typeof maplebirch) {
    super(core, 'WhitneyExpansion', DEFAULT_WHITNEY_EXPANSION_STATE);
  }
}

export default WhitneyExpansion;
