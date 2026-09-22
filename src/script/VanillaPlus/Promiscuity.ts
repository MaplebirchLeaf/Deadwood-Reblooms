// ./src/script/VanillaPlus/Promiscuity.ts

export default function (maplebirch: typeof window.maplebirch) {
  const available = () => V.VanillaPlus.lock.promiscuity && V.enemytype === 'man' && !V.npcSub;
  const target = (index: number) => V.NPCList?.[index];
  const reachable = (npc: any) => npc?.stance !== 'topface' && npc.location?.genitals === 0 && npc.location?.head !== 'genitals';
  const penisFree = () => !(window as any).playerChastity('penis');
  const direct = (action: string, target: string) =>
    `<<set _vanillaPlusPromiscuity to $VanillaPlus.traits.promiscuity>><<set _vanillaPlusPromiscuityIgnore to $promiscuityIgnore>><<set _vanillaPlusPromiscuityTarget to ${target}>><<set $promiscuityIgnore to true>><<set $${action}>>`;
  const text = (key: string, values: Record<string, string> = {}) => {
    let result = maplebirch.t(`deadwood-reblooms.VanillaPlus.promiscuity.${key}`);
    for (const [name, value] of Object.entries(values)) result = result.replaceAll(`{${name}}`, value);
    return result;
  };
  const straddle = (index: number) => {
    const npc = target(index);
    if (!npc) return '';
    return text('action.straddle', { his: npc.pronouns.his });
  };

  maplebirch.tool.onInit(() => {
    setup.feats['Every Inch'] ??= {
      get title() {
        return text('feat.title');
      },
      get desc() {
        return text('feat.description');
      },
      difficulty: 3,
      series: '',
      filter: ['All', 'Stats']
    };
  });

  maplebirch.dynamic.regStateEvent('gate', 'promiscuity-max', {
    output: 'earnFeat "Every Inch"',
    cond: () => V.VanillaPlus != null && maplebirch.VP.promiscuity.max && !V.feats.currentSave['Every Inch']
  });
  maplebirch.dynamic.regStateEvent('gate', 'promiscuity-unlock', {
    output: 'deadwood-reblooms-promiscuity-unlock',
    cond: () => V.VanillaPlus != null && maplebirch.VP.promiscuity.unlock
  });

  maplebirch.combat.CombatAction.reg(
    {
      id: 'promiscuity-receive-vaginal',
      actionType: 'vaginaaction',
      cond: () => available() && V.player.vaginaExist && !V.vaginause && target(V.vaginatarget)?.penis === 0 && reachable(target(V.vaginatarget)),
      display: () => straddle(V.vaginatarget),
      value: () => 'VanillaPlusPromiscuityReceiveVaginal',
      color: 'meek',
      effect: direct('vaginaaction to "vaginatopenis"', '$vaginatarget')
    },
    {
      id: 'promiscuity-receive-anal',
      actionType: 'anusaction',
      cond: () => available() && !V.anususe && target(V.anustarget)?.penis === 0 && reachable(target(V.anustarget)),
      display: () => straddle(V.anustarget),
      value: () => 'VanillaPlusPromiscuityReceiveAnal',
      color: 'meek',
      effect: direct('anusaction to "anustopenis"', '$anustarget')
    },
    {
      id: 'promiscuity-press-vaginal',
      actionType: 'penisaction',
      cond: () => available() && V.player.penisExist && !V.penisuse && penisFree() && target(V.penistarget)?.vagina === 0 && reachable(target(V.penistarget)),
      display: () => {
        const npc = target(V.penistarget);
        return text('action.pressVagina', { his: npc.pronouns.his });
      },
      value: () => 'VanillaPlusPromiscuityPressVaginal',
      color: 'meek',
      effect: direct('penisaction to "penistovagina"', '$penistarget')
    },
    {
      id: 'promiscuity-press-anal',
      actionType: 'penisaction',
      cond: () => {
        const npc = target(V.penistarget);
        return available() && V.player.penisExist && !V.penisuse && penisFree() && !!npc && [0, 'none'].includes(npc.vagina) && [0, 'none'].includes(npc.penis) && reachable(npc);
      },
      display: () => {
        const npc = target(V.penistarget);
        return text('action.pressAnus', { his: npc.pronouns.his });
      },
      value: () => 'VanillaPlusPromiscuityPressAnal',
      color: 'meek',
      effect: direct('penisaction to "penistoanus"', '$penistarget')
    }
  );

  // 扩展战斗性行为选项，并接入淫乱突破与数值上限。
  maplebirch.tool.zone.inject({
    widgetPassage: {
      Cheats: [
        // 将作弊面板淫乱滑条上限改为 100/150 动态值，保留原版反向显示。
        {
          src: '$promiscuity "promiscuity" {reverse: true}',
          to: '$promiscuity "promiscuity" {max: $VanillaPlus.lock.promiscuity ? 150 : 100, reverse: true}'
        }
      ],
      'Widgets Effects Man': [
        // 在男性战斗结算组件入口记录本回合双方同意的身体部位行动，并在突破后调用第六级成长。
        {
          src: '<<widget "effectsman">>',
          applyafter:
            '<<if $consensual is 1 and $enemytype is "man" and maplebirch.VP.promiscuity.record({ hands: [$leftaction, $rightaction], feet: $feetaction, mouth: $mouthaction, penis: $penisaction, vagina: $vaginaaction, anus: $anusaction, chest: $chestaction, thigh: $thighaction }) and $VanillaPlus.lock.promiscuity>><<combatpromiscuity6>><</if>>'
        },
        // 在原版请求窒息判断前插入扩展请求结算，使新增语言选项能进入同一行动流程。
        {
          src: '<<if $mouthaction is "ask" and $askAction is "askchoke" and $askedtochoke isnot 1>>',
          applybefore: '<<deadwood-reblooms-promiscuity-request>>\n\t\t'
        },
        // 在阴道主动骑乘的原版效果后恢复临时状态，并输出本次扩展行动结果。
        {
          src: '<<effectsvaginatopenis>>',
          applyafter: '<<deadwood-reblooms-promiscuity-direct-result "vagina">>'
        },
        // 在肛门主动骑乘的原版效果后恢复临时状态，并输出本次扩展行动结果。
        {
          src: '<<effectsanustopenis>>',
          applyafter: '<<deadwood-reblooms-promiscuity-direct-result "anus">>'
        },
        // 在阴道插入的原版效果后恢复临时状态，并记录玩家主动使用阴茎的结果。
        {
          src: '<<effectspenistovagina>>',
          applyafter: '<<deadwood-reblooms-promiscuity-direct-result "penis-vagina">>'
        },
        // 在肛门插入的原版效果后恢复临时状态，并记录玩家主动使用阴茎的结果。
        {
          src: '<<effectspenistoanus>>',
          applyafter: '<<deadwood-reblooms-promiscuity-direct-result "penis-anus">>'
        }
      ],
      'Widgets Effects Vagina': [
        // 为扩展阴道行动放行一次原版技能检查；普通行动仍必须通过 combatSkillCheck。
        {
          src: '<<if combatSkillCheck("vaginal", $vaginatarget)>>',
          to: '<<if _vanillaPlusPromiscuity or combatSkillCheck("vaginal", $vaginatarget)>>'
        }
      ],
      'Widgets Effects Anus': [
        // 为扩展肛门行动放行一次原版技能检查；普通行动仍必须通过 combatSkillCheck。
        {
          src: '<<if combatSkillCheck("anal", $anustarget)>>',
          to: '<<if _vanillaPlusPromiscuity or combatSkillCheck("anal", $anustarget)>>'
        }
      ],
      'Widgets Effects Penis': [
        // 替换第一处阴茎技能检查，为主动阴道插入行动使用临时放行标记。
        {
          src: '<<if combatSkillCheck("penile", $penistarget)>>',
          to: '<<if _vanillaPlusPromiscuity or combatSkillCheck("penile", $penistarget)>>'
        },
        // 替换第二处阴茎技能检查，为主动肛门插入行动使用相同的临时放行标记。
        {
          src: '<<if combatSkillCheck("penile", $penistarget)>>',
          to: '<<if _vanillaPlusPromiscuity or combatSkillCheck("penile", $penistarget)>>'
        }
      ],
      'Widgets Actions Speak': [
        // 在原版汇总请求选项前注册扩展请求，确保新增选项进入同一 _askValues 列表。
        {
          src: '<<set _askValues to Object.values(_askActions)>>',
          applybefore: '<<deadwood-reblooms-promiscuity-request-options>>\n\t\t'
        }
      ],
      'Widgets Promiscuity': [
        // 替换第一处阶段上限计算，使第六阶段在突破锁定后显示 150 上限。
        {
          src: '<<set $_scaledPromiscuityMax to 20 * $_n>>',
          to: '<<set $_scaledPromiscuityMax to $_n is 6 and $VanillaPlus.lock.promiscuity ? 150 : 20 * $_n>>'
        },
        // 替换同组件第二处阶段上限计算，覆盖另一种淫乱数值显示路径。
        {
          src: '<<set $_scaledPromiscuityMax to 20 * $_n>>',
          to: '<<set $_scaledPromiscuityMax to $_n is 6 and $VanillaPlus.lock.promiscuity ? 150 : 20 * $_n>>'
        },
        // 替换第一处淫乱结算钳制，加入特质保底值与突破后的 150 上限。
        {
          src: '<<set $promiscuity to Math.clamp($promiscuity, 0, 100)>>',
          to: "<<set $promiscuity to Math.clamp($promiscuity, maplebirch.VP.minimum('promiscuity'), $VanillaPlus.lock.promiscuity ? 150 : 100)>>"
        },
        // 替换同组件第二处淫乱结算钳制，确保另一条更新路径使用相同边界。
        {
          src: '<<set $promiscuity to Math.clamp($promiscuity, 0, 100)>>',
          to: "<<set $promiscuity to Math.clamp($promiscuity, maplebirch.VP.minimum('promiscuity'), $VanillaPlus.lock.promiscuity ? 150 : 100)>>"
        }
      ],
      'Widgets Clamp': [
        // 替换全局淫乱钳制公式，使其他来源的数值变化同样遵守突破边界。
        {
          src: '<<set $promiscuity to Math.clamp($promiscuity, 0, 100)>>',
          to: "<<set $promiscuity to Math.clamp($promiscuity, maplebirch.VP.minimum('promiscuity'), $VanillaPlus.lock.promiscuity ? 150 : 100)>>"
        }
      ]
    }
  });
}
