// ./src/module/Finance/Shareholders.ts

import type Company from './Company';
import Securities from './Securities';
import CompanyEvents from './CompanyEvents';

type Policy = 'income' | 'reserve' | 'expansion';

export interface ShareholdersState {
  board: boolean;
  treasury: number;
  policy: Policy;
  next_meeting_day: number;
  last_dividend_day: number;
  minutes: { day: number; held: number; total: number; policy: Policy; passed: boolean } | null;
  placement_used: boolean;
  offer: { shares: number; price: number; total: number; expires: number } | null;
  transferred: number;
  project_spent: number;
  funded_stages: number[];
  project: { stage: number; funded_day: number; remaining: number; cost_per_point: number; points: number } | null;
}

export default class Shareholders {
  public readonly terms;
  public static readonly defaults: ShareholdersState = {
    board: false,
    treasury: 0,
    policy: 'income',
    next_meeting_day: 0,
    last_dividend_day: -1,
    minutes: null,
    placement_used: false,
    offer: null,
    transferred: 0,
    project_spent: 0,
    funded_stages: [],
    project: null
  };

  public constructor(private readonly company: Company) {
    this.terms = company.terms.governance;
  }

  public get state(): ShareholdersState {
    return this.company.state.shareholders;
  }

  public get stock(): { total: number; listed: number } {
    return this.company.finance.state.market.shares.AVY;
  }

  public get held(): number {
    return this.company.finance.sellableShares.AVY ?? 0;
  }

  public get controller(): boolean {
    return this.held > this.stock.total / 2;
  }

  public get director(): boolean {
    return this.state.board && this.company.share >= this.terms.boardShare;
  }

  public get available(): boolean {
    return (
      this.company.available &&
      this.company.open &&
      this.company.finance.state.brokerage.opened &&
      this.company.finance.state.collection.amount === 0 &&
      C.npc.Avery?.state === 'active' &&
      !V.avery_injury &&
      V.avery_mansion?.schedule !== 'away' &&
      !['fallen', 'kicked'].includes(V.avery_fate)
    );
  }

  public get canMeet(): boolean {
    return this.available && this.company.share >= this.terms.meetingShare && Math.floor(Time.days) >= this.state.next_meeting_day;
  }

  public get canSubscribe(): boolean {
    return this.available && this.company.share >= this.terms.meetingShare && !!this.state.minutes?.passed && Math.floor(Time.days) < this.state.next_meeting_day && !this.state.placement_used;
  }

  public get placementPrice(): number {
    return Math.ceil(this.company.finance.state.market.prices.AVY * this.terms.placementPremium);
  }

  public get canNegotiate(): boolean {
    return (
      this.available &&
      this.director &&
      this.company.state.completed >= this.company.terms.partnerContracts &&
      (this.company.finance.state.brokerage.holdings.AVY ?? 0) <= this.stock.total / 2 &&
      this.stock.total > this.stock.listed
    );
  }

  public get towerStage() {
    return V.avery_mansion && V.avery_tower && !['fallen', 'kicked', 'saved', 'ascended'].includes(V.avery_fate)
      ? this.terms.towerStages.find(stage => stage.stage === V.avery_tower.stage && V.avery_tower.progress < stage.limit)
      : null;
  }

  public get canFund(): boolean {
    const stage = this.towerStage;
    return this.available && (this.director || this.controller) && !!stage && !this.state.project && !this.state.funded_stages.includes(stage.stage) && this.state.treasury >= stage.budget;
  }

  public meeting(policy: Policy): boolean {
    if (!this.canMeet || !['income', 'reserve', 'expansion'].includes(policy)) return false;
    this.company.finance.advanceMarketThrough(Math.floor(Time.days));
    if (!this.canMeet) return false;
    const day = Math.floor(Time.days);
    const passed = this.controller || policy !== 'income' || (!this.state.project && !this.towerStage);
    this.state.minutes = { day, held: this.held, total: this.stock.total, policy, passed };
    this.state.next_meeting_day = day + this.terms.meetingInterval;
    if (passed) {
      this.state.policy = policy;
      this.state.placement_used = false;
      if (this.company.share >= this.terms.boardShare && this.company.state.completed >= this.company.terms.partnerContracts) this.state.board = true;
    }
    this.company.finance.recognition.award('social', 'shareholder-meeting', 3);
    return true;
  }

  public subscribe(pounds: number, expectedPrice: number): boolean {
    const budget = Math.round(pounds * 100);
    if (!this.canSubscribe || !Number.isFinite(pounds) || !Number.isSafeInteger(budget) || budget <= 0 || expectedPrice !== this.placementPrice) return false;
    const shares = Math.floor(budget / expectedPrice);
    const cost = shares * expectedPrice;
    const finance = this.company.finance;
    const brokerage = finance.state.brokerage;
    if (
      shares < 1 ||
      shares > Math.floor(this.stock.total * this.terms.placementLimit) ||
      ![
        cost,
        this.stock.total + shares,
        this.stock.listed + shares,
        this.state.treasury + cost + (this.state.project?.remaining ?? 0),
        (brokerage.holdings.AVY ?? 0) + shares,
        (brokerage.costs.AVY ?? 0) + cost
      ].every(Number.isSafeInteger)
    )
      return false;
    if (finance.payFromBankPennies(cost) !== 'ok') return false;
    this.stock.total += shares;
    this.stock.listed += shares;
    this.state.treasury += cost;
    this.state.placement_used = true;
    this.acquire(shares, cost);
    CompanyEvents.record(finance.state.market, 'AVY', 'share_issue', 0, Math.floor(Time.days), shares);
    finance.recognition.award('business', 'company-placement', 5);
    return true;
  }

