// ./src/script/VanillaPlus/DivineTransformations.ts

import type { DivineEncounter } from '../../module/VanillaPlus/DivineTransformations';

export default function (maplebirch: typeof window.maplebirch) {
  const text = (key: string) => maplebirch.t(`deadwood-reblooms:VanillaPlus:divineTransformations:${key}`);
  const divine = () => maplebirch.get('VanillaPlus')?.divineTransformations;
  maplebirch.once(':storyready', () => {
    const transform = maplebirch.tool.macro.Macro.get('transform');
    if (transform?.handler) {
      // 只拦截神圣点数的负增长，其余调用保留现有宏的框架修正与兼容逻辑。
      maplebirch.tool.macro.define(
        'transform',
        function (name: string, change: number) {
          if (divine()?.trinity && ['angel', 'fallen', 'demon'].includes(name) && change < 0) return;
          return transform.handler.call(this);
        },
        transform.tags,
        transform.skipArgs,
        false,
        'storyready'
      );
    }

    let updating = false;
    for (const name of ['angelTransform', 'demonTransform', 'fallenButNotOut']) {
      const original = maplebirch.tool.macro.Macro.get(name);
      if (!original?.handler) continue;
      // 保留已加载的 widget，只在正常成长后补算另外两种形态，不改动原定义。
      maplebirch.tool.macro.define(
        name,
        function (step: number) {
          const result = original.handler.call(this);
          if (!divine()?.trinity || !V.settings.transformDivineEnabled || updating) return result;
          updating = true;
          try {
            // 无参强制转化与 99 清除分支不触发补算。
            if (Number.isInteger(step) && step >= 0 && step <= 6) {
              if (name !== 'angelTransform' && (V.angel > 0 || V.angelbuild >= 25)) this.output.append(maplebirch.char.transformation.wikifier('angelTransform', V.angel));
              if (name !== 'demonTransform' && (V.demon > 0 || V.demonbuild >= 5)) this.output.append(maplebirch.char.transformation.wikifier('demonTransform', V.demon));
              if (name !== 'fallenButNotOut' && V.fallenangel >= 2) this.output.append(maplebirch.char.transformation.wikifier('fallenButNotOut', V.fallenangel));
            }
          } finally {
            V.specialTransform = V.angel > 0 || V.demon > 0 || V.fallenangel >= 2 ? 1 : 0;
            updating = false;
          }
          return result;
        },
        original.tags,
        original.skipArgs,
        false,
        'storyready'
      );
    }
  });

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
      'Transformation Widgets': [
        {
          src: '<<if $demonbuild gte 5 and $settings.transformDivineEnabled and $specialTransform isnot 1>>',
          to: '<<if $demonbuild gte 5 and $settings.transformDivineEnabled and ($specialTransform isnot 1 or maplebirch.get("VanillaPlus")?.divineTransformations.trinity)>>',
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

  const crossdressing = () => window.isCrossdressing?.() === true;
  const demonName = () => {
    const masculine = V.player?.gender_appearance === 'm';
    const markedSex = (masculine && V.player?.sex === 'f') || (!masculine && V.player?.sex === 'm');
    const crossdressed = markedSex && crossdressing();
    const englishName = `${masculine ? 'Incubus' : 'Succubus'}${crossdressed ? ` (${V.player.sex === 'f' ? 'female' : 'male'})` : ''}`;
    const chineseName = `${masculine ? '魅影' : '魅魔'}${crossdressed ? (masculine ? '(♀)' : '(♂)') : ''}`;
    return lanSwitch(englishName, chineseName);
  };

  // 复用原版特质名称覆盖其说明，使新增效果与对应转化显示在同一项中。
  maplebirch.tool.patch.traits.add(
    {
      title: 'General Traits',
      name: () => text('trait:angel:name'),
      colour: 'gold',
      has: () => maplebirch.get('VanillaPlus')!.divineTransformations.angel,
      text: () => text('trait:angel:text')
    },
    {
      title: 'General Traits',
      name: () => text('trait:fallenAngel:name'),
      colour: 'black',
      has: () => maplebirch.get('VanillaPlus')!.divineTransformations.fallenAngel,
      text: () => text('trait:fallenAngel:text')
    },
    {
      title: 'General Traits',
      name: () => text('trait:ironWill:name'),
      colour: 'silver',
      has: () => maplebirch.get('VanillaPlus')!.divineTransformations.fallenAngel,
      text: () => text('trait:ironWill:text')
    },
    {
      title: 'General Traits',
      name: demonName,
      colour: 'red',
      has: () => maplebirch.get('VanillaPlus')!.divineTransformations.demon,
      text: () => text('trait:demon:text')
    }
  );
}
