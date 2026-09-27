// ./src/module/UnlockCheatAndCombatStatusDisplay.ts

// 四段状态各自限定在原版相邻的 if 分支之间，只给该段的彩色 span 插入数值。
// srcmatchgroup 与 to 都遵守框架的字符串替换契约；已插入的宏不会被再次匹配。
function statusPatch(start: string, end: string, suffixMacro: string, expected: number) {
  const marker = suffixMacro.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return {
    srcmatchgroup: new RegExp(
      `(?<=<<if \\$${start}\\b(?:(?!<<if \\$${end}\\b)[\\s\\S])*?)(<span\\b[^>]*>(?:(?!<\\/span>)[\\s\\S])*?)(?<!${marker})(<\\/span>)(?=(?:(?!<<if \\$${end}\\b)[\\s\\S])*?<<if \\$${end}\\b)`,
      'g'
    ),
    to: `$1${suffixMacro}$2`,
    expected
  };
}

class UnlockCheatAndCombatStatusDisplay {
  public constructor(readonly core: typeof maplebirch) {}

  public preInit() {
    const health = ' <<print "(" + Math.round($enemyhealth) + "/" + $enemyhealthmax + ")">>';
    const arousal = ' <<print "(" + Math.round($enemyarousal) + "/" + $enemyarousalmax + ")">>';
    const anger = ' <<print "(" + Math.round($enemyanger) + "/" + $enemyangermax + ")">>';
    const trust = ' <<print "(" + Math.round($enemytrust) + ")">>';

    // 解锁原版作弊入口，并在战斗状态旁显示精确数值。
    this.core.tool.inject({
      locationPassage: {
        StoryCaption: [
          // 删除作弊菜单入口对 $cheatsEnabled 的额外限制，让本模块启用时入口始终可见。
          {
            src: ' and $cheatsEnabled is true',
            to: '',
            expected: 1
          }
        ]
      },

      widgetPassage: {
        'Widgets State Man': [
          statusPatch('loveDrunk', 'enemyarousal', health, 8),
          statusPatch('enemyarousal', 'enemyanger', arousal, 10),
          statusPatch('enemyanger', 'enemytrust', anger, 7),
          statusPatch('enemytrust', 'panicviolence', trust, 7)
        ]
      }
    });
  }
}

export default UnlockCheatAndCombatStatusDisplay;
