// ./src/script/DeadwoodReblooms/Traits.ts

import type { MaplebirchCore } from '@scml-dol-maplebirch/types';

export default function Traits(core: MaplebirchCore): void {
  const source = core.services.addonPlugin.SC2DataManager.getSC2DataInfoAfterPatch().passageDataItems.map.get('Traits')?.content ?? '';
  // 从解锁条件标记原生条目，避免依赖汉化名称，也不重建动态说明、样式和进度条。
  const condition =
    /^([\t ]+)(has:[^\r\n]*(?:\$transformationParts\b|effectiveTransformationLevel\(|\bTransformations\.|\$(?:wolfgirl|cat|cow|harpy|fox|bunny|bear|waterdragon|angel|fallenangel|demon|heterochromia|TF\w+)\b)[^\r\n]*)/gm;
  const matches = [...source.matchAll(condition)].length;
  core.tool.inject({
    widgetPassage: {
      Traits: [
        ...(matches ? [{ srcmatchgroup: condition, to: '$1deadwoodTransformation: true,\n$1$2', expected: matches }] : []),
        {
          src: '<<run maplebirch.tool.patch.traits.inject(_traitLists)>>',
          applybefore: '<<deadwood-transformation-traits>>\n\t',
          expected: 1
        }
      ]
    }
  });
}
