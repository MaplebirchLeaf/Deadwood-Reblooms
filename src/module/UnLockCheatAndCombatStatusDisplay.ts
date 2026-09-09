// ./src/module/UnlockCheatAndCombatStatusDisplay.ts

function statusPatch(suffixMacro: string, duplicateMarker: string): string {
  return ((matchedBlock: string) => {
    return matchedBlock.replace(/(<span\b[^>]*>[\s\S]*?)(<\/span>)/g, (span, body, close) => {
      if (span.includes(duplicateMarker)) return span;
      return `${body}${suffixMacro}${close}`;
    });
  }) as unknown as string;
}

class UnlockCheatAndCombatStatusDisplay {
  public constructor(readonly core: typeof maplebirch) {}

  public preInit() {
    const health = ' <<print "(" + Math.round($enemyhealth) + "/" + $enemyhealthmax + ")">>';
    const arousal = ' <<print "(" + Math.round($enemyarousal) + "/" + $enemyarousalmax + ")">>';
    const anger = ' <<print "(" + Math.round($enemyanger) + "/" + $enemyangermax + ")">>';
    const trust = ' <<print "(" + Math.round($enemytrust) + ")">>';

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
            to: statusPatch(health, 'Math.round($enemyhealth)')
          },
          {
            srcmatch: /<<if\s+\$enemyarousal\b[\s\S]*?(?=\n\s*<<if\s+\$enemyanger\b)/,
            to: statusPatch(arousal, 'Math.round($enemyarousal)')
          },
          {
            srcmatch: /<<if\s+\$enemyanger\b[\s\S]*?(?=\n\s*<<if\s+\$enemytrust\b)/,
            to: statusPatch(anger, 'Math.round($enemyanger)')
          },
          {
            srcmatch: /<<if\s+\$enemytrust\b[\s\S]*?(?=\n\s*<<if\s+\$panicviolence\b)/,
            to: statusPatch(trust, 'Math.round($enemytrust)')
          }
        ]
      }
    });
  }
}

export default UnlockCheatAndCombatStatusDisplay;
