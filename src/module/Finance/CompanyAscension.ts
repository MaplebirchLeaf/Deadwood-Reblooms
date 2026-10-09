// ./src/module/Finance/CompanyAscension.ts

import type Company from './Company';

export interface CompanyAscensionState {
  prepared_day: number;
  proposed: boolean;
  accepted: boolean;
  ascended: boolean;
  recognized: boolean;
  audience_day: number;
  audience: 'avery' | 'harper' | 'remy' | null;
  jordan_told: boolean;
}

export default class CompanyAscension {
  public static readonly defaults: CompanyAscensionState = {
    prepared_day: -1,
    proposed: false,
    accepted: false,
    ascended: false,
    recognized: false,
    audience_day: -1,
    audience: null,
    jordan_told: false
  };

  public constructor(private readonly company: Company) {}

  public preInit(): void {
    const core = this.company.finance.core;
    core.dynamic.regStateEvent('gate', ':deadwood-ascension-terms', {
      forceExit: true,
      cond: () => !!V.Finance?.company && this.negotiation,
      output: 'deadwood-ascension-terms-room',
      extra: { passage: ['Skyscraper Party 13'] }
    });
    core.dynamic.regStateEvent('gate', ':deadwood-ascension-awakening', {
      cond: () => !!V.Finance?.company && this.state.accepted && !this.active && this.company.avery.ceremony && V.fake_artefact !== 'Avery',
      action: () => {
        T.deadwood_ascension = true;
      },
      extra: { passage: ['Skyscraper Ascend'] }
    });
    core.dynamic.regStateEvent('append', ':deadwood-ascension-grant', {
      cond: () => !!V.Finance?.company && !this.active && this.canAwaken,
      action: () => {
        this.state.ascended = true;
      },
      extra: { passage: ['Skyscraper Ascend'] }
    });
    core.dynamic.regStateEvent('gate', ':deadwood-ascension-recognition', {
      cond: () => !!V.Finance?.company && this.active && !this.state.recognized && !V.replayScene && !V.statFreeze && V.avery_fate === 'ascended',
      action: () => {
        this.state.recognized = true;
      },
      output: 'deadwood-ascension-recognition',
      extra: { passage: ['Skyscraper Ascend 2'] }
    });
    core.dynamic.regTimeEvent('onAfter', ':deadwood-ascension-recovery', {
      cond: data => !!V.Finance?.company && this.active && !V.replayScene && !V.statFreeze && (data.passed ?? 0) > 0,
      action: data => {
        const hours = (data.passed ?? 0) / 3600;
        core.SugarCube.Wikifier.wikifyEval(`<<stress ${-60 * hours} 1>><<tiredness ${-0.75 * hours}>>`);
      }
    });
  }

  public get state(): CompanyAscensionState {
    return this.company.state.ascension;
  }

  public get active(): boolean {
    return V.Finance?.company?.ascension?.ascended === true;
  }

  public get scarTraumaInput(): number {
    return this.active ? 0 : (Number(V.auriga_scar) || 0) * 25;
  }

  private get influence(): boolean {
    return this.company.shareholders.controller || (this.company.partner && this.company.shareholders.director && this.company.state.completed >= this.company.terms.partnerContracts);
  }

  public get canPrepare(): boolean {
    const avery = this.company.avery;
    return avery.available && avery.project && this.influence && avery.state.papers_read && avery.state.site_visited && avery.state.invited && this.state.prepared_day < 0;
  }

  public get canPropose(): boolean {
    return this.company.avery.ceremony && this.influence && this.state.prepared_day >= 0 && Math.floor(Time.days) > this.state.prepared_day && !this.state.proposed;
  }

  public get negotiation(): boolean {
    return this.company.avery.ceremony && this.state.proposed && !this.state.accepted && V.NPCList?.[1]?.fullDescription === 'Remy';
  }

  public get canAwaken(): boolean {
    return !!T.deadwood_ascension && this.state.accepted && !V.replayScene && !V.statFreeze && V.avery_fate === 'ascended' && V.fake_artefact !== 'Avery';
  }

  public get canAudience(): boolean {
    return this.active && this.state.recognized && this.company.available && this.company.open && this.state.audience_day !== Math.floor(Time.days);
  }

  public get canTellJordan(): boolean {
    return (
      this.active &&
      !this.state.jordan_told &&
      !V.replayScene &&
      !V.statFreeze &&
      V.combat !== 1 &&
      !V.possessed &&
      C.npc.Jordan?.state === 'active' &&
      V.spear_vessel !== 'held' &&
      !(V.temple_spear_mission == null && ['monk', 'priest'].includes(V.temple_rank) && V.grace >= 100)
    );
  }

  public prepare(): boolean {
    if (!this.canPrepare) return false;
    this.state.prepared_day = Math.floor(Time.days);
    return true;
  }

  public propose(): boolean {
    if (!this.canPropose) return false;
    this.state.proposed = true;
    this.company.avery.state.decision = 'continue';
    return true;
  }

  public accept(): boolean {
    if (!this.negotiation) return false;
    this.state.accepted = true;
    return true;
  }

  public withdraw(): void {
    if (this.active || V.replayScene || V.statFreeze) return;
    this.state.proposed = false;
    this.state.accepted = false;
  }

  public audience(character: 'avery' | 'harper' | 'remy'): boolean {
    if (!this.canAudience || !['avery', 'harper', 'remy'].includes(character)) return false;
    const npc = C.npc[{ avery: 'Avery', harper: 'Harper', remy: 'Remy' }[character]];
    if (npc?.state !== 'active' || (character === 'avery' && (V.avery_injury || V.avery_mansion?.schedule === 'away'))) return false;
    this.state.audience_day = Math.floor(Time.days);
    this.state.audience = character;
    return true;
  }

  public tellJordan(): boolean {
    if (!this.canTellJordan) return false;
    this.state.jordan_told = true;
    return true;
  }
}
