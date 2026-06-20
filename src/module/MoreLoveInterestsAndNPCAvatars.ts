interface NPCData {
  nam: string;
  pronoun?: string;
  love?: number;
  lust?: number;
  dom?: number;
  trauma?: number;
  rage?: number;
  purity?: number;
  corruption?: number;
  state?: string;
  hairColour?: string;
}

/** NPC 在通用关系阈值下使用的头像状态名。 */
interface AvatarStates {
  /** 没有命中其他状态时使用。 */
  readonly default: string;
  /** 爱意达到 loved 阈值时使用。 */
  readonly loved?: string;
  /** 爱意低于原版 npclovelow 阈值时使用。 */
  readonly disliked?: string;
  /** 支配值达到原版 npcdomhigh 阈值时使用。 */
  readonly dominant?: string;
  /** 支配值低于原版 npcdomlow 阈值时使用。 */
  readonly submissive?: string;
  /** 欲望达到 lustful 阈值时使用。 */
  readonly lustful?: string;
}

interface AvatarLayers {
  readonly base: string;
  readonly infront?: string;
}

/** 单名 NPC 的头像目录、文件命名和通用状态配置。 */
interface AvatarProfile {
  /** 位于 basePath 下的图片目录。 */
  readonly folder: string;
  /** 文件名前缀，未填写时与 folder 相同。 */
  readonly prefix?: string;
  /** 是否在文件名末尾追加 NPC 的 _f / _m 等代词后缀。 */
  readonly gendered?: boolean;
  /** 各关系状态对应的文件名片段。 */
  readonly states: AvatarStates;
  /** 自定义普通头像图层。 */
  readonly layers?: (npc: NPCData) => AvatarLayers;
  /** 自定义幽灵模仿头像图层。 */
  readonly mimic?: (npc: NPCData, state: 'iwr' | 'iwb') => AvatarLayers;
}

const avatarBasePath = 'img/misc/icon/social';

/** 解析悉尼共用的发色、发型与眼镜前景。 */
function sydneyAppearance(npc: NPCData): { hairColor: string; foreground: string } {
  const hairColor = npc.hairColour === 'strawberryblond' ? 'st' : 'bl';
  const hair = V.sydney?.hair === 'ponytail' ? 'po' : 'lo';
  const glasses = V.sydney?.glasses === 'contacts' ? 'co' : V.sydney?.glasses === 'broken' || V.sydney?.glasses === 'playerbroken' ? 'br' : 'gl';
  return { hairColor, foreground: `${hairColor}_${hair}_${glasses}` };
}

/** 解析悉尼普通社交头像的双层资源。 */
function sydneyLayers(npc: NPCData): AvatarLayers {
  const appearance = sydneyAppearance(npc);
  const mass = Time.weekDay === 1 && Time.hour === 12;
  const romance = V.sydneyromance === 1;
  let foreground = `${appearance.foreground}${mass && npc.pronoun === 'f' ? '_f' : ''}`;
  let state = 'default';

  if (mass) state = 'mass';
  else if (romance && (npc.purity ?? 0) > 80) {
    if ((npc.lust ?? 0) >= 60) {
      state = 'anything';
      if (V.sydney?.hair === 'ponytail') foreground = `${appearance.hairColor}_po_${V.sydney?.glasses === 'contacts' ? 'co' : V.sydney?.glasses === 'broken' || V.sydney?.glasses === 'playerbroken' ? 'br' : 'gl'}_a`;
    } else state = 'beyondp';
  } else if (romance && (npc.purity ?? 0) >= 40) state = 'beyondp';
  else if (romance && (npc.corruption ?? 0) >= 40) state = (npc.lust ?? 0) >= 20 ? 'deflowered' : 'beyondc';
  else if (romance && (npc.corruption ?? 0) >= 10) state = 'influenced';
  else if (romance) state = 'beyondp';
  else if ((npc.love ?? 0) >= 30 && (npc.purity ?? 0) >= 50) state = V.purity <= 500 || V.demon >= 6 ? 'misguided' : ['monk', 'priest', 'initiate'].includes(V.temple_rank) || V.angel >= 6 ? 'equal' : 'fond';
  else if ((npc.love ?? 0) >= 60 && (npc.corruption ?? 0) >= 10) state = 'influenced';
  else if ((npc.love ?? 0) >= 30 && (npc.corruption ?? 0) >= 10) state = 'know';
  else if ((npc.love ?? 0) >= 30) state = 'conflicted';
  else if ((V.sydneySeen ?? []).includes('initiate')) state = V.purity <= 500 || V.demon >= 6 ? 'heretical' : (npc.love ?? 0) >= 10 ? 'intrigued' : 'initiate';
  else if ((npc.love ?? 0) >= 10) state = 'intrigued';

  return {
    base: `${avatarBasePath}/sydney/syd_${state}_${appearance.hairColor}.png`,
    infront: `${avatarBasePath}/sydney/${foreground}.png`
  };
}

