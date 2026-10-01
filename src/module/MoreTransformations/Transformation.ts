// ./src/module/MoreTransformations/Transformation.ts

import type { MaplebirchCore } from '@scml-dol-maplebirch/types';

export type TransformationOption = Parameters<MaplebirchCore['char']['transformation']['add']>[2];

abstract class Transformation {
  protected static readonly defaults: Partial<TransformationOption> = {
    build: 100,
    level: 6,
    update: [5, 10, 15, 20, 25, 30],
    decay: true,
    suppress: true
  };

  public readonly transformation: TransformationOption;

  public get icon(): string {
    const icon = this.transformation.icon;
    return icon?.startsWith('<') ? icon : icon ? `<<iconUi '${icon}'>>` : '';
  }

  protected constructor(
    private readonly id: string,
    private readonly type: string,
    option: Partial<TransformationOption>,
    combat?: TransformationOption['combat']
  ) {
    this.transformation = {
      ...Transformation.defaults,
      icon: `${id}.png`,
      ...option,
      ...(combat ? { combat } : {})
    } as TransformationOption;
  }

  public apply(maplebirch: MaplebirchCore): void {
    maplebirch.char.transformation.add(this.id, this.type, this.transformation);
    this.extend(maplebirch);
  }

  protected extend(_maplebirch: MaplebirchCore): void {}
}

export default Transformation;
