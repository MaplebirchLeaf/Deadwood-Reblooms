// ./src/module/Transport/DrivingSchool.ts

import type Transport from '../Transport';

type DrivingCategory = 'motorcycle' | 'motor_vehicle';
type SchoolActivity = 'apply' | 'collect' | 'study' | 'theory' | 'lesson' | 'cbt' | 'module_1' | 'test' | 'bribe' | 'tamper';
type SchoolResult =
  | 'applied'
  | 'collected'
  | 'study'
  | 'theory_passed'
  | 'theory_failed'
  | 'lesson'
  | 'cbt'
  | 'module_1_passed'
  | 'failed'
  | 'passed'
  | 'bribed'
  | 'tampered'
  | 'refused'
  | 'caught'
  | 'interrupted'
  | null;

interface DrivingRecord {
  theory: boolean;
  study: number;
  lessons: number;
  practice: number;
  licensed: boolean;
  theory_retest_day: number;
  retest_day: number;
}

interface MotorcycleRecord extends DrivingRecord {
  cbt_completed: boolean;
  module_1: boolean;
}

interface RoadExam {
  category: DrivingCategory;
  day: number;
  step: number;
  variants: number[];
  observed: boolean;
  minor_faults: number;
  serious_faults: number;
}

interface SchoolState {
  provisional: { applied_day: number; ready_day: number; issued: boolean };
  motorcycle: MotorcycleRecord;
  motor_vehicle: DrivingRecord;
  category: DrivingCategory;
  test_day: number;
  penalty_until: number;
  revision: number;
  result: SchoolResult;
  attempt: { category: DrivingCategory; stage: 'module_1' | 'road'; day: number; close_call: boolean; resolved: boolean } | null;
  exam: RoadExam | null;
  report: { minor_faults: number; serious_faults: number } | null;
}

class DrivingSchool {
  public static readonly defaults: SchoolState = {
    provisional: { applied_day: -1, ready_day: -1, issued: false },
    motorcycle: { theory: false, study: 0, lessons: 0, practice: 0, licensed: false, theory_retest_day: -1, retest_day: -1, cbt_completed: false, module_1: false },
    motor_vehicle: { theory: false, study: 0, lessons: 0, practice: 0, licensed: false, theory_retest_day: -1, retest_day: -1 },
    category: 'motor_vehicle',
    test_day: -1,
    penalty_until: -1,
    revision: 0,
    result: null,
    attempt: null,
    exam: null,
    report: null
  };

  private working = false;

  public constructor(private readonly transport: Transport) {}

  public get state(): SchoolState {
    return this.transport.state.school;
  }

  public get record(): DrivingRecord {
    return this.state[this.state.category];
  }

  public get terms(): { provisional_fee: number; study_fee: number; theory_fee: number; lesson_fee: number; cbt_fee: number; module_1_fee: number; test_fee: number; bribe_fee: number } {
    const motorcycle = this.state.category === 'motorcycle';
    const weekend = Time.weekDay === 7;
    return {
      provisional_fee: 4300,
      study_fee: 3000,
      theory_fee: 2300,
      lesson_fee: motorcycle ? 4500 : 5000,
      cbt_fee: 16000,
      module_1_fee: 1550,
      test_fee: motorcycle ? (weekend ? 8850 : 7500) : weekend ? 7500 : 6200,
      bribe_fee: motorcycle ? 50000 : 80000
    };
  }

  public get available(): boolean {
    return (
      !this.working &&
      this.transport.ready &&
      V.id > 0 &&
      V.drunk <= 0 &&
      V.drugged <= 0 &&
      !V.worn.feet.type.includes('shackle') &&
      this.transport.core.passage.title === 'Deadwood Transport School' &&
      Time.hour >= 9 &&
      Time.hour < 18 &&
      Time.weekDay !== 1 &&
      Time.days >= this.state.penalty_until
    );
  }

  public get canApply(): boolean {
    return this.available && !this.state.exam && this.state.provisional.applied_day < 0 && !this.state.provisional.issued && Time.hour < 17 && this.transport.canPay(this.terms.provisional_fee);
  }

