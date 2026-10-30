// ./src/module/Robin/Rent.ts

import Shared from './Shared';

export default class RobinRent extends Shared {
  public get free(): boolean {
    return this.state.bailey_defeated || this.finance?.orphanage.robinFree === true;
  }

  /** 承担两人房租所需的周收入门槛，随玩家房租水涨船高。 */
  public get bothRequirement(): number {
    const pcRent = (Math.max(0, Number(V.rentmoney) || 0) + Math.max(0, Number(V.babyRent) || 0)) / 100;
    return Math.max(5000, Math.ceil(pcRent) + 1000);
  }

  /** 下一周罗宾应承担的房租，单位英镑。 */
  public get due(): number {
    if (this.free) return 0;
    const pcRentPennies = Math.max(0, Number(V.rentmoney) || 0);
    const ownSharePennies = V.robinpaid === 1 && !this.state.self_rent ? pcRentPennies / 2 : pcRentPennies;
    return Math.ceil(ownSharePennies / 100);
  }

  /** 按当前房租折算的旧欠，单位英镑。 */
  public get debt(): number {
    return Math.max(0, Number(V.robindebt) || 0) * this.due;
  }

  public get canAcceptSelfRent(): boolean {
    return (
      this.robinAvailable &&
      !this.free &&
      !this.state.self_rent &&
      this.state.lemonade >= 2 &&
      this.state.chocolate >= 2 &&
      this.facade.income >= Math.max(1500, this.due + 50) &&
      C.npc.Robin.dom >= 60 &&
      C.npc.Robin.trauma <= 40 &&
      this.funds >= this.debt + this.due
    );
  }

  public acceptSelfRent(): boolean {
    if (!this.canAcceptSelfRent) return false;
    this.spend(this.debt, false);
    this.state.self_rent = true;
    if (V.robinpaid === 1) V.rentmoney /= 2;
    this.state.rent_separated = true;
    V.robindebt = 0;
    return true;
  }

  /** 只登记“两人共同承担”的承诺，实际付款由 payPcRent 完成。 */
  public promiseBothRent(): boolean {
    if (
      !this.robinAvailable ||
      this.free ||
      !this.state.self_rent ||
      this.state.both_rent ||
      this.facade.income < this.bothRequirement ||
      C.npc.Robin.dom < 80 ||
      C.npc.Robin.love < 60 ||
      C.npc.Robin.trauma > 30
    )
      return false;
    this.state.both_rent = true;
    return true;
  }

  public get canPayPcRent(): boolean {
    return (
      this.robinAvailable &&
      !this.state.bailey_defeated &&
      !this.finance?.orphanage.pcFree &&
      this.state.both_rent &&
      (this.funds - this.due) * 100 >= (Number(V.rentmoney) || 0) + (Number(V.babyRent) || 0)
    );
  }

  public payPcRent(): boolean {
    const pennies = (Number(V.rentmoney) || 0) + (Number(V.babyRent) || 0);
    if (!this.canPayPcRent || !this.spend(Math.ceil(pennies / 100))) return false;
    V.money += pennies;
    return true;
  }

  public proposeRebellion(): boolean {
    if (!this.robinAvailable || this.free || this.state.rebellion || !this.state.self_rent || this.facade.income < 4000 || C.npc.Robin.dom < 85 || C.npc.Robin.trauma > 30) return false;
    this.state.rebellion = true;
    return true;
  }

  /** 正式反抗仍需罗宾在孤儿院，并有足够自信面对贝利。 */
  public get canFight(): boolean {
    return (
      this.state.rebellion &&
      !this.free &&
      !this.finance?.orphanage.pcFree &&
      this.robinAvailable &&
      V.bus === 'home' &&
      !V.combat &&
      window.getRobinLocation() === 'orphanage' &&
      C.npc.Robin.dom >= 60 &&
      C.npc.Robin.trauma < 40
    );
  }
}
