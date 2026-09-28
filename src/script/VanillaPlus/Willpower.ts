// ./src/script/VanillaPlus/Willpower.ts

export default function (maplebirch: typeof window.maplebirch) {
  maplebirch.tool.onInit(() => {
    setup.feats['Sovereign Will'] ??= {
      get title() {
        return maplebirch.t('deadwood-reblooms:VanillaPlus:willpower:feat:title');
      },
      get desc() {
        return maplebirch.t('deadwood-reblooms:VanillaPlus:willpower:feat:description');
      },
      difficulty: 3,
      series: '',
      filter: ['All', 'Stats']
    };
  });

  maplebirch.dynamic.regStateEvent('gate', 'willpower-max', {
    output: 'earnFeat "Sovereign Will"',
    cond: () => V.VanillaPlus != null && maplebirch.VP.willpower.max
  });

  const slimeDefyPassages = [
    'Asylum Mundane Slime Defy',
    'Asylum Patient Slime Defy',
    'Farm Slime Strip Defy',
    'Forest Pitcher Slime Defy',
    'Forest Slime Pair Defy',
    'Forest Slime Wolf Defy',
    'Hallways Slime Breasts Defy',
    'Hallways Slime Strip Defy',
    'Lake Stroll Slime Defy',
    'Livestock Slime Field Grass Defy',
    'Livestock Slime Field Grass Extreme Defy',
    'Meadow Relax Slime Defy',
    'Ocean Breeze Slime Defy',
    'Pound Food Event Slime Defy',
    'School Lesson Slime',
    'School Lesson 2 Slime',
    'Sea Slime Dolphins Defy',
    'SleepSlimeEventDefy',
    'Street Bind Slime Defy',
    'Street Car Slime Defy',
    'Street Exhibitionism Fame Flaunt Slime Defy',
    'Street Slime Defy',
    'Street Slime Extreme Defy',
    'Tentacle Plains Ear Slime Defy',
    'Trash Slime Defy'
  ];
  const slimeDefy = Object.fromEntries(
    slimeDefyPassages.map(passage => [
      passage,
      [
        // 将每个史莱姆抗拒场景的原版意志值输入包装为耳液抗性值；无特质时返回原值。
        {
          src: "currentSkillValue('willpower')",
          to: "maplebirch.VP.willpower.earSlime(currentSkillValue('willpower'))",
          expected: 1
        }
      ]
    ])
  );

  maplebirch.tool.addTo('BeforeLinkZone', { widget: 'deadwood-reblooms-willpower-unlock', passage: 'Lake Ruin Prison' });

  // 记录原版抗拒成功点，并扩展意志上限与耳液抵抗。
  maplebirch.tool.inject({
    locationPassage: {
      ...slimeDefy,
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
          to: 'maplebirch.VP.willpower.checkPain($pain) and $pain gte 100 and $willpowerpain is undefined',
          expected: 1
        }
      ],
      'Widgets End Combat': [
        {
          src: '<<unset $willpowerpain>>',
          applyafter: '<<run maplebirch.VP.willpower.reset()>>',
          expected: 1
        }
      ],
      Cheats: [
        // 将作弊面板意志滑条上限改为动态 125%，未突破时继续使用原版 $willpowermax。
        {
          srcmatch: /\$willpower "willpower" \{max: (1000)( \* \$AMCTraits\.willpower)?(, percentage: false)?\}/,
          to: '$willpower "willpower" {max: $VanillaPlus.lock.willpower ? maplebirch.VP.ceiling("willpower") : $1$2$3}',
          expected: 1
        }
      ],
      'Widgets Clamp': [
        // 替换全局意志钳制公式，同时应用特质保底值与突破后的 125% 上限。
        {
          srcmatch: /Math\.clamp\(\$willpower, 0, \$willpowermax( \* \$AMCTraits\.willpower)?\)/,
          to: "Math.clamp($willpower, maplebirch.VP.minimum('willpower'), $VanillaPlus.lock.willpower ? maplebirch.VP.ceiling('willpower') : $willpowermax$1)",
          expected: 1
        }
      ]
    }
  });
}