/** 解析悉尼被象牙幽灵模仿时的双层资源。 */
function sydneyMimicLayers(npc: NPCData, state: 'iwr' | 'iwb'): AvatarLayers {
  const appearance = sydneyAppearance(npc);
  return {
    base: `${avatarBasePath}/sydney/syd_${state}_${appearance.hairColor}.png`,
    infront: `${avatarBasePath}/sydney/${appearance.foreground}.png`
  };
}

// prettier-ignore
const avatarProfiles: Record<string, AvatarProfile> = {
  // 艾利克斯：关系、支配与依赖状态。
  Alex        : { folder: 'alex'    , gendered: true , states: { default: 'default', loved: 'partner'   , disliked: 'bother'    , dominant: 'control'  , submissive: 'depend'   , lustful: undefined } },
  // 艾弗里：由专用规则处理爱意、愤怒和离场状态。
  Avery       : { folder: 'avery'   , gendered: true , states: { default: 'default', loved: undefined   , disliked: undefined   , dominant: undefined  , submissive: undefined  , lustful: undefined } },
  // 贝利：默认、烦扰状态。
  Bailey      : { folder: 'bailey'  , gendered: true , states: { default: ''       , loved: undefined   , disliked: 'bother'    , dominant: undefined  , submissive: undefined  , lustful: undefined } },
  // 布莱尔：爱意、厌恶与支配状态。
  Briar       : { folder: 'briar'   , gendered: true , states: { default: 'default', loved: 'delightful', disliked: 'terrible'  , dominant: 'cute'     , submissive: 'lookup'   , lustful: undefined } },
  // 黑狼：伴侣关系、威势与认可状态。
  'Black Wolf': { folder: 'bw'      , gendered: true , states: { default: 'default', loved: 'mate'      , disliked: 'terrible'  , dominant: 'powerful' , submissive: 'worthy'   , lustful: undefined } },
  // 查理：爱意、厌恶与才能评价。
  Charlie     : { folder: 'charlie' , gendered: true , states: { default: 'default', loved: 'delightful', disliked: 'terrible'  , dominant: 'talent'   , submissive: undefined  , lustful: undefined } },
  // 达里尔：爱意与支配关系。
  Darryl      : { folder: 'darryl'  , gendered: true , states: { default: 'default', loved: 'adorable'  , disliked: 'terrible'  , dominant: 'cute'     , submissive: 'lookup'   , lustful: undefined } },
  // 多伦：默认、爱意状态。
  Doren       : { folder: 'doren'   , gendered: true , states: { default: 'default', loved: 'delightful', disliked: undefined   , dominant: undefined  , submissive: undefined  , lustful: undefined } },
  // 伊甸：爱意、厌恶与支配状态。
  Eden        : { folder: 'eden'    , gendered: true , states: { default: 'default', loved: 'delightful', disliked: 'terrible'  , dominant: 'adorable' , submissive: 'inspiring', lustful: undefined } },
  // 巨鹰：无性别后缀，使用伴侣与支配状态。
  'Great Hawk': { folder: 'gh'      , gendered: false, states: { default: 'default', loved: 'mate'      , disliked: 'distraught', dominant: 'domhigh'  , submissive: 'domlow'   , lustful: undefined } },
  // 哈珀：无性别后缀，使用关系与支配状态。
  Harper      : { folder: 'harper'  , gendered: false, states: { default: 'default', loved: 'adorable'  , disliked: 'terrible'  , dominant: 'cute'     , submissive: 'lookup'   , lustful: undefined } },
  // 约旦：无性别后缀，使用爱意状态。
  Jordan      : { folder: 'jordan'  , gendered: false, states: { default: 'default', loved: 'delightful', disliked: 'terrible'  , dominant: undefined  , submissive: undefined  , lustful: undefined } },
  // 凯拉尔：由专用规则处理爱意、愤怒与监狱状态。
  Kylar       : { folder: 'kylar'   , gendered: true , states: { default: 'fixated1',loved: undefined   , disliked: undefined   , dominant: undefined  , submissive: undefined  , lustful: undefined } },
  // 兰德里：默认头像。
  Landry      : { folder: 'landry'  , gendered: true , states: { default: 'default', loved: undefined   , disliked: undefined   , dominant: undefined  , submissive: undefined  , lustful: undefined } },
  // 礼顿：爱意与支配状态。
  Leighton    : { folder: 'leighton', gendered: true , states: { default: 'default', loved: 'adorable'  , disliked: 'terrible'  , dominant: 'cute'     , submissive: 'lookup'   , lustful: undefined } },
  // 梅森：爱意、厌恶与欲望状态。
  Mason       : { folder: 'mason'   , gendered: true , states: { default: 'default', loved: 'best'      , disliked: 'terrible'  , dominant: undefined  , submissive: undefined  , lustful: 'lust3'    } },
  // 摩根：爱意与支配状态，也可被幽灵模仿。
  Morgan      : { folder: 'morgan'  , gendered: true , states: { default: 'default', loved: 'delightful', disliked: 'terrible'  , dominant: 'adorable' , submissive: 'inspiring', lustful: undefined } },
  // 尼奇：默认、爱意状态。
  Niki        : { folder: 'niki'    , gendered: true , states: { default: 'default', loved: 'delightful', disliked: undefined   , dominant: undefined  , submissive: undefined  , lustful: undefined } },
  // 奎恩：爱意、厌恶与欲望状态。
  Quinn       : { folder: 'quinn'   , gendered: true , states: { default: 'default', loved: 'interest'  , disliked: 'terrible'  , dominant: undefined  , submissive: undefined  , lustful: 'mind'     } },
  // 雷米：爱意与支配状态。
  Remy        : { folder: 'remy'    , gendered: true , states: { default: 'default', loved: 'delightful', disliked: 'terrible'  , dominant: 'adorable' , submissive: 'inspiring', lustful: undefined } },
  // 罗宾：由专用规则处理恋爱、创伤与支配状态。
  Robin       : { folder: 'robin'   , gendered: true , states: { default: 'default', loved: undefined   , disliked: undefined   , dominant: undefined  , submissive: undefined  , lustful: undefined } },
  // 瑞沃：默认、爱意状态。
  River       : { folder: 'river'   , gendered: true , states: { default: 'default', loved: 'delightful', disliked: undefined   , dominant: undefined  , submissive: undefined  , lustful: undefined } },
  // 山姆：爱意、厌恶状态。
  Sam         : { folder: 'sam'     , gendered: true , states: { default: 'default', loved: 'delightful', disliked: 'terrible'  , dominant: undefined  , submissive: undefined  , lustful: undefined } },
  // 西里斯：爱意、厌恶状态。
  Sirris      : { folder: 'sirris'  , gendered: true , states: { default: 'default', loved: 'delightful', disliked: 'terrible'  , dominant: undefined  , submissive: undefined  , lustful: undefined } },
  // 悉尼：使用 syd 文件名前缀，由专用规则处理发色。
  Sydney      : { folder: 'sydney'  , prefix: 'syd'  , gendered: false, states: { default: 'default_bl', loved: undefined, disliked: undefined, dominant: undefined, submissive: undefined, lustful: undefined }, layers: sydneyLayers, mimic: sydneyMimicLayers },
  // 温特：爱意、厌恶与仰望状态。
  Winter      : { folder: 'winter'  , gendered: true , states: { default: 'default', loved: 'delightful', disliked: 'terrible'  , dominant: undefined  , submissive: 'lookup'   , lustful: undefined } },
  // 伦恩：爱意与支配状态。
  Wren        : { folder: 'wren'    , gendered: true , states: { default: 'default', loved: 'adorable'  , disliked: 'terrible'  , dominant: 'cute'     , submissive: 'lookup'   , lustful: undefined } },
  // 惠特尼：由专用规则处理爱意、欲望、支配与地牢状态。
  Whitney     : { folder: 'whitney' , gendered: true , states: { default: 'fun'    , loved: undefined   , disliked: undefined   , dominant: undefined  , submissive: undefined  , lustful: undefined } },
  // 格威岚：固定头像，无性别后缀。
  Gwylan      : { folder: 'gwylan'  , gendered: false, states: { default: ''       , loved: undefined   , disliked: undefined   , dominant: undefined  , submissive: undefined  , lustful: undefined } },
  // 象牙幽灵：由专用规则处理幽灵形态，无性别后缀。
  'Ivory Wraith': { folder: 'iw'    , gendered: false, states: { default: 'life'   , loved: undefined   , disliked: undefined   , dominant: undefined  , submissive: undefined  , lustful: undefined } },
  // 泽菲尔：爱意、厌恶状态。
  Zephyr      : { folder: 'zephyr'  , gendered: true , states: { default: 'default', loved: 'delightful', disliked: 'terrible'  , dominant: undefined  , submissive: undefined  , lustful: undefined } }
};

