// ./src/module/MoreLoveInterestsAndNPCAvatars.ts

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

interface AvatarStates {
  default: string;
  loved?: string;
  disliked?: string;
  dominant?: string;
  submissive?: string;
  lustful?: string;
}

interface AvatarLayers {
  readonly base: string;
  readonly infront?: string;
}

interface AvatarProfile {
  readonly folder: string;
  readonly prefix?: string;
  readonly gendered?: boolean;
  readonly states: AvatarStates;
  readonly layers?: (npc: NPCData) => AvatarLayers;
  readonly mimic?: (npc: NPCData, state: 'iwr' | 'iwb') => AvatarLayers;
  readonly stateResolver?: (npc: NPCData) => string;
  readonly mimicFolder?: string;
}

class NPCAvatars {
  private static readonly avatarBasePath = 'img/misc/icon/social';

  private static readonly THRESHOLDS = {
    loved: 50,
    lustful: 60
  };

  private static sydneyAppearance(npc: NPCData): { hairColor: string; foreground: string } {
    const hairColor = npc.hairColour === 'strawberryblond' ? 'st' : 'bl';
    const hair = V.sydney?.hair === 'ponytail' ? 'po' : 'lo';
    const glasses = V.sydney?.glasses === 'contacts' ? 'co' : V.sydney?.glasses === 'broken' || V.sydney?.glasses === 'playerbroken' ? 'br' : 'gl';
    return { hairColor, foreground: `${hairColor}_${hair}_${glasses}` };
  }

  private static sydneyLayers(npc: NPCData): AvatarLayers {
    const appearance = NPCAvatars.sydneyAppearance(npc);
    const mass = Time.weekDay === 1 && Time.hour === 12;
    const romance = window.isPossibleLoveInterest('Sydney');
    let foreground = `${appearance.foreground}${mass && npc.pronoun === 'm' ? '' : '_f'}`;
    let state = 'default';

    if (mass) state = 'mass';
    else if (romance && (npc.purity ?? 0) > 80) {
      if ((npc.lust ?? 0) >= 60) {
        state = 'anything';
        if (V.sydney?.hair === 'ponytail')
          foreground = `${appearance.hairColor}_po_` + (V.sydney?.glasses === 'contacts' ? 'co' : V.sydney?.glasses === 'broken' || V.sydney?.glasses === 'playerbroken' ? 'br' : 'gl') + '_a';
      } else state = 'beyondp';
    } else if (romance && (npc.purity ?? 0) >= 40) state = 'beyondp';
    else if (romance && (npc.corruption ?? 0) >= 40) state = (npc.lust ?? 0) >= 20 ? 'deflowered' : 'beyondc';
    else if (romance && (npc.corruption ?? 0) >= 10) state = 'influenced';
    else if (romance) state = 'beyondp';
    else if ((npc.love ?? 0) >= 30 && (npc.purity ?? 0) >= 50)
      state = V.purity <= 500 || V.demon >= 6 ? 'misguided' : ['monk', 'priest', 'initiate'].includes(V.temple_rank) || V.angel >= 6 ? 'equal' : 'fond';
    else if ((npc.love ?? 0) >= 60 && (npc.corruption ?? 0) >= 10) state = 'influenced';
    else if ((npc.love ?? 0) >= 30 && (npc.corruption ?? 0) >= 10) state = 'know';
    else if ((npc.love ?? 0) >= 30) state = 'conflicted';
    else if ((V.sydneySeen ?? []).includes('initiate')) state = V.purity <= 500 || V.demon >= 6 ? 'heretical' : (npc.love ?? 0) >= 10 ? 'intrigued' : 'initiate';
    else if ((npc.love ?? 0) >= 10) state = 'intrigued';

    return {
      base: `${NPCAvatars.avatarBasePath}/sydney/syd_${state}_${appearance.hairColor}.png`,
      infront: `${NPCAvatars.avatarBasePath}/sydney/${foreground}.png`
    };
  }

