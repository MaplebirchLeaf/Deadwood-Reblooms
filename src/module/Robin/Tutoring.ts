import Shared from './Shared';

export default class RobinTutoring extends Shared {
  /** 周家教收入，单位英镑。学期外为 0，六节以上提价。 */
  public get income(): number {
    return this.state.tutor && this.state.tutorLessons > 0 && Time.schoolTerm ? (this.state.tutorLessons >= 6 ? 60 : 40) : 0;
  }

  /** 开班条件：已拿到家教线索、摊位至少 1 级、罗宾服从度足够。 */
  public start(): boolean {
    if (!this.robinAvailable || !this.state.topics.tutor || this.state.tutor || Math.max(this.state.lemonade, this.state.chocolate) < 1 || C.npc.Robin.dom < 45) return false;
    this.state.tutor = true;
    // 当天尚未到授课时间，罗宾也能自行完成试课，已过授课时间则从下个上课日开始。
    this.state.tutorDay = Time.hour < 19 ? Time.days - 1 : Time.days;
    return true;
  }

  /** 今天是否还能与罗宾共同授课：上学日 17:30–18:30，且当日尚未授课。 */
  public get canTutorToday(): boolean {
    return (
      this.state.tutor &&
      Time.schoolDay &&
      this.state.tutorDay !== Time.days &&
      ((Time.hour === 17 && Time.minute >= 30) || (Time.hour === 18 && Time.minute < 30)) &&
      window.getRobinLocation() === 'tutor' &&
      !V.robinmissing &&
      V.robin.timer.hurt === 0 &&
      C.npc.Robin.trauma < 80
    );
  }

  /** 与罗宾共同授课一次，推进科目并结算收益。 */
  public teach(approach: 'lead' | 'together' | 'skills'): boolean {
    const pupil = V.per_npc?.deadwood_robin_tutor_pupil;
    const parent = V.per_npc?.deadwood_robin_tutor_parent;
    if (!this.canTutorToday || pupil?.name_known !== 1 || parent?.name_known !== 1 || !['lead', 'together', 'skills'].includes(approach)) return false;
    this.state.tutorDay = Time.days;
    this.state.tutorLessons++;
    this.state.tutorSubject = (this.state.tutorLessons - 1) % 3;
    // 只记录 PC 真正完成的帮课，进门后离开不会让学生进步或增加家长的信任。
    pupil.tutorConfidence = Math.min(6, (pupil.tutorConfidence ?? 0) + (approach === 'together' ? 2 : 1));
    parent.tutorVisits = (parent.tutorVisits ?? 0) + 1;
    V.money += 750;
    this.state.reserve += 8;
    return true;
  }
}
