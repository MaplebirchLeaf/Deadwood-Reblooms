// ./src/script/VanillaPlus/DivineTransformations.ts

import type { DivineEncounter } from '../../module/VanillaPlus/DivineTransformations';

export default function (maplebirch: typeof window.maplebirch) {
  const text = (key: string) => maplebirch.t(`deadwood-reblooms:VanillaPlus:divineTransformations:${key}`);

  const action = (encounter: DivineEncounter) => ({
    id: `divine-transformations-expunge-${encounter.toLowerCase()}`,
    actionType: 'mouthaction' as const,
    combatType: encounter,
    cond: () => maplebirch.get('VanillaPlus')!.divineTransformations.canExpunge(encounter),
    display: () => text('action:expunge'),
    value: () => `VanillaPlusDivineExpunge${encounter}`,
    color: 'def',
    order: 1,
    effect: `<<deadwood-reblooms-divine-expunge "${encounter}">>`
  });

  // 堕天使的清除来自原版仪式剧情中的同名能力，只接入框架已有结算点，不改写遭遇战 passage。
  maplebirch.combat.CombatAction.reg(action('Default'), action('Struggle'), action('Tentacle'));

  maplebirch.tool.inject({
    widgetPassage: {
      Traits: [
        // 只扩充原版恶魔的说明，称号与解锁判断仍由原版及兼容层处理。
        {
          srcmatch: /(has: \$demon gte 6,\s*text: )[^\r\n]+/,
          to: '$1maplebirch.t("deadwood-reblooms:VanillaPlus:divineTransformations:trait:demon:text"),',
          expected: 1
        }
      ],
      'Widgets Combat Tentacle Adv': [
        // 沿用原版放逐的命中、双手与满纯洁倍率，只把每层固定伤害扩展为固定值加初始生命百分比。
        {
          src: '<<if $rng lte ($purity / 20)>>',
          applybefore: '<<set _banishDamage to maplebirch.get("VanillaPlus").divineTransformations.banishDamage(_tentacle.tentaclehealthstart)>>',
          expected: 1
        },
        {
          srcmatch: /<<set _tentacle\.tentaclehealth -= 10 \* _multi>><<tentacle_record "banish" 10 \* _multi>>/g,
          to: '<<set _tentacle.tentaclehealth -= _banishDamage * _multi>><<tentacle_record "banish" _banishDamage * _multi>>',
          expected: 2
        }
      ]
    }
  });

  // 复用原版特质名称覆盖其说明，使新增效果与对应转化显示在同一项中。
  maplebirch.tool.patch.traits.add(
    {
      title: 'Transformation Traits',
      name: () => text('trait:angel:name'),
      replace: 'Angel',
      colour: 'gold',
      has: () => maplebirch.get('VanillaPlus')!.divineTransformations.angel,
      text: () => text('trait:angel:text') + (maplebirch.get('VanillaPlus')!.divineTransformations.trinity ? '' : ' ' + text('trait:angel:warning'))
    },
    {
      title: 'Transformation Traits',
      name: () => text('trait:fallenAngel:name'),
      replace: 'Fallen Angel',
      colour: 'black',
      has: () => maplebirch.get('VanillaPlus')!.divineTransformations.fallenAngel,
      text: () => text('trait:fallenAngel:text')
    },
    {
      title: 'Transformation Traits',
      name: () => text('trait:ironWill:name'),
      replace: 'Iron Will',
      colour: 'silver',
      has: () => maplebirch.get('VanillaPlus')!.divineTransformations.fallenAngel,
      text: () => text('trait:ironWill:text')
    }
  );
}
