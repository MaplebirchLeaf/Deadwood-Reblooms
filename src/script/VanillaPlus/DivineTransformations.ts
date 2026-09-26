import type { DivineEncounter } from '../../module/VanillaPlus/DivineTransformations';

export default function (maplebirch: typeof window.maplebirch) {
  const text = (key: string) => maplebirch.t(`deadwood-reblooms:VanillaPlus:divineTransformations:${key}`);
  const action = (encounter: DivineEncounter) => ({
    id: `divine-transformations-expunge-${encounter.toLowerCase()}`,
    actionType: 'mouthaction' as const,
    combatType: encounter,
    cond: () => maplebirch.VP.divineTransformations.canExpunge(encounter),
    display: () => text('action:expunge'),
    value: () => `VanillaPlusDivineExpunge${encounter}`,
    color: 'def',
    order: 1,
    effect: `<<deadwood-reblooms-divine-expunge "${encounter}">>`
  });

  // 堕天使的清除来自原版仪式剧情中的同名能力；只接入框架已有结算点，不改写遭遇战 passage。
  maplebirch.combat.CombatAction.reg(action('Default'), action('Struggle'), action('Tentacle'));

  // 先同步转化数值与战斗体液，再让可能输出文本的状态事件接管页面。
  maplebirch.dynamic.regStateEvent('gate', 'divine-transformations', {
    priority: 100,
    cond: () => V.VanillaPlus != null,
    action: () => maplebirch.VP.divineTransformations.update()
  });

  maplebirch.tool.inject({
    widgetPassage: {
      'Widgets Combat Tentacle Adv': [
        // 沿用原版放逐的命中、双手与满纯洁倍率，只把每层固定伤害扩展为固定值加初始生命百分比。
        {
          src: '<<if $rng lte ($purity / 20)>>',
          applybefore: '<<set _banishDamage to maplebirch.VP.divineTransformations.banishDamage(_tentacle.tentaclehealthstart)>>',
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
      has: () => maplebirch.VP.divineTransformations.angel,
      text: () => text('trait:angel:text')
    },
    {
      title: 'General Traits',
      name: () => text('trait:fallenAngel:name'),
      colour: 'black',
      has: () => maplebirch.VP.divineTransformations.fallenAngel,
      text: () => text('trait:fallenAngel:text')
    },
    {
      title: 'General Traits',
      name: () => text('trait:ironWill:name'),
      colour: 'silver',
      has: () => maplebirch.VP.divineTransformations.fallenAngel,
      text: () => text('trait:ironWill:text')
    },
    {
      title: 'General Traits',
      name: demonName,
      colour: 'red',
      has: () => maplebirch.VP.divineTransformations.demon,
      text: () => text('trait:demon:text')
    }
  );
}