/** 特殊角色只决定文件名状态，目录与性别后缀仍由统一配置处理。 */
const specialStates: Record<string, (npc: NPCData) => string> = {
  // 罗宾：恋爱状态优先，其次按创伤和支配值选择表情。
  Robin: npc => {
    if (V.robinromance === 1) return (npc.trauma ?? 0) >= 80 ? ((npc.lust ?? 0) >= 50 ? 'lost' : 'nothing') : (npc.dom ?? 0) >= 40 ? 'cherishes' : 'love';
    if ((npc.trauma ?? 0) >= 80) return 'traumatised';
    if ((npc.trauma ?? 0) >= 40) return 'pain';
    if ((npc.trauma ?? 0) >= 10) return 'troubled';
    if ((npc.dom ?? 0) >= 80) return 'protective';
    if ((npc.dom ?? 0) >= 20) return 'friend';
    return 'default';
  },
  // 艾弗里：离场状态优先，其次组合爱意与愤怒值。
  Avery: npc => {
    if (npc.state === 'dismissed') return V.avery_fate === 'fallen' || V.avery_fate === 'kicked' ? 'fallen' : 'dismissed';
    if ((npc.rage ?? 0) >= 96) return 'given';
    if ((npc.love ?? 0) >= 60) return (npc.rage ?? 0) >= 60 ? 'infuriated' : (npc.rage ?? 0) >= 20 ? 'tighter' : 'prize';
    if ((npc.love ?? 0) >= 20) return (npc.rage ?? 0) >= 20 ? 'possession' : 'cute';
    return (npc.rage ?? 0) >= 60 ? 'insolent' : (npc.rage ?? 0) >= 20 ? 'brat' : 'default';
  },
  // 凯拉尔：监狱状态优先，其余状态由爱意分组、愤怒分级。
  Kylar: npc => {
    if (npc.state === 'prison') return 'prison';
    const love = npc.love ?? 0;
    const rage = npc.rage ?? 0;
    const group = love >= 90 ? 'obsessed' : love >= 60 ? 'enamoured' : love >= 30 ? 'infatuated' : 'fixated';
    const level = group === 'obsessed' || group === 'enamoured' ? (rage >= 90 ? 4 : rage >= 60 ? 3 : rage >= 30 ? 2 : 1) : rage >= 90 ? 2 : 1;
    return `${group}${level}`;
  },
  // 惠特尼：组合地牢、爱意、欲望和支配值。
  Whitney: npc => {
    if (npc.state === 'dungeon') return 'dismissed';
    if ((npc.love ?? 0) >= 20) return (npc.lust ?? 0) >= 60 ? 'lust' : (npc.dom ?? 0) <= 8 ? 'girlfriend' : 'own';
    if ((npc.love ?? 0) <= 5) {
      return (npc.lust ?? 0) >= 60 ? 'beg' : (npc.dom ?? 0) >= 20 ? 'pathetic' : (npc.dom ?? 0) <= 2 && (npc.love ?? 0) <= 2 ? 'vendetta' : (npc.dom ?? 0) <= 7 ? 'threat' : 'freak';
    }
    return (npc.dom ?? 0) <= 8 ? 'threat' : 'fun';
  },
  // 象牙幽灵：直接对应当前幽灵形态。
  'Ivory Wraith': () => (['active', 'despair', 'haunt'].includes(V.wraith?.state) ? V.wraith.state : 'life')
};

