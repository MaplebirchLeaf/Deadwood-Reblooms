import Module from './Module';
import { DEFAULT_SYDNEY_EXPANSION_STATE } from './constants';

class Sydney extends Module {
  public constructor(core: typeof maplebirch) {
    super(core, 'SydneyExpansion', DEFAULT_SYDNEY_EXPANSION_STATE);
  }

  /** 可正常互动，不代表当前在神殿，位置仍由原版日程判断。 */
  public get available(): boolean {
    return C.npc.Sydney.init === 1 && !['prison', 'dungeon'].includes(C.npc.Sydney.state) && V.daily.sydney?.punish !== 1;
  }

  public get canTease(): boolean {
    return V.sydneyromance === 1 && window.hasSexStat('promiscuity', 2) && !window.pcAreArmsBound('both');
  }
}

declare module '@scml-dol-maplebirch/types' {
  interface Extensions {
    readonly Sydney: Sydney;
  }
}

export default Sydney;
