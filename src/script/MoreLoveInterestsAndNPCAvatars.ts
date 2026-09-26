// ./src/script/MoreLoveInterestsAndNPCAvatars.ts

import type { MaplebirchCore } from '@scml-dol-maplebirch/types';

export default function (maplebirch: MaplebirchCore) {
  'use strict';

  // 扩展海报头像、恋人列表和恋人移除逻辑。
  maplebirch.tool.inject({
    locationPassage: {
      Bedroom: [
        // 在原版海报图标宏执行前覆盖已计算的文件名，不替换原版的长三元表达式。
        {
          src: '<<furnitureicon _poster>>',
          applybefore: '<<set _poster to maplebirch.MLIANPCA.icon(_furniture.poster.name, _premadePoster)>>',
          expected: 1
        }
      ]
    },
    widgetPassage: {
      'Widgets Named Npcs': [
        // 在原版关系文字之后追加人物关系图标，不替换关系数值或文本本身。
        {
          src: '<<relationshiptext>>',
          applyafter: '<<relationshipicon _npc>>',
          expected: 1
        }
      ],
      Widgets: [
        // Ivory Wraith 关系宏在中英文原版中都是唯一锚点，直接在其后追加图标。
        {
          src: '<<npcrelationship "Ivory Wraith">>',
          applyafter: '<<mimicicon>>',
          expected: 1
        },
        // 用可配置恋爱对象列表替换原版单一 primary 判断，使 NPC 列表正确标记多个恋爱对象。
        {
          src: 'if (V.loveInterest.primary == T.npcData.nam) {',
          to: 'if (Array.isArray(V.loveInterestList)) {\n\t\t\t\t\tT.loveInterest = V.loveInterestList.includes(T.npcData.nam);\n\t\t\t\t} else if (V.loveInterest.primary == T.npcData.nam) {',
          expected: 1
        }
      ],
      'Widgets Attitudes': [
        // 只在原版恋爱对象面板的首尾加边界，避免跨越整段设置内容进行替换。
        {
          src: '<<set _loveIntStart1 to $loveInterest.primary>>',
          applybefore: '<<if false>>\n\t\t',
          expected: 1
        },
        {
          src: '<<loveInterestFunction>>',
          applyafter: '\n\t\t<</if>>\n\t\t<div class="settingsToggleItem"><<moreLoveInterest>></div>',
          expected: 1
        },
        // 在原版移除恋爱对象组件入口调用模块清理逻辑并立即退出，防止旧逻辑重复处理。
        {
          src: '<<widget "loveInterestRemove">>',
          applyafter: '\n\t<<run maplebirch.MLIANPCA.remove(_args[0])>><<exit>>',
          expected: 1
        }
      ]
    }
  });
}
