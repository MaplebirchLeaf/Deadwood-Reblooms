// ./src/compat/DoLP.ts

import type { MaplebirchCore } from '@scml-dol-maplebirch/types';
import adaptBike from './Bike';

export default function DoLP(maplebirch: MaplebirchCore): void {
  const data = maplebirch.services.addonPlugin.SC2DataManager.getSC2DataInfoAfterPatch();
  const passages = data.passageDataItems.map;
  if (passages.get('Widgets Version Info')?.content.includes('Degrees of Lewdity Plus') && !data.scriptFileItems.getByNameWithOrWithoutPath('xchange.js')) adaptBike(maplebirch);
  // DoLP 先合计恢复并应用酒精、兽化倍率，只在实际扣除时缩放一次。
  if (maplebirch.get('MoreTransformations') && passages.get('Widgets Sleep')?.content.includes('<<set $tiredness -= Math.round(_tiredness)>>')) {
    const rule = maplebirch.tool.zone.widgetPassage['Widgets Sleep']?.find(rule => rule.to?.includes('$_undeadSleepStart'));
    if (rule) {
      delete rule.srcmatch;
      rule.src = '<<set $tiredness -= Math.round(_tiredness)>>';
      rule.to = '<<set $tiredness -= Math.round(_tiredness) * (maplebirch.get("MoreTransformations")?.Undead.active ? 0.5 : 1)>>';
    }
  }
  const effects = passages.get('Widgets Effects Man');
  if (maplebirch.get('MoreTransformations') && /<<defiance 10 \$feettarget>>/.test(effects?.content ?? '')) {
    // DoLP 增加了强度 10 的踢击分支，保留两种原生强度及其实际分支数。
    const rule = maplebirch.tool.zone.widgetPassage['Widgets Effects Man']?.find(
      rule => rule.srcmatchgroup?.source === '<<defiance 5 \\$feettarget>>' && rule.to?.includes('$transformationParts?.traits?.hooves')
    );
    if (rule) {
      rule.srcmatchgroup = /<<defiance (5|10) \$feettarget>>/g;
      rule.to = '<<defiance `$1 * (typeof $transformationParts?.traits?.hooves is "string" and isPartEnabled($transformationParts.traits.hooves) ? 3 : 1)` $feettarget>>';
      delete rule.expected;
    }
  }
  maplebirch.once(':addon:beforePatch', () => {
    const transport = maplebirch.get('Transport');
    if (transport) {
      const passages = maplebirch.services.addonPlugin.SC2DataManager.getSC2DataInfoAfterPatch().passageDataItems.map;
      transport.external_bicycle = passages.has('Bike Depot') && passages.has('Widgets Bike');
    }
  });
  const mirror = maplebirch.services.addonPlugin.SC2DataManager.getSC2DataInfoAfterPatch().passageDataItems.map.get('Widgets Mirror');
  if (mirror?.content.includes('<<set _fallenFullCheck to')) {
    // DoLP 已独立列出各形态，移除本模组为原版登记的镜子拆分规则。
    const rules = maplebirch.tool.zone.widgetPassage['Widgets Mirror'];
    if (rules) {
      maplebirch.tool.zone.widgetPassage['Widgets Mirror'] = rules.filter(
        rule =>
          ![rule.to, rule.applybefore, rule.applyafter].some(
            text => /_mirrorAnimal|_trinityDivine/.test(text ?? '') || text === '$1 and _animal is "$2"$3' || /^ and _divine is "(angel|fallenangel|demon)"$/.test(text ?? '')
          )
      );
    }
  }
}
