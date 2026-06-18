// ./src/module/DeadwoodReblooms.ts

import { dataUpdate, options } from './constants';
import Hint from './reblooms/Hint';
import Cheat from './reblooms/Cheat';
import EclipseSystem from './reblooms/solarEclipse';
import BodyModel from './reblooms/BodyModel';
import BodyCarries from './reblooms/BodyCarries';
import CarryItems from './reblooms/CarryItems';

class DeadwoodReblooms {
  public readonly exposed: boolean = true;
  public readonly version: string = '1.0.0';
  public readonly migration: ReturnType<typeof maplebirch.tool.migration.create>;
  public readonly log: ReturnType<typeof maplebirch.tool.createlog>;
  private readonly optionsKey: string = 'DeadwoodReblooms';
  private random?: ReturnType<typeof maplebirch.tool.rand.create>;

  public readonly modhint: Hint;
  public readonly cheat: Cheat;
  public readonly solarEclipse: EclipseSystem;
  public readonly carryItems: CarryItems;

  public constructor(readonly core: typeof maplebirch) {
    this.log = this.core.tool.createlog(this.optionsKey);
    this.migration = this.core.tool.migration.create();

    this.modhint = new Hint(this.core.tool.createlog('modhint'));
    this.cheat = new Cheat(this.core);
    this.solarEclipse = new EclipseSystem(this.core);
    this.carryItems = new CarryItems(this);

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

  public get rng(): number {
    return this.rand.percent();
  }

  public get rand(): ReturnType<typeof maplebirch.tool.rand.create> {
    const state = (V.DeadwoodReblooms.rand ??= { seed: null, history: [], index: 0 });
    if (!Number.isInteger(state.index)) state.index = 0;
    if (this.random && this.random.state === state) return this.random;
    return (this.random = this.core.tool.rand.create(state));
  }

  private optionsCheck() {
    V.options ??= {};
    if (!V.options.maplebirch || typeof V.options.maplebirch !== 'object' || Array.isArray(V.options.maplebirch)) V.options.maplebirch = {};
    const current = V.options.maplebirch[this.optionsKey];
    V.options.maplebirch[this.optionsKey] = current && typeof current === 'object' && !Array.isArray(current) ? Object.merge(options, current) : options.clone();
  }

  private variableInit() {
    if (!V.DeadwoodReblooms || typeof V.DeadwoodReblooms !== 'object' || Array.isArray(V.DeadwoodReblooms)) V.DeadwoodReblooms = { version: '0.0.0' };
    this.migration.run(V.DeadwoodReblooms, this.version);
    this.optionsCheck();
  }

  public preInit() {
    this.solarEclipse.apply();
  }

  public Init() {
    //void this.carryItems.loadFiles('deadwood-reblooms', );
    void this.core.on(
      ':modhint',
      async () => {
        BodyModel.render(this);
        BodyCarries.render(this);
        this.carryItems.render();
      },
      'Deadwood Reblooms Panel Render'
    );
  }
}

declare module '@scml-maplebirch/types/maplebirch' {
  interface Extensions {
    readonly rebloom: DeadwoodReblooms;
  }
}

export default DeadwoodReblooms;
