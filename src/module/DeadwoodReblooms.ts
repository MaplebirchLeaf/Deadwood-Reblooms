// ./src/module/DeadwoodReblooms.ts

import { dataUpdate, options } from './constants';
import Hint from './reblooms/Hint';
import Cheat from './reblooms/Cheat';
import EclipseSystem from './reblooms/solarEclipse';

class DeadwoodReblooms {
  public readonly exposed: boolean = true;
  public readonly version: string = '1.0.0';
  private readonly optionsKey = 'DeadwoodReblooms';
  public readonly migration: ReturnType<typeof maplebirch.tool.migration.create>;

  public readonly modhint: Hint;
  public readonly cheat: Cheat;
  //public readonly solarEclipse: EclipseSystem;

  public constructor(readonly core: typeof maplebirch) {
    this.migration = this.core.tool.migration.create();
    this.modhint = new Hint(this.core.tool.createlog('modhint'));
    this.cheat = new Cheat(this.core);
    //this.solarEclipse = new EclipseSystem(this.core);
    dataUpdate(this.migration);
    this.core.once(':variable', () => this.variableInit());
    this.core.once(':passageend', () => this.optionsCheck());
    this.core.on(':rest-options', () => this.optionsCheck());
    this.core.once(':storyready', () => {
      $('#history-backward').ariaClick(() => this.rand.back(1));
      $('#history-forward').ariaClick(() => this.rand.forward(1));
    });
  }

  public get options(): typeof options {
    return V.options.maplebirch[this.optionsKey];
  }

  public get rand(): ReturnType<typeof maplebirch.tool.rand.create> {
    return this.core.tool.rand.create(V.DeadwoodReblooms.rand);
  }

  private optionsCheck() {
    V.options ??= {};
    if (!this.core.lodash.isPlainObject(V.options.maplebirch)) V.options.maplebirch = {};
    const current = V.options.maplebirch[this.optionsKey];
    V.options.maplebirch[this.optionsKey] = this.core.lodash.isPlainObject(current) ? Object.merge(options, current ?? {}) : options.clone();
  }

  private variableInit() {
    if (!this.core.lodash.isPlainObject(V.DeadwoodReblooms)) V.DeadwoodReblooms = { version: '0.0.0' };
    this.migration.run(V.DeadwoodReblooms, this.version);
    this.optionsCheck();
  }

  public preInit() {
    //this.solarEclipse.apply();
  }
}

declare module '@scml-maplebirch/types/maplebirch' {
  interface Extensions {
    readonly rebloom: DeadwoodReblooms;
  }
}

export default DeadwoodReblooms;