// prettier-ignore
const mimicProfiles: Record<string, string> = {
  // 罗宾：幽灵模仿时使用罗宾专用覆盖层。
  Robin : 'robin',
  // 凯拉尔：幽灵模仿时使用凯拉尔专用覆盖层。
  Kylar : 'kylar',
  // 伊甸：幽灵模仿时使用伊甸专用覆盖层。
  Eden  : 'eden',
  // 摩根：幽灵模仿时使用摩根专用覆盖层。
  Morgan: 'morgan'
};

export const npcAvatarConfig = {
  basePath: avatarBasePath,
  thresholds: { loved: 50, lustful: 60 },
  characters: avatarProfiles
};

class NPCAvatars {
  public constructor(readonly core: typeof maplebirch) {}

  public preInit(): void {
    this.core.tool.zone.inject({
      widgetPassage: {
        'Widgets Named Npcs': [{ src: '<<relationshiptext>>', applyafter: '<<relationshipicon>>' }],
        Widgets: [{ src: '<<npcrelationship "Ivory Wraith">>', applyafter: '<<mimicicon>>' }]
      }
    });
    this.core.once(':sugarcube', () => {
      this.core.tool.macro.defineS('relationshipicon', () => this.avatar());
      this.core.tool.macro.defineS('mimicicon', () => this.mimic());
    });
  }

