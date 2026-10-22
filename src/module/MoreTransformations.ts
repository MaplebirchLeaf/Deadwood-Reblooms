// ./src/module/MoreTransformations.ts

import Achievements from './Achievements';
import Whale from './MoreTransformations/Whale';
import Horse from './MoreTransformations/Horse';
import Raven from './MoreTransformations/Raven';
import Undead from './MoreTransformations/Undead';
import Module from './Module';

interface Tentacle {
  type: string;
  shaft: string | number;
  tentaclehealth: number;
  fullDesc: string;
}

class MoreTransformations extends Module {
  public Whale: Whale;
  public Horse: Horse;
  public Raven: Raven;
  public Undead: Undead;

  constructor(core: typeof maplebirch) {
    super(core, 'MoreTransformations', {
      harbour: {
        mist: false,
        ship: false,
        voice: false,
        spoke: false,
        exchanged: false,
        relics: 0,
        scene: '',
        event: '',
        fighting: false,
        zephyr: { stage: 0, fee: 0, origin: '' },
        raid: { day: -7, stage: '', outcome: '', approach: '', talked: false, rested: false, needsEffects: false, victories: 0, rescues: 0, encounters: 0 }
      },
      treasure: {
        found: false,
        room: 'mouth',
        torch: 0,
        visited: [],
        scene: '',
        inscription: false,
        journal: false,
        shortcut: false,
        guardian: '',
        coins: 0,
        zephyrCoins: 0,
        crewCoins: 0,
        museumCoins: 0,
        bound: false,
        returns: 0,
        appraised: false,
        together: false,
        voyage: false,
        origin: 'Pirate Zephyr',
        agreed: false
      },
      raven: { met: false, searched: -1, fed: -1, called: -1, preened: -1, origin: 'Forest', action: '', disparaged: 0 },
      shrine: {
        stage: 0,
        feeds: 0,
        forest: 30,
        helped: 0,
        work: -1,
        prayer: -1,
        rest: -1,
        talk: -1,
        tea: -1,
        walk: -1,
        kiss: -1,
        sex: -1,
        sex_total: 0,
        feelings: -1,
        close: -1,
        confessed: false,
        home_invited: false,
        home_sneaking: false,
        home_time: -1,
        home_action: '',
        rain_at: -1,
        bathed_at: -1,
        favour: -1,
        favour_result: '',
        favour_late: false,
        promise: -1,
        walks: 0,
        topic: 'shrine',
        scene: '',
        step: '',
        memory: '',
        action: '',
        donations: 0,
        wish: { count: 0, kind: '', day: -1, ready: false, returned: false, shared: false },
        harvests: 0
      }
    });
    this.Whale = new Whale();
    this.Horse = new Horse();
    this.Raven = new Raven();
    this.Undead = new Undead();
  }

  public get foxfire(): boolean {
    return V.angel >= 6 && V.fox >= 6;
  }

  /** 只波及另一条存活触手，伤害跟随原版实际放逐结算，不再消耗次数。 */
  public flare(primary: Tentacle, damage: number) {
    if (!this.foxfire || V.combat !== 1 || !Number.isFinite(damage) || damage <= 0) return;
    const target = Object.values((V.tentacles ?? {}) as Record<string, Tentacle | number>).find(
      (target): target is Tentacle =>
        typeof target === 'object' &&
        target !== null &&
        target !== primary &&
        ['tentacle', 'vine', 'root', 'shoot', 'tendril'].includes(target.type) &&
        target.shaft !== 'finished' &&
        target.tentaclehealth > 0
    );
    if (!target) return;
    const splash = Math.floor(damage / 4);
    if (splash <= 0) return;
    target.tentaclehealth -= splash;
    return { target, damage: splash };
  }

  public override preInit(): void {
    super.preInit();
    // 转化会衰减，成就只在首次达到完整形态时授予。
    Achievements.add(this.core, 'MoreTransformations');

    this.Whale.apply(this.core);
    this.Horse.apply(this.core);
    this.Raven.apply(this.core);
    this.Undead.apply(this.core);
  }
}

declare module '@scml-dol-maplebirch/types' {
  interface Extensions {
    readonly MoreTransformations: MoreTransformations;
  }
}

export default MoreTransformations;
