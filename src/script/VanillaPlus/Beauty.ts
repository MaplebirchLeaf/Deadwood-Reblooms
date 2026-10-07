// ./src/script/VanillaPlus/Beauty.ts

export default function (maplebirch: typeof window.maplebirch) {
  // 原版言语动作的结算点各一处，仅增强实际发生的减怒。
  maplebirch.tool.inject({
    widgetPassage: {
      'Widgets Effects Man': [
        // 鸦化先注册时保留其演说倍率，容貌只追加自己的减怒效果。
        {
          srcmatch: /<<meek `(?:1 \+ \$englishtrait|\(1 \+ \$englishtrait\) \* maplebirch\.get\('MoreTransformations'\)\.Raven\.speech)`>>/,
          applyafter: '<<if $VanillaPlus.traits.beauty>><<set $enemyanger -= 25>><</if>>',
          expected: 1
        },
        {
          srcmatch: /(<<set \$enemyanger -= (?:50|100) \* \((?:1 \+ \$englishtrait|\(1 \+ \$englishtrait\) \* maplebirch\.get\('MoreTransformations'\)\.Raven\.speech)\))>>/g,
          to: '$1 * ($VanillaPlus.traits.beauty ? 1.25 : 1)>>',
          expected: 3
        }
      ],
      'Widgets Difficulty': [
        // 同一诱惑评分公式在明示与隐藏属性分支复用，显示与实际等级一起提高。
        {
          srcmatchgroup: /\$attractiveness \+ \(currentSkillValue\("seductionskill"\) \* 5\)/g,
          applyafter: ' + maplebirch.get("VanillaPlus").beauty.seductionBonus',
          expected: 10
        }
      ]
    }
  });

  // 放宽原版美貌上限与钳制范围。
  maplebirch.tool.inject({
    widgetPassage: {
      'Widgets Clamp': [
        // 替换全局美貌钳制公式，同时应用特质保底值与突破后的 125% 上限。
        {
          srcmatch: /<<set \$beauty = Math\.clamp\(\$beauty, 0, \$beautymax( \* \$AMCTraits\.beauty)?\)>>/,
          to: '<<set $beauty = Math.clamp($beauty, maplebirch.get("VanillaPlus").beauty.floor, maplebirch.get("VanillaPlus").divineTransformations.beautyCeiling($VanillaPlus.lock.beauty ? maplebirch.get("VanillaPlus").ceiling("beauty") : $beautymax$1))>>',
          expected: 1
        }
      ]
    }
  });
}
