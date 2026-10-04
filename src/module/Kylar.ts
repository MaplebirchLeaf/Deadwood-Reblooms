// ./src/module/Kylar.ts

import Module from './Module';
import { DEFAULT_KYLAR_EXPANSION_STATE } from './constants';

class Kylar extends Module {
  public constructor(core: typeof maplebirch) {
    super(core, 'KylarExpansion', DEFAULT_KYLAR_EXPANSION_STATE);
  }

  private get available(): boolean {
    return C.npc.Kylar.state === 'active' && !this.core.get('VanillaPlus')?.realEstate.residenceOf('Kylar');
  }

  /** 夜间沿用原版卧室判断，白天使用原版地点查询。 */
  public get atManor(): boolean {
    return this.available && (Time.hour >= 18 || window.getKylarLocation().area === 'manor_bedroom');
  }

  /** 起床后、去公园或街机厅前的空档，不覆盖上学日程。 */
  public get canGarden(): boolean {
    return this.available && V.KylarExpansion.stay_invited && window.isLoveInterest('Kylar') && !Time.schoolTime && Time.dayState === 'day' && Time.hour >= 8 && Time.hour < 9;
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

export default Kylar;
