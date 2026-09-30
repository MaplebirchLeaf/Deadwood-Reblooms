import Shared from './Shared';

export default class RobinMarket extends Shared {
  /** 今天是否还能摆摊。 */
  public get canWork(): boolean {
    return this.state.marketDay !== Time.days && this.robinAvailable && C.npc.Robin.trauma < 80 && ['beach', 'park'].includes(window.getRobinLocation() || '');
  }

  /** 摆摊一次，按当季摊位等级结算销量。 */
  public work(): boolean {
    if (!this.canWork) return false;
    const state = this.state;
    state.marketDay = Time.days;
    const seasonalLevel = Time.season === 'winter' ? state.chocolate : state.lemonade;
    state.marketSales = 4 + seasonalLevel * 2 + (state.balloon === 'cooperate' ? 2 : 0);
    state.reserve += state.marketSales;
    V.money += state.marketSales * 100;
    return true;
  }
}
