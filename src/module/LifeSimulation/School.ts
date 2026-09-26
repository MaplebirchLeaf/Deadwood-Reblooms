export type SchoolRole = 'student' | 'prefect' | 'president';

export type SchoolDressPolicy = 'uniform' | 'free' | 'revealing' | 'optionalNudity' | 'nudeDay' | 'mandatoryNudity';

export type SchoolApprovalRoute = 'none' | 'formal' | 'petition' | 'pressure';

export type SchoolDutyOutcome = 'enforce' | 'mediate' | 'pressure' | 'overlook' | 'inviteAccepted' | 'inviteRefused';

export type SchoolStudent = 'Robin' | 'Sydney' | 'Kylar' | 'Whitney';

export interface SchoolState {
  role: SchoolRole;
  order: number;
  studentSupport: number;
  staffSupport: number;
  duties: {
    completed: number;
    lastDay: number;
    target: SchoolStudent | null;
    encounter: SchoolStudent | null;
  };
  dress: {
    active: SchoolDressPolicy;
    highest: SchoolDressPolicy;
    previous: SchoolDressPolicy;
    proposal: SchoolDressPolicy | null;
    route: SchoolApprovalRoute;
    trialUntil: number;
    cooldownUntil: number;
  };
  clothesStored: boolean;
}

export interface SchoolPolicyRequirements {
  studentSupport: number;
  staffSupport: number;
  corruption: number;
  leightonLove: number;
}

export const DEFAULT_SCHOOL_STATE: SchoolState = {
  role: 'student',
  order: 20,
  studentSupport: 20,
  staffSupport: 20,
  duties: {
    completed: 0,
    lastDay: -1,
    target: null,
    encounter: null
  },
  dress: {
    active: 'uniform',
    highest: 'uniform',
    previous: 'uniform',
    proposal: null,
    route: 'none',
    trialUntil: 0,
    cooldownUntil: 0
  },
  clothesStored: false
};

const DRESS_POLICIES: readonly SchoolDressPolicy[] = ['uniform', 'free', 'revealing', 'optionalNudity', 'nudeDay', 'mandatoryNudity'];

// 制服政策按此顺序升级；highest 记录已保住的最高等级，active 可在一周试行后回退。
const POLICY_REQUIREMENTS: Record<SchoolDressPolicy, SchoolPolicyRequirements> = {
  uniform: { studentSupport: 0, staffSupport: 0, corruption: 0, leightonLove: 0 },
  free: { studentSupport: 30, staffSupport: 25, corruption: 0, leightonLove: 10 },
  revealing: { studentSupport: 40, staffSupport: 30, corruption: 20, leightonLove: 20 },
  optionalNudity: { studentSupport: 55, staffSupport: 35, corruption: 35, leightonLove: 30 },
  nudeDay: { studentSupport: 65, staffSupport: 45, corruption: 50, leightonLove: 40 },
  mandatoryNudity: { studentSupport: 80, staffSupport: 60, corruption: 70, leightonLove: 50 }
};

export const SCHOOL_STUDENT_ROSTER: readonly SchoolStudent[] = ['Robin', 'Sydney', 'Kylar', 'Whitney'];

export const SCHOOL_CAMPUS_LOCATIONS: Record<SchoolStudent, readonly string[]> = {
  Robin: ['school'],
  Sydney: ['library', 'science', 'class', 'canteen', 'late'],
  Kylar: ['school', 'class', 'english', 'canteen', 'rear_courtyard', 'library'],
  Whitney: ['school']
};

const DUTY_LOVE_CHANGES: Record<SchoolStudent, Record<SchoolDutyOutcome, number>> = {
  Robin: { enforce: -1, mediate: 2, pressure: -3, overlook: 0, inviteAccepted: 2, inviteRefused: -1 },
  Sydney: { enforce: -1, mediate: 1, pressure: -2, overlook: 0, inviteAccepted: 2, inviteRefused: -1 },
  Kylar: { enforce: -2, mediate: 2, pressure: -3, overlook: 0, inviteAccepted: 2, inviteRefused: -1 },
  Whitney: { enforce: -2, mediate: -1, pressure: -3, overlook: 1, inviteAccepted: 2, inviteRefused: -1 }
};

