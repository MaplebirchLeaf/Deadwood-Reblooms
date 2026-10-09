// ./src/module/Finance/CompanyAvery.ts

import type Company from './Company';

export interface CompanyAveryState {
  talk_day: number;
  topic: 'work' | 'boundary' | 'personal' | 'competition' | 'invitation' | 'dream' | null;
  business_only: boolean;
  invitation_day: number;
  invitation_choice: 'pending' | 'accepted' | 'declined' | 'business' | null;
  date_day: number;
  date_state: 'scheduled' | 'native' | 'cancelled' | 'missed' | null;
  dinner_day: number;
  dinner_topic: 'work' | 'personal' | null;
  papers_read: boolean;
  site_visited: boolean;
  invited: boolean;
  questioned: boolean;
  decision: 'continue' | 'leave' | null;
  dream_seen: boolean;
}

export default class CompanyAvery {
  public static readonly defaults: CompanyAveryState = {
    talk_day: -1,
    topic: null,
    business_only: false,
    invitation_day: -7,
    invitation_choice: null,
    date_day: -1,
    date_state: null,
    dinner_day: -1,
    dinner_topic: null,
    papers_read: false,
    site_visited: false,
    invited: false,
    questioned: false,
    decision: null,
    dream_seen: false
  };

  public constructor(private readonly company: Company) {}

  public preInit(): void {
    const core = this.company.finance.core;
    core.dynamic.regStateEvent('append', ':deadwood-company-avery-dream', {
      cond: () => !!V.Finance?.company && !V.replayScene && !V.statFreeze,
      action: () => {
        this.state.dream_seen = true;
      },
      extra: { passage: ['Skyscraper Dream 4'] }
    });
    core.dynamic.regTimeEvent('onDay', ':deadwood-company-avery-date', {
      exact: true,
      action: () => this.advanceDate()
    });
    core.on(':passagestart', () => {
      if (V.Finance?.company) this.advanceDate();
    });
  }

  public get state(): CompanyAveryState {
    return this.company.state.avery;
  }

  public get available(): boolean {
    const shareholders = this.company.shareholders;
    return shareholders.available && C.npc.Avery.init === 1 && (shareholders.director || shareholders.controller);
  }

  public get canTalk(): boolean {
    return this.available && this.state.talk_day !== Math.floor(Time.days);
  }

  public get dateFree(): boolean {
    return !V.averydate && !V.averydatedone && !V.averydatemissed && !(V.avery_valentines?.invite && !V.avery_valentines.done);
  }

  public get canInvite(): boolean {
    return (
      this.available &&
      this.dateFree &&
      this.state.date_state !== 'scheduled' &&
      !this.state.business_only &&
      ['work', 'personal'].includes(this.state.topic ?? '') &&
      this.state.talk_day === Math.floor(Time.days) &&
      Math.floor(Time.days) >= this.state.invitation_day + 7 &&
      !V.averyseen &&
      !V.avery_mansion?.date_seen
    );
  }

  public get canAnswer(): boolean {
    return this.available && this.dateFree && this.state.date_state !== 'scheduled' && this.state.invitation_day === Math.floor(Time.days) && this.state.invitation_choice === 'pending';
  }

  public advanceDate(): void {
    const state = this.state;
    const day = Math.floor(Time.days);
    if (V.replayScene || V.statFreeze || state.date_state !== 'scheduled' || day < state.date_day) return;
    if (C.npc.Avery?.state !== 'active' || V.avery_injury || ['fallen', 'kicked'].includes(V.avery_fate) || !this.dateFree) {
      state.date_state = 'cancelled';
    } else if (day === state.date_day && Time.weekDay === 7) {
      V.averydate = 1;
      state.date_state = 'native';
    } else {
      V.averydatemissed = 1;
      state.date_state = 'missed';
    }
  }

  public get canDinner(): boolean {
    return (
      this.company.available &&
      C.npc.Avery?.state === 'active' &&
      (this.company.shareholders.director || this.company.shareholders.controller) &&
      V.averydateattended === 1 &&
      V.averydatedone === 1 &&
      V.NPCList?.[0]?.fullDescription === 'Avery' &&
      this.state.dinner_day !== Math.floor(Time.days) &&
      !(V.rng >= 51 && C.npc.Avery.love >= 20 && V.settings.footFetishEnabled)
    );
  }

  public get project(): boolean {
    return !!V.avery_mansion && V.avery_tower?.intro === 1 && !V.avery_fate;
  }

  public get canResearch(): boolean {
    return this.available && this.project;
  }

  public get canVisit(): boolean {
    return this.company.available && this.project && this.state.papers_read && (this.company.shareholders.director || this.company.shareholders.controller) && !this.state.site_visited;
  }

  public get canPrepare(): boolean {
    return this.canTalk && this.project && V.avery_tower.stage >= 2 && this.state.papers_read && this.state.site_visited && !this.state.invited;
  }

  public get ceremony(): boolean {
    return (
      !V.replayScene &&
      !V.statFreeze &&
      !V.possessed &&
      V.combat !== 1 &&
      !!V.silenceNotifications &&
      V.avery_tower?.stage === 3 &&
      !V.avery_fate &&
      V.NPCList?.[0]?.fullDescription === 'Avery' &&
      V.NPCList?.[2]?.fullDescription === 'Harper' &&
      this.state.invited
    );
  }
}
