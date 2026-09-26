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
    // defaults 是模块配置模板；每次迁移都 clone 到当前存档，避免不同开局共享对象引用。
    this.migration.add('*', this.version, (data, utils) => utils.fill(data, clone(this.defaults)));
  }

  public preInit(): void {
    this.core.on(':variable', () => {
      // :variable 在新游戏和读档后运行。V 已指向对应存档，不能靠当前 Passage 名推断是否为新开局。
      // 旧存档没有此模块时从空对象补全；已有数据只迁移缺失字段，不覆盖玩家进度。
      V[this.name] ??= {};
      this.migration.run(V[this.name], this.version);
      this.migration.utils.fill(V[this.name], clone(this.defaults));
    });
  }
}

export default Module;