const DUTY_STANDING_CHANGES: Record<SchoolStudent, Record<SchoolDutyOutcome, readonly [number, number, number]>> = {
  Robin: { enforce: [2, -1, 2], mediate: [1, 2, 0], pressure: [1, -3, -1], overlook: [-1, 0, -1], inviteAccepted: [-1, 0, -1], inviteRefused: [-1, -1, 0] },
  Sydney: { enforce: [2, 0, 2], mediate: [1, 2, 0], pressure: [1, -2, -1], overlook: [-1, 0, -1], inviteAccepted: [-1, -1, -1], inviteRefused: [-1, -1, 0] },
  Kylar: { enforce: [2, -2, 2], mediate: [1, 2, 0], pressure: [1, -3, -1], overlook: [-1, 0, -1], inviteAccepted: [-1, 0, -1], inviteRefused: [-1, -2, 0] },
  Whitney: { enforce: [2, 1, 2], mediate: [1, 1, 0], pressure: [3, -2, -1], overlook: [-2, -1, -1], inviteAccepted: [-2, 0, -2], inviteRefused: [-1, -1, 0] }
};

class School {
  private get state(): SchoolState {
    return V.LifeSimulation.school as SchoolState;
  }

  public get role(): SchoolRole {
    return this.state.role;
  }

  public get studentRoster(): readonly SchoolStudent[] {
    return SCHOOL_STUDENT_ROSTER;
  }

  public standingColour(value: number): 'red' | 'pink' | 'blue' | 'teal' | 'green' {
    if (value < 20) return 'red';
    if (value < 40) return 'pink';
    if (value < 60) return 'blue';
    if (value < 80) return 'teal';
    return 'green';
  }

  public acceptsDressCode(vanillaAccepted: boolean): boolean {
    const policy = V.LifeSimulation?.school?.dress?.active as SchoolDressPolicy | undefined;
    if (!policy || policy === 'uniform') return vanillaAccepted;

    const worn = V.worn as Record<string, { name?: string; type?: string[] } | undefined>;
    const dressed = (slot: string) => worn?.[slot]?.name !== undefined && worn[slot]?.name !== 'naked';
    const overalls = worn?.lower?.type?.includes('overalls') === true;

    if (policy === 'free') return overalls || (dressed('upper') && dressed('lower'));
    if (policy === 'revealing') return overalls || ['upper', 'lower', 'under_upper', 'under_lower'].some(dressed);
    return true;
  }

  public get nextPolicy(): SchoolDressPolicy | null {
    const index = DRESS_POLICIES.indexOf(this.state.dress.highest);
    return DRESS_POLICIES[index + 1] ?? null;
  }

  public get availablePolicies(): readonly SchoolDressPolicy[] {
    return DRESS_POLICIES.slice(0, DRESS_POLICIES.indexOf(this.state.dress.highest) + 1);
  }

  public get canSelectPolicy(): boolean {
    return this.state.role === 'president' && this.state.dress.proposal === null && this.state.dress.trialUntil === 0;
  }

  public selectPolicy(policy: SchoolDressPolicy): boolean {
    if (!this.canSelectPolicy || !this.availablePolicies.includes(policy) || this.state.dress.active === policy) return false;
    this.state.dress.active = policy;
    this.state.dress.previous = policy;
    return true;
  }

  public get requiresNudity(): boolean {
    if (!Time.schoolDay || Time.hour < 7 || Time.hour >= 17) return false;
    if (['earlynoschool', 'latenoschool', 'daynoschool'].includes(V.schoolstate)) return false;
    return this.state.dress.active === 'mandatoryNudity' || (this.state.dress.active === 'nudeDay' && Time.weekDay === 6);
  }

  public get allowsNudity(): boolean {
    return DRESS_POLICIES.indexOf(this.state.dress.active) >= DRESS_POLICIES.indexOf('optionalNudity');
  }

  public get canRequestPrefect(): boolean {
    return this.state.role === 'student';
  }

  public get canBecomePrefect(): boolean {
    return this.canRequestPrefect && V.schooltrait >= 4 && V.delinquency <= 0;
  }

  public appointPrefect(): boolean {
    if (!this.canBecomePrefect) return false;
    this.state.role = 'prefect';
    this.adjustStanding(2, 2, 4);
    return true;
  }

  public get canRequestPresident(): boolean {
    return this.state.role === 'prefect';
  }

  public get canBecomePresident(): boolean {
    return this.canRequestPresident && this.state.duties.completed >= 5 && this.state.studentSupport >= 25 && this.state.staffSupport >= 25 && this.state.order >= 25;
  }

