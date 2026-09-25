// ./src/script/MoreLoveInterestsAndNPCAvatars.ts

import type { MaplebirchCore } from '@scml-dol-maplebirch/types';

export default function (maplebirch: MaplebirchCore) {
  'use strict';

  // 扩展海报头像、恋人列表和恋人移除逻辑。
  maplebirch.tool.inject({
    locationPassage: {
      Bedroom: [
        // 用模块图标解析器替换卧室海报文件名判断，使自定义人物海报与原版预制海报共用入口。
        {
          src: '<<set _poster to _premadePoster ? "poster_" + _furniture.poster.name : [\'dol\', \'degrees of lewdity\'].some(e => _furniture.poster.name.toLowerCase().includes(e)) ? "poster_dol" : "poster">>',
          to: '<<set _poster to maplebirch.MLIANPCA.icon(_furniture.poster.name, _premadePoster)>>',
          expected: 1
        }
      ]
    },
    widgetPassage: {
      'Widgets Named Npcs': [
        // 在原版关系文字之后追加人物关系图标，不替换关系数值或文本本身。
        {
          src: '<<relationshiptext>>',
          applyafter: '<<relationshipicon>>',
          expected: 1
        }
      ],
      Widgets: [
        // 规范 Ivory Wraith 关系行，确保 mimicicon 恰好存在一次，兼容原版是否已带该图标。
        {
          srcmatch: /<<npcrelationship "Ivory Wraith">>(?:\s*<<mimicicon>>)?/,
          to: '<<npcrelationship "Ivory Wraith">><<mimicicon>>',
          expected: 1
        },
        // 用可配置恋爱对象列表替换原版单一 primary 判断，使 NPC 列表正确标记多个恋爱对象。
        {
          srcmatch: /(?:\/\*(?:(?!\*\/)[\s\S])*\*\/\s*)?if\s*\(\s*V\.loveInterest\.primary\s*==\s*T\.npcData\.nam\s*\)[\s\S]*?T\.loveInterest\s*=\s*false;\s*}/,
          to: '\n\t\t\t\tT.loveInterest = V.loveInterestList.includes(T.npcData.nam);',
          expected: 1
        }
      ],
      'Widgets Attitudes': [
        // 用多恋爱对象设置面板替换原版整段单选控件，避免两个设置系统同时修改相同状态。
        {
          srcmatch: /\t\t<<set _loveIntStart1[\s\S]*?\t\t<<loveInterestFunction>>/,
          to: '\t\t<div class="settingsToggleItem"><<moreLoveInterest>></div>',
          expected: 1
        },
        // 在原版移除恋爱对象组件入口调用模块清理逻辑并立即退出，防止旧逻辑重复处理。
        {
          srcmatch: /<<widget "loveInterestRemove">>(?:\s*<<run maplebirch\.MLIANPCA\.remove\(_args\[0\]\)>><<exit>>)?/,
          to: '<<widget "loveInterestRemove">>\n\t<<run maplebirch.MLIANPCA.remove(_args[0])>><<exit>>',
          expected: 1
        }
      ]
    }
  });
}