  public get canCollect(): boolean {
    return this.available && !this.state.exam && !this.state.provisional.issued && this.state.provisional.ready_day >= 0 && Time.days >= this.state.provisional.ready_day && Time.hour < 17;
  }

  public get motorcycleLearner(): boolean {
    return this.state.provisional.issued && !this.state.motorcycle.licensed && this.state.motorcycle.cbt_completed;
  }

  public get canStudy(): boolean {
    return (
      this.available &&
      !this.state.exam &&
      this.state.provisional.issued &&
      !this.record.licensed &&
      !this.record.theory &&
      this.record.study < 3 &&
      Time.hour < 17 &&
      this.transport.canPay(this.terms.study_fee)
    );
  }

  public get canTheory(): boolean {
    return (
      this.available &&
      !this.state.exam &&
      this.state.provisional.issued &&
      !this.record.licensed &&
      !this.record.theory &&
      Time.days >= this.record.theory_retest_day &&
      this.state.test_day !== Time.days &&
      Time.hour < 16 &&
      this.transport.canPay(this.terms.theory_fee)
    );
  }

  public get canTrain(): boolean {
    return (
      this.available &&
      this.practicalWeather &&
      !this.state.exam &&
      this.state.provisional.issued &&
      (this.record.practice < 1000 || this.transport.state.driving < 1000) &&
      Time.hour < 17 &&
      this.transport.canPay(this.terms.lesson_fee)
    );
  }

  public get canCBT(): boolean {
    return (
      this.available &&
      this.practicalWeather &&
      !this.state.exam &&
      this.state.category === 'motorcycle' &&
      this.state.provisional.issued &&
      !this.state.motorcycle.licensed &&
      !this.motorcycleLearner &&
      Time.hour < 12 &&
      this.transport.canPay(this.terms.cbt_fee)
    );
  }

  public get canModuleOne(): boolean {
    return this.state.category === 'motorcycle' && !this.state.motorcycle.module_1 && this.motorcycleLearner && this.canPractical && this.transport.canPay(this.terms.module_1_fee);
  }

  public get canTest(): boolean {
    return this.canPractical && (this.state.category !== 'motorcycle' || (this.motorcycleLearner && this.state.motorcycle.module_1)) && this.transport.canPay(this.terms.test_fee);
  }

  private get canPractical(): boolean {
    return (
      this.available &&
      this.practicalWeather &&
      !this.state.exam &&
      this.state.provisional.issued &&
      this.record.theory &&
      !this.record.licensed &&
      this.record.practice >= 200 &&
      this.transport.state.driving >= 300 &&
      Time.days >= this.record.retest_day &&
      this.state.test_day !== Time.days &&
      Time.hour < 17
    );
  }

  public get canAlter(): boolean {
    const attempt = this.state.attempt;
    return (
      this.available &&
      !this.state.exam &&
      attempt != null &&
      attempt.category === this.state.category &&
      attempt.day === Time.days &&
      attempt.close_call &&
      !attempt.resolved &&
      !this.record.licensed &&
      Time.hour < 17
    );
  }

  public get canBribe(): boolean {
    return this.canAlter && V.money >= this.terms.bribe_fee;
  }

  public get canTamper(): boolean {
    return this.canAlter && window.currentSkillValue('skulduggery') >= 400;
  }

  public get examActive(): boolean {
    return this.available && this.practicalWeather && this.state.exam != null && this.state.exam.category === this.state.category && this.state.exam.day === Time.days;
  }

  public get practicalWeather(): boolean {
    return !Weather.isSnow && Weather.precipitation !== 'snow' && !(Weather.precipitation === 'rain' && Weather.precipitationIntensity >= 2);
  }

  public get scene(): 'junction' | 'passing' | 'roundabout' | 'stopping' | null {
    return this.state.exam ? ((['junction', 'passing', 'roundabout', 'stopping'] as const)[this.state.exam.step] ?? null) : null;
  }

  public get hazardAware(): boolean {
    return this.transport.state.driving >= 600 || this.state.exam?.observed === true;
  }

