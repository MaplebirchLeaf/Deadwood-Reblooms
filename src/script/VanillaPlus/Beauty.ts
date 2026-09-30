// ./src/script/VanillaPlus/Beauty.ts

export default function (maplebirch: typeof window.maplebirch) {
  maplebirch.tool.onInit(() => {
    setup.feats['Unadorned'] ??= {
      get title() {
        return maplebirch.t('deadwood-reblooms:VanillaPlus:beauty:feat:title');
      },
      get desc() {
        return maplebirch.t('deadwood-reblooms:VanillaPlus:beauty:feat:description');
      },
      difficulty: 3,
      series: '',
      filter: ['All', 'Stats']
    };
  });

  maplebirch.dynamic.regStateEvent('append', 'beauty-max', {
    output: 'earnFeat "Unadorned"',
    cond: () => V.feats?.currentSave['Unadorned'] === undefined && V.VanillaPlus != null && maplebirch.VP.beauty.max
  });
  maplebirch.dynamic.regStateEvent('gate', 'beauty-unlock', {
    output: 'deadwood-reblooms-beauty-unlock',
    cond: () => V.VanillaPlus != null && maplebirch.VP.beauty.unlock
  });
  maplebirch.dynamic.regStateEvent('gate', 'beauty-alluring', {
    output: 'run maplebirch.VP.beauty.rememberAllure()',
    cond: () => V.VanillaPlus != null && maplebirch.VP.beauty.alluring && !V.VanillaPlus.beauty.alluring
  });

  // 原版言语动作的结算点各一处；仅增强实际发生的减怒。
  maplebirch.tool.inject({
    widgetPassage: {
      'Widgets Effects Man': [
        {
          src: '<<meek `1 + $englishtrait`>>',
          applyafter: '<<if $VanillaPlus.traits.beauty>><<set $enemyanger -= 25>><</if>>',
          expected: 1
        },
        {
          srcmatch: /<<set \$enemyanger -= (50|100) \* \(1 \+ \$englishtrait\)>>/g,
          to: '<<set $enemyanger -= $1 * (1 + $englishtrait) * ($VanillaPlus.traits.beauty ? 1.25 : 1)>>',
          expected: 3
        }
      ],
      'Widgets Difficulty': [
        {
          // 同一诱惑评分公式在明示与隐藏属性分支复用；显示与实际等级一起提高。
          src: '$attractiveness + (currentSkillValue("seductionskill") * 5)',
          to: '$attractiveness + (currentSkillValue("seductionskill") * 5) + maplebirch.VP.beauty.seductionBonus',
          expected: 10
        }
      ]
    }
  });

  // 放宽原版美貌上限与钳制范围。
  maplebirch.tool.inject({
    widgetPassage: {
      Cheats: [
        // 将作弊面板的美貌滑条上限改为动态上限；未锁定突破时仍使用原版 $beautymax。
        {
          srcmatch: /\$beauty "beauty" \{max: (10000)( \* \$AMCTraits\.beauty)?(, percentage: false)?\}/,
          to: '$beauty "beauty" {max: maplebirch.VP.divineTransformations.beautyCeiling($VanillaPlus.lock.beauty ? maplebirch.VP.ceiling("beauty") : $1$2)$3}',
          expected: 1
        }
      ],
      'Widgets Clamp': [
        // 替换全局美貌钳制公式，同时应用特质保底值与突破后的 125% 上限。
        {
          srcmatch: /<<set \$beauty = Math\.clamp\(\$beauty, 0, \$beautymax( \* \$AMCTraits\.beauty)?\)>>/,
          to: '<<set $beauty = Math.clamp($beauty, maplebirch.VP.beauty.floor, maplebirch.VP.divineTransformations.beautyCeiling($VanillaPlus.lock.beauty ? maplebirch.VP.ceiling("beauty") : $beautymax$1))>>',
          expected: 1
        }
      ]
    }
  });
}
