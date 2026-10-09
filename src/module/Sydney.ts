// ./src/module/Sydney.ts

import Achievements from './Achievements';
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

  /** 门前叙事与窗户灯光共用原版日程和现有同住判定。 */
  public get estatePresence(): { sydney: boolean; sirris: boolean } {
    window.sydneySchedule?.();
    const housing = this.core.get('Finance')?.realEstate;
    const property = housing?.residenceOf('Sydney');
    return {
      sydney: T.sydney_location === 'home' && this.available && !V.replayScene && (!property || !housing!.residentsHome(property.id).some(resident => resident.id === 'Sydney')),
      sirris: Time.hour >= 21 || Time.hour < 7 || (Time.weekDay === 1 && !Time.schoolDay)
    };
  }

  public override preInit(): void {
    super.preInit();
    Achievements.add(this.core, 'Sydney');
    this.core.dynamic.regStateEvent('gate', 'deadwood-sydney-science-inspection', {
      extra: { passage: ['Science Lesson'] },
      action: () => {
        T.deadwood_science_event = V.schoolevent;
      }
    });
  }
}

declare module '@scml-dol-maplebirch/types' {
  interface Extensions {
    readonly Sydney: Sydney;
  }
}

export default Sydney;
