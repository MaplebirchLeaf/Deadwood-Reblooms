// ./src/script/VanillaPlus/Promiscuity.ts

import HandGrip from '../../module/VanillaPlus/HandGrip';

export default function (maplebirch: typeof window.maplebirch) {
  type GuideHand = 'left' | 'right';
  type GuideDestination = 'player-vagina' | 'player-anus' | 'NPC-vagina' | 'NPC-anus';

  const text = (key: string, values: Record<string, string> = {}) => {
    let result = maplebirch.t(`deadwood-reblooms:VanillaPlus:promiscuity:${key}`);
    for (const [name, value] of Object.entries(values)) result = result.replaceAll(`{${name}}`, value);
    return result;
  };
  // 原版 stalk 包含跟踪和追逐，空闲的手不能用于接触对方。
  const active = (index: number) => V.combat === 1 && V.position !== 'stalk' && maplebirch.get('VanillaPlus')!.promiscuity.canAdvancedActions(Number(index)) && V.walltype !== 'front' && !V.gloryhole;
  const direct = (destination: 'vagina' | 'anus', changePosition = false) => {
    const prepare = changePosition ? `preparePenisSwitch("${destination}", Number($penistarget))` : `canDirect("offer-${destination}-to-penis", Number($penistarget))`;
    return `<<if $combat is 1 and $position isnot "stalk" and $walltype isnot "front" and !$gloryhole and maplebirch.get("VanillaPlus").promiscuity.canAdvancedActions(Number($penistarget)) and maplebirch.get("VanillaPlus").promiscuity.${prepare}>><<set _vanillaPlusPromiscuity to "penis-${destination}">><<set _vanillaPlusPromiscuityIgnore to $promiscuityIgnore>><<set _vanillaPlusPromiscuityTarget to Number($penistarget)>><<set $promiscuityIgnore to true>><<set $penisaction to "penisto${destination}">><</if>>`;
  };
  const targetName = (index: number) => {
    const npc = V.NPCList?.[Number(index)];
    return lanSwitch(npc?.fullDescription, npc?.fullDescription_CN) || npc?.fullDescription || '';
  };
  const needsExtraAction = (index: number) => {
    const npc = V.NPCList?.[Number(index)];
    if (!npc || npc.stance === 'topface') return false;
    return ![0, undefined].includes(npc.location?.genitals) || npc.location?.head === 'genitals';
  };
  const distinctDoubleTargets = (first: number, second: number) => {
    const primary = Number(first);
    const partner = Number(second);
    return (
      Number.isInteger(primary) &&
      Number.isInteger(partner) &&
      primary !== partner &&
      [primary, partner].every(index => V.NPCList?.[index]?.active === 'active' && V.NPCList[index].stance !== 'defeated')
    );
  };
  const canReceiveDouble = (orifice: 'vagina' | 'anus') => {
    const second = orifice === 'vagina' ? V.vaginadoubletarget : V.anusdoubletarget;
    if (!active(second)) return false;
    const state = orifice === 'vagina' ? V.vaginastate : V.anusstate;
    const enabled = orifice === 'vagina' ? V.settings.vaginalDoubleEnabled : V.settings.analDoubleEnabled;
    return second != null && enabled && state === 'penetrated' && maplebirch.get('VanillaPlus')!.NPCDoublePenetration.canJoinPlayer(Number(second), orifice);
  };
  const handTarget = (hand: GuideHand) => Number(hand === 'left' ? V.lefttarget : V.righttarget);
  const handAvailable = (hand: GuideHand) => HandGrip.handFree(hand);
  const canTongueKiss = () => {
    const selected = Number(V.mouthtarget);
    const npc = V.NPCList?.[selected];
    const faceType = V.worn?.face?.type ?? [];
    return (
      V.combat === 1 &&
      T?.mouthOptions === 'kiss' &&
      V.mouthuse === 'kiss' &&
      ['kissentrance', 'kissimminent', 'kiss'].includes(String(V.mouthstate)) &&
      String(npc?.mouth).includes('kiss') &&
      V.head !== 'grappled' &&
      V.head !== 'bound' &&
      !faceType.includes('face_covering') &&
      !faceType.includes('gag') &&
      V.enemytype !== 'beast' &&
      V.consensual === 1 &&
      !V.gloryhole &&
      npc?.location?.genitals !== 'head'
    );
  };
  const canGuidePenis = (hand: GuideHand) => {
    const selected = handTarget(hand);
    return (
      active(selected) &&
      handAvailable(hand) &&
      maplebirch.get('VanillaPlus')!.promiscuity.hasPenis(selected) &&
      V.NPCList[selected].penis !== 'clothed' &&
      !V.NPCList[selected].chastity.penis.includes('chastity')
    );
  };
  const canGuidePlayerDouble = (selected: number, orifice: 'vagina' | 'anus') => {
    const primary = orifice === 'vagina' ? V.vaginatarget : V.anustarget;
    const use = orifice === 'vagina' ? V.vaginause : V.anususe;
    const enabled = orifice === 'vagina' ? V.settings.vaginalDoubleEnabled : V.settings.analDoubleEnabled;
    return enabled && use === 'penis' && Number(primary) !== selected && maplebirch.get('VanillaPlus')!.promiscuity.hasPenis(selected);
  };
  const canGuideToPlayer = (hand: GuideHand, orifice: 'vagina' | 'anus') => {
    if (!canGuidePenis(hand) || (orifice === 'anus' && !V.settings.analEnabled) || V.walltype === 'front' || window.playerChastity(orifice)) return false;
    const selected = handTarget(hand);
    const action = orifice === 'vagina' ? 'penetrate-vagina' : 'penetrate-anus';
    return maplebirch.get('VanillaPlus')!.promiscuity.canAsk(action, selected) || canGuidePlayerDouble(selected, orifice);
  };
  const canGuideToNPC = (hand: GuideHand, orifice: 'vagina' | 'anus') => {
    if (!canGuidePenis(hand) || V.enemytype !== 'man' || (orifice === 'anus' && !V.settings.analEnabled)) return false;
    const selected = handTarget(hand);
    const recipient = Number(V.penistarget);
    const enabled = orifice === 'vagina' ? V.settings.vaginalDoubleEnabled : V.settings.analDoubleEnabled;
    const correctUse =
      orifice === 'vagina'
        ? V.penisuse === 'othervagina' && ['entrance', 'imminent', 'penetrated'].includes(V.penisstate)
        : V.penisuse === 'otheranus' && ['otheranusentrance', 'otheranusimminent', 'otheranus'].includes(V.penisstate);
    const differentPartner = !V.VanillaPlus.npcDoublePenetration || Number(V.VanillaPlus.npcDoublePenetration.partner) !== selected;
    return enabled && correctUse && selected !== recipient && differentPartner && window.playerPenisSize() >= 2 && V.NPCList[selected].penissize >= 2;
  };
  const guideLabel = (hand: GuideHand, destination: GuideDestination) => {
    const selected = handTarget(hand);
    const values = { name: targetName(selected), recipient: targetName(V.penistarget) };
    if (destination === 'player-vagina') return text(V.vaginause === 'penis' ? 'action:guidePlayerVaginaDouble' : 'action:guidePlayerVagina', values);
    if (destination === 'player-anus') return text(V.anususe === 'penis' ? 'action:guidePlayerAnusDouble' : 'action:guidePlayerAnus', values);
    return text(destination === 'NPC-vagina' ? 'action:guideNPCVagina' : 'action:guideNPCAnus', values);
  };

  // PC 主动改变姿势的动作使用框架注册，只有要求 NPC 主动配合的内容保留在 Ask。
  maplebirch.combat.CombatAction.reg(
    {
      id: 'promiscuity-receive-vaginal',
      actionType: 'vaginaaction',
      cond: () => canReceiveDouble('vagina'),
      display: () => text('action:straddleVaginal', { name: targetName(V.vaginadoubletarget) }),
      value: () => 'VanillaPlusPromiscuityReceiveVaginal',
      color: 'lustful',
      difficulty: '<<vaginaldifficulty>> <<deadwood-reblooms-combat-stat-rating $vaginadoubletarget>> <<combataware 4>>',
      order: 2,
      effect:
        '<<if $settings.vaginalDoubleEnabled and !playerChastity("vagina") and maplebirch.get("VanillaPlus").promiscuity.canAdvancedActions(Number($vaginadoubletarget)) and $vaginastate is "penetrated" and maplebirch.get("VanillaPlus").NPCDoublePenetration.canJoinPlayer(Number($vaginadoubletarget), "vagina")>><<set $vaginaaction to "vaginatopenisdouble">><</if>>'
    },
    {
      id: 'promiscuity-receive-anal',
      actionType: 'anusaction',
      cond: () => canReceiveDouble('anus'),
      display: () => text('action:straddleAnal', { name: targetName(V.anusdoubletarget) }),
      value: () => 'VanillaPlusPromiscuityReceiveAnal',
      color: 'lustful',
      difficulty: '<<analdifficulty>> <<deadwood-reblooms-combat-stat-rating $anusdoubletarget>> <<combataware 4>>',
      order: 2,
      effect:
        '<<if $settings.analDoubleEnabled and !playerChastity("anus") and maplebirch.get("VanillaPlus").promiscuity.canAdvancedActions(Number($anusdoubletarget)) and $anusstate is "penetrated" and maplebirch.get("VanillaPlus").NPCDoublePenetration.canJoinPlayer(Number($anusdoubletarget), "anus")>><<set $anusaction to "anustopenisdouble">><</if>>'
    },
    {
      id: 'promiscuity-press-vaginal',
      actionType: 'penisaction',
      cond: () => active(V.penistarget) && needsExtraAction(V.penistarget) && maplebirch.get('VanillaPlus')!.promiscuity.canDirect('offer-vagina-to-penis', Number(V.penistarget)),
      display: () => text('action:pressVagina', { name: targetName(V.penistarget) }),
      value: () => 'VanillaPlusPromiscuityPressVaginal',
      color: 'lustful',
      difficulty: '<<deadwood-reblooms-combat-stat-rating $penistarget 5>>',
      order: 2,
      effect: direct('vagina')
    },
    {
      id: 'promiscuity-press-anal',
      actionType: 'penisaction',
      cond: () =>
        active(V.penistarget) && V.settings.analEnabled && needsExtraAction(V.penistarget) && maplebirch.get('VanillaPlus')!.promiscuity.canDirect('offer-anus-to-penis', Number(V.penistarget)),
      display: () => text('action:pressAnus', { name: targetName(V.penistarget) }),
      value: () => 'VanillaPlusPromiscuityPressAnal',
      color: 'lustful',
      difficulty: '<<deadwood-reblooms-combat-stat-rating $penistarget 5>>',
      order: 2,
      effect: direct('anus')
    },
    {
      id: 'promiscuity-switch-to-vaginal',
      actionType: 'penisaction',
      cond: () => active(V.penistarget) && maplebirch.get('VanillaPlus')!.promiscuity.canSwitchPenis('vagina', Number(V.penistarget)),
      display: () => text('action:switchVagina', { name: targetName(V.penistarget) }),
      value: () => 'VanillaPlusPromiscuitySwitchVaginal',
      color: 'sub',
      difficulty: '<<peniledifficulty>> <<deadwood-reblooms-combat-stat-rating $penistarget 5>>',
      order: -1,
      effect: direct('vagina', true)
    },
    {
      id: 'promiscuity-switch-to-anal',
      actionType: 'penisaction',
      cond: () => active(V.penistarget) && maplebirch.get('VanillaPlus')!.promiscuity.canSwitchPenis('anus', Number(V.penistarget)),
      display: () => text('action:switchAnus', { name: targetName(V.penistarget) }),
      value: () => 'VanillaPlusPromiscuitySwitchAnal',
      color: 'sub',
      difficulty: '<<peniledifficulty>> <<deadwood-reblooms-combat-stat-rating $penistarget 5>>',
      order: -1,
      effect: direct('anus', true)
    },
    {
      id: 'promiscuity-tongue-kiss',
      actionType: 'mouthaction',
      cond: canTongueKiss,
      display: () => text('action:tongueKiss'),
      value: () => 'VanillaPlusTongueKiss',
      color: 'sub',
      difficulty: '<<oraldifficulty>> <<deadwood-reblooms-combat-stat-rating $mouthtarget 3>> <<kissvirginitywarning>> <<NPCvirginitywarning $npc[$npcrow.indexOf($mouthtarget)] "kiss">>',
      order: 2,
      effect: '<<deadwood-reblooms-promiscuity-tongue-kiss>>'
    }
  );

  // 突破后由模组动作提供双插入口，结算仍调用原版双插效果，其他状态保留原版动作。
  maplebirch.combat.CombatAction.modify(
    {
      id: 'promiscuity-double-vaginal-straddle-targets',
      actionType: 'vaginaaction',
      value: 'vaginatopenisdouble',
      cond: () => !active(V.vaginadoubletarget) && distinctDoubleTargets(V.vaginatarget, V.vaginadoubletarget)
    },
    {
      id: 'promiscuity-double-anal-straddle-targets',
      actionType: 'anusaction',
      value: 'anustopenisdouble',
      cond: () => !active(V.anusdoubletarget) && distinctDoubleTargets(V.anustarget, V.anusdoubletarget)
    },
    { id: 'promiscuity-double-vaginal-offer-targets', actionType: 'penisaction', value: 'penispussydouble', cond: () => distinctDoubleTargets(V.penistarget, V.vaginatarget) },
    { id: 'promiscuity-double-anal-offer-targets', actionType: ['penisaction', 'vaginaaction'], value: 'penisanusdouble', cond: () => distinctDoubleTargets(V.penistarget, V.anustarget) }
  );

  // 左右手沿用原版目标下拉框，引导所选 NPC 的阴茎，动作结算前会再次检查目标与位置。
  for (const hand of ['left', 'right'] as const) {
    const guide = (destination: GuideDestination, cond: () => boolean) => ({
      id: `promiscuity-guide-${hand}-${destination}`,
      actionType: hand === 'left' ? ('leftaction' as const) : ('rightaction' as const),
      cond,
      display: () => guideLabel(hand, destination),
      value: () => `VanillaPlusPromiscuityGuide${hand === 'left' ? 'Left' : 'Right'}${destination.replaceAll('-', '')}`,
      color: 'lustful',
      difficulty: () => {
        const level = destination.startsWith('NPC-') || (destination === 'player-vagina' ? V.vaginause : V.anususe) === 'penis' ? 6 : 5;
        return `<<handdifficulty>> <<deadwood-reblooms-combat-stat-rating $${hand}target ${level}>>`;
      },
      effect: `<<deadwood-reblooms-promiscuity-guide "${hand}" "${destination}">>`
    });
    maplebirch.combat.CombatAction.reg(
      guide('player-vagina', () => canGuideToPlayer(hand, 'vagina')),
      guide('player-anus', () => canGuideToPlayer(hand, 'anus')),
      guide('NPC-vagina', () => canGuideToNPC(hand, 'vagina')),
      guide('NPC-anus', () => canGuideToNPC(hand, 'anus'))
    );
  }

  // 扩展战斗性行为选项，并接入淫乱突破与数值上限。
  maplebirch.tool.inject({
    widgetPassage: {
      'Widgets Effects Man': [
        // 在男性战斗结算入口先清理失效的 NPC 双插状态。
        {
          src: '<<widget "effectsman">>',
          applyafter: '<<run maplebirch.get("VanillaPlus").NPCDoublePenetration.update()>>',
          expected: 1
        },
        // 男性战斗的全部部位效果结算后再次同步双插，令本回合的插入、拔出和换目标立即反映到状态与 X-ray。
        {
          src: '<<combat_lewdity_text>>',
          applybefore: '<<run maplebirch.get("VanillaPlus").NPCDoublePenetration.update()>>\n\n\t\t',
          expected: 1
        },
        // 在原版 Ask 效果入口结算扩展请求，请求对象仍由原版 mouthtarget 选择。
        {
          src: '<<if $mouthaction is "ask" and $askAction is "askchoke" and $askedtochoke isnot 1>>',
          applybefore: '<<deadwood-reblooms-promiscuity-request>>\n\t\t',
          expected: 1
        },
        // 对应动作执行后恢复临时标记，只在姿势确实改变时结算成长。
        {
          src: '<<effectsvaginatopenis>>',
          applyafter: '<<deadwood-reblooms-combat-direct-result "vagina">>',
          expected: 1
        },
        // 框架注册的 PC 肛门主动动作执行后恢复临时标记。
        {
          src: '<<effectsanustopenis>>',
          applyafter: '<<deadwood-reblooms-combat-direct-result "anus">>',
          expected: 1
        },
        // 框架注册的 PC 阴茎主动插入动作执行后核对目标状态。
        {
          src: '<<effectspenistovagina>>',
          applyafter: '<<deadwood-reblooms-combat-direct-result "penis-vagina">>',
          expected: 1
        },
        // 框架注册的 PC 阴茎主动肛交动作执行后核对目标状态。
        {
          src: '<<effectspenistoanus>>',
          applyafter: '<<deadwood-reblooms-combat-direct-result "penis-anus">>',
          expected: 1
        },
        // 成功切换肛门双插时会写入唯一的双插目标，直接在该状态写入后结算成长。
        {
          src: '<<set $anusdoubletarget to $penistarget>>',
          applyafter: '<<deadwood-reblooms-combat-stat-settle $penistarget>>',
          expected: 1
        },
        // 成功把阴茎从玩家移入阴道双插时，以原版确认承受者的写入为锚点。
        {
          src: '<<set $vaginatarget to _n>>',
          applyafter: '<<deadwood-reblooms-combat-stat-settle _j>>',
          expected: 1
        },
        // 从阴道动作栏成功转入肛门双插后，双插目标写入能唯一标识该成功分支。
        {
          src: '<<set $anusdoubletarget to $vaginatarget>>',
          applyafter: '<<deadwood-reblooms-combat-stat-settle $vaginatarget>>',
          expected: 1
        },
        // 从肛门动作栏成功转入已有阴茎的阴道后，以唯一的新双插目标写入结算。
        {
          src: '<<set $vaginadoubletarget to _npcA>>',
          applyafter: '<<deadwood-reblooms-combat-stat-settle _npcA>>',
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
          to: '<<case "penisanusdouble">><<analdifficulty>><<deadwood-reblooms-combat-stat-rating _n>><<combataware 4>>',
          expected: 1
        },
        // 将阴道动作中的肛门双插邀请由原版五级标识提升为模组六级标识。
        {
          src: '<<case "penisanusdouble">><<analdifficulty>> <<combatpromiscuous5>> <<combataware 4>>',
          to: '<<case "penisanusdouble">><<analdifficulty>> <<deadwood-reblooms-combat-stat-rating _n>> <<combataware 4>>',
          expected: 1
        },
        // 阴茎与肛门动作都会生成阴道双插邀请，两处统一显示六级标识。
        {
          srcmatchgroup: /(<<case "penispussydouble">><<vaginaldifficulty>>\s*)<<combatpromiscuous5>>/g,
          to: '$1<<deadwood-reblooms-combat-stat-rating _n>>',
          expected: 2
        },
        // 将 PC 主动跨坐第二根阴茎的阴道双插动作提升为六级标识。
        {
          src: '<<case "vaginatopenisdouble">><<vaginaldifficulty>> <<combatpromiscuous5>> <<combataware 4>>',
          to: '<<case "vaginatopenisdouble">><<vaginaldifficulty>> <<deadwood-reblooms-combat-stat-rating _n>> <<combataware 4>>',
          expected: 1
        },
        // 将 PC 主动维持阴道双插的动作提升为六级标识，童贞警告仍由原版继续输出。
        {
          src: '<<case "vaginapenisdoublefuck">><<vaginaldifficulty>> <<combatpromiscuous5>>',
          to: '<<case "vaginapenisdoublefuck">><<vaginaldifficulty>> <<deadwood-reblooms-combat-stat-rating _n>>',
          expected: 1
        },
        // 将 PC 主动跨坐第二根阴茎的肛门双插动作提升为六级标识。
        {
          src: '<<case "anustopenisdouble">><<analdifficulty>> <<combatpromiscuous5>> <<combataware 4>>',
          to: '<<case "anustopenisdouble">><<analdifficulty>> <<deadwood-reblooms-combat-stat-rating _n>> <<combataware 4>>',
          expected: 1
        },
        // 将 PC 主动维持肛门双插的动作提升为六级标识，童贞警告仍由原版继续输出。
        {
          src: '<<case "anuspenisdoublefuck">><<combatpromiscuous5>>',
          to: '<<case "anuspenisdoublefuck">><<deadwood-reblooms-combat-stat-rating _n>>',
          expected: 1
        }
      ],
      'Widgets Actions Vagina': [
        // 狐化格威岚仍在人型分支，维持双插时也要接受异种癖突破，衣物和认知门槛不变。
        {
          srcmatch: /(<<widget "actionsvaginapenisdoublefuck">>(?:(?!<<\/widget>>)[\s\S])*?)!hasSexStat\("promiscuity", 5\)/,
          to: '$1!(hasSexStat("promiscuity", 5) or maplebirch.get("VanillaPlus").promiscuity.canAdvancedActions(Number($vaginadoubletarget)))',
          expected: 1
        },
        // 原版只用 penis === 0 判断空闲，导致没有阴茎的 NPC 也出现骑乘选项，改为同时检查目标有效、阴茎或绑带阳具存在且未被占用。
        {
          src: '<<if $NPCList[$vaginatarget].penis is 0>>',
          to: '<<if maplebirch.get("VanillaPlus").promiscuity.penisAvailable($vaginatarget)>>',
          expected: 1
        }
      ],
      'Widgets Actions Anus': [
        {
          srcmatch: /(<<widget "actionsanuspenisdoublefuck">>(?:(?!<<\/widget>>)[\s\S])*?)!hasSexStat\("promiscuity", 5\)/,
          to: '$1!(hasSexStat("promiscuity", 5) or maplebirch.get("VanillaPlus").promiscuity.canAdvancedActions(Number($anusdoubletarget)))',
          expected: 1
        }
      ],
      'Widgets Effects Vagina': [
        // 多目标下拉框在部分控件模式会把索引保存为字符串，骑乘结算前统一转回数字，避免第 3 名及之后的 NPC 在严格比较中丢失目标。
        {
          src: '<<if $vaginaaction is "vaginatopenis">>',
          applyafter: '<<set $vaginatarget to Number($vaginatarget)>>',
          expected: 1
        },
        // 骑乘结算再次核对所选 NPC 的阴茎，并把具名 NPC 传给原版检定，只有满级淫乱特质跳过技能检定。
        {
          srcmatch: /(<<if \$vaginause is 0>>\s*)<<if (\$combatExtended\.reverseRapeStart is 1 or )?combatSkillCheck\("vaginal", \$vaginatarget\)>>/,
          to: '$1<<if $2$VanillaPlus.traits.promiscuity or combatSkillCheck("vaginal", $vaginatarget, $NPCList[$vaginatarget].fullDescription)>>',
          expected: 1
        },
        // 双重动作移到成功分支结算，失败不再获得原版五级或模组六级成长。
        {
          src: '<<set $vaginaaction to 0>><<submission 10>><<vaginalskilluse>><<set $vaginaactiondefault to "vaginatopenisdouble">><<combatpromiscuity5>>',
          to: '<<set $vaginaaction to 0>><<submission 10>><<vaginalskilluse>><<set $vaginaactiondefault to "vaginatopenisdouble">>',
          expected: 1
        },
        // PC 主动维持阴道双插时持续按六级动作成长，不再按原版五级结算。
        {
          src: '<<set $vaginaaction to 0>><<submission 20>><<vaginalskilluse>><<set $vaginaactiondefault to "vaginapenisdoublefuck">><<combatpromiscuity5>>',
          to: '<<set $vaginaaction to 0>><<submission 20>><<vaginalskilluse>><<set $vaginaactiondefault to "vaginapenisdoublefuck">>',
          expected: 1
        },
        {
          src: '<<if $enemytype is "beast">><<set $NPCList[$vaginadoubletarget].stance to "top">><</if>>',
          applyafter: '<<deadwood-reblooms-combat-stat-settle $vaginadoubletarget>>',
          expected: 1
        },
        {
          srcmatchgroup: /<<set \$NPCList\[_npcB\]\.penis to "vaginadouble">>/g,
          applyafter: '<<deadwood-reblooms-combat-stat-settle $vaginadoubletarget>>',
          expected: 2
        }
      ],
      'Widgets Effects Anus': [
        // 框架注册的 PC 主动骑乘仍执行原版技能检定，满级淫乱特质使其必定成功。
        {
          srcmatch: /<<if (\$combatExtended\.reverseRapeStart is 1 or )?combatSkillCheck\("anal", \$anustarget\)>>/,
          to: '<<if $1$VanillaPlus.traits.promiscuity or combatSkillCheck("anal", $anustarget)>>',
          expected: 1
        },
        // PC 成功跨坐第二根阴茎、形成肛门双插时，将原版五级成长提升为六级成长。
        {
          srcmatch:
            /<<set \$anusaction to 0>><<submission 10>><<analskilluse>><<combatpromiscuity5>>(?=\s*<<if (?:\$combatExtended\.reverseRapeStart is 1 or )?combatSkillCheck\("anal", \$anusdoubletarget\)>>)/,
          to: '<<set $anusaction to 0>><<submission 10>><<analskilluse>>',
          expected: 1
        },
        // PC 主动维持肛门双插时持续按六级动作成长，不再按原版五级结算。
        {
          srcmatch: /<<set \$anusaction to 0>><<submission 20>><<analskilluse>><<combatpromiscuity5>>(?=\s*\/\* Ensure combined)/,
          to: '<<set $anusaction to 0>><<submission 20>><<analskilluse>>',
          expected: 1
        },
        {
          src: '<<if $enemytype is "beast">><<set $NPCList[$anusdoubletarget].stance to "top">><</if>>',
          applyafter: '<<deadwood-reblooms-combat-stat-settle $anusdoubletarget>>',
          expected: 1
        },
        {
          src: '<<set $NPCList[$anusdoubletarget].penis to "anusdouble">>',
          applyafter: '<<deadwood-reblooms-combat-stat-settle $anusdoubletarget>>',
          expected: 1
        }
      ],
      'Widgets Effects Penis': [
        // NPC 正用阴茎插入 PC 时，其阴部仍可记录肛门受插状态，只占用一个空闲字段，避免覆盖正在进行的动作。
        {
          src: '<<if ($NPCList[$penistarget].vagina is 0 or $NPCList[$penistarget].vagina is "none") and ($NPCList[$penistarget].penis is 0 or $NPCList[$penistarget].penis is "none")>>',
          to: '<<if maplebirch.get("VanillaPlus").promiscuity.anusAvailable($penistarget)>>',
          expected: 1
        },
        {
          src: '<<if $_target.vagina isnot "none">>',
          to: '<<if $_target.vagina is 0>>',
          expected: 1
        },
        // 原版这里是两个独立 if，只替换中间的闭合/开启边界，把它们合成单个二选一分支。
        {
          srcmatch: /<<\/if>>\s*<<if \$_target\.penis isnot "none">>/,
          to: '<<elseif $_target.penis is 0>>',
          expected: 1
        },
        // 两个主动插入入口都紧邻五级成长宏，批量替换这两个局部条件，不匹配整个 widget。
        {
          srcmatchgroup: /(<<combatpromiscuity5>>\s*)<<if (\$combatExtended\.reverseRapeStart is 1 or )?combatSkillCheck\("penile", \$penistarget\)>>/g,
          to: '$1<<if $2$VanillaPlus.traits.promiscuity or combatSkillCheck("penile", $penistarget)>>',
          expected: 2
        }
      ],
      'Widgets Promiscuity': [
        // 原版五级结算完整执行后，每四次自愿的人类动作折算一点六级进度，非自愿与异种结算仍走原版逻辑。
        {
          src: '<<combatpromiscuityN 5>>',
          applyafter:
            '\n\t<<if $VanillaPlus.lock.promiscuity and $promiscuity gte maplebirch.get("VanillaPlus").normalCeiling("promiscuity") and $promiscuity lt maplebirch.get("VanillaPlus").ceiling("promiscuity") and $enemytype is "man" and $consensual is 1 and !$promiscuityIgnore>>\n\t\t<<set $VanillaPlus.promiscuity.levelFive to ($VanillaPlus.promiscuity.levelFive || 0) + 1>>\n\t\t<<if $VanillaPlus.promiscuity.levelFive gte 4>>\n\t\t\t<<set $VanillaPlus.promiscuity.levelFive -= 4>>\n\t\t\t<<set $promiscuity to Math.clamp($promiscuity + 1, maplebirch.get("VanillaPlus").normalCeiling("promiscuity"), maplebirch.get("VanillaPlus").ceiling("promiscuity"))>>\n\t\t<</if>>\n\t<</if>>',
          expected: 1
        },
        // 两处相同的阶段上限和数值钳制都显式批量替换，避免依赖先后顺序逐次命中。
        {
          srcmatchgroup: /<<set \$_scaledPromiscuityMax to 20 \* \$_n>>/g,
          to: '<<set $_scaledPromiscuityMax to $_n is 6 and $VanillaPlus.lock.promiscuity ? maplebirch.get("VanillaPlus").ceiling("promiscuity") : 20 * $_n>>',
          expected: 2
        },
        {
          srcmatchgroup: /<<set \$promiscuity to Math\.clamp\(\$promiscuity, 0, 100\)>>/g,
          to: '<<set $promiscuity to Math.clamp($promiscuity, maplebirch.get("VanillaPlus").minimum(\'promiscuity\'), $VanillaPlus.lock.promiscuity ? maplebirch.get("VanillaPlus").ceiling(\'promiscuity\') : maplebirch.get("VanillaPlus").normalCeiling(\'promiscuity\'))>>',
          expected: 2
        }
      ],
      'Widgets Clamp': [
        // 替换全局淫乱钳制公式，使其他来源的数值变化同样遵守突破边界。
        {
          src: '<<set $promiscuity to Math.clamp($promiscuity, 0, 100)>>',
          to: '<<set $promiscuity to Math.clamp($promiscuity, maplebirch.get("VanillaPlus").minimum(\'promiscuity\'), $VanillaPlus.lock.promiscuity ? maplebirch.get("VanillaPlus").ceiling(\'promiscuity\') : maplebirch.get("VanillaPlus").normalCeiling(\'promiscuity\'))>>',
          expected: 1
        }
      ]
    }
  });
}
