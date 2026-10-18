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

  /** 原版地点和事务先结算，节庆、留宿及接送共用一个入口。 */
  public schedule(): void {
    const state = V.SydneyExpansion;
    if (!state) return;
    const active = this.available;
    const halloweenNight = (Time.month === 10 && Time.monthDay === 31 && Time.hour >= 21) || (Time.month === 11 && Time.monthDay === 1 && Time.hour < 7);
    const festivalNight = active && halloweenNight && state.halloweenYear === Time.year && state.sirrisHalloweenVisitYear !== Time.year;
    const sirrisMorning = active && state.halloweenYear === Time.year && state.sirrisHalloweenVisitYear !== Time.year && Time.month === 11 && Time.monthDay === 1 && Time.hour >= 7 && Time.hour < 10;
    const christmasRest = state.christmasRestYear === Time.year && ((Time.month === 12 && Time.monthDay === 25 && Time.hour >= 21) || (Time.month === 12 && Time.monthDay === 26 && Time.hour < 6));
    const visit = state.estate.visitDay;
    const estateVisit = visit >= 0 && visit === Time.days && (Time.hour >= 21 || Time.hour < 6);

    if (active && !V.replayScene) {
      // 周日午夜的原版祈祷时段与宿舍留宿衔接。
      if (T.sydney_location === 'temple' && Time.weekDay === 1 && Time.hour === 0 && V.sydney_templeWork === 'pray') V.sydney_templeWork = 'sleep';
      if (festivalNight || sirrisMorning || christmasRest) {
        T.sydney_location = 'temple';
        T.sydney_location_message = 'temple';
        V.sydney_templeWork = (festivalNight && state.halloweenRestYear === Time.year) || christmasRest ? 'sleep' : 'pray';
      } else if (estateVisit && ['home', 'temple'].includes(T.sydney_location) && V.sydney_templeWork !== 'anguish') {
        T.sydney_location = 'home';
        T.sydney_location_message = 'home';
      } else {
        T.sydney_location = this.core.get('Finance')?.realEstate.outings.location('Sydney', T.sydney_location) ?? T.sydney_location;
      }
    }

    T.sydneyAvailable = active && T.sydney_location === 'temple';
    T.festivalNight = festivalNight;
    T.sirrisMorning = sirrisMorning;
    T.dormAccess = active && ['monk', 'priest'].includes(V.temple_rank) && ['monk', 'priest'].includes(V.sydney?.rank) && V.sydneyromance === 1;
    T.christmasRest = christmasRest;
    // quarters 是宿舍杂务，不能据此认定悉尼就在床铺旁。
    T.sydneyWorking = T.sydneyAvailable && V.sydney_templeWork === 'quarters';
    T.sydneyResting = T.sydneyAvailable && V.sydney_templeWork === 'sleep';
    T.shareSydneyBed = T.dormAccess && T.sydneyResting;
    T.minutesUntilSirris = Time.month === 10 ? 31 * 60 - (Time.hour * 60 + Time.minute) : Math.max(1, 7 * 60 - (Time.hour * 60 + Time.minute));
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
    this.core.npc.Pregnancy.add('Sydney', { canBePregnant: true });
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