  /** 创建指定 NPC 的社交栏头像。 */
  public avatar(name = String(T.npc ?? '')): HTMLElement | undefined {
    const npc = V.NPCName.find((entry: NPCData) => entry.nam === name) as NPCData | undefined;
    if (!npc) return undefined;
    const profile = npcAvatarConfig.characters[npc.nam];
    if (!profile) return undefined;
    const customLayers = profile.layers?.(npc);
    if (customLayers) return this.layers(customLayers.base, customLayers.infront);

    const states = profile.states;
    const selectSpecialState = specialStates[npc.nam];
    let state = selectSpecialState?.(npc) ?? states.default;
    if (!selectSpecialState) {
      if ((npc.love ?? 0) >= npcAvatarConfig.thresholds.loved && states.loved) state = states.loved;
      else if ((npc.love ?? 0) <= Number(V.npclovelow ?? 0) && states.disliked) state = states.disliked;
      else if ((npc.lust ?? 0) >= npcAvatarConfig.thresholds.lustful && states.lustful) state = states.lustful;
      else if ((npc.dom ?? 0) >= Number(V.npcdomhigh ?? 50) && states.dominant) state = states.dominant;
      else if ((npc.dom ?? 0) <= Number(V.npcdomlow ?? -50) && states.submissive) state = states.submissive;
    }

    const suffix = profile.gendered === false ? '' : `_${npc.pronoun ?? 'f'}`;
    const separator = state ? '_' : '';
    return this.layers(`${npcAvatarConfig.basePath}/${profile.folder}/${profile.prefix ?? profile.folder}${separator}${state}${suffix}.png`);
  }

