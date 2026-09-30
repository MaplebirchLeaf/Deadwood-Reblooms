import Shared from './Shared';

export default class RobinRent extends Shared {
  /** 承担两人房租所需的周收入门槛，随玩家房租水涨船高。 */
  public get bothRequirement(): number {
    const pcRent = (Math.max(0, Number(V.rentmoney) || 0) + Math.max(0, Number(V.babyRent) || 0)) / 100;
    return Math.max(5000, Math.ceil(pcRent) + 1000);
  }

  /** 下一周罗宾应承担的房租，单位英镑。 */
  public get due(): number {
    if (this.state.baileyDefeated) return 0;
    const pcRentPennies = Math.max(0, Number(V.rentmoney) || 0);
    const ownSharePennies = V.robinpaid === 1 && !this.state.selfRent ? pcRentPennies / 2 : pcRentPennies;
    return Math.ceil(ownSharePennies / 100);
  }

  /** 按当前房租折算的旧欠，单位英镑。 */
  public get debt(): number {
    return Math.max(0, Number(V.robindebt) || 0) * this.due;
  }

  public get canAcceptSelfRent(): boolean {
    return (
      this.robinAvailable &&
      !this.state.selfRent &&
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
    this.state.selfRent = true;
    if (V.robinpaid === 1) V.rentmoney /= 2;
    this.state.rentSeparated = true;
    V.robindebt = 0;
    return true;
  }

  /** 只登记“两人共同承担”的承诺，实际付款由 payPcRent 完成。 */
  public promiseBothRent(): boolean {
    if (!this.robinAvailable || !this.state.selfRent || this.state.bothRent || this.facade.income < this.bothRequirement || C.npc.Robin.dom < 80 || C.npc.Robin.love < 60 || C.npc.Robin.trauma > 30)
      return false;
    this.state.bothRent = true;
    return true;
  }

  public get canPayPcRent(): boolean {
    return this.robinAvailable && this.state.bothRent && (this.funds - this.due) * 100 >= (Number(V.rentmoney) || 0) + (Number(V.babyRent) || 0);
  }

  public payPcRent(): boolean {
    const pennies = (Number(V.rentmoney) || 0) + (Number(V.babyRent) || 0);
    if (!this.canPayPcRent || !this.spend(Math.ceil(pennies / 100))) return false;
    V.money += pennies;
    return true;
  }

  public proposeRebellion(): boolean {
    if (!this.robinAvailable || this.state.rebellion || !this.state.selfRent || this.facade.income < 4000 || C.npc.Robin.dom < 85 || C.npc.Robin.trauma > 30) return false;
    this.state.rebellion = true;
    return true;
  }

  /** 反抗战每回合：同盟越稳固越容易让罗宾撑住。返回 true 表示本回合顶住。 */
  public combatTurn(): boolean {
    if (!this.state.rebellion || V.fightstart === 1 || V.enemyhealth <= 0) return false;
    const chance = this.state.solidarity ? 90 : this.state.allies ? 80 : 65;
    if (V.rng <= chance) {
      V.timer = Math.min(4, Math.max(0, V.timer) + 2);
      return true;
    }
    C.npc.Robin.trauma = Math.min(100, C.npc.Robin.trauma + 2);
    return false;
  }

  /** 反抗战结算：胜场累加，败场按是否动用关怀基金扣创伤。 */
  public combatFinish(): void {
    if (!this.state.rebellion || this.state.fightResolutionDay === Time.days) return;
    this.state.fightResolutionDay = Time.days;
    if (V.enemyhealth <= 0 || V.enemyarousal >= V.enemyarousalmax) {
      this.state.victories++;
      return;
    }
    const supported = this.state.solidarity && this.state.careFund >= 10;
    if (supported) this.state.careFund -= 10;
    C.npc.Robin.trauma = Math.min(100, C.npc.Robin.trauma + (supported ? 4 : 8));
  }
}
