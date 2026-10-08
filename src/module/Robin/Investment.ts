// ./src/module/Robin/Investment.ts

import terms from '../../assets/finance/shop-investment.json';
import Shared from './Shared';

/** 饮品店的私人合伙份额，与 PC 垫款及公开市场股票分别记账，金额均为便士。 */
export default class Investment extends Shared {
  public readonly terms = terms;

  public get contract() {
    return this.state.investment;
  }

  public get available(): boolean {
    return this.state.shop && !!this.finance && !V.statFreeze;
  }

  public get canAgree(): boolean {
    return this.available && this.robinAvailable && window.getRobinLocation() === 'shop' && C.npc.Robin.love >= 20 && V.exposed <= 0 && V.combat !== 1 && V.stress < V.stressmax;
  }

  public agree(): boolean {
    if (!this.canAgree || this.contract.agreed) return false;
    this.contract.agreed = true;
    this.contract.valuation = terms.initialValue;
    return true;
  }

  public get exitValue(): number {
    return Math.floor((this.contract.valuation * this.contract.share * terms.exitMultiplier) / 100);
  }

  public quote(share: number): number | null {
    if (!Number.isInteger(share) || share % terms.shareStep !== 0 || share <= this.contract.share || share > terms.maximumShare) return null;
    return Math.ceil((this.contract.valuation * (share - this.contract.share)) / 100);
  }

  public invest(share: number): boolean {
    const contract = this.contract;
    const amount = this.quote(share);
    if (!this.available || !this.robinAvailable || !contract.agreed || contract.exit_day >= 0 || amount === null || this.finance!.payFromBankPennies(amount) !== 'ok') return false;
    this.state.reserve += amount / 100;
    contract.invested_total += amount;
    contract.share = share;
    // 每次增加份额重新等满一周，不能用结算前的临时入资领取整周分红。
    contract.last_day = Math.floor(Time.days);
    contract.next_settlement = contract.last_day + 7;
    return true;
  }

  public exit(request: boolean): boolean {
    if (!this.available || this.contract.share <= 0 || (request && this.contract.exit_day >= 0)) return false;
    this.contract.exit_day = request ? Math.floor(Time.days) + terms.exitDays : -1;
    return true;
  }

  /** 与房租、果园收入和银行债务共用历史日期。读页不会结算或重抽经营结果。 */
  public advance(day: number): void {
    const contract = this.contract;
    if (!this.available || contract.share <= 0 || !Number.isInteger(day) || day <= contract.last_day || day > Math.floor(Time.days)) return;
    for (let current = contract.last_day + 1; current <= day; current++) {
      if (current >= contract.next_settlement) {
        const roll = random(1, 100);
        const closed = !this.robinAvailable;
        const loss = !closed && roll <= terms.lossChance;
        const busy = !closed && roll > 100 - terms.boomChance;
        // 仅饮品店的营业部分，不包含家教、神殿津贴和孤儿院房租。
        const shop = this.facade.shop;
        const base = 1500 + (this.state.lemonade + this.state.chocolate) * 1200 + shop.staffSales - shop.staffWages;
        const season = Time.getSeason(new DateTime(Time.date).addDays(current - Math.floor(Time.days)));
        const seasonal = season === 'winter' ? 0.65 : season === 'summer' ? 1.2 : 1;
        const profit = closed ? 0 : Math.round(base * 100 * seasonal * (loss ? -0.3 : busy ? 1.5 : random(-20, 80) / 100));
        const move = closed ? -10 : loss ? -35 : busy ? 35 : random(-8, 8);
        contract.valuation = Math.clamp(Math.round((contract.valuation * (100 + move)) / 100), terms.minimumValue, Number.MAX_SAFE_INTEGER);
        // 先保护下周房租。分红从罗宾已经持有的营业资金中支付，不凭报价凭空造钱。
        let dividend = Math.max(0, Math.floor((profit * terms.distributionRate * contract.share) / 100));
        if (dividend > 0 && !this.spend(dividend / 100)) dividend = 0;
        if (dividend > 0) this.finance!.creditBankPennies(dividend);
        contract.dividends_total += dividend;
        contract.report = { day: current, event: closed ? 'closed' : loss ? 'loss' : busy ? 'busy' : 'quiet', profit, dividend };
        contract.next_settlement = current + 7;
      }
      if (contract.exit_day >= 0 && current >= contract.exit_day) {
        const amount = this.exitValue;
        // 回购需营业资金足够。不自动替罗宾贷款，也不动用房租保底。
        if (this.robinAvailable && this.spend(amount / 100)) {
          this.finance!.creditBankPennies(amount);
          contract.returned_total += amount;
          contract.share = 0;
          contract.exit_day = -1;
          break;
        }
      }
    }
    contract.last_day = day;
  }
}
