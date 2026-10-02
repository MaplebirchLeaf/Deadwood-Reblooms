// ./src/module/MoreLoveInterestsAndNPCAvatars/Avatars.ts

import avatarProfiles from './Profiles';

export interface NPCData {
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
  skincolour?: string;
  clothes?: {
    upper?: { name?: string };
    lower?: { name?: string };
  };
}

export interface AvatarStates {
  default: string;
  loved?: string;
  disliked?: string;
  dominant?: string;
  submissive?: string;
  lustful?: string;
}

export interface AvatarLayers {
  readonly base: string;
  readonly infront?: string;
  readonly fallback?: string;
  readonly infrontFallback?: string;
}

export interface AvatarOverlay {
  readonly src: string;
  readonly replace?: boolean;
}

export interface AvatarProfile {
  readonly folder?: string;
  readonly prefix?: string;
  readonly gendered?: boolean;
  readonly states?: Partial<AvatarStates>;
  readonly layers?: (npc: NPCData) => AvatarLayers;
  readonly mimic?: (npc: NPCData, state: 'iwr' | 'iwb') => AvatarLayers;
  readonly stateResolver?: (npc: NPCData) => string;
  readonly mimicFolder?: string;
}

export interface AvatarOptions {
  readonly basePath?: string;
  readonly defaults?: boolean;
  readonly loved?: number;
  readonly lustful?: number;
  readonly load?: (path: string) => Promise<string | undefined>;
  readonly exists?: (path: string) => boolean | undefined;
}

class NPCAvatars {
  private readonly custom = new Map<string, AvatarProfile>();
  private readonly overlays = new Map<string, (npc: NPCData, source: string) => AvatarOverlay | undefined>();
  private static readonly avatarBasePath = 'img/misc/icon/social';
  static readonly avatarProfiles = avatarProfiles;

  public constructor(private readonly options: AvatarOptions = {}) {}

  private profile(name: string): AvatarProfile | undefined {
    const profile = this.custom.get(name) ?? (this.options.defaults === false ? undefined : NPCAvatars.avatarProfiles[name]);
    return profile && { ...profile, folder: profile.folder ?? name.toLowerCase().replaceAll(' ', '-') };
  }

  public avatar(name = String(T.npc ?? '')): HTMLElement | undefined {
    const npc = V.NPCName.find((entry: NPCData) => entry.nam === name) as NPCData | undefined;
    if (!npc) return undefined;
    const profile = this.profile(npc.nam);
    if (!profile) return undefined;
    const layers = this.layers(npc, profile);
    return this.buildLayers(layers, this.overlays.get(name)?.(npc, layers.base));
  }

  public add(name: string, profile: AvatarProfile): void {
    this.custom.set(name, profile);
  }

  public overlay(name: string, resolve: (npc: NPCData, source: string) => AvatarOverlay | undefined): void {
    this.overlays.set(name, resolve);
  }

  /** 移除扩展配置，恢复内置头像。 */
  public remove(name: string): void {
    this.custom.delete(name);
    this.overlays.delete(name);
  }

  private layers(npc: NPCData, profile: AvatarProfile): AvatarLayers {
    // 少数角色按发色、装束或形态选择图层，其他角色按关系状态选单张表情图。
    const customLayers = profile.layers?.(npc);
    if (customLayers) {
      return {
        base: this.asset(customLayers.base),
        infront: customLayers.infront ? this.asset(customLayers.infront) : undefined,
        fallback: customLayers.fallback ? this.asset(customLayers.fallback) : undefined,
        infrontFallback: customLayers.infrontFallback ? this.asset(customLayers.infrontFallback) : undefined
      };
    }

    return {
      base: this.path(npc, profile, this.state(npc, profile)),
      fallback: this.path(npc, profile, profile.states?.default)
    };
  }

