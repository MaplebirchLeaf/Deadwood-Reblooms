import Module from './Module';
import Achievements from './Achievements';
import Jobs from './StreetLife/Jobs';
import Bounties from './StreetLife/Bounties';
import Bailey from './StreetLife/Bailey';
import Heist from './StreetLife/Heist';
import SmugglerPub from './StreetLife/SmugglerPub';
import Races from './StreetLife/Races';
import ammunition from '../assets/street/ammunition.json';

/** 街头口碑独立于警方证据，原版委托的贡献只读取，不重复增加原版计数。 */
export default class StreetLife extends Module {
  public readonly jobs = new Jobs(this);
  public readonly bounties = new Bounties(this);
  public readonly bailey = new Bailey(this);
  public readonly heist = new Heist(this);
  public readonly smugglerPub = new SmugglerPub(this);
  public readonly races = new Races(this);
  public readonly ammunition = ammunition;

  public constructor(core: typeof maplebirch) {
    super(core, 'StreetLife', {
      reputation: 0,
      jobs: Jobs.defaults,
      bounties: Bounties.defaults,
      bailey: Bailey.defaults,
      heist: Heist.defaults,
      smuggler_pub: SmugglerPub.defaults,
      races: Races.defaults,
      ammo: { handgun: 0, shotgun: 0, rifle: 0 }
    });
  }

  public override preInit(): void {
    super.preInit();
    Achievements.add(this.core, 'StreetLife');
    this.core.on(':passagestart', () => {
      if (V.StreetLife?.races) this.races.enterPassage();
    });
  }

  public Init(): void {
    this.variable();
  }

  public loadInit(): void {
    this.variable();
  }

  public get reputation(): number {
    return Math.clamp(V.StreetLife.reputation + Math.min(100, (Number(V.pub_task_stat) || 0) * 5), 0, 100);
  }

  public set reputation(value: number) {
    // 存档字段保存相对原版贡献的增减，封顶后仍能正确结算损失。
    V.StreetLife.reputation = Math.clamp(value, 0, 100) - Math.min(100, (Number(V.pub_task_stat) || 0) * 5);
  }

  public get available(): boolean {
    return !V.combat && !V.replayScene && !V.statFreeze && !V.possessed && V.exposed <= 0;
  }

  public canUse(hand: 'left' | 'right'): boolean {
    const item = V.worn?.[hand === 'left' ? 'handheld_left' : 'handheld'];
    const weapon = setup.clothes.handheld[item?.index];
    const firearm = weapon?.streetWeapon;
    const target = V.NPCList?.[Number(V[`${hand}target`])];
    return (
      !!this.core.get('StreetLife') &&
      V.combat === 1 &&
      V.enemytype === 'man' &&
      V.enemyhealth > 0 &&
      V.consensual === 0 &&
      !V.replayScene &&
      !V.statFreeze &&
      !V.possessed &&
      V[`${hand}arm`] === 0 &&
      V.orgasmdown < 1 &&
      V.dissociation < 2 &&
      !(V.trance > 0 || V.panicparalysis > 0 || V.panicviolence > 0) &&
      !(V.pain >= 100 && V.willpowerpain === 0) &&
      V.position !== 'stalk' &&
      !V.gloryhole &&
      V.walltype !== 'front' &&
      target?.active === 'active' &&
      target.stance !== 'defeated' &&
      (V.enemyno < 2 || target.health > 0) &&
      (firearm ? V.StreetLife.ammo[firearm.ammo] > 0 : weapon?.streetMelee > 0 || ['street_knife', 'street_stunner'].includes(weapon?.variable))
    );
  }
}

declare module '@scml-dol-maplebirch/types' {
  interface Extensions {
    readonly StreetLife: StreetLife;
  }
}
