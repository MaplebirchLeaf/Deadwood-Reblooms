// ./src/module/UnlockCheatAndCombatStatusDisplay.ts

import type { MaplebirchCore } from '@scml-maplebirch/types';

function spanStatusPatch(suffixMacro: string, duplicateMarker: string): string {
  return ((matchedBlock: string) => {
    return matchedBlock.replace(/(<span\b[^>]*>[\s\S]*?)(<\/span>)/g, (span, body, close) => {
      if (span.includes(duplicateMarker)) return span;
      return `${body}${suffixMacro}${close}`;
    });
  }) as unknown as string;
}

class UnlockCheatAndCombatStatusDisplay {
  public constructor(readonly core: MaplebirchCore) {}

  public preInit() {
    const healthSuffix = ' <<print "(" + Math.round($enemyhealth) + "/" + $enemyhealthmax + ")">>';
    const arousalSuffix = ' <<print "(" + Math.round($enemyarousal) + "/" + $enemyarousalmax + ")">>';
    const angerSuffix = ' <<print "(" + Math.round($enemyanger) + "/" + $enemyangermax + ")">>';
    const trustSuffix = ' <<print "(" + Math.round($enemytrust) + ")">>';

    this.core.tool.zone.inject({
      locationPassage: {
        StoryCaption: [
          {
            src: ' and $cheatsEnabled is true',
            to: ''
          }
        ]
      },

      widgetPassage: {
        'Widgets State Man': [
          {
            srcmatch: /<<if\s+\$loveDrunk\b[\s\S]*?(?=\n\s*<<if\s+\$enemyarousal\b)/,
            to: spanStatusPatch(healthSuffix, 'Math.round($enemyhealth)')
          },
          {
            srcmatch: /<<if\s+\$enemyarousal\b[\s\S]*?(?=\n\s*<<if\s+\$enemyanger\b)/,
            to: spanStatusPatch(arousalSuffix, 'Math.round($enemyarousal)')
          },
          {
            srcmatch: /<<if\s+\$enemyanger\b[\s\S]*?(?=\n\s*<<if\s+\$enemytrust\b)/,
            to: spanStatusPatch(angerSuffix, 'Math.round($enemyanger)')
          },
          {
            srcmatch: /<<if\s+\$enemytrust\b[\s\S]*?(?=\n\s*<<if\s+\$panicviolence\b)/,
            to: spanStatusPatch(trustSuffix, 'Math.round($enemytrust)')
          }
        ]
      }
    });
  }
}

export default UnlockCheatAndCombatStatusDisplay;