  private static avatar(folder: string, states: Partial<AvatarStates> = {}, extra: Omit<AvatarProfile, 'folder' | 'states'> = {}): AvatarProfile {
    return {
      folder,
      gendered: true,
      states: { default: 'default', ...states },
      ...extra
    };
  }

  // prettier-ignore
  static readonly avatarStates = {
    love     : { loved: 'delightful' },
    normal   : { loved: 'delightful', disliked: 'terrible' },
    cute     : { loved: 'adorable'  , disliked: 'terrible', dominant: 'cute'    , submissive: 'lookup' },
    inspiring: { loved: 'delightful', disliked: 'terrible', dominant: 'adorable', submissive: 'inspiring' }
  } satisfies Record<string, Partial<AvatarStates>>;

  // prettier-ignore
  static readonly avatarProfiles: Record<string, AvatarProfile> = {
    Alex        : NPCAvatars.avatar('alex', { loved: 'partner', disliked: 'bother', dominant: 'control', submissive: 'depend' }),

    Avery       : NPCAvatars.avatar('avery', {}, {
      stateResolver: npc => {
        if (npc.state === 'dismissed') return V.avery_fate === 'fallen' || V.avery_fate === 'kicked' ? 'fallen' : 'dismissed';
        if ((npc.rage ?? 0) >= 96) return 'given';
        if ((npc.love ?? 0) >= 60) {
          const rage = npc.rage ?? 0;
          if (rage >= 60) return 'infuriated';
          if (rage >= 20) return 'tighter';
          return 'prize';
        }
        if ((npc.love ?? 0) >= 20) {
          const rage = npc.rage ?? 0;
          if (rage >= 20) return 'possession';
          return 'cute';
        }
        const rage = npc.rage ?? 0;
        if (rage >= 60) return 'insolent';
        if (rage >= 20) return 'brat';
        return 'default';
      }
    }),

    Bailey      : NPCAvatars.avatar('bailey'  , { default: ''        , disliked: 'bother' }),
    Briar       : NPCAvatars.avatar('briar'   , { loved: 'delightful', disliked: 'terrible', dominant: 'cute'    , submissive: 'lookup' }),
    'Black Wolf': NPCAvatars.avatar('bw'      , { loved: 'mate'      , disliked: 'terrible', dominant: 'powerful', submissive: 'worthy' }),
    Charlie     : NPCAvatars.avatar('charlie' , { loved: 'delightful', disliked: 'terrible', dominant: 'talent' }),
    Darryl      : NPCAvatars.avatar('darryl'  , NPCAvatars.avatarStates.cute),
    Doren       : NPCAvatars.avatar('doren'   , NPCAvatars.avatarStates.love),
    Eden        : NPCAvatars.avatar('eden'    , NPCAvatars.avatarStates.inspiring, { mimicFolder: 'eden' }),
    'Great Hawk': NPCAvatars.avatar('gh'      , { loved: 'mate'      , disliked: 'distraught', dominant: 'domhigh', submissive: 'domlow' }, { gendered: false }),
    Harper      : NPCAvatars.avatar('harper'  , NPCAvatars.avatarStates.cute    , { gendered: false }),
    Jordan      : NPCAvatars.avatar('jordan'  , NPCAvatars.avatarStates.normal  , { gendered: false }),

    Kylar       : NPCAvatars.avatar('kylar'   , { default: 'fixated1' }, {
      stateResolver: npc => {
        if (npc.state === 'prison') return 'prison';
        const love = npc.love ?? 0;
        const rage = npc.rage ?? 0;
        const group = love >= 90 ? 'obsessed' : love >= 60 ? 'enamoured' : love >= 30 ? 'infatuated' : 'fixated';
        const level = group === 'obsessed' || group === 'enamoured' ? (rage >= 90 ? 4 : rage >= 60 ? 3 : rage >= 30 ? 2 : 1) : rage >= 90 ? 2 : 1;
        return `${group}${level}`;
      },
      mimicFolder: 'kylar'
    }),

    Landry      : NPCAvatars.avatar('landry') ,
    Leighton    : NPCAvatars.avatar('leighton', NPCAvatars.avatarStates.cute),
    Mason       : NPCAvatars.avatar('mason'   , { loved: 'best'       , disliked: 'terrible', lustful: 'lust3' }),
    Morgan      : NPCAvatars.avatar('morgan'  , NPCAvatars.avatarStates.inspiring, { mimicFolder: 'morgan' }),
    Niki        : NPCAvatars.avatar('niki'    , NPCAvatars.avatarStates.love),
    Quinn       : NPCAvatars.avatar('quinn'   , { loved: 'interest'   , disliked: 'terrible', lustful: 'mind' }),
    Remy        : NPCAvatars.avatar('remy'    , NPCAvatars.avatarStates.inspiring),

    Robin       : NPCAvatars.avatar('robin', {}, {
      stateResolver: npc => {
        if (window.isPossibleLoveInterest('Robin')) {
          const trauma = npc.trauma ?? 0;
          if (trauma >= 80) return (npc.lust ?? 0) >= 50 ? 'lost' : 'nothing';
          return (npc.dom ?? 0) >= 40 ? 'cherishes' : 'love';
        }
        const trauma = npc.trauma ?? 0;
        if (trauma >= 80) return 'traumatised';
        if (trauma >= 40) return 'pain';
        if (trauma >= 10) return 'troubled';
        const dom = npc.dom ?? 0;
        if (dom >= 80) return 'protective';
        if (dom >= 20) return 'friend';
        return 'default';
      },
      mimicFolder: 'robin'
    }),

    River       : NPCAvatars.avatar('river' , NPCAvatars.avatarStates.love),
    Sam         : NPCAvatars.avatar('sam'   , NPCAvatars.avatarStates.normal),
    Sirris      : NPCAvatars.avatar('sirris', NPCAvatars.avatarStates.normal),

    Sydney      : {
      folder: 'sydney',
      prefix: 'syd',
      gendered: false,
      states: { default: 'default_bl' },
      layers: NPCAvatars.sydneyLayers,
      mimic : function (npc: NPCData, state: 'iwr' | 'iwb'): AvatarLayers {
        const appearance = NPCAvatars.sydneyAppearance(npc);
        return {
          base: `${NPCAvatars.avatarBasePath}/sydney/syd_${state}_${appearance.hairColor}.png`,
          infront: `${NPCAvatars.avatarBasePath}/sydney/${appearance.foreground}.png`
        };
      }
    },

    Winter      : NPCAvatars.avatar('winter', { loved: 'delightful', disliked: 'terrible', submissive: 'lookup' }),
    Wren        : NPCAvatars.avatar('wren'  , NPCAvatars.avatarStates.cute),

    Whitney     : NPCAvatars.avatar('whitney', { default: 'fun' }, {
      stateResolver: npc => {
        if (npc.state === 'dungeon') return 'dismissed';
        const love = npc.love ?? 0;
        const lust = npc.lust ?? 0;
        const dom = npc.dom ?? 0;
        if (love >= 20) {
          if (lust >= 60) return 'lust';
          if (dom <= 8) return 'girlfriend';
          return 'own';
        }
        if (love <= 5) {
          if (lust >= 60) return 'beg';
          if (dom >= 20) return 'pathetic';
          if (dom <= 2 && love <= 2) return 'vendetta';
          if (dom <= 7) return 'threat';
          return 'freak';
        }
        return dom <= 8 ? 'threat' : 'fun';
      }
    }),

    Gwylan        : NPCAvatars.avatar('gwylan', { default: '' }    , { gendered: false }),
    'Ivory Wraith': NPCAvatars.avatar('iw'    , { default: 'life' }, {
      gendered: false,
      stateResolver: () => (['active', 'despair', 'haunt'].includes(V.wraith?.state) ? V.wraith.state : 'life')
    }),
    Zephyr        : NPCAvatars.avatar('zephyr', NPCAvatars.avatarStates.normal)
  };

