// ./src/module/UnlockCheatAndCombatStatusDisplay.ts

// 战斗状态颜色由分支内的原版 span 决定；数值必须写入 span 内才能继承同一颜色。
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
          // 用数值生命面板替换原版从 loveDrunk 到 enemyarousal 前的生命状态文本区块。
          {
            srcmatch: /<<if\s+\$loveDrunk\b[\s\S]*?(?=\n\s*<<if\s+\$enemyarousal\b)/,
            to: statusPatch(health, 'Math.round($enemyhealth)'),
            expected: 1
          },
          // 用数值兴奋面板替换原版 enemyarousal 状态区块，保留后续愤怒区块作为边界。
          {
            srcmatch: /<<if\s+\$enemyarousal\b[\s\S]*?(?=\n\s*<<if\s+\$enemyanger\b)/,
            to: statusPatch(arousal, 'Math.round($enemyarousal)'),
            expected: 1
          },
          // 用数值愤怒面板替换原版 enemyanger 状态区块，保留后续信任区块作为边界。
          {
            srcmatch: /<<if\s+\$enemyanger\b[\s\S]*?(?=\n\s*<<if\s+\$enemytrust\b)/,
            to: statusPatch(anger, 'Math.round($enemyanger)'),
            expected: 1
          },
          // 用数值信任面板替换原版 enemytrust 状态区块，截止到恐慌暴力判断之前。
          {
            srcmatch: /<<if\s+\$enemytrust\b[\s\S]*?(?=\n\s*<<if\s+\$panicviolence\b)/,
            to: statusPatch(trust, 'Math.round($enemytrust)'),
            expected: 1
          }
        ]
      }
    });
  }
}

export default UnlockCheatAndCombatStatusDisplay;
