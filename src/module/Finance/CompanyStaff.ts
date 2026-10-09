// ./src/module/Finance/CompanyStaff.ts

import type Company from './Company';
import Securities from './Securities';

type Role = 'accountant' | 'sales';

export interface CompanyStaffState {
  selected: Role;
  collection: boolean;
  accountant: { employed: boolean; pay_day: number; arrears: number; unpaid_since: number; quit: boolean };
  sales: { employed: boolean; pay_day: number; arrears: number; unpaid_since: number; quit: boolean };
}

export default class CompanyStaff {
  public readonly roles = ['accountant', 'sales'] as const;
  public static readonly defaults: CompanyStaffState = {
    selected: 'accountant',
    collection: false,
    accountant: { employed: false, pay_day: -1, arrears: 0, unpaid_since: -1, quit: false },
    sales: { employed: false, pay_day: -1, arrears: 0, unpaid_since: -1, quit: false }
  };

  public constructor(private readonly company: Company) {}

  public get state(): CompanyStaffState {
    return this.company.state.staff;
  }

  public get key(): string {
    return `deadwood_company_${this.state.selected}`;
  }

  public get employed(): boolean {
    return this.roles.some(role => this.state[role].employed);
  }

  public get arrears(): number {
    return this.state.accountant.arrears + this.state.sales.arrears;
  }

  public get working(): boolean {
    return this.company.state.office && this.company.state.rent_arrears === 0 && this.company.finance.state.collection.amount === 0;
  }

  public get accountant(): boolean {
    return this.working && this.state.accountant.employed && this.state.accountant.arrears === 0;
  }

  public get sales(): boolean {
    return this.working && this.state.sales.employed && this.state.sales.arrears === 0;
  }

  public employ(role: Role, enabled: boolean): boolean {
    if (!this.roles.includes(role) || typeof enabled !== 'boolean' || !this.company.available || !this.company.open || !this.company.state.office) return false;
    const staff = this.state[role];
    if (staff.employed === enabled || (enabled && (!this.company.dealing || !V.per_npc?.[`deadwood_company_${role}`]))) return false;
    const wage = this.company.terms.staff[role].weeklyWage;
    if (this.company.finance.payFromBankPennies(staff.arrears + wage) !== 'ok') return false;
    Object.assign(staff, { employed: enabled, pay_day: enabled ? Math.floor(Time.days) + 7 : -1, arrears: 0, unpaid_since: -1, quit: false });
    if (!enabled && role === 'accountant') this.state.collection = false;
    return true;
  }

  public pay(): boolean {
    if (!this.company.available || !this.company.open || this.arrears <= 0 || this.company.finance.payFromBankPennies(this.arrears) !== 'ok') return false;
    this.state.accountant.arrears = this.state.sales.arrears = 0;
    this.state.accountant.unpaid_since = this.state.sales.unpaid_since = -1;
    return true;
  }

  public advance(day: number): void {
    for (const role of this.roles) {
      const staff = this.state[role];
      if (!staff.employed) continue;
      while (staff.pay_day <= day) {
        if (staff.unpaid_since >= 0 && staff.pay_day >= staff.unpaid_since + 14) {
          staff.employed = false;
          staff.quit = true;
          staff.pay_day = -1;
          if (role === 'accountant') this.state.collection = false;
          break;
        }
        const due = staff.arrears + this.company.terms.staff[role].weeklyWage;
        staff.arrears = due - this.company.finance.collectBankPennies(due);
        if (staff.arrears > 0 && staff.unpaid_since < 0) staff.unpaid_since = staff.pay_day;
        if (staff.arrears === 0) staff.unpaid_since = -1;
        staff.pay_day += 7;
      }
    }
    const contract = this.company.state.contract;
    if (this.accountant && this.state.collection && Securities.tradingDay(day) && contract?.stage === 'disputed') {
      contract.stage = 'waiting';
      contract.pay_day = day + this.company.terms.reminderDays;
    }
  }
}
