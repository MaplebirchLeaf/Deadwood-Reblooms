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
    asylum.status = 'recovering';
    asylum.plan = 0;
    asylum.severeDays = 0;
    V.robindebt = asylum.savedDebt;
    V.robinReunionScene = undefined;
  }
}