  private spend(fee: number, minutes: number): boolean {
    const passage = this.transport.core.passage.title;
    const day = Time.days;
    this.working = true;
    try {
      this.transport.core.SugarCube.Wikifier.wikifyEval(`<<money -${fee} 'transport'>><<pass ${minutes}>>`);
      return this.transport.core.passage.title === passage && Time.days === day && this.transport.ready;
    } finally {
      this.working = false;
    }
  }

  public attend(activity: SchoolActivity, revision: number = this.state.revision): boolean {
    if (revision !== this.state.revision) return false;
    const allowed = {
      apply: this.canApply,
      collect: this.canCollect,
      study: this.canStudy,
      theory: this.canTheory,
      lesson: this.canTrain,
      cbt: this.canCBT,
      module_1: this.canModuleOne,
      test: this.canTest,
      bribe: this.canBribe,
      tamper: this.canTamper
    };
    if (!allowed[activity]) return false;
    const record = this.record;
    const category = this.state.category;
    const day = Time.days;
    const fee = {
      apply: this.terms.provisional_fee,
      collect: 0,
      study: this.terms.study_fee,
      theory: this.terms.theory_fee,
      lesson: this.terms.lesson_fee,
      cbt: this.terms.cbt_fee,
      module_1: this.terms.module_1_fee,
      test: this.terms.test_fee,
      bribe: 0,
      tamper: 0
    }[activity];
    const minutes = activity === 'cbt' ? 360 : ['study', 'lesson'].includes(activity) ? 60 : activity === 'theory' ? 90 : activity === 'test' ? 5 : activity === 'module_1' ? 20 : 15;
    this.state.revision++;
    this.state.result = null;
    if (activity === 'apply') {
      this.state.provisional.applied_day = day;
      this.state.provisional.ready_day = day + 1;
    } else if (activity === 'collect') this.state.provisional.issued = true;
    else if (activity === 'theory' || activity === 'module_1' || activity === 'test') {
      this.state.test_day = day;
      this.state.attempt = null;
      this.state.report = null;
    } else if (activity === 'bribe' || activity === 'tamper') this.state.attempt!.resolved = true;
    if (!this.spend(fee, minutes)) return false;
    if (this.state.category !== category) return false;
    if (activity === 'bribe' && V.money < this.terms.bribe_fee) {
      this.state.result = 'interrupted';
      return true;
    }
    if (['lesson', 'cbt', 'module_1', 'test'].includes(activity) && !this.practicalWeather) {
      this.state.result = 'interrupted';
      return true;
    }
    if (activity === 'apply' || activity === 'collect') this.state.result = activity === 'apply' ? 'applied' : 'collected';
    else if (activity === 'study') {
      record.study = Math.min(3, record.study + 1);
      this.state.result = 'study';
    } else if (activity === 'lesson' || activity === 'cbt') {
      const gain = activity === 'cbt' ? 150 : 70;
      record.practice = Math.min(1000, record.practice + gain);
      record.lessons++;
      this.transport.state.driving = Math.min(1000, this.transport.state.driving + gain);
      if (activity === 'cbt') this.state.motorcycle.cbt_completed = true;
      this.state.result = activity;
    } else if (activity === 'theory') {
      record.theory = this.transport.core.get('DeadwoodReblooms')!.rng <= 35 + record.study * 20;
      record.theory_retest_day = record.theory ? -1 : day + 1;
      this.state.result = record.theory ? 'theory_passed' : 'theory_failed';
    } else if (activity === 'module_1') {
      const chance = Math.min(95, 20 + (record.practice + this.transport.state.driving) / 20);
      const roll = this.transport.core.get('DeadwoodReblooms')!.rng;
      if (roll <= chance) {
        this.state.motorcycle.module_1 = true;
        record.retest_day = -1;
        this.state.result = 'module_1_passed';
      } else {
        record.retest_day = day + 1;
        this.state.attempt = { category, stage: 'module_1', day, close_call: roll <= chance + 15, resolved: false };
        this.state.result = 'failed';
      }
    } else if (activity === 'test') {
      const random = this.transport.core.get('DeadwoodReblooms')!.rand;
      this.state.exam = { category, day, step: 0, variants: Array.from({ length: 4 }, () => random.int(1)), observed: false, minor_faults: 0, serious_faults: 0 };
    } else {
      const chance = activity === 'bribe' ? 55 : Math.min(85, 20 + window.currentSkillValue('skulduggery') / 15);
      const passed = this.transport.core.get('DeadwoodReblooms')!.rng <= chance;
      if (passed) {
        if (activity === 'bribe') this.transport.core.SugarCube.Wikifier.wikifyEval(`<<money -${this.terms.bribe_fee} 'transport_bribe'>>`);
        if (this.state.attempt!.stage === 'module_1') this.state.motorcycle.module_1 = true;
        else record.licensed = true;
        record.retest_day = -1;
        this.state.result = activity === 'bribe' ? 'bribed' : 'tampered';
      } else {
        this.state.penalty_until = day + 3;
        this.state.result = activity === 'bribe' ? 'refused' : 'caught';
        this.transport.core.SugarCube.Wikifier.wikifyEval("<<crimeUp 50 'petty'>><<stress 2>>");
      }
    }
    return true;
  }

