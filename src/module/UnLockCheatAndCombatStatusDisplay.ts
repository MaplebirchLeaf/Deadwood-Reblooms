// ./src/module/UnLockCheatAndCombatStatusDisplay.ts

class UnlockCheatAndCombatStatusDisplay {
  public constructor(readonly core: typeof maplebirch) {}

  public preInit() {
    const health = ' <<print "(" + Math.round($enemyhealth) + "/" + $enemyhealthmax + ")">>';
    const arousal = ' <<print "(" + Math.round($enemyarousal) + "/" + $enemyarousalmax + ")">>';
    const anger = ' <<print "(" + Math.round($enemyanger) + "/" + $enemyangermax + ")">>';
    const trust = ' <<print "(" + Math.round($enemytrust) + ")">>';

    this.core.tool.inject({
      locationPassage: {
        StoryCaption: [
          {
            src: ' and $cheatsEnabled is true',
            to: '',
            expected: 1
          }
        ]
      },

      widgetPassage: {
        'Widgets State Man': [
          // 在原版生命描述中追加当前值和上限，限定在生命分支内。
          {
            srcmatchgroup:
              /(?<=<<if \$loveDrunk\b(?:(?!<<if \$enemyarousal\b)[\s\S])*?)(?<! <<print "\(" \+ Math\.round\(\$enemyhealth\) \+ "\/" \+ \$enemyhealthmax \+ "\)">>)<\/span>(?=(?:(?!<<if \$enemyarousal\b)[\s\S])*?<<if \$enemyarousal\b)/g,
            applybefore: health,
            expected: 8
          },
          // 在原版兴奋描述中追加当前值和上限，限定在兴奋分支内。
          {
            srcmatchgroup:
              /(?<=<<if \$enemyarousal\b(?:(?!<<if \$enemyanger\b)[\s\S])*?)(?<! <<print "\(" \+ Math\.round\(\$enemyarousal\) \+ "\/" \+ \$enemyarousalmax \+ "\)">>)<\/span>(?=(?:(?!<<if \$enemyanger\b)[\s\S])*?<<if \$enemyanger\b)/g,
            applybefore: arousal,
            expected: 10
          },
          // 在原版怒气描述中追加当前值和上限，限定在怒气分支内。
          {
            srcmatchgroup:
              /(?<=<<if \$enemyanger\b(?:(?!<<if \$enemytrust\b)[\s\S])*?)(?<! <<print "\(" \+ Math\.round\(\$enemyanger\) \+ "\/" \+ \$enemyangermax \+ "\)">>)<\/span>(?=(?:(?!<<if \$enemytrust\b)[\s\S])*?<<if \$enemytrust\b)/g,
            applybefore: anger,
            expected: 7
          },
          // 在原版信任描述中追加当前值，限定在信任分支内。
          {
            srcmatchgroup:
              /(?<=<<if \$enemytrust\b(?:(?!<<if \$panicviolence\b)[\s\S])*?)(?<! <<print "\(" \+ Math\.round\(\$enemytrust\) \+ "\)">>)<\/span>(?=(?:(?!<<if \$panicviolence\b)[\s\S])*?<<if \$panicviolence\b)/g,
            applybefore: trust,
            expected: 7
          }
        ]
      }
    });
  }
}

export default UnlockCheatAndCombatStatusDisplay;
