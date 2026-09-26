// ./src/script/VanillaPlus/HandGrip.ts

import type { GripHand } from '../../module/VanillaPlus/HandGrip';

export default function (maplebirch: typeof window.maplebirch) {
  const text = (key: string, values: Record<string, string> = {}) => {
    let result = maplebirch.t(`deadwood-reblooms:VanillaPlus:handGrip:${key}`);
    for (const [name, value] of Object.entries(values)) result = result.replaceAll(`{${name}}`, value);
    return result;
  };
  const selectedTarget = (hand: GripHand) => Number(hand === 'left' ? V.lefttarget : V.righttarget);
  const targetName = (hand: GripHand) => {
    const npc = V.NPCList?.[selectedTarget(hand)];
    return (maplebirch.Language === 'CN' ? npc?.fullDescription_CN : npc?.fullDescription) || npc?.fullDescription || '';
  };
  const active = () => V.combat === 1 && V.enemytype === 'man' && V.walltype !== 'front' && !V.gloryhole;
  const available = (hand: GripHand) => T?.[`${hand}Options`] === 'free';
  const canStart = (hand: GripHand) => active() && available(hand) && maplebirch.VP.handGrip.target(hand) == null && maplebirch.VP.handGrip.isPenetrationRecipient(selectedTarget(hand));
  const canKeep = (hand: GripHand) => active() && maplebirch.VP.handGrip.target(hand) != null;
  const difficulty = '<<handdifficulty>> <<if $consensual is 0>><<combatpromiscuous6>><<else>><<combatpromiscuous3>><</if>>';
  const keepDifficulty = `<<if $orgasmdown lt 1>>${difficulty}<</if>>`;

  // 抓握是原版性交动作的增强，不要求淫乱突破；左右手分别注册，因此可以同时抓住目标。
  maplebirch.combat.CombatAction.reg(
    {
      id: 'hand-grip-left',
      actionType: 'leftaction',
      cond: () => canStart('left'),
      display: () => text('action:grip', { name: targetName('left') }),
      value: () => 'VanillaPlusHandGripLeft',
      color: 'brat',
      difficulty,
      effect: '<<deadwood-reblooms-hand-grip "left" "start">>'
    },
    {
      id: 'hand-grip-right',
      actionType: 'rightaction',
      cond: () => canStart('right'),
      display: () => text('action:grip', { name: targetName('right') }),
      value: () => 'VanillaPlusHandGripRight',
      color: 'brat',
      difficulty,
      effect: '<<deadwood-reblooms-hand-grip "right" "start">>'
    },
    {
      id: 'hand-grip-left-keep',
      actionType: 'leftaction',
      cond: () => canKeep('left'),
      display: () => text(Number(V.orgasmdown) >= 1 ? 'action:noEscape' : 'action:keep'),
      value: () => 'VanillaPlusHandGripLeftKeep',
      color: 'brat',
      difficulty: keepDifficulty,
      effect: '<<deadwood-reblooms-hand-grip "left" "keep">>'
    },
    {
      id: 'hand-grip-right-keep',
      actionType: 'rightaction',
      cond: () => canKeep('right'),
      display: () => text(Number(V.orgasmdown) >= 1 ? 'action:noEscape' : 'action:keep'),
      value: () => 'VanillaPlusHandGripRightKeep',
      color: 'brat',
      difficulty: keepDifficulty,
      effect: '<<deadwood-reblooms-hand-grip "right" "keep">>'
    },
    {
      id: 'hand-grip-left-release',
      actionType: 'leftaction',
      cond: () => canKeep('left') && Number(V.orgasmdown) < 1,
      display: () => text('action:release'),
      value: () => 'VanillaPlusHandGripLeftRelease',
      color: 'white',
      effect: '<<deadwood-reblooms-hand-grip "left" "release">>'
    },
    {
      id: 'hand-grip-right-release',
      actionType: 'rightaction',
      cond: () => canKeep('right') && Number(V.orgasmdown) < 1,
      display: () => text('action:release'),
      value: () => 'VanillaPlusHandGripRightRelease',
      color: 'white',
      effect: '<<deadwood-reblooms-hand-grip "right" "release">>'
    }
  );

  // 抓握借用原版 handheld 占用；持续期间隐藏原版牵手选项，只保留抓握自己的继续与停止。
  maplebirch.combat.CombatAction.modify(
    { id: 'hand-grip-left-hide-keep', actionType: 'leftaction', value: 'lefthandholdkeep', cond: () => maplebirch.VP.handGrip.target('left') == null },
    { id: 'hand-grip-left-hide-release', actionType: 'leftaction', value: 'lefthandholdstop', cond: () => maplebirch.VP.handGrip.target('left') == null },
    { id: 'hand-grip-left-hide-guide', actionType: 'leftaction', value: 'handguide', cond: () => maplebirch.VP.handGrip.target('left') == null },
    { id: 'hand-grip-right-hide-keep', actionType: 'rightaction', value: 'righthandholdkeep', cond: () => maplebirch.VP.handGrip.target('right') == null },
    { id: 'hand-grip-right-hide-release', actionType: 'rightaction', value: 'righthandholdstop', cond: () => maplebirch.VP.handGrip.target('right') == null },
    { id: 'hand-grip-right-hide-guide', actionType: 'rightaction', value: 'handguide', cond: () => maplebirch.VP.handGrip.target('right') == null }
  );

  // 原版会在 showfn 隐藏右臂前先求值 srcfn，导致受缚时请求不存在的 right-arm-none.png。
  // 只为资源预解析提供现有的 idle 图片；arm_right 仍为 none，因此该图层不会实际显示。
  maplebirch.char.use(
    {
      rightarm: {
        srcfn: (options: CanvasModelOptionsData) => {
          const arm = options.arm_right === 'none' ? 'idle' : options.arm_right;
          if (options.mannequin) return `img/body/mannequin/right-arm-${arm}.png`;
          if (arm === 'idle') return `img/body/right-arm-idle-${options.body_type}.png`;
          return `img/body/right-arm-${arm}.png`;
        }
      }
    },
    'main'
  );

  // 高潮时先恢复抓握占用；只在唯一的人类动作入口插入调用，不匹配原版高潮分支或文本块。
  maplebirch.tool.inject({
    widgetPassage: {
      'Widgets Actions Generation': [
        {
          src: '<<widget "generateActionsMan">>',
          applyafter: '\n\t<<run maplebirch.VP.handGrip.restoreOrgasmGrip()>>',
          expected: 1
        },
        {
          srcmatch: /(?:Your left hand is being held\.|你的左手被握住了。)/,
          to: '<<if maplebirch.VP.handGrip.target("left") isnot undefined>><<deadwood-reblooms-hand-grip-status "left">><<else>>$&<</if>>',
          expected: 1
        },
        {
          srcmatch: /(?:Your right hand is being held\.|你的右手被握住了。)/,
          to: '<<if maplebirch.VP.handGrip.target("right") isnot undefined>><<deadwood-reblooms-hand-grip-status "right">><<else>>$&<</if>>',
          expected: 1
        }
      ]
    }
  });
}