  public observe(step: number): boolean {
    const exam = this.state.exam;
    if (!this.examActive || !exam || exam.step !== step || exam.observed || this.hazardAware) return false;
    exam.observed = true;
    if (this.spend(0, 1)) return true;
    this.abandon();
    return false;
  }

  public drive(choice: string, step: number): boolean {
    const exam = this.state.exam;
    if (!this.examActive || !exam || exam.step !== step) return false;
    const record = this.state[exam.category];
    const variant = exam.variants[step];
    const choices = {
      junction: variant === 0 ? { wait: 0, edge: 2, go: -1 } : { wait: 2, edge: 0, go: -1 },
      passing: variant === 0 ? { hold: 0, pass: -1, squeeze: -1 } : { hold: 2, pass: 0, squeeze: -1 },
      roundabout: variant === 0 ? { wait: 0, enter: -1, outer: 2 } : { wait: 2, enter: 0, outer: 2 },
      stopping: variant === 0 ? { here: 2, ahead: 0, hurry: -1 } : { here: 0, ahead: 2, hurry: -1 }
    };
    const scene = this.scene;
    const faults = scene ? (choices[scene] as Record<string, number>) : null;
    if (!faults || !Object.hasOwn(faults, choice)) return false;
    const fault = faults[choice];
    if (fault < 0) exam.serious_faults++;
    else {
      exam.minor_faults += fault;
      if (fault === 0) {
        const stability = Math.min(98, 60 + (record.practice + this.transport.state.driving) / 50);
        const roll = this.transport.core.get('DeadwoodReblooms')!.rng;
        if (roll > stability) exam.minor_faults += roll > stability + 15 ? 2 : 1;
      }
    }
    exam.step++;
    exam.observed = false;
    if (!this.spend(0, 10)) {
      this.abandon();
      return false;
    }
    if (!this.practicalWeather) {
      this.abandon();
      return true;
    }
    if (exam.step < 4 && exam.serious_faults === 0) return true;
    record.licensed = exam.serious_faults === 0 && exam.minor_faults <= 3;
    this.state.result = record.licensed ? 'passed' : 'failed';
    record.retest_day = record.licensed ? -1 : Time.days + 1;
    this.state.attempt = record.licensed ? null : { category: exam.category, stage: 'road', day: exam.day, close_call: exam.serious_faults === 0 && exam.minor_faults <= 5, resolved: false };
    this.state.report = { minor_faults: exam.minor_faults, serious_faults: exam.serious_faults };
    this.state.exam = null;
    return true;
  }

  public abandon(): void {
    if (!this.state.exam) return;
    this.state[this.state.exam.category].retest_day = Time.days + 1;
    this.state.exam = null;
    this.state.result = 'interrupted';
  }
}

export default DrivingSchool;
