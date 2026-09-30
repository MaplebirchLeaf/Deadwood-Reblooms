// ./src/module/VanillaPlus/Willpower.ts

import type VanillaPlus from '../VanillaPlus';

class Willpower {
  public constructor(private readonly vanillaPlus: VanillaPlus) {}

  private static readonly PAIN_LIMIT = 200;
  private static readonly PAIN_RECOVERY_LIMIT = 100;
  private static readonly PAIN_SHIELD_LIMIT = Willpower.PAIN_LIMIT / 2;

  private get state() {
    return V.VanillaPlus?.willpower?.painShield;
  }

  public get unlock(): boolean {
    const parasites = V.parasite ?? {};
    const earSlimes = Number(parasites.left_ear?.name === 'slime') + Number(parasites.right_ear?.name === 'slime');

    return (
      !V.VanillaPlus.lock.willpower &&
      V.willpower >= this.vanillaPlus.normalCeiling('willpower') &&
      earSlimes >= 2 &&
      V.VanillaPlus.willpower.wraith &&
      V.VanillaPlus.willpower.schism &&
      V.VanillaPlus.willpower.vigil &&
      V.wraithPrison?.state === 'recovering' &&
      V.wraithPrison?.search === 4
    );
  }

  public get max(): boolean {
    return V.VanillaPlus?.lock?.willpower && V.willpower >= this.vanillaPlus.ceiling('willpower');
  }

  public earSlime(value: number): number {
    return V.VanillaPlus.traits.willpower ? Infinity : value;
  }

  // 疼痛达到原版上限时，额外承受相当于上限 50% 的溢出伤害，真实疼痛仍由原版维护。
  public absorbPain(value: number): number {
    const shield = this.state;
    if (!shield) return value;
    if (!V.VanillaPlus.traits.willpower || V.combat !== 1 || V.gamemode === 'soft') {
      this.reset();
      return value;
    }

    if (value < Willpower.PAIN_RECOVERY_LIMIT) {
      this.rearm();
      return value;
    }

    if (shield.ready && value >= Willpower.PAIN_LIMIT) {
      shield.ready = false;
      shield.remaining = Willpower.PAIN_SHIELD_LIMIT;
      delete V.willpowerpain;
    }

    if (shield.remaining > 0 && value > Willpower.PAIN_LIMIT) {
      shield.remaining = Math.max(0, shield.remaining - (value - Willpower.PAIN_LIMIT));
      return Willpower.PAIN_LIMIT;
    }

    return value;
  }

  public checkPain(value: number): boolean {
    const shield = this.state;
    if (!shield) return true;
    if (!V.VanillaPlus.traits.willpower || V.combat !== 1) {
      this.reset();
      return true;
    }

    if (value < Willpower.PAIN_RECOVERY_LIMIT) {
      this.rearm();
      return true;
    }

    if (shield.ready && value >= Willpower.PAIN_LIMIT) this.absorbPain(value);
    if (shield.remaining <= 0) return true;

    delete V.willpowerpain;
    return false;
  }

  public reset(): void {
    const shield = this.state;
    if (!shield) return;
    shield.remaining = 0;
    shield.ready = true;
  }

  private rearm(): void {
    this.reset();
    delete V.willpowerpain;
  }
}

export default Willpower;
