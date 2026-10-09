// ./src/module/Finance/Donations.ts

import projects from '../../assets/finance/donations.json';
import type Finance from '../Finance';

type Fund = 'orphanage' | 'hospital' | 'school' | 'temple';

export interface DonationsState {
  total: Record<Fund, number>;
  named: Record<Fund, number>;
  receipts: { fund: Fund; amount: number; anonymous: boolean; day: number }[];
}

export default class Donations {
  public static readonly defaults: DonationsState = {
    total: { orphanage: 0, hospital: 0, school: 0, temple: 0 },
    named: { orphanage: 0, hospital: 0, school: 0, temple: 0 },
    receipts: []
  };

  public constructor(private readonly finance: Finance) {}

  public get state(): DonationsState {
    return this.finance.state.donations;
  }

  public get available(): boolean {
    return Time.hour >= 8 && Time.hour < 18 && !Time.isWeekEnd() && V.combat !== 1 && !V.replayScene && !V.statFreeze && !V.possessed && V.exposed <= 0 && V.stress < V.stressmax;
  }

  public get projects(): ((typeof projects)[number] & { donated: number; funded: boolean })[] {
    return projects.map(project => ({ ...project, donated: this.state.total[project.id as Fund], funded: this.state.total[project.id as Fund] >= project.goal }));
  }

  public donate(fund: Fund, pounds: number, anonymous: boolean): boolean {
    const amount = Math.round(pounds * 100);
    if (!this.available || !projects.some(project => project.id === fund) || !Number.isFinite(pounds) || !Number.isSafeInteger(amount) || amount <= 0 || typeof anonymous !== 'boolean') return false;
    if (!Number.isSafeInteger(this.state.total[fund] + amount) || !Number.isSafeInteger(this.state.named[fund] + amount)) return false;
    const cash = Math.min(V.money, amount);
    const bank = amount - cash;
    if (bank > 0 && this.finance.payFromBankPennies(bank) !== 'ok') return false;
    V.money -= cash;
    this.finance.core.SugarCube.Wikifier.wikifyEval(`<<money ${-amount} 'deadwoodDonation' \`{recordOnly: true}\`>>`);
    this.state.total[fund] += amount;
    if (!anonymous) this.state.named[fund] += amount;
    this.state.receipts.push({ fund, amount, anonymous, day: Math.floor(Time.days) });
    if (this.state.receipts.length > 12) this.state.receipts.shift();
    return true;
  }
}