  /** 创建象牙幽灵模仿指定角色时使用的头像层。 */
  private mimic(): DocumentFragment | undefined {
    const name = String(V.wraith?.mimic ?? '');
    if (!name) return undefined;
    const npc = V.NPCName.find((entry: NPCData) => entry.nam === name) as NPCData | undefined;
    if (!npc) return undefined;

    const fragment = document.createDocumentFragment();
    const wraithState = V.wraith.state === 'haunt' ? 'iwr' : 'iwb';
    const customLayers = npcAvatarConfig.characters[name]?.mimic?.(npc, wraithState);
    if (customLayers) {
      fragment.append(this.layers(customLayers.base, customLayers.infront));
      return fragment;
    }

    const folder = mimicProfiles[name];
    if (!folder) return undefined;
    fragment.append(this.image(`${npcAvatarConfig.basePath}/${folder}/${folder}_${wraithState}_${npc.pronoun ?? 'f'}.png`));
    return fragment;
  }

  /** 创建统一头像层；存在前景图时自动建立叠层容器。 */
  private layers(base: string, infront?: string): HTMLElement {
    if (!infront) return this.image(base);
    const container = document.createElement('span');
    container.className = 'icon-container';
    container.append(this.image(base), this.image(infront, 'icon infront'));
    return container;
  }

  /** 使用框架图片加载器创建头像节点。 */
  private image(path: string, className = 'icon'): HTMLImageElement {
    const image = new Image();
    image.className = className;
    image.alt = '';
    const loaded = loadImage(path);
    image.src = typeof loaded === 'string' ? loaded : path;
    if (loaded instanceof Promise) void loaded.then(src => typeof src === 'string' && (image.src = src));
    return image;
  }
}

class MoreLoveInterests {
  public constructor(
    readonly core: typeof maplebirch,
    readonly avatars: NPCAvatars
  ) {}

  public preInit(): void {
    this.core.once(':variable', () => this.syncLoveInterests());
    this.core.tool.zone.inject({
      widgetPassage: {
        Widgets: [
          {
            srcmatch: /\/\* Check if this is a main love interest \*\/[\s\S]*?T\.loveInterest = false;\s*}/,
            to: '\n\t\t\t\tT.loveInterest = V.loveInterestList.includes(T.npcData.nam);'
          }
        ],
        'Widgets Attitudes': [
          {
            srcmatch: /\t\t<<set _loveIntStart1[\s\S]*?\t\t<<loveInterestFunction>>/,
            to: '\t\t<div class="settingsToggleItem"><<moreLoveInterest>></div>'
          },
          {
            src: '<<widget "loveInterestRemove">>',
            applyafter: '\n\t<<run maplebirch.npcAvatars.loveInterests.removeLoveInterest(_args[0])>><<exit>>'
          }
        ]
      }
    });

