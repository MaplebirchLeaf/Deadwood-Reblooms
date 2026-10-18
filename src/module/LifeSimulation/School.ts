// ./src/module/LifeSimulation/School.ts

import schoolData from '../../assets/life-simulation/school.json';

type SchoolRole = 'student' | 'prefect' | 'president';

export type SchoolDressPolicy = 'uniform' | 'free' | 'revealing' | 'optionalNudity' | 'nudeDay' | 'mandatoryNudity';

type SchoolApprovalRoute = 'none' | 'formal' | 'petition' | 'pressure';

type SchoolDutyOutcome = 'enforce' | 'mediate' | 'pressure' | 'overlook' | 'inviteAccepted' | 'inviteRefused';

export type SchoolStudent = 'Robin' | 'Sydney' | 'Kylar' | 'Whitney';

export interface SchoolState {
  role: SchoolRole;
  attendanceExempt: boolean;
  attendanceDay: number;
  // 住宅与西里斯庄园共用每日一次的课后辅导机会。
  study_session_day: number;
  council: {
    work_day: number;
    work: 'records' | 'mediate' | 'enforce' | 'delegate' | null;
    rest_day: number;
    study_day: number;
    /** 上次在学生会室里私会某个同学的游戏日。 */
    private_day: number;
    /** 上次私会的对象，用于后续文案。 */
    private_with: SchoolStudent | null;
  };
  leightonApprovalDay: number;
  baileySigned: boolean;
  studentSupport: number;
  staffSupport: number;
  corruption: number;
  feedback: [number, number, number] | null;
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

interface SchoolPolicyRequirements {
  studentSupport: number;
  staffSupport: number;
  corruption: number;
  leightonLove: number;
}

export const DEFAULT_SCHOOL_STATE: SchoolState = {
  role: 'student',
  attendanceExempt: false,
  attendanceDay: -1,
  study_session_day: -1,
  council: { work_day: -1, work: null, rest_day: -1, study_day: -1, private_day: -1, private_with: null },
  leightonApprovalDay: -1,
  baileySigned: false,
  studentSupport: 20,
  staffSupport: 20,
  corruption: 0,
  feedback: null,
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

// 制服政策按此顺序升级，highest 记录已保住的最高等级，active 可在一周试行后回退。
const POLICY_REQUIREMENTS: Record<SchoolDressPolicy, SchoolPolicyRequirements> = schoolData.policyRequirements;

export const SCHOOL_STUDENT_ROSTER: readonly SchoolStudent[] = ['Robin', 'Sydney', 'Kylar', 'Whitney'];

export const SCHOOL_CAMPUS_LOCATIONS: Record<SchoolStudent, readonly string[]> = schoolData.campusLocations;

const DUTY_LOVE_CHANGES: Record<SchoolStudent, Record<SchoolDutyOutcome, number>> = schoolData.dutyLoveChanges;

const DUTY_STANDING_CHANGES: Record<SchoolStudent, Record<SchoolDutyOutcome, readonly [number, number, number]>> = {
  Robin: { enforce: [-1, 2, 0], mediate: [2, 0, -1], pressure: [-3, -1, 3], overlook: [0, -1, 1], inviteAccepted: [0, -1, 3], inviteRefused: [-1, 0, 1] },
  Sydney: { enforce: [0, 2, 0], mediate: [2, 0, -1], pressure: [-2, -1, 3], overlook: [0, -1, 1], inviteAccepted: [-1, -1, 3], inviteRefused: [-1, 0, 1] },
  Kylar: { enforce: [-2, 2, 0], mediate: [2, 0, -1], pressure: [-3, -1, 3], overlook: [0, -1, 1], inviteAccepted: [0, -1, 3], inviteRefused: [-2, 0, 1] },
  Whitney: { enforce: [1, 2, 0], mediate: [1, 0, -1], pressure: [-2, -1, 3], overlook: [-1, -1, 1], inviteAccepted: [0, -2, 3], inviteRefused: [-1, 0, 1] }
};

class School {
  public readonly policies = DRESS_POLICIES;
  public readonly policyRequirements = POLICY_REQUIREMENTS;

  private get state(): SchoolState {
    return V.LifeSimulation.school as SchoolState;
  }

  /** 当前穿着是否满足已生效的着装政策。政策为 uniform 时沿用原版判定。 */
  public meetsDressCode(vanillaAccepted: boolean): boolean {
    const policy = V.LifeSimulation?.school?.dress?.active as SchoolDressPolicy | undefined;
    if (!policy || policy === 'uniform' || !['school', 'school_rear_courtyard', 'pool'].includes(V.location)) return vanillaAccepted;

    const worn = V.worn as Record<string, { name?: string; type?: string[] } | undefined>;
    const dressed = (slot: string) => worn?.[slot]?.name !== undefined && worn[slot]?.name !== 'naked';
    const overalls = worn?.lower?.type?.includes('overalls') === true;

    if (policy === 'free') return overalls || (dressed('upper') && dressed('lower'));
    if (policy === 'revealing') return overalls || ['upper', 'lower', 'under_upper', 'under_lower'].some(dressed);
    if (this.requiresNudity) return ['upper', 'lower', 'under_upper', 'under_lower'].every(slot => worn?.[slot]?.name === 'naked');
    return this.allowsNudity || vanillaAccepted;
  }

  public selectPolicy(policy: SchoolDressPolicy): boolean {
    const index = DRESS_POLICIES.indexOf(policy);
    if (
      this.state.role !== 'president' ||
      this.state.dress.proposal !== null ||
      this.state.dress.trialUntil !== 0 ||
      index < 0 ||
      index > DRESS_POLICIES.indexOf(this.state.dress.highest) ||
      this.state.dress.active === policy
    )
      return false;
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
    return (
      ['school', 'school_rear_courtyard', 'pool'].includes(V.location) &&
      this.councilOpen &&
      !['earlynoschool', 'latenoschool', 'daynoschool'].includes(V.schoolstate) &&
      DRESS_POLICIES.indexOf(this.state.dress.active) >= DRESS_POLICIES.indexOf('optionalNudity')
    );
  }

  public get canRequestAttendanceExemption(): boolean {
    const topMarks = V.schooltrait >= 4 && V.sciencetrait >= 4 && V.mathstrait >= 4 && V.englishtrait >= 4 && V.historytrait >= 4;
    return !(this.state.attendanceExempt || this.state.leightonApprovalDay >= 0 || !topMarks || (C.npc.Leighton.love < 10 && V.headblackmailed !== 1));
  }

  public get canSignAttendanceExemption(): boolean {
    return !(this.state.attendanceExempt || this.state.baileySigned || this.state.leightonApprovalDay < 0 || (!V.RobinExpansion?.bailey_defeated && V.baileypaychain < 3));
  }

  public get canGrantAttendanceExemption(): boolean {
    return !(this.state.attendanceExempt || this.state.leightonApprovalDay < 0 || !this.state.baileySigned);
  }

  /** 项目约定不覆盖缺席、受伤或收容。校园内协助还要求罗宾实际在校。 */
  public get historyAssistantAvailable(): boolean {
    if (!V.LifeSimulation.historyProject.assistant || C.npc.Robin?.init !== 1 || V.robinmissing || V.robin?.timer?.hurt !== 0 || V.RobinExpansion?.asylum?.status === 'admitted') return false;
    const location = window.getRobinLocation();
    return location !== 'asylum' && (V.location !== 'school' || location === 'school');
  }

  public get canSupplyDrinks(): boolean {
    return this.state.role !== 'student' && V.RobinExpansion?.shop === true && V.RobinExpansion.shop_stock > 0 && V.RobinExpansion.school_drinks_day !== Time.days;
  }

  public organiseSchoolDrinks(): boolean {
    if (!this.canSupplyDrinks) return false;
    V.RobinExpansion.shop_stock -= 1;
    V.RobinExpansion.reserve += 20;
    V.RobinExpansion.school_drinks_day = Time.days;
    this.adjustStanding(3, 1);
    return true;
  }

  public organiseStudySession(prepared: boolean): boolean {
    if (this.state.role === 'student' || this.state.study_session_day === Time.days) return false;
    this.state.study_session_day = Time.days;
    this.adjustStanding(prepared ? 3 : 1, prepared ? 2 : 0, 0);
    return true;
  }

  public appointPrefect(pressure = false): boolean {
    if (!this.canRequestPrefect) return false;
    if (pressure ? V.headblackmailed !== 1 : C.npc.Leighton.love < 10) return false;
    this.state.role = 'prefect';
    if (pressure) this.adjustStanding(-2, -4, 6);
    else this.adjustStanding(2, 4);
    return true;
  }

  public get canRequestPrefect(): boolean {
    return this.state.role === 'student' && V.delinquency <= 0 && V.cool >= 160;
  }

  public get councilOpen(): boolean {
    return Time.schoolDay && Time.hour >= 7 && Time.hour < 17;
  }

  public get councilGuest(): SchoolStudent | null {
    if (!this.councilOpen || (Time.hour >= 9 && Time.hour !== 12 && Time.hour < 15)) return null;
    const students = SCHOOL_STUDENT_ROSTER.filter(student => this.isStudentAvailable(student));
    return students.length ? students[Time.days % students.length] : null;
  }

  public get canPrivateMeeting(): boolean {
    const guest = this.councilGuest;
    if (!guest || !this.councilOpen || this.state.role === 'student') return false;
    if (V.combat === 1 || V.statFreeze) return false;
    if (this.state.council.private_day === Time.days) return false;
    return C.npc[guest]?.init === 1 && (C.npc[guest].love ?? 0) >= 30 && (C.npc[guest].trauma ?? 0) < 60 && window.isLoveInterest(guest);
  }

  public get councilPrivatePartner(): SchoolStudent | null {
    return this.state.council.private_with;
  }

  public recordPrivateMeeting(guest: SchoolStudent): boolean {
    if (!this.canPrivateMeeting || this.councilGuest !== guest) return false;
    this.state.council.private_day = Time.days;
    this.state.council.private_with = guest;
    return true;
  }

  public get canDelegate(): boolean {
    return (
      this.councilOpen && Time.hour < 9 && this.state.role === 'president' && this.state.duties.lastDay !== Time.days && this.state.duties.target === null && this.state.council.work_day !== Time.days
    );
  }

  public resolveCouncil(choice: SchoolState['council']['work']): boolean {
    if (!choice || !this.councilOpen || V.location !== 'school' || V.combat === 1 || V.statFreeze || this.state.council.work_day === Time.days) return false;
    if (choice !== 'records' && this.state.role === 'student') return false;
    switch (choice) {
      case 'records':
        this.adjustStanding(1, 1);
        break;
      case 'mediate':
        this.adjustStanding(3, 1);
        break;
      case 'enforce':
        this.adjustStanding(-2, 2);
        break;
      case 'delegate':
        if (!this.canDelegate) return false;
        this.state.duties.lastDay = Time.days;
        this.adjustStanding(0, 1);
        break;
      default:
        return false;
    }
    this.state.council.work_day = Time.days;
    this.state.council.work = choice;
    return true;
  }

  public get canAppointPresident(): boolean {
    return this.state.role === 'prefect' && this.state.duties.completed >= 5 && this.state.studentSupport >= 25 && this.state.staffSupport >= 25;
  }

  public appointPresident(): boolean {
    if (!this.canAppointPresident) return false;
    this.state.role = 'president';
    this.adjustStanding(3, 3);
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
      if (target === 'Whitney' && (C.npc.Whitney.love >= 25 || V.whitneyromance === 1)) loveChange = 1;
    }
    if (outcome === 'pressure') {
      if (target === 'Robin' && C.npc.Robin.trauma >= 20) loveChange = -4;
      if (target === 'Sydney' && C.npc.Sydney.purity >= 50) loveChange = -3;
      if (target === 'Kylar' && C.npc.Kylar.rage >= 60) loveChange = -4;
      if (target === 'Whitney' && (C.npc.Whitney.love >= 25 || V.whitneyromance === 1)) loveChange = -4;
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

    // 校门口的私人邀约由关系与人物状态决定，满级特质保证的是战斗中的 Ask 请求。
    const accepted = (() => {
      switch (student) {
        case 'Robin':
          return C.npc.Robin.love >= 40 && C.npc.Robin.trauma < 20;
        case 'Sydney':
          return C.npc.Sydney.love >= 40 && C.npc.Sydney.corruption >= 30 && C.npc.Sydney.purity < 50;
        case 'Kylar':
          return C.npc.Kylar.love >= 30 && C.npc.Kylar.rage < 60;
        case 'Whitney':
          return C.npc.Whitney.love >= 25 || V.whitneyromance === 1;
      }
    })();

    if (!this.finishDuty(accepted ? 'inviteAccepted' : 'inviteRefused')) return 'unavailable';
    this.state.duties.encounter = accepted ? student : null;
    return accepted ? 'accepted' : 'refused';
  }

  public get canProposePolicy(): boolean {
    return this.state.role === 'president' && this.nextPolicy !== undefined && this.state.dress.proposal === null && this.state.dress.trialUntil === 0 && Time.days >= this.state.dress.cooldownUntil;
  }

  private get nextPolicy(): SchoolDressPolicy | undefined {
    return DRESS_POLICIES[DRESS_POLICIES.indexOf(this.state.dress.highest) + 1];
  }

  public proposePolicy(): boolean {
    const next = this.nextPolicy;
    if (!this.canProposePolicy || !next) return false;
    this.state.dress.proposal = next;
    return true;
  }

  public prefersRevealingOutfit(student: SchoolStudent): boolean {
    if (student === 'Whitney') return true;
    return student === 'Sydney' && this.isStudentAvailable(student) && (C.npc.Sydney.corruption ?? 0) >= 30 && (C.npc.Sydney.purity ?? 0) < 50;
  }

  public canApprovePolicy(route: Exclude<SchoolApprovalRoute, 'none'>): boolean {
    const policy = this.state.dress.proposal;
    if (!policy) return false;

    const requirement = this.policyRequirements[policy];
    if (this.state.corruption < requirement.corruption || V.world_corruption_soft < requirement.corruption) return false;

    switch (route) {
      case 'formal':
        return this.state.staffSupport >= requirement.staffSupport && C.npc.Leighton.love >= requirement.leightonLove;
      case 'petition':
        return this.state.studentSupport >= requirement.studentSupport + 10;
      case 'pressure':
        return V.headdrive === 1 || V.headblackmailed === 1;
    }
  }

  public approvePolicy(route: Exclude<SchoolApprovalRoute, 'none'>): boolean {
    const policy = this.state.dress.proposal;
    if (!policy || !this.canApprovePolicy(route)) return false;

    // 提案通过只开启七天试行，期满才由 reviewPolicy 决定保留还是回滚。
    this.state.dress.previous = this.state.dress.active;
    this.state.dress.active = policy;
    this.state.dress.proposal = null;
    this.state.dress.route = route;
    this.state.dress.trialUntil = Time.days + 7;

    if (route === 'formal') this.adjustStanding(0, 1, -1);
    if (route === 'petition') this.adjustStanding(2, -1, 0);
    if (route === 'pressure') this.adjustStanding(-2, -2, 5);
    return true;
  }

  public get canReviewPolicy(): boolean {
    return this.state.dress.trialUntil > 0 && Time.days >= this.state.dress.trialUntil;
  }

  public get canKeepPolicy(): boolean {
    const requirement = this.policyRequirements[this.state.dress.active];
    return this.canReviewPolicy && this.state.studentSupport >= Math.max(0, requirement.studentSupport - 10) && this.state.staffSupport >= Math.max(0, requirement.staffSupport - 10);
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
    // 人物出勤由原版日程决定，与侧栏立绘开关无关。
    if (student === 'Robin') return !V.robinmissing && V.robin.timer.hurt === 0 && V.RobinExpansion?.asylum?.status !== 'admitted' && window.getRobinLocation() === 'school';
    if (student === 'Sydney' && (V.daily.sydney?.punish === 1 || (V.sydney_location_override && V.replayScene))) return false;
    switch (student) {
      case 'Kylar':
        if (Time.schoolDay && Time.hour >= 7 && Time.hour < 9) return true;
        return SCHOOL_CAMPUS_LOCATIONS.Kylar.includes(window.getKylarLocation().area);
      case 'Sydney':
        window.sydneySchedule?.();
        // late 只表示晨间尚未到校，原版当天午后仍会正常到校。
        return T.sydney_location !== 'late' && SCHOOL_CAMPUS_LOCATIONS.Sydney.includes(T.sydney_location ?? '');
      case 'Whitney':
        return Time.schoolDay && Time.hour >= 7 && Time.hour < 17;
    }
  }

  private adjustLove(student: SchoolStudent, change: number): void {
    const npc = C.npc?.[student];
    if (!npc) return;
    npc.love = Math.clamp((npc.love ?? 0) + change, 0, student === 'Whitney' ? 30 : student === 'Sydney' ? 150 : 100);
  }

  private adjustStanding(studentSupport: number, staffSupport: number, corruption = 0): void {
    const previous: [number, number, number] = [this.state.studentSupport, this.state.staffSupport, this.state.corruption];
    this.state.studentSupport = Math.clamp(previous[0] + studentSupport, 0, 100);
    this.state.staffSupport = Math.clamp(previous[1] + staffSupport, 0, 100);
    this.state.corruption = Math.clamp(previous[2] + corruption, 0, 100);
    this.state.feedback = [this.state.studentSupport - previous[0], this.state.staffSupport - previous[1], this.state.corruption - previous[2]];
  }

  /** 在原版每次每日学校结算后豁免新增旷课，保留实际出勤消除旧记录的收益。 */
  public attendance(settle: () => void): void {
    if (!this.state.attendanceExempt) {
      settle();
      return;
    }
    const total = V.lessonmissed;
    const subjects = { ...V.schoolLessonsMissed };
    settle();
    V.lessonmissed = Math.min(V.lessonmissed, total);
    V.lessonmissedtext = 0;
    Object.assign(V.schoolLessonsMissed, subjects);
  }
}

export default School;
