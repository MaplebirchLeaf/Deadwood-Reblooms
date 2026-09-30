export type DivineEncounter = 'Default' | 'Struggle' | 'Tentacle';

interface DivineTransformationState {
  beautyBonus: number;
  expungeUsed: boolean;
}

interface StruggleEnemy {
  health: number;
  satisfied: number;
}

interface Tentacle {
  tentaclehealth: number;
  tentaclehealthstart: number;
  shaft: string;
}

class DivineTransformations {
  private static readonly ATTRIBUTE_MULTIPLIER = 1.1;
  private static readonly ATTRIBUTE_BONUS = 0.1;

  private get state(): DivineTransformationState | undefined {
    return V.VanillaPlus?.divineTransformations;
  }

  public get angel(): boolean {
    return Number(V.angel) >= 6;
  }

  public get fallenAngel(): boolean {
    return Number(V.fallenangel) >= 4;
  }

  public get demon(): boolean {
    return Number(V.demon) >= 6;
  }

  // 三种完整神圣转化各强化与其内核最贴近的一项数值，不改变原始成长值。
  public skillValue(skill: string, value: number): number {
    if ((skill === 'physique' && this.angel) || (skill === 'willpower' && this.fallenAngel)) return Math.floor(value * DivineTransformations.ATTRIBUTE_MULTIPLIER);
    return value;
  }

  public beautyCeiling(value: number): number {
    return this.demon ? Math.floor(value * DivineTransformations.ATTRIBUTE_MULTIPLIER) : value;
  }

  // 记录恶魔转化提供的容貌部分，转换或解除转化时只增减本模块实际施加的数值。
  private syncBeauty(): void {
    const state = this.state;
    if (!state) return;
    const previous = Number(state.beautyBonus) || 0;
    const base = Math.max(0, Number(V.beauty) - previous);
    const next = this.demon ? Math.floor(base * DivineTransformations.ATTRIBUTE_BONUS) : 0;
    if (previous === next) return;
    V.beauty = base + next;
    state.beautyBonus = next;
  }

  // 完整恶魔在遭遇战中始终拥有当前容量的体液，容量本身仍由原版转化和成长决定。
  private restoreFluids(): void {
    if (!this.demon || V.combat !== 1) return;
    if (V.player?.penisExist) V.semen_amount = Number(V.semen_volume) || 0;
    if (Number(V.lactating) >= 1) V.milk_amount = Number(V.milk_volume) || 0;
  }

  public fluidChange(value: number): number {
    return this.demon && V.combat === 1 && value < 0 ? 0 : value;
  }

  private damage(fixed: number, rate: number, maximum: unknown): number {
    return fixed + Math.floor(Math.max(0, Number(maximum) || 0) * rate);
  }

  private get struggleEnemies(): StruggleEnemy[] {
    return Object.values((V.struggle?.enemy ?? {}) as Record<string, StruggleEnemy>);
  }

  private get tentacles(): Tentacle[] {
    return Object.values((V.tentacles ?? {}) as Record<string, Tentacle>);
  }

  // 原版放逐的双手与满纯洁倍率在 passage 内结算，这里只提供每层的固定值与比例值。
  public banishDamage(maximum: unknown): number {
    return this.damage(10, 0.1, maximum);
  }

  public update(): void {
    this.syncBeauty();
    this.restoreFluids();
    if (V.combat !== 1 && this.state) this.state.expungeUsed = false;
  }

  public canExpunge(encounter: DivineEncounter): boolean {
    if (!this.fallenAngel || V.combat !== 1 || this.state?.expungeUsed || V.mouthuse) return false;
    if (encounter === 'Default') return V.enemytype !== 'man' && Number(V.enemyhealth) > 0;
    if (encounter === 'Struggle') return this.struggleEnemies.some(enemy => Number(enemy.health) > 0 && Number(enemy.satisfied) < 1);
    return this.tentacles.some(tentacle => Number(tentacle.tentaclehealth) > 0 && tentacle.shaft !== 'finished');
  }

  // “清除”承袭原版堕天使以体内空洞抹除异物的表现，每场遭遇只能发动一次。
  public expunge(encounter: DivineEncounter): boolean {
    const state = this.state;
    if (!state || !this.canExpunge(encounter)) return false;

    if (encounter === 'Default') {
      V.enemyhealth = Math.max(0, Number(V.enemyhealth) - this.damage(5, 0.05, V.enemyhealthmax));
    } else if (encounter === 'Struggle') {
      for (const enemy of this.struggleEnemies) {
        if (Number(enemy.health) > 0 && Number(enemy.satisfied) < 1) enemy.health = Math.max(0, Number(enemy.health) - this.damage(1, 0.05, enemy.health));
      }
    } else {
      for (const tentacle of this.tentacles) {
        if (Number(tentacle.tentaclehealth) > 0 && tentacle.shaft !== 'finished') {
          tentacle.tentaclehealth = Math.max(0, Number(tentacle.tentaclehealth) - this.damage(5, 0.05, tentacle.tentaclehealthstart));
        }
      }
    }

    state.expungeUsed = true;
    return true;
  }
}

export default DivineTransformations;
