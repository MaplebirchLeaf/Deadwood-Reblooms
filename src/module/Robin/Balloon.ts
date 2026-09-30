import Shared from './Shared';

/** 气球摊支线的走向。resolved 表示竞争营业日已达标，支线收束。 */
export type BalloonRoute = 'none' | 'cooperate' | 'compete' | 'resolved';

/** 竞争营业日需要赢下的场次。 */
const BALLOON_WINS_REQUIRED = 3;

export default class RobinBalloon extends Shared {
  /** 合作路线每周从气球摊获得的介绍费，单位英镑。 */
  public get income(): number {
    if (V.balloonStand?.robin?.status !== 'helped') return 0;
    return this.state.balloon === 'cooperate' ? 50 : this.state.balloon === 'resolved' ? 25 : 0;
  }

  /** 是否处在竞争路线且尚未赢满。 */
  public get inContest(): boolean {
    return this.state.balloon === 'compete' && this.state.balloonWins < BALLOON_WINS_REQUIRED && this.state.balloonDay !== Time.days;
  }

  /** 选择支线走向。两条路线都只选一次，选定后不可更改。 */
  public choose(route: BalloonRoute): boolean {
    if (
      !this.robinAvailable ||
      this.state.balloon !== 'none' ||
      this.state.lemonade < 1 ||
      V.balloonStand?.robin?.status !== 'helped' ||
      V.balloonStand.robin.talked !== true ||
      C.npc.Robin.dom < 60 ||
      Time.season === 'winter' ||
      window.getRobinLocation() !== 'beach' ||
      Weather.precipitation === 'rain'
    )
      return false;
    this.state.balloon = route;
    return true;
  }

  /** 竞争营业日赢一场。赢满三场后支线收束为 resolved。 */
  public compete(): boolean {
    if (
      !this.robinAvailable ||
      this.state.balloon !== 'compete' ||
      this.state.balloonWins >= BALLOON_WINS_REQUIRED ||
      this.state.balloonDay === Time.days ||
      V.balloonStand?.robin?.status !== 'helped' ||
      window.getRobinLocation() !== 'beach' ||
      Weather.precipitation === 'rain'
    )
      return false;
    this.state.balloonDay = Time.days;
    this.state.balloonWins++;
    if (this.state.balloonWins >= BALLOON_WINS_REQUIRED) this.state.balloon = 'resolved';
    return true;
  }
}
