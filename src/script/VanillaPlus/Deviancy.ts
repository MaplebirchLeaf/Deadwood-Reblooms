// ./src/script/VanillaPlus/Deviancy.ts

export default function (maplebirch: typeof window.maplebirch) {
  const transformation = maplebirch.char.transformation as typeof maplebirch.char.transformation & { readonly coexistConditions: Array<() => boolean> };
  transformation.coexistConditions.push(() => V.VanillaPlus?.traits.deviancy === true);

  // 诡异镜的“放逐”选项可能占据首位，入口始终紧邻原版“观察”选项。
  maplebirch.tool.addTo(
    'CustomLinkZone',
    { widget: [0, 'deadwood-reblooms-deviancy-eerie-mirror-link 0'], passage: 'Eerie Mirror' },
    { widget: [1, 'deadwood-reblooms-deviancy-eerie-mirror-link 1'], passage: 'Eerie Mirror' }
  );

  // 接入镜面通路与仪式结算，并扩展异种癖上限。
  maplebirch.tool.inject({
    locationPassage: {
      // 仅在原版正常导航层显示镜面出口，不绕过昏厥或强制遭遇。
      'Tentacle Plains': [{ src: '<<if $tentnorth is 0 and $tenteast is 0>>', applybefore: '<<deadwood-reblooms-deviancy-mirror-exits>>\n\t', expected: 1 }],
      'Farm Mirror': [
        // 镜子菜单会局部重绘，链接区若插进菜单内部，会在重绘后消失。
        { src: '<<mirror>>', applybefore: '<<deadwood-reblooms-deviancy-mirror-enter-link "farm">>\n', expected: 1 }
      ],
      'Bird Tower Mirror': [
        // 在原版 mirror 宏前插入鸟塔镜面进入链接，不替换鸟塔自身的镜子内容。
        { src: '<<mirror>>', applybefore: '<<deadwood-reblooms-deviancy-mirror-enter-link "tower">>\n', expected: 1 }
      ],
      'Temple Mirror': [
        // 神殿床铺镜的原版 mirror 带显示文字，取共用前缀以兼容中英文原版。
        { src: '<<mirror ', applybefore: '<<deadwood-reblooms-deviancy-mirror-enter-link "temple">>\n', expected: 1 }
      ]
    },
    widgetPassage: {
      'Gwylan Hypnosis Widgets': [
        // “超越禁忌”只保证格威岚意志检定成功，需求计时与错过惩罚仍完全由原版处理。
        {
          src: '!$hypnosis_traits.devotion or $hypnosis_traits.devotion lt $_level',
          applybefore: '$VanillaPlus.traits.deviancy or ',
          expected: 1
        }
      ],
      'Widgets Deviancy': [
        // 满自控分支读取自身等级，六级仍增加创伤，但没有可恢复的自控。
        {
          srcmatch: /(<<elseif _combat_deviancy_max_control>>\s*<br>\s*<<if )_combat_deviancy_success( is 6>>[\s\S]*?)<<gggcontrol>>/,
          to: '$1_combat_deviancy_max_control$2',
          expected: 1
        },
        // 两处相同的阶段上限作为明确的批量替换，避免依赖补丁先后顺序。
        {
          srcmatchgroup: /<<set \$_scaledDeviancyMax to 20 \* \$_n>>/g,
          to: '<<set $_scaledDeviancyMax to $_n is 6 and $VanillaPlus.lock.deviancy ? maplebirch.get("VanillaPlus").ceiling("deviancy") : 20 * $_n>>',
          expected: 2
        },
        // 非战斗的成长接在唯一的原版兴奋结算后，不匹配后续钳制语句。
        {
          src: '<<arousal `$_n * 100`>><<garousal>>',
          applyafter:
            '\n\t<<if $_n is 5 and $VanillaPlus.lock.deviancy and $deviancy gte maplebirch.get("VanillaPlus").normalCeiling(\'deviancy\') and $deviancy lt maplebirch.get("VanillaPlus").ceiling(\'deviancy\')>>\n\t\t<<set $VanillaPlus.deviancy.levelFive to ($VanillaPlus.deviancy.levelFive || 0) + 1>>\n\t\t<<if $VanillaPlus.deviancy.levelFive gte 4>>\n\t\t\t<<set $VanillaPlus.deviancy.levelFive -= 4>>\n\t\t\t<<set $deviancy to Math.clamp($deviancy + 1, maplebirch.get("VanillaPlus").normalCeiling(\'deviancy\'), maplebirch.get("VanillaPlus").ceiling(\'deviancy\'))>>\n\t\t<</if>>\n\t<</if>>',
          expected: 1
        },
        // 战斗成长插在唯一的耳液行为记录前，避免捕获外层 if 结尾。
        {
          src: '<<earSlimeSeenActions "deviancy" $_n 5>>',
          applybefore:
            '<<if $_n is 5 and $VanillaPlus.lock.deviancy and $deviancy gte maplebirch.get("VanillaPlus").normalCeiling(\'deviancy\') and $deviancy lt maplebirch.get("VanillaPlus").ceiling(\'deviancy\') and $consensual is 1>>\n\t\t<<set $VanillaPlus.deviancy.levelFive to ($VanillaPlus.deviancy.levelFive || 0) + 1>>\n\t\t<<if $VanillaPlus.deviancy.levelFive gte 4>>\n\t\t\t<<set $VanillaPlus.deviancy.levelFive -= 4>>\n\t\t\t<<set $deviancy to Math.clamp($deviancy + 1, maplebirch.get("VanillaPlus").normalCeiling(\'deviancy\'), maplebirch.get("VanillaPlus").ceiling(\'deviancy\'))>>\n\t\t<</if>>\n\t<</if>>\n\t',
          expected: 1
        },
        // 两处原版钳制语句内容完全相同，用最短表达式成组替换并锁定数量。
        {
          srcmatchgroup: /<<set \$deviancy to Math\.clamp\(\$deviancy, 0, 100\)>>/g,
          to: '<<set $deviancy to Math.clamp($deviancy, maplebirch.get("VanillaPlus").minimum(\'deviancy\'), $VanillaPlus.lock.deviancy ? maplebirch.get("VanillaPlus").ceiling(\'deviancy\') : maplebirch.get("VanillaPlus").normalCeiling(\'deviancy\'))>>',
          expected: 2
        }
      ],
      'Widgets Clamp': [
        // 替换全局异种癖钳制公式，使非专用组件触发的数值变化也遵守突破边界。
        {
          src: '<<set $deviancy to Math.clamp($deviancy, 0, 100)>>',
          to: '<<set $deviancy to Math.clamp($deviancy, maplebirch.get("VanillaPlus").minimum(\'deviancy\'), $VanillaPlus.lock.deviancy ? maplebirch.get("VanillaPlus").ceiling(\'deviancy\') : maplebirch.get("VanillaPlus").normalCeiling(\'deviancy\'))>>',
          expected: 1
        }
      ]
    }
  });
}
