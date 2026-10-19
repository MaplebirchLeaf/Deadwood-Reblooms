// ./src/compat/DoLP.ts

import type { MaplebirchCore } from '@scml-dol-maplebirch/types';

export default function DoLP(core: MaplebirchCore): void {
  const effects = core.services.addonPlugin.SC2DataManager.getSC2DataInfoAfterPatch().passageDataItems.map.get('Widgets Effects Man');
  if (core.get('MoreTransformations') && /<<defiance 10 \$feettarget>>/.test(effects?.content ?? '')) {
    // DoLP 增加了强度 10 的踢击分支，保留两种原生强度及其实际分支数。
    const rule = core.tool.zone.widgetPassage['Widgets Effects Man']?.find(
      rule => rule.srcmatchgroup?.source === '<<defiance 5 \\$feettarget>>' && rule.to?.includes('$transformationParts?.traits?.hooves')
    );
    if (rule) {
      rule.srcmatchgroup = /<<defiance (5|10) \$feettarget>>/g;
      rule.to = '<<defiance `$1 * (typeof $transformationParts?.traits?.hooves is "string" and isPartEnabled($transformationParts.traits.hooves) ? 3 : 1)` $feettarget>>';
      delete rule.expected;
    }
  }
  core.once(':addon:beforePatch', () => {
    const transport = core.get('Transport');
    if (transport) {
      const passages = core.services.addonPlugin.SC2DataManager.getSC2DataInfoAfterPatch().passageDataItems.map;
      transport.external_bicycle = passages.has('Bike Depot') && passages.has('Widgets Bike');
    }
  });
  const mirror = core.services.addonPlugin.SC2DataManager.getSC2DataInfoAfterPatch().passageDataItems.map.get('Widgets Mirror');
  if (mirror?.content.includes('<<set _fallenFullCheck to')) {
    // DoLP 已独立列出各形态，移除本模组为原版登记的镜子拆分规则。
    const rules = core.tool.zone.widgetPassage['Widgets Mirror'];
    if (rules) {
      core.tool.zone.widgetPassage['Widgets Mirror'] = rules.filter(
        rule =>
          ![rule.to, rule.applybefore, rule.applyafter].some(
            text => /_mirrorAnimal|_trinityDivine/.test(text ?? '') || text === '$1 and _animal is "$2"$3' || /^ and _divine is "(angel|fallenangel|demon)"$/.test(text ?? '')
          )
      );
    }
  }
}