  // prettier-ignore
  static readonly posterAliases: Record<string, readonly string[]> = {
    vrel   : ['vrel', 'vrelnir'],
    puri   : ['puri', 'purityguy'],
    nona   : ['nona', '诺娜'],
    fayne  : ['fayne', '费恩'],
    seabird: ['seabird', '海鸟']
  };

  public constructor(readonly core: typeof maplebirch) {
    this.core.once(':sugarcube', () => {
      this.core.tool.macro.defineS('relationshipicon', () => this.avatar());
      this.core.tool.macro.defineS('mimicicon', () => this.mimic());
    });
  }

  public icon(name: string, premade: boolean): string {
    if (premade) return `poster_${name}`;
    const normalized = String(name ?? '')
      .trim()
      .toLowerCase();
    if (normalized.includes('vrel') && normalized.includes('puri')) return 'poster_purivrel';
    for (const [icon, aliases] of Object.entries(NPCAvatars.posterAliases)) if (aliases.some(alias => normalized === alias.toLowerCase())) return `poster_${icon}`;
    if (['象牙怨灵', 'ivory wraith'].some(alias => normalized.includes(alias))) return this.core.DR.rng > 96 ? 'poster_iwlife' : `poster_iw${V.wraith.state}`;
    return ['dol', 'degrees of lewdity'].some(alias => normalized.includes(alias)) ? 'poster_dol' : 'poster';
  }