  public appointPresident(): boolean {
    if (!this.canBecomePresident) return false;
    this.state.role = 'president';
    this.adjustStanding(0, 3, 3);
    return true;
  }

  public get canPerformDuty(): boolean {
    return (
      this.state.role !== 'student' &&
      Time.schoolDay &&
      Time.hour >= 7 &&
      Time.hour < 9 &&
      this.state.duties.lastDay !== Time.days &&
      SCHOOL_STUDENT_ROSTER.some(student => this.isStudentAvailable(student))
    );
  }

  public startDuty(): SchoolStudent | null {
    if (!this.canPerformDuty) return null;
    if (this.state.duties.target && this.isStudentAvailable(this.state.duties.target)) return this.state.duties.target;
    // 同一天固定同一目标，避免反复打开页面就能刷到更有利的学生。
    const available = SCHOOL_STUDENT_ROSTER.filter(student => this.isStudentAvailable(student));
    this.state.duties.target = available.length ? available[Time.days % available.length] : null;
    return this.state.duties.target;
  }

  public get canInviteStudent(): boolean {
    const student = this.state.duties.target;
    return this.canPerformDuty && student !== null && window.hasSexStat('promiscuity', 3);
  }

  public finishDuty(outcome: SchoolDutyOutcome): boolean {
    const target = this.state.duties.target;
    if (!this.canPerformDuty || !target || !['enforce', 'mediate', 'pressure', 'overlook', 'inviteAccepted', 'inviteRefused'].includes(outcome)) return false;

    // 私下谈话的好感结算随各人的亲近或受伤状态变化。
    let loveChange = DUTY_LOVE_CHANGES[target][outcome];
    if (outcome === 'mediate') {
      if (target === 'Robin' && C.npc.Robin.trauma >= 20) loveChange = 1;
      if (target === 'Sydney' && C.npc.Sydney.love >= 40 && C.npc.Sydney.corruption >= 30 && C.npc.Sydney.purity < 50) loveChange = 2;
      if (target === 'Kylar' && C.npc.Kylar.rage >= 60) loveChange = 1;
      if (target === 'Whitney' && (C.npc.Whitney.love >= 30 || V.whitneyromance === 1)) loveChange = 1;
    }
    if (outcome === 'pressure') {
      if (target === 'Robin' && C.npc.Robin.trauma >= 20) loveChange = -4;
      if (target === 'Sydney' && C.npc.Sydney.purity >= 50) loveChange = -3;
      if (target === 'Kylar' && C.npc.Kylar.rage >= 60) loveChange = -4;
      if (target === 'Whitney' && (C.npc.Whitney.love >= 30 || V.whitneyromance === 1)) loveChange = -4;
    }

    this.adjustStanding(...DUTY_STANDING_CHANGES[target][outcome]);

    this.state.duties.completed += 1;
    this.state.duties.lastDay = Time.days;
    this.adjustLove(target, loveChange);
    this.state.duties.target = null;
    return true;
  }

  public inviteStudent(): 'accepted' | 'refused' | 'unavailable' {
    const student = this.state.duties.target;
    if (!this.canInviteStudent || !student) return 'unavailable';

    // 校门口的私人邀约由关系与人物状态决定；满级特质保证的是战斗中的 Ask 请求。
    const accepted = (() => {
      switch (student) {
        case 'Robin':
          return C.npc.Robin.love >= 40 && C.npc.Robin.trauma < 20;
        case 'Sydney':
          return C.npc.Sydney.love >= 40 && C.npc.Sydney.corruption >= 30 && C.npc.Sydney.purity < 50;
        case 'Kylar':
          return C.npc.Kylar.love >= 30 && C.npc.Kylar.rage < 60;
        case 'Whitney':
          return C.npc.Whitney.love >= 30 || V.whitneyromance === 1;
      }
    })();

    if (!this.finishDuty(accepted ? 'inviteAccepted' : 'inviteRefused')) return 'unavailable';
    this.state.duties.encounter = accepted ? student : null;
    return accepted ? 'accepted' : 'refused';
  }

  public endEncounter(): void {
    this.state.duties.encounter = null;
  }

  public policyRequirements(policy: SchoolDressPolicy): SchoolPolicyRequirements {
    return POLICY_REQUIREMENTS[policy];
  }

  public get canProposePolicy(): boolean {
    return this.state.role === 'president' && this.nextPolicy !== null && this.state.dress.proposal === null && this.state.dress.trialUntil === 0 && Time.days >= this.state.dress.cooldownUntil;
  }

