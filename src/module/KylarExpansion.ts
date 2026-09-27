import Module from './Module';

class KylarExpansion extends Module {
  static readonly variables = {
    stay_invited: false,
    night_day: -1,
    night_scene: ''
  };

  public constructor(core: typeof maplebirch) {
    super(core, 'KylarExpansion', KylarExpansion.variables);
  }

  public openWardrobe(): void {
    const wardrobes = V.wardrobes as Record<string, Record<string, unknown>>;
    wardrobes.kylar_manor ??= {
      face: [],
      feet: [],
      hands: [],
      handheld: [],
      head: [],
      legs: [],
      lower: [],
      neck: [],
      over_head: [],
      over_lower: [],
      over_upper: [],
      genitals: [],
      under_lower: [],
      under_upper: [],
      upper: [],
      unlocked: true,
      shopSend: true,
      transfer: true,
      isolated: true,
      locationRequirement: [],
      space: 20,
      name: lanSwitch("Kylar's wardrobe", '凯拉尔的衣柜')
    };
    V.wardrobe_location = 'kylar_manor';
  }
}

export default KylarExpansion;