  public avatar(name = String(T.npc ?? '')): HTMLElement | undefined {
    const npc = V.NPCName.find((entry: NPCData) => entry.nam === name) as NPCData | undefined;
    if (!npc) return undefined;
    const profile = NPCAvatars.avatarProfiles[npc.nam];
    if (!profile) return undefined;

    const customLayers = profile.layers?.(npc);
    if (customLayers) return this.buildLayers(customLayers.base, customLayers.infront);

    let state: string | undefined;
    if (profile.stateResolver) {
      state = profile.stateResolver(npc);
    } else {
      const states = profile.states;
      const love = npc.love ?? 0;
      const lust = npc.lust ?? 0;
      const dom = npc.dom ?? 0;
      if (love >= NPCAvatars.THRESHOLDS.loved && states.loved) state = states.loved;
      else if (love <= Number(V.npclovelow ?? 0) && states.disliked) state = states.disliked;
      else if (lust >= NPCAvatars.THRESHOLDS.lustful && states.lustful) state = states.lustful;
      else if (dom >= Number(V.npcdomhigh ?? 50) && states.dominant) state = states.dominant;
      else if (dom <= Number(V.npcdomlow ?? -50) && states.submissive) state = states.submissive;
      else state = states.default;
    }

    const suffix = profile.gendered === false ? '' : `_${npc.pronoun ?? 'f'}`;
    const separator = state ? '_' : '';
    const prefix = profile.prefix ?? profile.folder;
    const path = `${NPCAvatars.avatarBasePath}/${profile.folder}/${prefix}${separator}${state}${suffix}.png`;
    return this.buildLayers(path);
  }

  private mimic(): DocumentFragment | undefined {
    const name = String(V.wraith?.mimic ?? '');
    if (!name) return undefined;
    const npc = V.NPCName.find((entry: NPCData) => entry.nam === name) as NPCData | undefined;
    if (!npc) return undefined;

    const fragment = document.createDocumentFragment();
    const wraithState = V.wraith.state === 'haunt' ? 'iwr' : 'iwb';
    const profile = NPCAvatars.avatarProfiles[name];
    if (!profile) return undefined;

    const customMimic = profile.mimic?.(npc, wraithState);
    if (customMimic) {
      fragment.append(this.buildLayers(customMimic.base, customMimic.infront));
      return fragment;
    }

    const folder = profile.mimicFolder;
    if (!folder) return undefined;
    const path = `${NPCAvatars.avatarBasePath}/${folder}/${folder}_${wraithState}_${npc.pronoun ?? 'f'}.png`;
    fragment.append(this.buildLayers(path));
    return fragment;
  }

