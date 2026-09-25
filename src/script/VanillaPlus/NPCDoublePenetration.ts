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
export function orderNPCDoublePenetrators(playerSize: number, partnerSize: number): OrderedPenetrators {
  const player = doubleSize(playerSize);
  const partner = doubleSize(partnerSize);
  return partner > player
    ? { primary: 'partner', secondary: 'player', primarySize: partner, secondarySize: player }
    : { primary: 'player', secondary: 'partner', primarySize: player, secondarySize: partner };
}

export default function (maplebirch: typeof window.maplebirch) {
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
    const combatRenderer = (window as any).CombatRenderer;
    const npcMapper = (window as any).NpcCombatMapper;
    const npc = V.NPCList[partnerIndex];
    const strapon = (window as any).npcHasStrapon(partnerIndex);
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

  maplebirch.char.use(
    'pre',
    options => {
      delete options.npcDouble;
      const state = maplebirch.VP.NPCDoublePenetration.visible ? maplebirch.VP.NPCDoublePenetration.state : undefined;
      if (!state) return;

      const player = playerVisual(options);
      const partner = partnerVisual(state.partner);
      const order = orderNPCDoublePenetrators(player.size, partner.size);
      const primary = order.primary === 'player' ? player : partner;
      const secondary = order.secondary === 'player' ? player : partner;
      options.npcDouble = {
        orifice: state.orifice === 'anus' ? 'anal' : 'vaginal',
        primary: { ...primary, size: order.primarySize },
        secondary: { ...secondary, size: order.secondarySize }
      };
      options.filters.npcDoublePrimary = primary.filter;
      options.filters.npcDoubleSecondary = secondary.filter;
      options.filters.npcDoublePrimaryCondom = primary.condomFilter;
      options.filters.npcDoubleSecondaryCondom = secondary.condomFilter;
    },
    'combatXrayPenis'
  );

  // 使用框架扩展原版 combatXrayPenis；单插分支保持原版资源路径和显示规则。
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
        zfn: () => (window as any).CombatRenderer.indices.xrayPenetrator2
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
        zfn: () => (window as any).CombatRenderer.indices.xrayCondom2
      },
      playerCum: {
        showfn: (options: any) => !options.npcDouble && !!options.penis.showCum && V.otherFilled >= 1
      },
      playerEjac: {
        showfn: (options: any) => !options.npcDouble && !!options.penis.showCum && !!options.penis.isCumActive
      }
    },
    'combatXrayPenis'
  );

  maplebirch.tool.inject({
    widgetPassage: {
      'Widgets Combat Man-Combat': [
        // 双插同伴已有明确的 NPC 目标；禁止原版手部 AI 在同一回合又随机转向 PC。
        {
          src: '<<hand_section>>',
          to: '<<if !maplebirch.VP.NPCDoublePenetration.isPartner(_n)>><<hand_section>><</if>>',
          expected: 1
        },
        // 原版胸部方位只区分 NPC 在 PC 上下；双插同伴位于承受者身旁，不能套用该段描述。
        {
          src: '<<chest_section>>',
          to: '<<if !maplebirch.VP.NPCDoublePenetration.isPartner(_n)>><<chest_section>><</if>>',
          expected: 1
        },
        // 命名 NPC 对白仍默认面向 PC；双插同伴改用明确写出承受者的回合文本，并阻止随后生成泛用对白。
        {
          srcmatch: /<<namedNpcComments (\$NPCList\[_n\]\.fullDescription|_n)>>/,
          to: '<<if maplebirch.VP.NPCDoublePenetration.isPartner(_n)>><<deadwood-reblooms-npc-double-turn>><<set _noNameComment to false>><<else>><<namedNpcComments $1>><</if>>',
          expected: 1
        }
      ],
      'Widgets Ejaculation': [
        // 第二名插入者由扩展组件处理，避免原版把其自定义状态误判为射入 PC。
        {
          src: '<<combatInseminate _nn>>',
          to: '<<if !maplebirch.VP.NPCDoublePenetration.isPartner(_nn)>><<combatInseminate _nn>><</if>>',
          expected: 1
        },
        // 原版多人共用一组 enemyarousal；这里只改写第二名插入者的射精目标，不另建高潮或结束流程。
        {
          src: '<<if !!namedNpcEjaculation(_nn, _args[0])>>',
          to: '<<if maplebirch.VP.NPCDoublePenetration.isPartner(_nn)>><<deadwood-reblooms-npc-double-ejaculation>><<elseif !!namedNpcEjaculation(_nn, _args[0])>>',
          expected: 1
        }
      ],
      'Widgets End Combat': [
        // 战斗结束前释放第二名 NPC 的阴茎状态并删除本场战斗的临时数据。
        {
          src: '<<set $combat to 0>>',
          applybefore: '<<run maplebirch.VP.NPCDoublePenetration.clear()>>\n\t',
          expected: 1
        }
      ]
    }
  });
}