    this.core.once(':sugarcube', () => {
      this.core.tool.macro.defineS('moreLoveInterest', () => this.loveInterestPanel());
    });
  }

  public Init() {
    const original = window.isLoveInterest;
    window.isLoveInterest = (name: string) => V.loveInterestList?.includes(name) || original(name);
  }

  /** 从恋人列表移除角色，供原版放逐流程调用。 */
  public removeLoveInterest(name: string): void {
    this.syncLoveInterests();
    V.loveInterestList.delete(name);
    this.syncLoveInterests();
  }

  /** 构建更多恋人设置面板。 */
  private loveInterestPanel(): HTMLElement {
    this.syncLoveInterests();
    const panel = document.createElement('section');
    panel.className = 'deadwood-love-interests';

    const title = document.createElement('div');
    title.className = 'gold bold deadwood-love-interests-title';
    title.textContent = this.core.t('deadwoodReblooms.loveInterests.title');
    panel.append(title);

    const candidates = setup.loveInterestNpc.filter((name: string) => window.isPossibleLoveInterest(name));
    panel.append(this.loveInterestGroup('deadwoodReblooms.loveInterests.selected', V.loveInterestList, true));
    panel.append(
      this.loveInterestGroup(
        'deadwoodReblooms.loveInterests.available',
        candidates.filter((name: string) => !V.loveInterestList.includes(name)),
        false
      )
    );
    return panel;
  }

  /** 创建恋人或候选人分组，并绑定点击与拖拽操作。 */
  private loveInterestGroup(labelKey: string, names: string[], selected: boolean): HTMLElement {
    const group = document.createElement('div');
    group.className = 'deadwood-love-interests-group';
    const label = document.createElement('div');
    label.className = selected ? 'lewd' : 'green';
    label.textContent = `${this.core.t(labelKey)} (${names.length})`;
    const list = document.createElement('div');
    list.className = 'deadwood-love-interests-list';
    list.dataset.selected = String(selected);

    for (const name of names) {
      const item = document.createElement('button');
      item.type = 'button';
      item.className = 'deadwood-love-interest';
      item.dataset.name = name;
      item.draggable = selected;
      const icon = this.avatars.avatar(name);
      if (icon) item.append(icon);
      const text = document.createElement('span');
      text.textContent = this.core.auto(name);
      item.append(text);
      item.addEventListener('click', () => {
        if (selected) V.loveInterestList.delete(name);
        else V.loveInterestList.push(name);
        this.syncLoveInterests();
        group.closest('.deadwood-love-interests')?.replaceWith(this.loveInterestPanel());
      });
      item.addEventListener('dragstart', event => event.dataTransfer?.setData('text/plain', name));
      item.addEventListener('dragover', event => selected && event.preventDefault());
      item.addEventListener('drop', event => {
        event.preventDefault();
        const from = V.loveInterestList.indexOf(event.dataTransfer?.getData('text/plain') ?? '');
        const to = V.loveInterestList.indexOf(name);
        if (from < 0 || to < 0 || from === to) return;
        [V.loveInterestList[from], V.loveInterestList[to]] = [V.loveInterestList[to], V.loveInterestList[from]];
        this.syncLoveInterests();
        group.closest('.deadwood-love-interests')?.replaceWith(this.loveInterestPanel());
      });
      list.append(item);
    }
    group.append(label, list);
    return group;
  }

  /** 归一化不限量列表，并向游戏本体映射前三名。 */
  private syncLoveInterests(): void {
    const stored = Array.isArray(V.loveInterestList) ? V.loveInterestList : Object.values(V.loveInterest ?? {});
    V.loveInterestList = [...new Set(stored.filter((name): name is string => typeof name === 'string' && name !== 'None'))];
    V.loveInterest = {
      primary: V.loveInterestList[0] ?? 'None',
      secondary: V.loveInterestList[1] ?? 'None',
      tertiary: V.loveInterestList[2] ?? 'None'
    };
    V.loveInterestAwareMessage = true;
  }
}

class MoreLoveInterestsAndNPCAvatars {
  public readonly avatars: NPCAvatars;
  public readonly loveInterests: MoreLoveInterests;

  public constructor(readonly core: typeof maplebirch) {
    this.avatars = new NPCAvatars(core);
    this.loveInterests = new MoreLoveInterests(core, this.avatars);
  }

  public preInit(): void {
    this.avatars.preInit();
    this.loveInterests.preInit();
  }

  public Init() {
    this.loveInterests.Init();
  }
}

export { MoreLoveInterests, NPCAvatars };
export default MoreLoveInterestsAndNPCAvatars;