  private buildLayers(base: string, infront?: string): HTMLElement {
    const baseImg = this.createImage(base);
    if (!infront) return baseImg;
    const container = document.createElement('span');
    container.className = 'icon-container';
    container.append(baseImg, this.createImage(infront, 'icon infront'));
    return container;
  }

  private createImage(path: string, className = 'icon'): HTMLImageElement {
    const img = new Image();
    img.className = className;
    img.alt = '';
    const loaded = loadImage(path);
    img.src = typeof loaded === 'string' ? loaded : path;
    if (loaded instanceof Promise) void loaded.then(src => typeof src === 'string' && (img.src = src));
    return img;
  }
}

class MoreLoveInterests {
  public constructor(
    readonly core: typeof maplebirch,
    readonly avatars: NPCAvatars
  ) {
    this.core.once(':sugarcube', () => {
      this.core.tool.macro.defineS('moreLoveInterest', () => this.panel);
      this.core.tool.macro.defineS('moreLoveInterestMessage', () => this.message);
      this.core.dynamic.regStateEvent('gate', 'MoreLoveInterest', {
        output: 'moreLoveInterestMessage',
        action: () => {
          if (this.level >= 4) V.moreLoveInterest_message = true;
          V.loveInterestList = V.loveInterestList.slice(0, Math.max(1, this.level));
        },
        cond: () => {
          if (this.level >= 4 && !V.moreLoveInterest_message) return true;
          return V.loveInterestList?.length > Math.max(1, this.level);
        }
      });
    });
    this.core.once(':variable', () => this.sync());
    this.core.once(':storyready', () => document.querySelector('.love-interests')?.replaceWith(this.panel));
  }

  get level(): number {
    return V.awarelevel ?? 0;
  }

  get message(): string {
    let text = '';
    let color = '';
    if (this.level > 3) {
      text = this.core.t('deadwood-reblooms.loveInterests.attitude.quaternary');
      color = 'lustful';
    } else if (this.level > 2) {
      text = this.core.t('deadwood-reblooms.loveInterests.attitude.tertiary');
      color = 'lewd';
    } else if (this.level > 1) {
      text = this.core.t('deadwood-reblooms.loveInterests.attitude.secondary');
      color = 'pink';
    } else {
      text = this.core.t('deadwood-reblooms.loveInterests.attitude.primary');
      color = 'blue';
    }
    return `<i class='${color}'>${text}</i><br>`;
  }

  public Init(): void {
    const original = window.isLoveInterest;
    window.isLoveInterest = (name: string) => V.loveInterestList?.includes(name) || original(name);
  }

  public remove(name: string): void {
    V.loveInterestList = V.loveInterestList.filter((n: string) => n !== name);
    this.sync();
  }

  get panel(): HTMLElement {
    this.sync();
    const panel = document.createElement('section');
    panel.className = 'love-interests';

    const title = document.createElement('div');
    title.className = 'gold bold love-interests-title';
    title.textContent = this.core.t('deadwood-reblooms.loveInterests.title');
    panel.append(title);

    const candidates = setup.loveInterestNpc.filter((name: string) => window.isPossibleLoveInterest(name));
    panel.append(this.group('deadwood-reblooms.loveInterests.selected', V.loveInterestList, true));
    panel.append(
      this.group(
        'deadwood-reblooms.loveInterests.available',
        candidates.filter((name: string) => !V.loveInterestList.includes(name)),
        false,
        V.loveInterestList.length
      )
    );
    return panel;
  }

