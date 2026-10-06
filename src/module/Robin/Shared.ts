// ./src/module/Robin/Shared.ts

import type VanillaPlus from '../VanillaPlus';
import type { RobinExpansionState } from '../constants';

export interface RobinFacade {
  /** 罗宾是否可正常互动。 */
  readonly available: boolean;
  /** 罗宾现金与储备金，单位英镑。 */
  readonly funds: number;
  /** 当前存档的罗宾拓展状态。 */
  readonly state: RobinExpansionState;
  /** 周收入，单位英镑。 */
  readonly income: number;
  /** 房租子系统。canSpend 需要它来保护下周房租。 */
  readonly rent: { readonly due: number };
}

export default abstract class Shared {
  public constructor(
    protected readonly core: typeof maplebirch,
    protected readonly facade: RobinFacade
  ) {}

  /** 当前存档的罗宾拓展状态。每次都从 V 取，切换存档后不会操作上一份存档的对象。 */
  public get state(): RobinExpansionState {
    return this.facade.state;
  }

  /** 罗宾自己持有的现金加上本模组的储备金，单位英镑。 */
  public get funds(): number {
    return this.facade.funds;
  }

  /** VanillaPlus 未载入时为空，房产与银行的调用都要先过这一层。 */
  protected get vanillaPlus(): VanillaPlus | undefined {
    return this.core.get('VanillaPlus') as VanillaPlus | undefined;
  }

  protected get robinAvailable(): boolean {
    return this.facade.available;
  }

  /** 开销后是否仍留得住下一周房租。protectNextRent 为 false 时只检查余额。 */
  public canSpend(amount: number, protectNextRent = true): boolean {
    return this.funds - amount >= (protectNextRent && (this.state.selfRent || V.robinpaid !== 1) ? this.facade.rent.due : 0);
  }

  /** 从储备金优先、罗宾现金其次的顺序扣款。 */
  public spend(amount: number, protectNextRent = true): boolean {
    if (!this.canSpend(amount, protectNextRent)) return false;
    const reserveSpent = Math.min(this.state.reserve, amount);
    this.state.reserve -= reserveSpent;
    V.robinmoney -= amount - reserveSpent;
    return true;
  }
}
