// ./src/module/Robin/Night.ts

import Shared from './Shared';

export default class RobinNight extends Shared {
  /** 今夜是否可以探访：恋人关系或创伤足够高，且罗宾已睡下。 */
  public get canVisit(): boolean {
    return (
      C.npc.Robin?.init === 1 &&
      (V.robinmissing === 0 || !V.robinmissing) &&
      V.robin.timer.hurt === 0 &&
      this.state.asylum.status !== 'admitted' &&
      this.state.night_day !== Time.days &&
      !this.vanillaPlus?.realEstate.residenceOf('Robin') &&
      Time.hour >= 21 &&
      Time.hour <= 22 &&
      C.npc.Robin.love >= 50 &&
      (V.robinromance === 1 || C.npc.Robin.trauma >= 50) &&
      C.npc.Robin.trauma < 80 &&
      window.getRobinLocation() === 'sleep'
    );
  }

  /** 开始今夜探访，记录当晚日期。 */
  public start(): boolean {
    if (!this.canVisit) return false;
    this.state.night_day = Time.days;
    return true;
  }

  /** 结算探访。允许跨过午夜：当晚或次日 0 点都算同一次。 */
  public finish(): boolean {
    const visitDay = this.state.night_day;
    if (visitDay < 0 || this.state.night_outcome_day === visitDay || (Time.days !== visitDay && (Time.days !== visitDay + 1 || Time.hour !== 0))) return false;
    this.state.night_outcome_day = visitDay;
    return true;
  }
}