  public proposePolicy(): boolean {
    if (!this.canProposePolicy || !this.nextPolicy) return false;
    this.state.dress.proposal = this.nextPolicy;
    return true;
  }

  public withdrawProposal(): boolean {
    if (!this.state.dress.proposal) return false;
    this.state.dress.proposal = null;
    return true;
  }

  public prefersRevealingOutfit(student: SchoolStudent): boolean {
    if (student === 'Whitney') return true;
    return student === 'Sydney' && this.isStudentAvailable(student) && (C.npc.Sydney.corruption ?? 0) >= 30 && (C.npc.Sydney.purity ?? 0) < 50;
  }

  public canApprovePolicy(route: Exclude<SchoolApprovalRoute, 'none'>): boolean {
    const policy = this.state.dress.proposal;
    if (!policy) return false;

    const requirement = this.policyRequirements(policy);
    if (V.world_corruption_soft < requirement.corruption) return false;

    switch (route) {
      case 'formal':
        return this.state.staffSupport >= requirement.staffSupport && C.npc.Leighton.love >= requirement.leightonLove;
      case 'petition':
        return this.state.studentSupport >= requirement.studentSupport + 10 && this.state.order >= 20;
      case 'pressure':
        return V.headdrive === 1 || V.headblackmailed === 1;
    }
  }

  public approvePolicy(route: Exclude<SchoolApprovalRoute, 'none'>): boolean {
    const policy = this.state.dress.proposal;
    if (!policy || !this.canApprovePolicy(route)) return false;

    // 提案通过只开启七天试行；期满才由 reviewPolicy 决定保留还是回滚。
    this.state.dress.previous = this.state.dress.active;
    this.state.dress.active = policy;
    this.state.dress.proposal = null;
    this.state.dress.route = route;
    this.state.dress.trialUntil = Time.days + 7;

    if (route === 'formal') this.adjustStanding(1, 0, 1);
    if (route === 'petition') this.adjustStanding(0, 2, -1);
    if (route === 'pressure') this.adjustStanding(-2, -2, -2);
    return true;
  }

  public get canReviewPolicy(): boolean {
    return this.state.dress.trialUntil > 0 && Time.days >= this.state.dress.trialUntil;
  }

  public get canKeepPolicy(): boolean {
    const requirement = this.policyRequirements(this.state.dress.active);
    return (
      this.canReviewPolicy &&
      this.state.order >= 10 &&
      this.state.studentSupport >= Math.max(0, requirement.studentSupport - 10) &&
      this.state.staffSupport >= Math.max(0, requirement.staffSupport - 10)
    );
  }

  public reviewPolicy(keep: boolean): boolean {
    if (!this.canReviewPolicy || (keep && !this.canKeepPolicy)) return false;

    if (keep) {
      this.state.dress.highest = this.state.dress.active;
    } else {
      this.state.dress.active = this.state.dress.previous;
      this.state.dress.cooldownUntil = Time.days + 3;
    }

    this.state.dress.previous = this.state.dress.active;
    this.state.dress.route = 'none';
    this.state.dress.trialUntil = 0;
    return true;
  }

  private isStudentAvailable(student: SchoolStudent): boolean {
    const npc = C.npc?.[student];
    if (npc?.init !== 1 || ['prison', 'pillory', 'dungeon'].includes(npc.state)) return false;
    // 侧栏模块安装时复用其原版日程解析；未安装时只做最基本的 NPC 状态检查。
    if (!window.maplebirch.get('NPCSidebarPortrait')) return true;
    return SCHOOL_CAMPUS_LOCATIONS[student].includes(window.maplebirch.npc.Schedule.location[student] ?? '');
  }

  private adjustLove(student: SchoolStudent, change: number): void {
    const npc = C.npc?.[student];
    if (!npc) return;
    npc.love = Math.clamp((npc.love ?? 0) + change, 0, student === 'Whitney' ? 30 : student === 'Sydney' ? 150 : 100);
  }

  private adjustStanding(order: number, studentSupport: number, staffSupport: number): void {
    this.state.order = Math.clamp(this.state.order + order, 0, 100);
    this.state.studentSupport = Math.clamp(this.state.studentSupport + studentSupport, 0, 100);
    this.state.staffSupport = Math.clamp(this.state.staffSupport + staffSupport, 0, 100);
  }
}

export default School;
