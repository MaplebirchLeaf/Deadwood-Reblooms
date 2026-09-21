// ./src/script/MoreLoveInterestsAndNPCAvatars.ts

import type { MaplebirchCore } from '@scml-dol-maplebirch/types';

export default function (maplebirch: MaplebirchCore) {
  'use strict';

  maplebirch.addon.wikify('deadwood-reblooms:relationship-icon', {
    afterWidget(_text, name, _passageTitle, _passage, node) {
      if (name === 'relationshiptext') new maplebirch.SugarCube.Wikifier(node, '<<relationshipicon>>');
    }
  });

  // 扩展海报头像、恋人列表和恋人移除逻辑。
  maplebirch.tool.zone.inject({
    locationPassage: {
      Bedroom: [
        {
          src: '<<set _poster to _premadePoster ? "poster_" + _furniture.poster.name : [\'dol\', \'degrees of lewdity\'].some(e => _furniture.poster.name.toLowerCase().includes(e)) ? "poster_dol" : "poster">>',
          to: '<<set _poster to maplebirch.MLIANPCA.icon(_furniture.poster.name, _premadePoster)>>',
          expected: 1
        }
      ]
    },
    widgetPassage: {
      Widgets: [
        {
          srcmatch: /<<npcrelationship "Ivory Wraith">>(?:\s*<<mimicicon>>)?/,
          to: '<<npcrelationship "Ivory Wraith">><<mimicicon>>',
          expected: 1
        },
        {
          srcmatch: /(?:\/\*(?:(?!\*\/)[\s\S])*\*\/\s*)?if\s*\(\s*V\.loveInterest\.primary\s*==\s*T\.npcData\.nam\s*\)[\s\S]*?T\.loveInterest\s*=\s*false;\s*}/,
          to: '\n\t\t\t\tT.loveInterest = V.loveInterestList.includes(T.npcData.nam);',
          expected: 1
        }
      ],
      'Widgets Attitudes': [
        {
          srcmatch: /\t\t<<set _loveIntStart1[\s\S]*?\t\t<<loveInterestFunction>>/,
          to: '\t\t<div class="settingsToggleItem"><<moreLoveInterest>></div>',
          expected: 1
        },
        {
          srcmatch: /<<widget "loveInterestRemove">>(?:\s*<<run maplebirch\.MLIANPCA\.remove\(_args\[0\]\)>><<exit>>)?/,
          to: '<<widget "loveInterestRemove">>\n\t<<run maplebirch.MLIANPCA.remove(_args[0])>><<exit>>',
          expected: 1
        }
      ]
    }
  });
}
