type PenetratorOwner = 'player' | 'partner';

interface OrderedPenetrators {
  primary: PenetratorOwner;
  secondary: PenetratorOwner;
  primarySize: number;
  secondarySize: number;
}

interface PenetratorVisual {
  sprite: string;
  size: number;
  filter: unknown;
  condom: boolean;
  condomFilter: unknown;
  tintStrapon: boolean;
}

const doubleSize = (size: number) => Math.min(4, Math.max(2, Number(size) || 2));

// 原版双插底图要求较大的阴茎作为主图，且只提供 2 至 4 号资源。
function orderNPCDoublePenetrators(playerSize: number, partnerSize: number): OrderedPenetrators {
  const player = doubleSize(playerSize);
  const partner = doubleSize(partnerSize);
  return partner > player
    ? { primary: 'partner', secondary: 'player', primarySize: partner, secondarySize: player }
    : { primary: 'player', secondary: 'partner', primarySize: player, secondarySize: partner };
}

export default function (maplebirch: typeof window.maplebirch) {
  const text = (key: string, values: Record<string, string> = {}) => {
    let result = maplebirch.t(`deadwood-reblooms:VanillaPlus:NPCDoublePenetration:${key}`);
    for (const [name, value] of Object.entries(values)) result = result.replaceAll(`{${name}}`, value);
    return result;
  };
  const playerVisual = (options: any): PenetratorVisual => {
    const strapon = playerHasStrapon();
    const parasite = options.penis.type === 'parasite';
    return {
      sprite: parasite ? 'tentacle' : options.penis.playerSprite,
      size: doubleSize(options.penis.size),
      filter: options.filters[strapon ? 'worn_under_lower_main' : parasite ? 'parasite' : 'body'],
      condom: !!options.penis.condom?.worn,
      condomFilter: options.filters.playerCondom,
      tintStrapon: false
    };
  };

  const partnerVisual = (partnerIndex: number): PenetratorVisual => {
    const combatRenderer = window.CombatRenderer;
    const npcMapper = window.NpcCombatMapper;
    const npc = V.NPCList[partnerIndex];
    const strapon = window.npcHasStrapon(partnerIndex);
    const condom = wearingCondom(partnerIndex);
    const description = String(npc.penisdesc || '');
    const sprite = strapon ? (description.includes('tentacle') ? 'tentacle' : npc.strapon?.color === 'fleshy' ? 'penis' : 'strapon') : 'penis';
    return {
      sprite,
      size: doubleSize(npc.penissize),
      filter: npcMapper.getNpcPenetratorFilter(npc),
      condom,
      condomFilter: condom ? combatRenderer.getCondomOptions(npc.condom).colour : undefined,
      tintStrapon: strapon
    };
  };

  const canUsePleasure = () => {
    const trait = !!V.VanillaPlus?.traits?.promiscuity;
    const stat = V.enemytype === 'man' ? 'promiscuity' : 'deviancy';
    return trait || (V.consensual === 1 && (V.promiscuityIgnore || (V.awareness >= 300 && window.hasSexStat(stat, 5))) && window.currentSkillValue('penileskill') >= 800);
  };

  const npcName = (target: number) => {
    const npc = V.NPCList?.[target];
    return lanSwitch(npc?.fullDescription, npc?.fullDescription_CN) || npc?.fullDescription || '';
  };

  const legLockAllowed = () => {
    const stat = V.enemytype === 'man' ? 'promiscuity' : 'deviancy';
    return !!V.VanillaPlus?.traits?.promiscuity || V.promiscuityIgnore || window.hasSexStat(stat, 6);
  };
  const doublePenetrators = (orifice: 'vagina' | 'anus') => maplebirch.get('VanillaPlus')!.NPCDoublePenetration.playerPenetrators(orifice);
  const doublePenetratorNames = () => {
    const names = maplebirch.get('VanillaPlus')!.NPCDoublePenetration.playerPenetrators().map(npcName);
    if (names.length < 2) return { names: names[0] || '' };
    return { names: lanSwitch(`${names.slice(0, -1).join(', ')} and ${names.at(-1)}`, names.join('、')) };
  };
  const canStartLegLock = (orifice: 'vagina' | 'anus') => {
    const penetrators = doublePenetrators(orifice);
    return V.combat === 1 && T?.feetOptions === 'free' && V.leglocktarget == null && V.feetuse === 0 && legLockAllowed() && penetrators.length >= 2 && penetrators.includes(Number(V.feettarget));
  };
  const canContinueLegLock = () => V.combat === 1 && V.feetuse === 'legLock' && !!maplebirch.get('VanillaPlus')!.NPCDoublePenetration.playerLegLock;

  // PC 双插期间的主动动作由框架注册到原版动作表，并接入对应效果宏。
  maplebirch.combat.CombatAction.reg(
    {
      id: 'NPCDouble-pleasure',
      actionType: 'penisaction',
      cond: () => V.combat === 1 && maplebirch.get('VanillaPlus')!.NPCDoublePenetration.visible && canUsePleasure(),
      display: () => text('action:pleasure'),
      value: () => 'NPCDoublePleasure',
      color: 'sub',
      difficulty: '<<combatpromiscuous5>> <<combataware 4>>',
      order: 2,
      effect: '<<deadwood-reblooms-npc-double-pleasure>>'
    },
    {
      id: 'NPCDouble-leg-lock-vagina',
      actionType: 'feetaction',
      cond: () => canStartLegLock('vagina'),
      display: () => text('action:legLockVagina', doublePenetratorNames()),
      value: () => 'NPCDoubleLegLockVagina',
      color: 'brat',
      difficulty: '<<thighdifficulty>> <<combatpromiscuous6>>',
      effect: '<<deadwood-reblooms-double-leglock-effect "NPCDoubleLegLockVagina">>'
    },
    {
      id: 'NPCDouble-leg-lock-anus',
      actionType: 'feetaction',
      cond: () => canStartLegLock('anus'),
      display: () => text('action:legLockAnus', doublePenetratorNames()),
      value: () => 'NPCDoubleLegLockAnus',
      color: 'brat',
      difficulty: '<<thighdifficulty>> <<combatpromiscuous6>>',
      effect: '<<deadwood-reblooms-double-leglock-effect "NPCDoubleLegLockAnus">>'
    },
    {
      id: 'NPCDouble-leg-lock-keep',
      actionType: 'feetaction',
      cond: canContinueLegLock,
      display: () => text(V.position === 'missionary' ? 'action:legLockKeepMissionary' : 'action:legLockKeepRear'),
      value: () => 'NPCDoubleLegLockKeep',
      color: 'brat',
      difficulty: '<<if _feetOptions isnot "orgasmLegLock">><<thighdifficulty>><</if>> <<combatpromiscuous6>>',
      effect: '<<deadwood-reblooms-double-leglock-effect "NPCDoubleLegLockKeep">>'
    },
    {
      id: 'NPCDouble-leg-lock-release',
      actionType: 'feetaction',
      cond: canContinueLegLock,
      display: () => text(V.position === 'missionary' ? 'action:legLockReleaseMissionary' : 'action:legLockReleaseRear'),
      value: () => 'NPCDoubleLegLockRelease',
      color: 'white',
      effect: '<<deadwood-reblooms-double-leglock-effect "NPCDoubleLegLockRelease">>'
    }
  );

  // 多目标锁腿时移除原版单目标开始、持续和释放动作，避免两套状态分叉。
  maplebirch.combat.CombatAction.modify(
    {
      id: 'NPCDouble-hide-single-leg-lock-start',
      actionType: 'feetaction',
      value: 'legLock',
      cond: () => maplebirch.get('VanillaPlus')!.NPCDoublePenetration.playerPenetrators().length < 2
    },
    {
      id: 'NPCDouble-hide-single-leg-lock-keep',
      actionType: 'feetaction',
      value: 'legLocked',
      cond: () => !canContinueLegLock()
    },
    {
      id: 'NPCDouble-hide-single-leg-lock-release',
      actionType: 'feetaction',
      value: 'legRelease',
      cond: () => !canContinueLegLock()
    }
  );

  maplebirch.char.use(
    'pre',
    options => {
      delete options.npcDouble;
      const state = maplebirch.get('VanillaPlus')!.NPCDoublePenetration.visible ? maplebirch.get('VanillaPlus')!.NPCDoublePenetration.state : undefined;
      if (!state) return;

      // 扩展条件创建画布时，原版可能尚未填写玩家阴茎的尺寸、精灵与过滤器。
      if (!options.showPcPenis) window.XrayCombatMapper.mapXrayPlayerPenis(options, options.penis);
      const player = playerVisual(options);
      const partner = partnerVisual(state.partner);
      const order = orderNPCDoublePenetrators(player.size, partner.size);
      const primary = order.primary === 'player' ? player : partner;
      const secondary = order.secondary === 'player' ? player : partner;
      const orifice = state.orifice === 'anus' ? 'anal' : 'vaginal';
      options.npcDouble = {
        orifice,
        primary: { ...primary, size: order.primarySize },
        secondary: { ...secondary, size: order.secondarySize }
      };
      // 原版先生成单插选项，这里把 NPC 目标双插明确映射为阴茎 X-ray，并保证对应画布图层可见。
      options.showPcPenis = true;
      options.showNpcVagina = orifice === 'vaginal';
      options.showNpcArse = orifice === 'anal';
      options.penis.penetrated = orifice;
      options.penis.doublePen = true;
      options.filters.npcDoublePrimary = primary.filter;
      options.filters.npcDoubleSecondary = secondary.filter;
      options.filters.npcDoublePrimaryCondom = primary.condomFilter;
      options.filters.npcDoubleSecondaryCondom = secondary.condomFilter;
    },
    'combatXrayPenis'
  );

  // 使用框架扩展原版 combatXrayPenis，单插分支保持原版资源路径和显示规则。
  maplebirch.char.use(
    {
      base: {
        srcfn: (options: any) => {
          const data = options.npcDouble;
          if (data) return `${options.src}${data.orifice}/sex-size${data.primary.size}-dp${data.secondary.size}.png`;
          const base = ['machine', 'tentacle'].includes(options.penis.penetratedType) ? options.penis.base + '-tentacle' : options.penis.base;
          const size = options.penis.size ? '-size' + options.penis.size : '';
          return `${options.src}${options.penis.penetrated}/${base}${size}.png`;
        }
      },
      playerPenis: {
        srcfn: (options: any) => {
          const data = options.npcDouble;
          if (data) return `${options.src}${data.orifice}/${data.primary.sprite}-size${data.primary.size}.png`;
          const size = options.penis.size ? '-size' + options.penis.size : '';
          return `${options.src}${options.penis.penetrated}/${options.penis.playerSprite}${size}.png`;
        },
        filtersfn: (options: any) => {
          if (options.npcDouble) return ['npcDoublePrimary'];
          if (playerHasStrapon()) return ['worn_under_lower_main'];
          return [options.penis.type === 'parasite' ? 'parasite' : 'body'];
        },
        desaturatefn: (options: any) => !!options.npcDouble?.primary.tintStrapon,
        brightnessfn: (options: any) => (options.npcDouble?.primary.tintStrapon ? -0.25 : 0)
      },
      npcDoubleSecondary: {
        srcfn: (options: any) => {
          const data = options.npcDouble;
          return `${options.src}${data.orifice}/${data.secondary.sprite}-size${data.secondary.size}-dp.png`;
        },
        showfn: (options: any) => !!options.npcDouble,
        animationfn: (options: any) => options.animKeyPenis,
        filters: ['npcDoubleSecondary'],
        desaturatefn: (options: any) => !!options.npcDouble.secondary.tintStrapon,
        brightnessfn: (options: any) => (options.npcDouble.secondary.tintStrapon ? -0.25 : 0),
        zfn: () => window.CombatRenderer.indices.xrayPenetrator2
      },
      playerCondom: {
        srcfn: (options: any) => {
          const data = options.npcDouble;
          const orifice = data?.orifice ?? options.penis.penetrated;
          const size = data?.primary.size ?? options.penis.size;
          return `${options.src}${orifice}/tentacle-size${size}.png`;
        },
        showfn: (options: any) => (options.npcDouble ? options.npcDouble.primary.condom : !!options.showPcPenis && !!options.penis.condom.worn),
        filtersfn: (options: any) => (options.npcDouble ? ['npcDoublePrimaryCondom'] : ['playerCondom'])
      },
      npcDoubleSecondaryCondom: {
        srcfn: (options: any) => {
          const data = options.npcDouble;
          return `${options.src}${data.orifice}/tentacle-size${data.secondary.size}-dp.png`;
        },
        showfn: (options: any) => !!options.npcDouble?.secondary.condom,
        animationfn: (options: any) => options.animKeyPenis,
        filters: ['npcDoubleSecondaryCondom'],
        alpha: 0.4,
        zfn: () => window.CombatRenderer.indices.xrayCondom2
      },
      playerCum: {
        srcfn: (options: any) => {
          const orifice = options.npcDouble?.orifice ?? options.penis.penetrated;
          const size = options.npcDouble?.primary.size ?? options.penis.size;
          const baseSize = size ? `-size${size}` : '';
          const double = options.npcDouble && orifice === 'vaginal' ? '-dp' : '';
          const amount = orifice === 'vaginal' ? `-cum${Math.clamp(V.otherFilled, 1, 5)}` : '-cum';
          return `${options.src}${orifice}/cum/${options.penis.base}${baseSize}${double}${amount}.png`;
        },
        showfn: (options: any) => !!options.penis.showCum && V.otherFilled >= 1
      },
      playerEjac: {
        srcfn: (options: any) => {
          const orifice = options.npcDouble?.orifice ?? options.penis.penetrated;
          const size = options.npcDouble?.primary.size ?? options.penis.size;
          const cumSize = size ? `-size${size}-cumming` : '';
          return `${options.src}${orifice}/cum/${options.penis.base}${cumSize}.png`;
        },
        showfn: (options: any) => !!options.penis.showCum && !!options.penis.isCumActive
      }
    },
    'combatXrayPenis'
  );

  maplebirch.tool.inject({
    widgetPassage: {
      'Combat Demo Widgets': [
        // NPC 目标双插也要创建阴茎 X-ray 画布，画布内部仍由 combatXrayPenis 的框架图层负责。
        {
          src: '<<if XrayCombatMapper.isPcBlowjobVisible()>>',
          to: '<<if XrayCombatMapper.isPcBlowjobVisible() or maplebirch.get("VanillaPlus").NPCDoublePenetration.visible>>',
          expected: 1
        },
        // 双插使用独立缓存槽，保证原版模型的底图和两根阴茎图层同时按扩展配置创建。
        {
          src: '<<selectmodel "combatXrayPenis" "divXrayPenis">>',
          to: '<<selectmodel "combatXrayPenis" `maplebirch.get("VanillaPlus").NPCDoublePenetration.visible ? "divXrayPenisDouble" : "divXrayPenis"`>>',
          expected: 1
        }
      ],
      'Widgets Actions Generation': [
        // 玩家被双插时，用原版目标索引输出两名具名 NPC，取代“他们的”泛称。
        {
          srcmatch: /(?:他们的鸡巴插到你的<<pussy>>里。|Their cocks penetrate your <<pussy>>\.)/,
          to: '<<deadwood-reblooms-double-penetration-status "player-vagina">>',
          expected: 1
        },
        {
          srcmatch: /(?:他们的鸡巴插到你的菊穴里。|Their cocks penetrate your anus\.)/,
          to: '<<deadwood-reblooms-double-penetration-status "player-anus">>',
          expected: 1
        },
        // NPC 承受双插时，只替换阴茎状态行，目标选择、动作表和原版单插状态保持不变。
        {
          srcmatch: /(?:<<combatPersons>>的小穴裹住了你的<<penis>>。|<<combatPersons>> vagina envelops your <<penis>>\.)/,
          to: '<<deadwood-reblooms-double-penetration-status "NPC-vagina">>',
          expected: 1
        },
        {
          srcmatch: /(?:<<combatPersons>>的屁股包裹着你的<<penis>>。|<<combatPersons>> ass envelops your <<penis>>\.)/,
          to: '<<deadwood-reblooms-double-penetration-status "NPC-anus">>',
          expected: 1
        },
        // 双目标锁定只替换原版用于显示目标的表达式，保留整行状态文本、颜色和高潮分支。
        {
          src: '<<personselect $leglocktarget>><<combatperson>>',
          to: '<<if maplebirch.get("VanillaPlus").NPCDoublePenetration.playerLegLock>><<deadwood-reblooms-double-leglock-targets $VanillaPlus.npcDoublePenetration.playerLegLock.targets>><<else>>$&<</if>>',
          expected: 1
        },
        {
          src: '$NPCList[$leglocktarget].pronouns.him',
          to: '<<if maplebirch.get("VanillaPlus").NPCDoublePenetration.playerLegLock>><<deadwood-reblooms-double-leglock-targets $VanillaPlus.npcDoublePenetration.playerLegLock.targets>><<else>>$&<</if>>',
          expected: 1
        }
      ],
      'Widgets Combat Man-Combat': [
        // 双插同伴已有明确的 NPC 目标，禁止原版手部 AI 在同一回合又随机转向 PC。
        {
          src: '<<hand_section>>',
          to: '<<if !maplebirch.get("VanillaPlus").NPCDoublePenetration.isPartner(_n)>><<hand_section>><</if>>',
          expected: 1
        },
        // 原版胸部方位只区分 NPC 在 PC 上下，双插同伴位于承受者身旁，不能套用该段描述。
        {
          src: '<<chest_section>>',
          to: '<<if !maplebirch.get("VanillaPlus").NPCDoublePenetration.isPartner(_n)>><<chest_section>><</if>>',
          expected: 1
        },
        // 命名 NPC 对白仍默认面向 PC，双插同伴改用明确写出承受者的回合文本，并阻止随后生成泛用对白。
        {
          srcmatch: /<<namedNpcComments (\$NPCList\[_n\]\.fullDescription|_n)>>/,
          to: '<<if maplebirch.get("VanillaPlus").NPCDoublePenetration.isPartner(_n)>><<deadwood-reblooms-npc-double-turn>><<set _noNameComment to false>><<else>><<namedNpcComments $1>><</if>>',
          expected: 1
        }
      ],
      'Widgets Ejaculation': [
        // 双插同伴是第二名受锁者时，原版主动拔出判定也要识别双目标锁定。
        {
          src: '<<if _nn is $leglocktarget>>',
          to: '<<if _nn is $leglocktarget or ($VanillaPlus.npcDoublePenetration and $VanillaPlus.npcDoublePenetration.playerLegLock and $VanillaPlus.npcDoublePenetration.playerLegLock.targets.includes(Number(_nn)))>>',
          expected: 1
        },
        // 第二名插入者由扩展组件处理，避免原版把其自定义状态误判为射入 PC。
        {
          src: '<<combatInseminate _nn>>',
          to: '<<if !maplebirch.get("VanillaPlus").NPCDoublePenetration.isPartner(_nn)>><<combatInseminate _nn>><</if>>',
          expected: 1
        },
        // 原版多人共用一组 enemyarousal，这里只改写第二名插入者的射精目标，不另建高潮或结束流程。
        {
          src: '<<if !!namedNpcEjaculation(_nn, _args[0])>>',
          to: '<<if maplebirch.get("VanillaPlus").NPCDoublePenetration.isPartner(_nn)>><<deadwood-reblooms-npc-double-ejaculation>><<elseif !!namedNpcEjaculation(_nn, _args[0])>>',
          expected: 1
        }
      ],
      'Widgets End Combat': [
        // 战斗结束前释放第二名 NPC 的阴茎状态并删除本场战斗的临时数据。
        {
          src: '<<set $combat to 0>>',
          applybefore: '<<run maplebirch.get("VanillaPlus").NPCDoublePenetration.clear()>><<run maplebirch.get("VanillaPlus").handGrip.clearAll()>>\n\t',
          expected: 1
        }
      ]
    }
  });
}
