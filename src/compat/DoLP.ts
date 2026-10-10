// ./src/compat/DoLP.ts

import type { MaplebirchCore } from '@scml-dol-maplebirch/types';

export default function DoLP(core: MaplebirchCore): void {
  core.once(':addon:beforePatch', () => {
    const transport = core.get('Transport');
    if (transport) {
      const passages = core.services.addonPlugin.SC2DataManager.getSC2DataInfoAfterPatch().passageDataItems.map;
      transport.external_bicycle = passages.has('Bike Depot') && passages.has('Widgets Bike');
    }
    if (!core.get('VanillaPlus')) return;
    const mirror = core.services.addonPlugin.SC2DataManager.getSC2DataInfoAfterPatch().passageDataItems.map.get('Widgets Mirror');
    // DoLP 已分别列出各神圣形态的部件，仅原版互斥菜单需要拆分。
    if (mirror?.content.includes('<<set _fallenFullCheck to')) return;
    core.tool.inject({
      widgetPassage: {
        'Widgets Mirror': [
          {
            src: '<<elseif $fallenangel gt 1>>',
            to: '<</if>><<if $fallenangel gt 1 and (maplebirch.get("VanillaPlus")?.divineTransformations.trinity or $angel lte 1)>>',
            expected: 1
          },
          {
            src: '<<elseif $demon gt 1>>',
            to: '<</if>><<if $demon gt 1 and (maplebirch.get("VanillaPlus")?.divineTransformations.trinity or ($angel lte 1 and $fallenangel lte 1))>>',
            expected: 1
          }
        ]
      }
    });
  });
}
