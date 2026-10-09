// ./src/module/Finance/Orphanage.ts

import terms from '../../assets/finance/orphanage.json';
import type Finance from '../Finance';

type Buyout = 'pc' | 'robin' | 'both';

export interface OrphanageState {
  offer: { pc: number; robin: number } | null;
  choice: Buyout | null;
  agreed: boolean;
  pc_bought_out: boolean;
  robin_bought_out: boolean;
  robin_told: boolean;
}

export default class Orphanage {
  public static readonly defaults: OrphanageState = { offer: null, choice: null, agreed: false, pc_bought_out: false, robin_bought_out: false, robin_told: false };

  public constructor(private readonly finance: Finance) {}

  public get state(): OrphanageState {
    return this.finance.state.orphanage;
  }

  public get boughtOut(): boolean {
    return this.pcFree && this.robinFree;
  }

  public get pcFree(): boolean {
    return this.state.pc_bought_out;
  }

  public get robinFree(): boolean {
    return this.state.robin_bought_out;
  }

  private get weeklyRent(): number {
    const debt = Math.max(0, V.DeadwoodReblooms?.baileyRentDebt ?? 0);
    const combined = V.robinpaid === 1 && !V.RobinExpansion?.rent_separated;
    return Math.max(0, V.rentmoney - debt) / (combined ? 2 : 1);
  }

  public get prices(): { pc: number; robin: number } {
    return {
      pc: Math.max(terms.minimum_buyout, Math.ceil(this.weeklyRent * terms.rent_weeks)),
      robin: Math.max(terms.minimum_buyout, Math.ceil((this.finance.core.get('Robin') ? this.weeklyRent : 40000) * terms.rent_weeks))
    };
  }

  public get offers(): { id: Buyout; price: number; arrears: number; total: number; payable: boolean }[] {
    const quote = this.state.offer ?? this.prices;
    const pcDebt = Math.max(0, V.DeadwoodReblooms?.baileyRentDebt ?? 0);
    const robinDebt = Math.max(0, V.robindebt) * (this.finance.core.get('Robin') ? this.weeklyRent : 40000);
    const bank = this.finance.state.bank;
    const funds = V.money + (bank.opened && bank.debit_card ? bank.balance : 0);
    return (['pc', 'robin', 'both'] as const)
      .filter(id => (id === 'pc' ? !this.pcFree : id === 'robin' ? !this.robinFree : !this.pcFree && !this.robinFree))
      .map(id => {
        const price = id === 'both' ? quote.pc + quote.robin : quote[id];
        const arrears = id === 'pc' ? pcDebt : id === 'robin' ? robinDebt : pcDebt + robinDebt;
        const total = price + arrears;
        const consent = id === 'pc' || (this.state.agreed && C.npc.Robin.init === 1 && !V.robinmissing && V.RobinExpansion?.asylum.status !== 'admitted');
        return {
          id,
          price,
          arrears,
          total,
          payable: this.canNegotiate && (Time.hour < 9 || Time.minute < 50) && this.state.offer !== null && consent && Number.isSafeInteger(total) && total > 0 && funds >= total
        };
      });
  }

  public get canNegotiate(): boolean {
    return !this.boughtOut && !V.RobinExpansion?.bailey_defeated && Time.hour >= 7 && Time.hour < 10 && !V.replayScene && !V.statFreeze;
  }

  public get canTalkRobin(): boolean {
    return (
      C.npc.Robin.init === 1 &&
      !V.robinmissing &&
      V.robin.timer.hurt === 0 &&
      V.RobinExpansion?.asylum.status !== 'admitted' &&
      window.getRobinLocation() === 'orphanage' &&
      !V.replayScene &&
      !V.statFreeze
    );
  }

  public buyout(choice: Buyout | null): boolean {
    const offer = this.offers.find(offer => offer.id === choice);
    if (!offer?.payable) return false;
    const total = offer.total;
    const cash = Math.min(V.money, total);
    const bank = total - cash;
    if (bank > 0 && this.finance.payFromBankPennies(bank) !== 'ok') return false;
    V.money -= cash;
    this.finance.core.SugarCube.Wikifier.wikifyEval(`<<money ${-total} 'baileyRent' \`{recordOnly: true}\`>>`);
    const debt = Math.max(0, V.DeadwoodReblooms?.baileyRentDebt ?? 0);
    V.rentmoney = this.weeklyRent + debt;
    if (choice !== 'robin') {
      this.state.pc_bought_out = true;
      V.rentmoney -= debt;
      V.renttime = Math.max(7, V.renttime);
      V.baileyRefusedToPay = 0;
      V.baileyRefusedToPayTotal = 0;
      if (V.DeadwoodReblooms) V.DeadwoodReblooms.baileyRentDebt = 0;
      if (V.bailey_confiscation) this.finance.core.SugarCube.Wikifier.wikifyEval('<<run baileyConfiscationRestore()>>');
    }
    if (choice !== 'pc') {
      this.state.robin_bought_out = true;
      V.robindebt = 0;
      V.robineventnote = 0;
    }
    // 单人买断后，剩余的一份分别结算，不再由原版“两人一起交租”标记倍增。
    V.robinpaid = this.boughtOut ? 1 : 0;
    return true;
  }
}
