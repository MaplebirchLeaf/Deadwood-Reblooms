type Hand = 'left' | 'right';
type Weapon = 'whip' | 'baton';

interface Tentacle {
  id: string;
  type: string;
  shaft: string | number;
  tentaclehealth: number;
  tentaclehealthstart: number;
  fullDesc: string;
}

export default class Weapons {
  public get weapon(): Weapon | undefined {
    const weapon = V.temple_weapon;
    return (weapon === 'whip' || weapon === 'baton') && Number.isFinite(V.prof?.[weapon]) ? weapon : undefined;
  }

  private target(hand?: Hand) {
    const id = hand ? V[`${hand}actionTarget`] : undefined;
    return Object.values((V.tentacles ?? {}) as Record<string, Tentacle | number>).find(
      (target): target is Tentacle =>
        typeof target === 'object' &&
        target !== null &&
        (!hand || target.id === id) &&
        ['tentacle', 'vine', 'root', 'shoot', 'tendril'].includes(target.type) &&
        target.shaft !== 'finished' &&
        target.tentaclehealth > 0
    );
  }

  public can(hand: Hand): boolean {
    // 混合遭遇沿用原版每只手的目标分类，选中本体时不能攻击旁边的触手。
    return (
      V.combat === 1 &&
      (V.enemytype === 'tentacles' || (V.abomination === 1 && ['man', 'plant'].includes(V.enemytype))) &&
      V[`${hand}target`] === 'tentacles' &&
      !V.vorecreature &&
      !(V.vorestage > 0) &&
      V.consensual === 0 &&
      V.position !== 'stalk' &&
      V[`${hand}arm`] === 0 &&
      !(V.orgasmdown > 0) &&
      !(V.dissociation >= 2) &&
      !(V.pain >= 100 && V.willpowerpain === 0) &&
      !(V.trance > 0 || V.panicparalysis > 0 || V.panicviolence > 0) &&
      !!this.weapon &&
      !!this.target()
    );
  }

  public hit(hand: Hand) {
    if (!this.can(hand)) return;
    const target = this.target(hand);
    if (!target) return;
    const weapon = this.weapon!;
    const skill = Math.max(0, Math.min(1000, V.prof[weapon])) / 1000;
    const health = Number.isFinite(target.tentaclehealthstart) ? target.tentaclehealthstart : target.tentaclehealth;
    // 原版单手放逐至少造成 10 点伤害，普通武器的单次伤害保持在它之下。
    const damage = Math.min(9, 2 + Math.floor(Math.max(0, health) * (0.05 + skill * 0.05)));
    target.tentaclehealth -= damage;
    // 神殿只借出一件武器。两手都选中时仍只结算一次，不复制武器。
    const other = hand === 'left' ? 'right' : 'left';
    if (V[`${other}action`] === 'lsWeapon') {
      V[`${other}action`] = 0;
      V[`${other}actiondefault`] = 'lsWeapon';
    }
    return { weapon, target, damage };
  }
}
