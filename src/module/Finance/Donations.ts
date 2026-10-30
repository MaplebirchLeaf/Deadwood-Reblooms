// ./src/module/Finance/Donations.ts

import projects from '../../assets/finance/donations.json';
import type Finance from '../Finance';
import DonationAid, { type AidFund, type AidState } from './DonationAid';
import SchoolDonations, { type SchoolDonationState } from './SchoolDonations';

export type Fund = 'orphanage' | 'hospital' | 'school' | 'temple';

interface Rewards {
  named: number;
  signed: boolean;
  followed: boolean;
}

const rewards: Rewards = { named: 0, signed: false, followed: false };

export interface DonationsState {
  total: Record<Fund, number>;
  named: Record<Fund, number>;
  receipts: { fund: Fund; amount: number; anonymous: boolean; day: number }[];
  school: SchoolDonationState;
  aid: Record<AidFund, AidState>;
  rewards: Record<Fund, Rewards>;
}

export default class Donations {
  public static readonly defaults: DonationsState = {
    total: { orphanage: 0, hospital: 0, school: 0, temple: 0 },
    named: { orphanage: 0, hospital: 0, school: 0, temple: 0 },
    receipts: [],
    school: SchoolDonations.defaults,
    aid: DonationAid.defaults,
    rewards: { orphanage: { ...rewards }, hospital: { ...rewards }, school: { ...rewards }, temple: { ...rewards } }
  };

  public readonly school = new SchoolDonations(this);
  public readonly aid = new DonationAid(this);

  public constructor(public readonly finance: Finance) {}

  public get state(): DonationsState {
    return this.finance.state.donations;
  }

  public get available(): boolean {
    return Time.hour >= 8 && Time.hour < 18 && !Time.isWeekEnd() && V.combat !== 1 && !V.replayScene && !V.statFreeze && !V.possessed && V.exposed <= 0 && V.stress < V.stressmax;
  }

  public get projects(): ((typeof projects)[number] & { donated: number; funded: boolean })[] {
    return projects.map(project => ({ ...project, donated: this.state.total[project.id as Fund], funded: this.state.total[project.id as Fund] >= project.goal }));
  }

  public reward(fund: Fund, stage: 'named' | 'signed' | 'followed'): void {
    if (V.replayScene || V.statFreeze || !projects.some(project => project.id === fund)) return;
    const state = this.state;
    const paid = state.rewards[fund];
    if (stage === 'named') {
      const goal = projects.find(project => project.id === fund)!.goal;
      const points = Math.floor(Math.min(state.named[fund], goal) / 100000) * 5;
      if (points <= paid.named) return;
      this.finance.recognition.award('good', `donation-${fund}-named`, points - paid.named, 0);
      paid.named = points;
      return;
    }
    const project = fund === 'school' ? state.school : state.aid[fund];
    if (state.named[fund] < 500000 || project.signed_at === null || paid[stage] || (stage === 'followed' && !project.followed)) return;
    paid[stage] = true;
    this.finance.recognition.award(stage === 'signed' ? 'good' : 'social', `donation-${fund}-${stage}`, stage === 'signed' ? 25 : 10, 0);
  }

  public customer(name: string): string {
    const project = projects.find(project => project.id === name);
    return this.finance.core.t(project?.name ?? `deadwood-reblooms:finance:security:${name}`);
  }

  public get customers(): Fund[] {
    return projects
      .filter(project => {
        const fund = project.id as Fund;
        const state = fund === 'school' ? this.state.school : this.aid.state(fund);
        return this.state.named[fund] >= 500000 && state.signed_at !== null && state.followed;
      })
      .map(project => project.id as Fund);
  }

  public donate(fund: Fund, pounds: number, anonymous: boolean): boolean {
    const amount = Math.round(pounds * 100);
    if (!this.available || !projects.some(project => project.id === fund) || !Number.isFinite(pounds) || !Number.isSafeInteger(amount) || amount <= 0 || typeof anonymous !== 'boolean') return false;
    if (!Number.isSafeInteger(this.state.total[fund] + amount) || !Number.isSafeInteger(this.state.named[fund] + amount)) return false;
    if (!this.pay(amount)) return false;
    const beforeTotal = this.state.total[fund];
    this.state.total[fund] += amount;
    const goal = projects.find(project => project.id === fund)!.goal;
    if (beforeTotal < goal && this.state.total[fund] >= goal) {
      const project = fund === 'school' ? this.state.school : this.aid.state(fund);
      project.ordered_at = Time.date.timeStamp;
    }
    if (!anonymous) {
      this.state.named[fund] += amount;
      this.reward(fund, 'named');
    }
    this.state.receipts.push({ fund, amount, anonymous, day: Math.floor(Time.days) });
    if (this.state.receipts.length > 12) this.state.receipts.shift();
    return true;
  }

  private pay(amount: number): boolean {
    const cash = Math.min(V.money, amount);
    const bank = amount - cash;
    if (bank > 0 && this.finance.payFromBankPennies(bank) !== 'ok') return false;
    V.money -= cash;
    this.finance.core.SugarCube.Wikifier.wikifyEval(`<<money ${-amount} 'deadwoodDonation' \`{recordOnly: true}\`>>`);
    return true;
  }
}
