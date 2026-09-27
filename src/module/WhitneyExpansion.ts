import Module from './Module';

class WhitneyExpansion extends Module {
  // 地下营救和巷子里的原版营救是两件事，不能共用 $whitneyrescued。
  static readonly variables = {
    rescued: false,
    reunionSeen: false
  };

  public constructor(core: typeof maplebirch) {
    super(core, 'WhitneyExpansion', WhitneyExpansion.variables);
  }
}

export default WhitneyExpansion;
