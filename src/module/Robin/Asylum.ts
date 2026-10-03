import Shared from './Shared';

export default class RobinAsylum extends Shared {
  /** 罗宾状态恶化时的宽限探视：创伤已到 95、尚未入院、今天还没探望过。 */
  public comfort(): boolean {
    const asylum = this.state.asylum;
    if (!this.robinAvailable || asylum.status !== 'home' || asylum.severeDays < 1 || asylum.warningVisitDay === Time.days || C.npc.Robin.trauma < 95) return false;
    asylum.warningVisitDay = Time.days;
    return true;
  }

  /** 带罗宾一起逃离：需已入院、计划推进到位且已探视过。 */
  public escape(): void {
    const asylum = this.state.asylum;
    if (asylum.status === 'admitted') V.robinReunionScene = undefined;
    if (asylum.status !== 'admitted' || asylum.plan < 2 || !asylum.met) return;
    this.release();
  }

  public get tentacleOpen(): boolean {
    const asylum = this.state.asylum;
    if (asylum.status !== 'admitted') return false;
    if (asylum.tentacleDay === Time.days) return false;
    return V.VanillaPlus?.traits?.deviancy === true;
  }

  /** 进入平原开始寻找罗宾：当天锁上，并把遭遇计数清零。 */
  public tentacleStart(): void {
    const asylum = this.state.asylum;
    asylum.tentacleDay = Time.days;
    asylum.tentacleWave = 0;
    asylum.tentacleClose = 0;
  }

  /** 从触手平原逃进森林：结束收容，不走门禁卡与换班计划。 */
  public rescue(): void {
    if (this.state.asylum.status === 'admitted') this.release();
  }

  /** 返回病区时结束本次平原行动，保留罗宾的收容状态与当日入口限制。 */
  public returnFromTentacles(): void {
    const asylum = this.state.asylum;
    if (asylum.status === 'admitted') V.robinReunionScene = undefined;
  }

  /** 收容结束：进入恢复期、清空计划，恢复原有债务并清除重复重逢标记。 */
  private release(): void {
    const asylum = this.state.asylum;
    asylum.status = 'recovering';
    asylum.plan = 0;
    asylum.severeDays = 0;
    V.robindebt = asylum.savedDebt;
    V.robinReunionScene = undefined;
  }
}