  private state(npc: NPCData, profile: AvatarProfile): string | undefined {
    if (profile.stateResolver) return profile.stateResolver(npc);
    const states: AvatarStates = profile.states
      ? { default: 'default', ...profile.states }
      : { default: 'default', lustful: 'lustful', dominant: 'dominant', loved: 'loved', submissive: 'submissive', disliked: 'disliked' };
    const available = (state?: string): boolean => !!state && this.options.exists?.(this.path(npc, profile, state)) !== false;
    const love = npc.love ?? 0;
    const lust = npc.lust ?? 0;
    const dom = npc.dom ?? 0;
    if (lust >= (this.options.lustful ?? 60) && available(states.lustful)) return states.lustful;
    if (dom >= Number(V.npcdomhigh ?? 50) && available(states.dominant)) return states.dominant;
    if (love >= (this.options.loved ?? 50) && available(states.loved)) return states.loved;
    if (dom <= Number(V.npcdomlow ?? -50) && available(states.submissive)) return states.submissive;
    if (love <= Number(V.npclovelow ?? 0) && available(states.disliked)) return states.disliked;
    return states.default;
  }

  private path(npc: NPCData, profile: AvatarProfile, state: string | undefined): string {
    const gender = profile.gendered === false ? '' : npc.pronoun === 'm' ? 'm' : 'f';
    const file = [profile.prefix, state || 'default', gender].filter(Boolean).join('_');
    return `${this.options.basePath ?? NPCAvatars.avatarBasePath}/${profile.folder}/${file}.png`;
  }

  private asset(path: string): string {
    const root = `${NPCAvatars.avatarBasePath}/`;
    return this.options.basePath && path.startsWith(root) ? `${this.options.basePath}/${path.slice(root.length)}` : path;
  }

  public mimic(): DocumentFragment | undefined {
    const name = String(V.wraith?.mimic ?? '');
    if (!name) return undefined;
    const npc = V.NPCName.find((entry: NPCData) => entry.nam === name) as NPCData | undefined;
    if (!npc) return undefined;

    const fragment = document.createDocumentFragment();
    const wraithState = V.wraith.state === 'haunt' ? 'iwr' : 'iwb';
    const profile = this.profile(name);
    if (!profile) return undefined;

    const customMimic = profile.mimic?.(npc, wraithState);
    if (customMimic) {
      fragment.append(
        this.buildLayers({
          base: this.asset(customMimic.base),
          infront: customMimic.infront ? this.asset(customMimic.infront) : undefined,
          fallback: customMimic.fallback ? this.asset(customMimic.fallback) : undefined,
          infrontFallback: customMimic.infrontFallback ? this.asset(customMimic.infrontFallback) : undefined
        })
      );
      return fragment;
    }

    const folder = profile.mimicFolder;
    if (!folder) return undefined;
    const path = `${this.options.basePath ?? NPCAvatars.avatarBasePath}/${folder}/${wraithState}_${npc.pronoun === 'm' ? 'm' : 'f'}.png`;
    fragment.append(this.buildLayers({ base: path }));
    return fragment;
  }

  private buildLayers({ base, infront, fallback, infrontFallback }: AvatarLayers, overlay?: AvatarOverlay): HTMLElement {
    if (overlay?.replace) return this.createImage(overlay.src, 'icon', base);
    const baseImg = this.createImage(base, 'icon', fallback);
    if (!infront && !overlay) return baseImg;
    const container = document.createElement('span');
    container.className = 'icon-container';
    container.append(baseImg);
    if (infront) {
      const foreground = this.createImage(infront, 'icon infront', infrontFallback);
      container.append(foreground);
    }
    if (overlay) container.append(this.createImage(overlay.src, 'icon infront'));
    return container;
  }

  private createImage(path: string, className = 'icon', fallback?: string): HTMLImageElement {
    const img = new Image();
    img.className = className;
    img.alt = '';
    const loader = this.options.load;
    if (!loader) {
      if (fallback && fallback !== path)
        img.addEventListener(
          'error',
          () => {
            img.src = fallback;
          },
          { once: true }
        );
      img.src = path;
      return img;
    }
    const load = async (): Promise<void> => {
      for (const source of fallback && fallback !== path ? [path, fallback] : [path]) {
        try {
          const loaded = await loader(source);
          if (typeof loaded === 'string') {
            img.src = loaded;
            return;
          }
        } catch {}
      }
      img.hidden = true;
      console.warn('头像图片无法加载：', path);
    };
    void load();
    return img;
  }
}

export default NPCAvatars;
