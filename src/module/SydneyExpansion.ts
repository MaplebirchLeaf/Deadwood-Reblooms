import Module from './Module';
import { DEFAULT_SYDNEY_EXPANSION_STATE } from './constants';

class SydneyExpansion extends Module {
  public constructor(core: typeof maplebirch) {
    super(core, 'SydneyExpansion', DEFAULT_SYDNEY_EXPANSION_STATE);
  }
}

export default SydneyExpansion;