  private group(labelKey: string, names: string[], selected: boolean, count = 0): HTMLElement {
    const group = document.createElement('div');
    group.className = 'love-interests-group';

    const label = document.createElement('div');
    label.className = selected ? 'lewd' : 'green';
    label.textContent = `${this.core.t(labelKey)} (${names.length})`;
    group.append(label);

    if (!selected && names.length === 0 && count > 0) {
      const complete = document.createElement('div');
      complete.className = 'love-interests-complete';
      complete.textContent = this.core.t('deadwood-reblooms.loveInterests.allSelected');
      group.append(complete);
      return group;
    }

    const list = document.createElement('div');
    list.className = 'love-interests-list';
    list.dataset.selected = String(selected);

    names.forEach((name, index) => {
      const item = document.createElement('div');
      item.className = `love-interest ${selected ? 'is-selected lewd' : 'green'}`;
      item.dataset.name = name;
      if (selected) item.draggable = true;

      const main = document.createElement('button');
      main.type = 'button';
      main.className = 'love-interest-main';
      const icon = this.avatars.avatar(name);
      if (icon) main.append(icon);
      const text = document.createElement('span');
      text.textContent = this.core.auto(name);
      main.append(text);
      main.addEventListener('click', () => {
        if (selected) V.loveInterestList = V.loveInterestList.filter((n: string) => n !== name);
        else V.loveInterestList.push(name);
        this.sync();
        group.closest('.love-interests')?.replaceWith(this.panel);
      });
      item.append(main);

      if (selected) {
        const controls = document.createElement('div');
        controls.className = 'love-interest-controls';
        for (const [offset, symbol] of [
          [-1, '←'],
          [1, '→']
        ] as const) {
          const move = document.createElement('button');
          move.type = 'button';
          move.textContent = symbol;
          move.disabled = index + offset < 0 || index + offset >= names.length;
          move.addEventListener('click', () => {
            [V.loveInterestList[index], V.loveInterestList[index + offset]] = [V.loveInterestList[index + offset], V.loveInterestList[index]];
            this.sync();
            group.closest('.love-interests')?.replaceWith(this.panel);
          });
          controls.append(move);
        }
        item.append(controls);
      }

      // 拖拽事件
      item.addEventListener('dragstart', e => {
        e.dataTransfer?.setData('text/plain', name);
        item.classList.add('is-dragging');
      });
      item.addEventListener('dragend', () => item.classList.remove('is-dragging'));
      item.addEventListener('dragover', e => selected && e.preventDefault());
      item.addEventListener('drop', e => {
        e.preventDefault();
        const from = V.loveInterestList.indexOf(e.dataTransfer?.getData('text/plain') ?? '');
        const to = V.loveInterestList.indexOf(name);
        if (from < 0 || to < 0 || from === to) return;
        [V.loveInterestList[from], V.loveInterestList[to]] = [V.loveInterestList[to], V.loveInterestList[from]];
        this.sync();
        group.closest('.love-interests')?.replaceWith(this.panel);
      });

      list.append(item);
    });

    group.append(list);
    return group;
  }

  private sync(): void {
    const stored = Array.isArray(V.loveInterestList) ? V.loveInterestList : Object.values(V.loveInterest ?? {});
    V.loveInterestList = [...new Set(stored.filter((name): name is string => typeof name === 'string' && name !== 'None'))];
    V.loveInterest = {
      primary: V.loveInterestList[0] ?? 'None',
      secondary: V.loveInterestList[1] ?? 'None',
      tertiary: V.loveInterestList[2] ?? 'None'
    };
    V.loveInterest_message = 0;
    V.loveInterestAwareMessage = 0;
  }
}

class MoreLoveInterestsAndNPCAvatars {
  public readonly exposed = true;
  private readonly avatars: NPCAvatars;
  private readonly loveInterests: MoreLoveInterests;

  public constructor(readonly core: typeof maplebirch) {
    this.avatars = new NPCAvatars(core);
    this.loveInterests = new MoreLoveInterests(core, this.avatars);
  }

  public icon(name: string, premade: boolean): string {
    return this.avatars.icon(name, premade);
  }

  public remove(name: string): void {
    this.loveInterests.remove(name);
  }

  public Init(): void {
    this.loveInterests.Init();
  }
}

export default MoreLoveInterestsAndNPCAvatars;
