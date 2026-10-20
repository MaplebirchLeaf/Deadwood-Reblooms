// ./src/compat/NewWorld.ts

import type { MaplebirchCore } from '@scml-dol-maplebirch/types';

export default function NewWorld(core: MaplebirchCore): void {
  const passages = core.services.addonPlugin.SC2DataManager.getSC2DataInfoAfterPatch().passageDataItems.map;
  const attitudes = passages.get('Widgets Attitudes')?.content ?? '';
  if (!attitudes.includes('$loveInterest.senary') || !attitudes.includes('$poly is 1')) return;

  const loveInterests = core.get('MoreLoveInterestsAndNPCAvatars')?.loveInterests;
  if (!loveInterests) return;
  // NewWorld 的多恋特质独立于认知等级，六个原生槽位也必须同步，避免读档或事件丢失后半名单。
  loveInterests.slots.push('quaternary', 'quinary', 'senary');
  loveInterests.levels.push(() => (V.poly === 1 ? 6 : 0));
  const assigned = core.tool.zone.widgetPassage['Widgets Attitudes']?.find(rule => rule.src === '<<set $_assigned to true>>');
  if (assigned) assigned.expected = 6;
}
