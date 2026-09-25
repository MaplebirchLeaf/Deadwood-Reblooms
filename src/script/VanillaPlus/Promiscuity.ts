// ./src/script/VanillaPlus/Promiscuity.ts

export default function (maplebirch: typeof window.maplebirch) {
  type GuideHand = 'left' | 'right';
  type GuideDestination = 'player-vagina' | 'player-anus' | 'NPC-vagina' | 'NPC-anus';

  const text = (key: string, values: Record<string, string> = {}) => {
    let result = maplebirch.t(`deadwood-reblooms:VanillaPlus:promiscuity:${key}`);
    for (const [name, value] of Object.entries(values)) result = result.replaceAll(`{${name}}`, value);
    return result;
  };
  const target = (index: number) => Number(index);
  const active = () => V.combat === 1 && maplebirch.VP.promiscuity.expanded && V.enemytype === 'man' && V.walltype !== 'front' && !V.gloryhole;
  const direct = (action: string, targetVariable: string) =>
    `<<set _vanillaPlusPromiscuity to true>><<set _vanillaPlusPromiscuityIgnore to $promiscuityIgnore>><<set _vanillaPlusPromiscuityTarget to Number(${targetVariable})>><<set $promiscuityIgnore to true>><<set $${action}>>`;
  const switchPenis = (destination: 'vagina' | 'anus') => {
    const action = destination === 'vagina' ? 'penistovagina' : 'penistoanus';
    return `<<if maplebirch.VP.promiscuity.preparePenisSwitch("${destination}", Number($penistarget))>>${direct(`penisaction to "${action}"`, '$penistarget')}<</if>>`;
  };
  const targetName = (index: number) => {
    const npc = V.NPCList?.[target(index)];
    return (maplebirch.Language === 'CN' ? npc?.fullDescription_CN : npc?.fullDescription) || npc?.fullDescription || '';
  };
  const needsExtraAction = (index: number) => {
    const npc = V.NPCList?.[target(index)];
    if (!npc || npc.stance === 'topface') return false;
    return ![0, undefined].includes(npc.location?.genitals) || npc.location?.head === 'genitals';
  };
  const handTarget = (hand: GuideHand) => target(hand === 'left' ? V.lefttarget : V.righttarget);
  const handAvailable = (hand: GuideHand) => (window as any).State?.temporary?.[`${hand}Options`] === 'free';
  const canGuidePenis = (hand: GuideHand) => {
    const selected = handTarget(hand);
    return active() && handAvailable(hand) && maplebirch.VP.promiscuity.hasPenis(selected) && !V.NPCList[selected].chastity.penis.includes('chastity');
  };
  const canGuidePlayerDouble = (selected: number, orifice: 'vagina' | 'anus') => {
    const primary = orifice === 'vagina' ? V.vaginatarget : V.anustarget;
    const use = orifice === 'vagina' ? V.vaginause : V.anususe;
    const enabled = orifice === 'vagina' ? V.settings.vaginalDoubleEnabled : V.settings.analDoubleEnabled;
    return enabled && use === 'penis' && Number(primary) !== selected && maplebirch.VP.promiscuity.hasPenis(selected);
  };
  const canGuideToPlayer = (hand: GuideHand, orifice: 'vagina' | 'anus') => {
    if (!canGuidePenis(hand) || V.walltype === 'front' || (window as any).playerChastity(orifice)) return false;
    const selected = handTarget(hand);
    const action = orifice === 'vagina' ? 'penetrate-vagina' : 'penetrate-anus';
    return maplebirch.VP.promiscuity.canAsk(action, selected) || canGuidePlayerDouble(selected, orifice);
  };
  const canGuideToNPC = (hand: GuideHand, orifice: 'vagina' | 'anus') => {
    if (!canGuidePenis(hand)) return false;
    const selected = handTarget(hand);
    const recipient = target(V.penistarget);
    const enabled = orifice === 'vagina' ? V.settings.vaginalDoubleEnabled : V.settings.analDoubleEnabled;
    const correctUse =
      orifice === 'vagina'
        ? V.penisuse === 'othervagina' && ['entrance', 'imminent', 'penetrated'].includes(V.penisstate)
        : V.penisuse === 'otheranus' && ['otheranusentrance', 'otheranusimminent', 'otheranus'].includes(V.penisstate);
    const differentPartner = !V.VanillaPlus.npcDoublePenetration || Number(V.VanillaPlus.npcDoublePenetration.partner) !== selected;
    return enabled && correctUse && selected !== recipient && differentPartner && (window as any).playerPenisSize() >= 2 && V.NPCList[selected].penissize >= 2;
  };
  const guideLabel = (hand: GuideHand, destination: GuideDestination) => {
    const selected = handTarget(hand);
    const values = { name: targetName(selected), recipient: targetName(V.penistarget) };
    if (destination === 'player-vagina') return text(V.vaginause === 'penis' ? 'action:guidePlayerVaginaDouble' : 'action:guidePlayerVagina', values);
    if (destination === 'player-anus') return text(V.anususe === 'penis' ? 'action:guidePlayerAnusDouble' : 'action:guidePlayerAnus', values);
    return text(destination === 'NPC-vagina' ? 'action:guideNPCVagina' : 'action:guideNPCAnus', values);
  };
  maplebirch.tool.onInit(() => {
    setup.feats['Every Inch'] ??= {
      get title() {
        return text('feat:title');
      },
      get desc() {
        return text('feat:description');
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

  // PC 主动改变姿势的动作使用框架注册；只有要求 NPC 主动配合的内容保留在 Ask。
  maplebirch.combat.CombatAction.reg(
    {
      id: 'promiscuity-receive-vaginal',
      actionType: 'vaginaaction',
      cond: () => active() && needsExtraAction(V.vaginatarget) && maplebirch.VP.promiscuity.canDirect('penetrate-vagina', target(V.vaginatarget)),
      display: () => text('action:straddleVaginal', { name: targetName(V.vaginatarget) }),
      value: () => 'VanillaPlusPromiscuityReceiveVaginal',
      color: 'lustful',
      effect: direct('vaginaaction to "vaginatopenis"', '$vaginatarget')
    },
    {
      id: 'promiscuity-receive-anal',
      actionType: 'anusaction',
      cond: () => active() && needsExtraAction(V.anustarget) && maplebirch.VP.promiscuity.canDirect('penetrate-anus', target(V.anustarget)),
      display: () => text('action:straddleAnal', { name: targetName(V.anustarget) }),
      value: () => 'VanillaPlusPromiscuityReceiveAnal',
      color: 'lustful',
      effect: direct('anusaction to "anustopenis"', '$anustarget')
    },
    {
      id: 'promiscuity-press-vaginal',
      actionType: 'penisaction',
      cond: () => active() && needsExtraAction(V.penistarget) && maplebirch.VP.promiscuity.canDirect('offer-vagina-to-penis', target(V.penistarget)),
      display: () => text('action:pressVagina', { name: targetName(V.penistarget) }),
      value: () => 'VanillaPlusPromiscuityPressVaginal',
      color: 'lustful',
      effect: direct('penisaction to "penistovagina"', '$penistarget')
    },
    {
      id: 'promiscuity-press-anal',
      actionType: 'penisaction',
      cond: () => active() && needsExtraAction(V.penistarget) && maplebirch.VP.promiscuity.canDirect('offer-anus-to-penis', target(V.penistarget)),
      display: () => text('action:pressAnus', { name: targetName(V.penistarget) }),
      value: () => 'VanillaPlusPromiscuityPressAnal',
      color: 'lustful',
      effect: direct('penisaction to "penistoanus"', '$penistarget')
    },
    {
      id: 'promiscuity-switch-to-vaginal',
      actionType: 'penisaction',
      cond: () => active() && maplebirch.VP.promiscuity.canSwitchPenis('vagina', target(V.penistarget)),
      display: () => text('action:switchVagina', { name: targetName(V.penistarget) }),
      value: () => 'VanillaPlusPromiscuitySwitchVaginal',
      color: 'sub',
      difficulty: '<<peniledifficulty>> <<combatpromiscuous5>>',
      effect: switchPenis('vagina')
    },
    {
      id: 'promiscuity-switch-to-anal',
      actionType: 'penisaction',
      cond: () => active() && maplebirch.VP.promiscuity.canSwitchPenis('anus', target(V.penistarget)),
      display: () => text('action:switchAnus', { name: targetName(V.penistarget) }),
      value: () => 'VanillaPlusPromiscuitySwitchAnal',
      color: 'sub',
      difficulty: '<<peniledifficulty>> <<combatpromiscuous5>>',
      effect: switchPenis('anus')
    }
  );

  // 左右手沿用原版目标下拉框，引导所选 NPC 的阴茎；动作结算前会再次检查目标与位置。
  for (const hand of ['left', 'right'] as const) {
    const registerGuide = (destination: GuideDestination, cond: () => boolean) => ({
      id: `promiscuity-guide-${hand}-${destination}`,
      actionType: hand === 'left' ? ('leftaction' as const) : ('rightaction' as const),
      cond,
      display: () => guideLabel(hand, destination),
      value: () => `VanillaPlusPromiscuityGuide${hand === 'left' ? 'Left' : 'Right'}${destination.replaceAll('-', '')}`,
      color: 'lustful',
      difficulty: '<<handdifficulty>> <<combatpromiscuous6>>',
      effect: `<<deadwood-reblooms-promiscuity-guide "${hand}" "${destination}">>`
    });
    maplebirch.combat.CombatAction.reg(
      registerGuide('player-vagina', () => canGuideToPlayer(hand, 'vagina')),
      registerGuide('player-anus', () => canGuideToPlayer(hand, 'anus')),
      registerGuide('NPC-vagina', () => canGuideToNPC(hand, 'vagina')),
      registerGuide('NPC-anus', () => canGuideToNPC(hand, 'anus'))
    );
  }

  // 扩展战斗性行为选项，并接入淫乱突破与数值上限。
  maplebirch.tool.inject({
    widgetPassage: {
      Cheats: [
        // 将作弊面板淫乱滑条上限按突破倍率计算，保留原版反向显示。
        {
          src: '$promiscuity "promiscuity" {reverse: true}',
          to: '$promiscuity "promiscuity" {max: $VanillaPlus.lock.promiscuity ? maplebirch.VP.ceiling("promiscuity") : maplebirch.VP.normalCeiling("promiscuity"), reverse: true}'
        }
      ],
      'Widgets Effects Man': [
        // 在男性战斗结算入口先清理失效的 NPC 双插状态；突破前记录部位经历，突破后五级动作由原版宏低效折算。
        {
          src: '<<widget "effectsman">>',
          applyafter:
            '<<run maplebirch.VP.NPCDoublePenetration.update()>><<if !$VanillaPlus.lock.promiscuity and $consensual is 1 and $enemytype is "man">><<run maplebirch.VP.promiscuity.record({ hands: [$leftaction, $rightaction], feet: $feetaction, mouth: $mouthaction, penis: $penisaction, vagina: $vaginaaction, anus: $anusaction, chest: $chestaction, thigh: $thighaction })>><</if>>'
        },
        // 男性战斗的全部部位效果结算后再次同步双插，令本回合的插入、拔出和换目标立即反映到状态与 X-ray。
        {
          src: '<<combat_lewdity_text>>',
          applybefore: '<<run maplebirch.VP.NPCDoublePenetration.update()>>\n\n\t\t',
          expected: 1
        },
        // 在原版 Ask 效果入口结算扩展请求；请求对象仍由原版 mouthtarget 选择。
        {
          src: '<<if $mouthaction is "ask" and $askAction is "askchoke" and $askedtochoke isnot 1>>',
          applybefore: '<<deadwood-reblooms-promiscuity-request>>\n\t\t'
        },
        // 框架注册的 PC 阴道主动动作执行后恢复临时标记，并只在姿势确实改变时结算六级成长。
        {
          src: '<<effectsvaginatopenis>>',
          applyafter: '<<deadwood-reblooms-promiscuity-direct-result "vagina">>',
          expected: 1
        },
        // 框架注册的 PC 肛门主动动作执行后恢复临时标记。
        {
          src: '<<effectsanustopenis>>',
          applyafter: '<<deadwood-reblooms-promiscuity-direct-result "anus">>',
          expected: 1
        },
        // 框架注册的 PC 阴茎主动插入动作执行后核对目标状态。
        {
          src: '<<effectspenistovagina>>',
          applyafter: '<<deadwood-reblooms-promiscuity-direct-result "penis-vagina">>',
          expected: 1
        },
        // 框架注册的 PC 阴茎主动肛交动作执行后核对目标状态。
        {
          src: '<<effectspenistoanus>>',
          applyafter: '<<deadwood-reblooms-promiscuity-direct-result "penis-anus">>',
          expected: 1
        },
        // 玩家要求第二名 NPC 加入肛交且检定成功时，按主动邀请双重插入结算一次六级成长。
        {
          srcmatch: /<<if (?:\$combatExtended\.reverseRapeStart is 1 or )?combatSkillCheck\("anal", \$penistarget\) and \$anususe is "penis">>/,
          applyafter: '<<combatpromiscuity6>>',
          expected: 1
        },
        // 玩家要求第二名 NPC 加入阴道性交且检定成功时，按主动邀请双重插入结算一次六级成长。
        {
          srcmatch: /<<if (?:\$combatExtended\.reverseRapeStart is 1 or )?combatSkillCheck\("vaginal", \$penistarget\) and \$vaginause is "penis">>/,
          applyafter: '<<combatpromiscuity6>>',
          expected: 1
        },
        // 从阴道动作栏邀请该 NPC 转入已有的肛交时，成功形成肛门双插才结算六级成长。
        {
          srcmatch: /<<if (?:combatSkillCheck\("anal", \$vaginatarget\)|\(\$combatExtended\.reverseRapeStart is 1 or combatSkillCheck\("anal", \$vaginatarget\)\)) and \$anususe is "penis">>/,
          applyafter: '<<combatpromiscuity6>>',
          expected: 1
        },
        // 从肛门动作栏邀请该 NPC 转入阴道时，仅在阴道已有另一根阴茎、实际形成双插时结算六级成长。
        {
          srcmatch:
            /<<if (?:combatSkillCheck\("vaginal", \$anustarget\) and \$vaginause isnot "doublepenis"|\(\$combatExtended\.reverseRapeStart is 1 or combatSkillCheck\("vaginal", _npcA\)\) and \$vaginause is "penis" and _existingVagNpc gte 0)>>/,
          applyafter: '<<if $vaginause is "penis">><<combatpromiscuity6>><</if>>',
          expected: 1
        }
      ],
      'Widgets Actions Speak': [
        // 在原版 Ask 列表读取值之前追加扩展请求，继续使用原版 mouthtarget 选择对象。
        {
          src: '<<set _askValues to Object.values(_askActions)>>',
          applybefore: '<<deadwood-reblooms-promiscuity-request-options>>\n\t\t',
          expected: 1
        }
      ],
      'Widgets Actions Generation': [
        // 将阴茎动作中的肛门双插邀请由原版五级标识提升为模组六级标识。
        {
          src: '<<case "penisanusdouble">><<analdifficulty>><<combatpromiscuous5>><<combataware 4>>',
          to: '<<case "penisanusdouble">><<analdifficulty>><<combatpromiscuous6>><<combataware 4>>',
          expected: 1
        },
        // 将阴道动作中的肛门双插邀请由原版五级标识提升为模组六级标识。
        {
          src: '<<case "penisanusdouble">><<analdifficulty>> <<combatpromiscuous5>> <<combataware 4>>',
          to: '<<case "penisanusdouble">><<analdifficulty>> <<combatpromiscuous6>> <<combataware 4>>',
          expected: 1
        },
        // 阴茎与肛门动作都会生成阴道双插邀请，两处统一显示六级标识。
        {
          src: '<<case "penispussydouble">><<vaginaldifficulty>> <<combatpromiscuous5>> <<combataware 4>>',
          to: '<<case "penispussydouble">><<vaginaldifficulty>> <<combatpromiscuous6>> <<combataware 4>>',
          expected: 2
        },
        // 将 PC 主动跨坐第二根阴茎的阴道双插动作提升为六级标识。
        {
          src: '<<case "vaginatopenisdouble">><<vaginaldifficulty>> <<combatpromiscuous5>> <<combataware 4>>',
          to: '<<case "vaginatopenisdouble">><<vaginaldifficulty>> <<combatpromiscuous6>> <<combataware 4>>',
          expected: 1
        },
        // 将 PC 主动维持阴道双插的动作提升为六级标识；童贞警告仍由原版继续输出。
        {
          src: '<<case "vaginapenisdoublefuck">><<vaginaldifficulty>> <<combatpromiscuous5>>',
          to: '<<case "vaginapenisdoublefuck">><<vaginaldifficulty>> <<combatpromiscuous6>>',
          expected: 1
        },
        // 将 PC 主动跨坐第二根阴茎的肛门双插动作提升为六级标识。
        {
          src: '<<case "anustopenisdouble">><<analdifficulty>> <<combatpromiscuous5>> <<combataware 4>>',
          to: '<<case "anustopenisdouble">><<analdifficulty>> <<combatpromiscuous6>> <<combataware 4>>',
          expected: 1
        },
        // 将 PC 主动维持肛门双插的动作提升为六级标识；童贞警告仍由原版继续输出。
        {
          src: '<<case "anuspenisdoublefuck">><<combatpromiscuous5>>',
          to: '<<case "anuspenisdoublefuck">><<combatpromiscuous6>>',
          expected: 1
        }
      ],
      'Widgets Actions Vagina': [
        // 原版只用 penis === 0 判断空闲，导致没有阴茎的 NPC 也出现骑乘选项；改为同时检查目标有效、阴茎或绑带阳具存在且未被占用。
        {
          src: '<<if $NPCList[$vaginatarget].penis is 0>>',
          to: '<<if maplebirch.VP.promiscuity.penisAvailable($vaginatarget)>>',
          expected: 1
        }
      ],
      'Widgets Effects Vagina': [
        // 多目标下拉框在部分控件模式会把索引保存为字符串；骑乘结算前统一转回数字，避免第 3 名及之后的 NPC 在严格比较中丢失目标。
        {
          src: '<<if $vaginaaction is "vaginatopenis">>\n\t\t<<personselect $vaginatarget>>',
          to: '<<if $vaginaaction is "vaginatopenis">>\n\t\t<<set $vaginatarget to Number($vaginatarget)>><<personselect $vaginatarget>>',
          expected: 1
        },
        // 骑乘结算再次核对所选 NPC 的阴茎，并把具名 NPC 传给原版检定；只有满级淫乱特质跳过技能检定。
        {
          srcmatch:
            /<<if \$vaginause is 0>>\n\t{3}<<if (\$combatExtended\.reverseRapeStart is 1 or )?combatSkillCheck\("vaginal", \$vaginatarget\)>>\n\t{4}<<if \$NPCList\[\$vaginatarget\]\.penis is 0>>/,
          to: '<<if $vaginause is 0>>\n\t\t\t<<if $1$VanillaPlus.traits.promiscuity or combatSkillCheck("vaginal", $vaginatarget, $NPCList[$vaginatarget].fullDescription)>>\n\t\t\t\t<<if maplebirch.VP.promiscuity.penisAvailable($vaginatarget)>>',
          expected: 1
        },
        // PC 成功跨坐第二根阴茎、形成阴道双插时，将原版五级成长提升为六级成长。
        {
          src: '<<set $vaginaaction to 0>><<submission 10>><<vaginalskilluse>><<set $vaginaactiondefault to "vaginatopenisdouble">><<combatpromiscuity5>>',
          to: '<<set $vaginaaction to 0>><<submission 10>><<vaginalskilluse>><<set $vaginaactiondefault to "vaginatopenisdouble">><<combatpromiscuity6>>',
          expected: 1
        },
        // PC 主动维持阴道双插时持续按六级动作成长，不再按原版五级结算。
        {
          src: '<<set $vaginaaction to 0>><<submission 20>><<vaginalskilluse>><<set $vaginaactiondefault to "vaginapenisdoublefuck">><<combatpromiscuity5>>',
          to: '<<set $vaginaaction to 0>><<submission 20>><<vaginalskilluse>><<set $vaginaactiondefault to "vaginapenisdoublefuck">><<combatpromiscuity6>>',
          expected: 1
        }
      ],
      'Widgets Effects Anus': [
        // 框架注册的 PC 主动骑乘仍执行原版技能检定；满级淫乱特质使其必定成功。
        {
          srcmatch: /<<if \$anususe is 0 or \$anusstate is "entrance">>\n\t{4}<<if (\$combatExtended\.reverseRapeStart is 1 or )?combatSkillCheck\("anal", \$anustarget\)>>/,
          to: '<<if $anususe is 0 or $anusstate is "entrance">>\n\t\t\t\t<<if $1$VanillaPlus.traits.promiscuity or combatSkillCheck("anal", $anustarget)>>',
          expected: 1
        },
        // PC 成功跨坐第二根阴茎、形成肛门双插时，将原版五级成长提升为六级成长。
        {
          src: '<<if !$anusstate.includes("double")>>\n\t\t\t<<set $anusaction to 0>><<submission 10>><<analskilluse>><<combatpromiscuity5>>',
          to: '<<if !$anusstate.includes("double")>>\n\t\t\t<<set $anusaction to 0>><<submission 10>><<analskilluse>><<combatpromiscuity6>>',
          expected: 1
        },
        // PC 主动维持肛门双插时持续按六级动作成长，不再按原版五级结算。
        {
          src: '<<if $anusaction is "anuspenisdoublefuck">>\n\t\t<<set $anusaction to 0>><<submission 20>><<analskilluse>><<combatpromiscuity5>>',
          to: '<<if $anusaction is "anuspenisdoublefuck">>\n\t\t<<set $anusaction to 0>><<submission 20>><<analskilluse>><<combatpromiscuity6>>',
          expected: 1
        }
      ],
      'Widgets Effects Penis': [
        // NPC 正用阴茎插入 PC 时，其阴部仍可记录肛门受插状态；只占用一个空闲字段，避免覆盖正在进行的动作。
        {
          src: '<<if ($NPCList[$penistarget].vagina is 0 or $NPCList[$penistarget].vagina is "none") and ($NPCList[$penistarget].penis is 0 or $NPCList[$penistarget].penis is "none")>>',
          to: '<<if maplebirch.VP.promiscuity.anusAvailable($penistarget)>>',
          expected: 1
        },
        {
          src: '<<if $_target.vagina isnot "none">>\n\t\t\t\t\t<<set $_target.vagina to "otheranusentrance">>\n\t\t\t\t<</if>>\n\t\t\t\t<<if $_target.penis isnot "none">>\n\t\t\t\t\t<<set $_target.penis to "otheranusentrance">>\n\t\t\t\t<</if>>',
          to: '<<if $_target.vagina is 0>>\n\t\t\t\t\t<<set $_target.vagina to "otheranusentrance">>\n\t\t\t\t<<elseif $_target.penis is 0>>\n\t\t\t\t\t<<set $_target.penis to "otheranusentrance">>\n\t\t\t\t<</if>>',
          expected: 1
        },
        // 框架的 PC 主动阴道插入仍执行原版技能检定；满级淫乱特质使其必定成功。
        {
          srcmatch:
            /<<widget "effectspenistovagina">>\n\t<<if \$penisaction is "penistovagina">>\n\t{2}<<personselect \$penistarget>>\n\t{2}<<set \$penisaction to 0>><<submission 10>><<penileskilluse>><<combatpromiscuity5>>\n\t{2}<<if (\$combatExtended\.reverseRapeStart is 1 or )?combatSkillCheck\("penile", \$penistarget\)>>/,
          to: '<<widget "effectspenistovagina">>\n\t<<if $penisaction is "penistovagina">>\n\t\t<<personselect $penistarget>>\n\t\t<<set $penisaction to 0>><<submission 10>><<penileskilluse>><<combatpromiscuity5>>\n\t\t<<if $1$VanillaPlus.traits.promiscuity or combatSkillCheck("penile", $penistarget)>>',
          expected: 1
        },
        // 主动肛交使用同一成功规则，占位与文本仍由原版处理。
        {
          srcmatch:
            /<<widget "effectspenistoanus">>\n\t<<if \$penisaction is "penistoanus">>\n\t{2}<<personselect \$penistarget>>\n\t{2}<<set \$penisaction to 0>><<submission 10>><<penileskilluse>><<combatpromiscuity5>>\n\t{2}<<if (\$combatExtended\.reverseRapeStart is 1 or )?combatSkillCheck\("penile", \$penistarget\)>>/,
          to: '<<widget "effectspenistoanus">>\n\t<<if $penisaction is "penistoanus">>\n\t\t<<personselect $penistarget>>\n\t\t<<set $penisaction to 0>><<submission 10>><<penileskilluse>><<combatpromiscuity5>>\n\t\t<<if $1$VanillaPlus.traits.promiscuity or combatSkillCheck("penile", $penistarget)>>',
          expected: 1
        }
      ],
      'Widgets Promiscuity': [
        // 原版五级结算完整执行后，每四次自愿的人类动作折算一点六级进度；非自愿与异种结算仍走原版逻辑。
        {
          src: '<<widget "combatpromiscuity5">>\n\t<<combatpromiscuityN 5>>\n<</widget>>',
          to: '<<widget "combatpromiscuity5">>\n\t<<combatpromiscuityN 5>>\n\t<<if $VanillaPlus.lock.promiscuity and $promiscuity gte maplebirch.VP.normalCeiling("promiscuity") and $promiscuity lt maplebirch.VP.ceiling("promiscuity") and $enemytype is "man" and $consensual is 1 and !$promiscuityIgnore>>\n\t\t<<set $VanillaPlus.promiscuity.levelFiveProgress to ($VanillaPlus.promiscuity.levelFiveProgress || 0) + 1>>\n\t\t<<if $VanillaPlus.promiscuity.levelFiveProgress gte 4>>\n\t\t\t<<set $VanillaPlus.promiscuity.levelFiveProgress -= 4>>\n\t\t\t<<set $promiscuity to Math.clamp($promiscuity + 1, maplebirch.VP.normalCeiling("promiscuity"), maplebirch.VP.ceiling("promiscuity"))>>\n\t\t<</if>>\n\t<</if>>\n<</widget>>',
          expected: 1
        },
        // 替换第一处阶段上限计算，使第六阶段显示倍率上限。
        {
          src: '<<set $_scaledPromiscuityMax to 20 * $_n>>',
          to: '<<set $_scaledPromiscuityMax to $_n is 6 and $VanillaPlus.lock.promiscuity ? maplebirch.VP.ceiling("promiscuity") : 20 * $_n>>'
        },
        // 替换同组件第二处阶段上限计算，覆盖另一种淫乱数值显示路径。
        {
          src: '<<set $_scaledPromiscuityMax to 20 * $_n>>',
          to: '<<set $_scaledPromiscuityMax to $_n is 6 and $VanillaPlus.lock.promiscuity ? maplebirch.VP.ceiling("promiscuity") : 20 * $_n>>'
        },
        // 替换第一处淫乱结算钳制，加入特质保底值与倍率上限。
        {
          src: '<<set $promiscuity to Math.clamp($promiscuity, 0, 100)>>',
          to: "<<set $promiscuity to Math.clamp($promiscuity, maplebirch.VP.minimum('promiscuity'), $VanillaPlus.lock.promiscuity ? maplebirch.VP.ceiling('promiscuity') : maplebirch.VP.normalCeiling('promiscuity'))>>"
        },
        // 替换同组件第二处淫乱结算钳制，确保另一条更新路径使用相同边界。
        {
          src: '<<set $promiscuity to Math.clamp($promiscuity, 0, 100)>>',
          to: "<<set $promiscuity to Math.clamp($promiscuity, maplebirch.VP.minimum('promiscuity'), $VanillaPlus.lock.promiscuity ? maplebirch.VP.ceiling('promiscuity') : maplebirch.VP.normalCeiling('promiscuity'))>>"
        }
      ],
      'Widgets Clamp': [
        // 替换全局淫乱钳制公式，使其他来源的数值变化同样遵守突破边界。
        {
          src: '<<set $promiscuity to Math.clamp($promiscuity, 0, 100)>>',
          to: "<<set $promiscuity to Math.clamp($promiscuity, maplebirch.VP.minimum('promiscuity'), $VanillaPlus.lock.promiscuity ? maplebirch.VP.ceiling('promiscuity') : maplebirch.VP.normalCeiling('promiscuity'))>>"
        }
      ]
    }
  });
}
