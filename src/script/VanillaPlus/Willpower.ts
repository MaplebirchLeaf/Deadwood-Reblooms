// ./src/script/VanillaPlus/Willpower.ts

export default function (maplebirch: typeof window.maplebirch) {
  maplebirch.tool.addTo('BeforeLinkZone', { widget: 'deadwood-reblooms-willpower-unlock', passage: 'Lake Ruin Prison' });

  const SLIME_DEFY_PASSAGES = [
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
  ] as const;

  const slimeDefyInjections = Object.fromEntries(
    SLIME_DEFY_PASSAGES.map(passage => [
      passage,
      [
        // 原版耳液抗拒的意志检定接入特质抗性，无特质时返回原值。
        {
          src: "currentSkillValue('willpower')",
          to: 'maplebirch.get("VanillaPlus").willpower.earSlime(currentSkillValue(\'willpower\'))',
          expected: 1
        }
      ]
    ])
  );

  // 扩展意志上限、疼痛承伤与耳液抵抗，保留原版结算。
  maplebirch.tool.inject({
    locationPassage: slimeDefyInjections,
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
