// ./src/script/VanillaPlus/Willpower.ts

export default function (maplebirch: typeof window.maplebirch) {
  maplebirch.tool.addTo('BeforeLinkZone', { widget: 'deadwood-reblooms-willpower-unlock', passage: 'Lake Ruin Prison' });

  // 记录原版抗拒成功点，并扩展意志上限与耳液抵抗。
  maplebirch.tool.inject({
    locationPassage: {
      'Asylum Mundane Slime Defy': [
        // 原版耳液抗拒的意志检定接入特质抗性，无特质时返回原值。
        {
          src: "currentSkillValue('willpower')",
          to: 'maplebirch.get("VanillaPlus").willpower.earSlime(currentSkillValue(\'willpower\'))',
          expected: 1
        }
      ],
      'Asylum Patient Slime Defy': [
        // 原版耳液抗拒的意志检定接入特质抗性，无特质时返回原值。
        {
          src: "currentSkillValue('willpower')",
          to: 'maplebirch.get("VanillaPlus").willpower.earSlime(currentSkillValue(\'willpower\'))',
          expected: 1
        }
      ],
      'Farm Slime Strip Defy': [
        // 原版耳液抗拒的意志检定接入特质抗性，无特质时返回原值。
        {
          src: "currentSkillValue('willpower')",
          to: 'maplebirch.get("VanillaPlus").willpower.earSlime(currentSkillValue(\'willpower\'))',
          expected: 1
        }
      ],
      'Forest Pitcher Slime Defy': [
        // 原版耳液抗拒的意志检定接入特质抗性，无特质时返回原值。
        {
          src: "currentSkillValue('willpower')",
          to: 'maplebirch.get("VanillaPlus").willpower.earSlime(currentSkillValue(\'willpower\'))',
          expected: 1
        }
      ],
      'Forest Slime Pair Defy': [
        // 原版耳液抗拒的意志检定接入特质抗性，无特质时返回原值。
        {
          src: "currentSkillValue('willpower')",
          to: 'maplebirch.get("VanillaPlus").willpower.earSlime(currentSkillValue(\'willpower\'))',
          expected: 1
        }
      ],
      'Forest Slime Wolf Defy': [
        // 原版耳液抗拒的意志检定接入特质抗性，无特质时返回原值。
        {
          src: "currentSkillValue('willpower')",
          to: 'maplebirch.get("VanillaPlus").willpower.earSlime(currentSkillValue(\'willpower\'))',
          expected: 1
        }
      ],
      'Hallways Slime Breasts Defy': [
        // 原版耳液抗拒的意志检定接入特质抗性，无特质时返回原值。
        {
          src: "currentSkillValue('willpower')",
          to: 'maplebirch.get("VanillaPlus").willpower.earSlime(currentSkillValue(\'willpower\'))',
          expected: 1
        }
      ],
      'Hallways Slime Strip Defy': [
        // 原版耳液抗拒的意志检定接入特质抗性，无特质时返回原值。
        {
          src: "currentSkillValue('willpower')",
          to: 'maplebirch.get("VanillaPlus").willpower.earSlime(currentSkillValue(\'willpower\'))',
          expected: 1
        }
      ],
      'Lake Stroll Slime Defy': [
        // 原版耳液抗拒的意志检定接入特质抗性，无特质时返回原值。
        {
          src: "currentSkillValue('willpower')",
          to: 'maplebirch.get("VanillaPlus").willpower.earSlime(currentSkillValue(\'willpower\'))',
          expected: 1
        }
      ],
      'Livestock Slime Field Grass Defy': [
        // 原版耳液抗拒的意志检定接入特质抗性，无特质时返回原值。
        {
          src: "currentSkillValue('willpower')",
          to: 'maplebirch.get("VanillaPlus").willpower.earSlime(currentSkillValue(\'willpower\'))',
          expected: 1
        }
      ],
      'Livestock Slime Field Grass Extreme Defy': [
        // 原版耳液抗拒的意志检定接入特质抗性，无特质时返回原值。
        {
          src: "currentSkillValue('willpower')",
          to: 'maplebirch.get("VanillaPlus").willpower.earSlime(currentSkillValue(\'willpower\'))',
          expected: 1
        }
      ],
      'Meadow Relax Slime Defy': [
        // 原版耳液抗拒的意志检定接入特质抗性，无特质时返回原值。
        {
          src: "currentSkillValue('willpower')",
          to: 'maplebirch.get("VanillaPlus").willpower.earSlime(currentSkillValue(\'willpower\'))',
          expected: 1
        }
      ],
      'Ocean Breeze Slime Defy': [
        // 原版耳液抗拒的意志检定接入特质抗性，无特质时返回原值。
        {
          src: "currentSkillValue('willpower')",
          to: 'maplebirch.get("VanillaPlus").willpower.earSlime(currentSkillValue(\'willpower\'))',
          expected: 1
        }
      ],
      'Pound Food Event Slime Defy': [
        // 原版耳液抗拒的意志检定接入特质抗性，无特质时返回原值。
        {
          src: "currentSkillValue('willpower')",
          to: 'maplebirch.get("VanillaPlus").willpower.earSlime(currentSkillValue(\'willpower\'))',
          expected: 1
        }
      ],
      'School Lesson Slime': [
        // 原版耳液抗拒的意志检定接入特质抗性，无特质时返回原值。
        {
          src: "currentSkillValue('willpower')",
          to: 'maplebirch.get("VanillaPlus").willpower.earSlime(currentSkillValue(\'willpower\'))',
          expected: 1
        }
      ],
      'School Lesson 2 Slime': [
        // 原版耳液抗拒的意志检定接入特质抗性，无特质时返回原值。
        {
          src: "currentSkillValue('willpower')",
          to: 'maplebirch.get("VanillaPlus").willpower.earSlime(currentSkillValue(\'willpower\'))',
          expected: 1
        }
      ],
      'Sea Slime Dolphins Defy': [
        // 原版耳液抗拒的意志检定接入特质抗性，无特质时返回原值。
        {
          src: "currentSkillValue('willpower')",
          to: 'maplebirch.get("VanillaPlus").willpower.earSlime(currentSkillValue(\'willpower\'))',
          expected: 1
        }
      ],
      SleepSlimeEventDefy: [
        // 原版耳液抗拒的意志检定接入特质抗性，无特质时返回原值。
        {
          src: "currentSkillValue('willpower')",
          to: 'maplebirch.get("VanillaPlus").willpower.earSlime(currentSkillValue(\'willpower\'))',
          expected: 1
        }
      ],
      'Street Bind Slime Defy': [
        // 原版耳液抗拒的意志检定接入特质抗性，无特质时返回原值。
        {
          src: "currentSkillValue('willpower')",
          to: 'maplebirch.get("VanillaPlus").willpower.earSlime(currentSkillValue(\'willpower\'))',
          expected: 1
        }
      ],
      'Street Car Slime Defy': [
        // 原版耳液抗拒的意志检定接入特质抗性，无特质时返回原值。
        {
          src: "currentSkillValue('willpower')",
          to: 'maplebirch.get("VanillaPlus").willpower.earSlime(currentSkillValue(\'willpower\'))',
          expected: 1
        }
      ],
      'Street Exhibitionism Fame Flaunt Slime Defy': [
        // 原版耳液抗拒的意志检定接入特质抗性，无特质时返回原值。
        {
          src: "currentSkillValue('willpower')",
          to: 'maplebirch.get("VanillaPlus").willpower.earSlime(currentSkillValue(\'willpower\'))',
          expected: 1
        }
      ],
      'Street Slime Defy': [
        // 原版耳液抗拒的意志检定接入特质抗性，无特质时返回原值。
        {
          src: "currentSkillValue('willpower')",
          to: 'maplebirch.get("VanillaPlus").willpower.earSlime(currentSkillValue(\'willpower\'))',
          expected: 1
        }
      ],
      'Street Slime Extreme Defy': [
        // 原版耳液抗拒的意志检定接入特质抗性，无特质时返回原值。
        {
          src: "currentSkillValue('willpower')",
          to: 'maplebirch.get("VanillaPlus").willpower.earSlime(currentSkillValue(\'willpower\'))',
          expected: 1
        }
      ],
      'Tentacle Plains Ear Slime Defy': [
        // 原版耳液抗拒的意志检定接入特质抗性，无特质时返回原值。
        {
          src: "currentSkillValue('willpower')",
          to: 'maplebirch.get("VanillaPlus").willpower.earSlime(currentSkillValue(\'willpower\'))',
          expected: 1
        }
      ],
      'Trash Slime Defy': [
        // 原版耳液抗拒的意志检定接入特质抗性，无特质时返回原值。
        {
          src: "currentSkillValue('willpower')",
          to: 'maplebirch.get("VanillaPlus").willpower.earSlime(currentSkillValue(\'willpower\'))',
          expected: 1
        }
      ],
      'Lake Ruin Prison Possession Resist': [
        // 在湖底监狱附身抗拒的成功判断入口记录 wraith 结果，作为意志突破条件。
        {
          src: '<<if $willpowerSuccess>>',
          applyafter: '<<set $VanillaPlus.willpower.wraith to true>>',
          expected: 1
        }
      ],
      'Schism End': [
        // 在原版 schismEnd 完成结算后记录 schism 结果，避免中途离开也被计为完成。
        {
          src: '<<schismEnd>>',
          applyafter: '<<set $VanillaPlus.willpower.schism to true>>',
          expected: 1
        }
      ],
      'Temple Vigil 14': [
        // 在守夜最终一小时推进后记录 vigil 结果，确认玩家完成整段神殿守夜。
        {
          src: '<<pass 60>>',
          applyafter: '<<set $VanillaPlus.willpower.vigil to true>>',
          expected: 1
        }
      ]
    },
    widgetPassage: {
      Widgets: [
        // 承伤层耗尽后继续执行原版意志检定、文本与失能结算。
        {
          src: '$pain gte 100 and $willpowerpain is undefined',
          applybefore: 'maplebirch.get("VanillaPlus").willpower.checkPain($pain) and ',
          expected: 1
        }
      ],
      'Widgets End Combat': [
        {
          src: '<<unset $willpowerpain>>',
          applyafter: '<<run maplebirch.get("VanillaPlus").willpower.reset()>>',
          expected: 1
        }
      ],
      'Widgets Clamp': [
        // 替换全局意志钳制公式，同时应用特质保底值与突破后的 125% 上限。
        {
          srcmatch: /Math\.clamp\(\$willpower, 0, \$willpowermax( \* \$AMCTraits\.willpower)?\)/,
          to: 'Math.clamp($willpower, maplebirch.get("VanillaPlus").minimum(\'willpower\'), $VanillaPlus.lock.willpower ? maplebirch.get("VanillaPlus").ceiling(\'willpower\') : $willpowermax$1)',
          expected: 1
        }
      ]
    }
  });
}
