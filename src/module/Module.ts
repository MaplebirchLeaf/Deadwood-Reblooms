// ./src/module/Module.ts

import { version } from './constants';

abstract class Module {
  public log!: (message: string, level?: string, ...objects: unknown[]) => void;
  public readonly version: string;
  protected readonly migration: ReturnType<typeof maplebirch.tool.migration.create>;

  protected constructor(
    readonly core: typeof maplebirch,
    private readonly name: string,
    private readonly defaults: Record<string, any>,
    targetVersion = version
  ) {
    this.version = targetVersion;
    this.migration = core.tool.migration.create();
  }

  public preInit(): void {
    // 独立迁移保留自己的版本步骤，通用填充不能跳过尚未执行的数据转换。
    if (!this.migration.steps.length) this.migration.add('*', this.version, (data, utils) => utils.fill(data, clone(this.defaults)));
    this.core.on(':variable', () => this.variable());
  }

  protected variable(): void {
    V[this.name] ??= {};
    this.migration.run(V[this.name], this.version);
    this.migration.utils.fill(V[this.name], clone(this.defaults));
  }
}

export default Module;
