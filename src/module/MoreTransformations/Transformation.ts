// ./src/module/MoreTransformations/Transformation.ts

import type { MaplebirchCore } from '@scml-maplebirch/types';

export type TransformationOption = Parameters<MaplebirchCore['char']['transformation']['add']>[2];

export type TransformationHooks = {
  pre?: (options: Record<string, unknown>) => void;
  layers?: CanvasLayerMap;
};

abstract class Transformation {
  protected static readonly defaults: Partial<TransformationOption> = {
    build: 100,
    level: 6,
    update: [5, 10, 15, 20, 25, 30],
    decay: true,
    suppress: true
  };

  public readonly transformation: TransformationOption;

  protected constructor(
    private readonly id: string,
    private readonly type: string,
    option: Partial<TransformationOption>,
    private readonly combat?: TransformationHooks
  ) {
    this.transformation = {
      ...Transformation.defaults,
      icon: `${id}.png`,
      ...option
    } as TransformationOption;
  }

  public apply(maplebirch: MaplebirchCore): void {
    maplebirch.char.transformation.add(this.id, this.type, this.transformation);
    if (this.combat?.pre) maplebirch.char.use('pre', this.combat.pre, 'combatMainPc');
    if (this.combat?.layers) maplebirch.char.use(this.combat.layers, 'combatMainPc');
    this.extend(maplebirch);
  }

  protected extend(_maplebirch: MaplebirchCore): void {}
}

export default Transformation;
