// ./src/compat/Bike.ts

import type { MaplebirchCore } from '@scml-dol-maplebirch/types';

export default function adaptBike(core: MaplebirchCore): void {
  if (!core.get('VanillaPlus')) return;
  // 仅放行 DoLP/DoLX 的七级暴露癖骑车检查，其余骑车条件和暴露后果仍由原生流程处理。
  core.tool.inject({
    widgetPassage: {
      'Widgets Bike': [
        {
          src: '!(($exposed gte 1 and Time.dayState is "night") or $exposed is 0)',
          applyafter: ' and !$VanillaPlus?.traits.exhibitionism',
          expected: 1
        }
      ]
    }
  });
}