  public negotiate(): boolean {
    if (!this.canNegotiate) return false;
    const shares = Math.min(
      this.stock.total - this.stock.listed,
      Math.max(1, Math.floor(this.stock.total * this.terms.transferBlock)),
      Math.floor(this.stock.total / 2) + 1 - (this.company.finance.state.brokerage.holdings.AVY ?? 0)
    );
    const price = Math.ceil(this.company.finance.state.market.prices.AVY * this.terms.transferPremium);
    if (shares <= 0 || !Number.isSafeInteger(shares * price)) return false;
    this.state.offer = { shares, price, total: this.stock.total, expires: Math.floor(Time.days) + this.terms.offerDays };
    return true;
  }

  public accept(): boolean {
    const offer = this.state.offer;
    if (!this.canNegotiate || !offer || Math.floor(Time.days) > offer.expires || offer.total !== this.stock.total || offer.shares > this.stock.total - this.stock.listed) return false;
    const cost = offer.shares * offer.price;
    const finance = this.company.finance;
    if (
      offer.shares > Math.floor(this.stock.total / 2) + 1 - (finance.state.brokerage.holdings.AVY ?? 0) ||
      ![cost, this.state.transferred + offer.shares, (finance.state.brokerage.holdings.AVY ?? 0) + offer.shares, (finance.state.brokerage.costs.AVY ?? 0) + cost].every(Number.isSafeInteger) ||
      finance.payFromBankPennies(cost) !== 'ok'
    )
      return false;
    this.stock.listed += offer.shares;
    this.state.transferred += offer.shares;
    this.acquire(offer.shares, cost);
    this.state.offer = null;
    finance.recognition.award('business', 'company-transfer', 5);
    return true;
  }

  private acquire(shares: number, cost: number): void {
    const finance = this.company.finance;
    const brokerage = finance.state.brokerage;
    const day = Math.floor(Time.days);
    brokerage.holdings.AVY = (brokerage.holdings.AVY ?? 0) + shares;
    brokerage.costs.AVY = (brokerage.costs.AVY ?? 0) + cost;
    if (!brokerage.unsettled || day >= brokerage.unsettled.available_day) brokerage.unsettled = { available_day: Securities.nextTradingDay(day), shares: {} };
    brokerage.unsettled.shares.AVY = (brokerage.unsettled.shares.AVY ?? 0) + shares;
    finance.resetMarketSeed();
  }

  public fund(): boolean {
    if (!this.canFund) return false;
    const stage = this.towerStage!;
    this.state.treasury -= stage.budget;
    this.state.project = { stage: stage.stage, funded_day: Math.floor(Time.days), remaining: stage.budget, cost_per_point: stage.budget / stage.points, points: stage.points };
    this.state.funded_stages.push(stage.stage);
    return true;
  }

  public advance(day: number): void {
    if (V.replayScene || V.statFreeze || !Number.isInteger(day) || day > Math.floor(Time.days)) return;
    const project = this.state.project;
    if (!project || day <= project.funded_day) return;
    const stage = this.terms.towerStages.find(item => item.stage === project.stage)!;
    if (!V.avery_tower || ['fallen', 'kicked', 'saved', 'ascended'].includes(V.avery_fate) || V.avery_tower.stage !== project.stage || V.avery_tower.progress >= stage.limit || project.points <= 0) {
      this.state.treasury += project.remaining;
      this.state.project = null;
      return;
    }
    if (!Securities.tradingDay(day)) return;
    const points = Math.min(1, project.points, stage.limit - V.avery_tower.progress);
    const cost = Math.ceil(project.cost_per_point * points);
    if (cost > project.remaining) return;
    project.remaining -= cost;
    project.points -= points;
    this.state.project_spent += cost;
    V.avery_tower.progress += points;
    if (V.avery_tower.progress >= stage.limit || project.points <= 0) {
      this.state.treasury += project.remaining;
      this.state.project = null;
    }
  }

  public dividend(day: number): number {
    if (V.replayScene || V.statFreeze) return 1;
    const rate = this.state.policy === 'income' ? 1 : this.state.policy === 'reserve' ? this.terms.retainedRate : 0;
    if (!Number.isInteger(day) || day <= this.state.last_dividend_day || day > Math.floor(Time.days)) return rate;
    const finance = this.company.finance;
    const security = finance.securities.find(item => item.symbol === 'AVY');
    const retained = Math.floor(this.stock.total * finance.state.market.prices.AVY * (security?.weeklyDividendRate ?? 0) * (1 - rate));
    if (!Number.isSafeInteger(this.state.treasury + retained + (this.state.project?.remaining ?? 0))) return 1;
    this.state.treasury += retained;
    this.state.last_dividend_day = day;
    return rate;
  }
}
