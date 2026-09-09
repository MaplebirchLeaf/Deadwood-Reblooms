// ./src/script/MoreLoveInterestsAndNPCAvatars.ts

import type { MaplebirchCore } from '@scml-maplebirch/types';

export default function (maplebirch: MaplebirchCore) {
  maplebirch.tool.zone.inject({
    locationPassage: {
      Bedroom: [
        {
          src: '<<set _poster to _premadePoster ? "poster_" + _furniture.poster.name : [\'dol\', \'degrees of lewdity\'].some(e => _furniture.poster.name.toLowerCase().includes(e)) ? "poster_dol" : "poster">>',
          to: '<<set _poster to maplebirch.MLIANPCA.icon(_furniture.poster.name, _premadePoster)>>'
        }
      ]
    },
    widgetPassage: {
      'Widgets Named Npcs': [{ src: '<<relationshiptext>>', applyafter: '<<relationshipicon>>' }],
      Widgets: [
        { src: '<<npcrelationship "Ivory Wraith">>', applyafter: '<<mimicicon>>' },
        {
          srcmatch: /\/\* Check if this is a main love interest \*\/[\s\S]*?T\.loveInterest = false;\s*}/,
          to: '\n\t\t\t\tT.loveInterest = V.loveInterestList.includes(T.npcData.nam);'
        }
      ],
      'Widgets Attitudes': [
        {
          srcmatch: /\t\t<<set _loveIntStart1[\s\S]*?\t\t<<loveInterestFunction>>/,
          to: '\t\t<div class="settingsToggleItem"><<moreLoveInterest>></div>'
        },
        {
          src: '<<widget "loveInterestRemove">>',
          applyafter: '\n\t<<run maplebirch.MLIANPCA.remove(_args[0])>><<exit>>'
        }
      ]
    }
  });
}
