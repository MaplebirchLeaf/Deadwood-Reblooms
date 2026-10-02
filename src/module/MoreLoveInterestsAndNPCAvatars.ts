// ./src/module/MoreLoveInterestsAndNPCAvatars.ts

import NPCAvatars, { type AvatarOverlay, type AvatarProfile, type NPCData } from './MoreLoveInterestsAndNPCAvatars/Avatars';

class MoreLoveInterests {
  public constructor(
    readonly core: typeof maplebirch,
    readonly avatars: NPCAvatars
  ) {}

  public preInit(): void {
    this.core.once(':sugarcube', () => {
      this.core.tool.macro.defineS('moreLoveInterest', () => this.panel);
      this.core.tool.macro.defineS('moreLoveInterestMessage', () => this.message);
      this.core.dynamic.regStateEvent('gate', 'MoreLoveInterest', {
        output: 'moreLoveInterestMessage',
        action: () => {
          if (this.level >= 4) {
            V.moreLoveInterest_message = true;
            return;
          }
          V.loveInterestList = V.loveInterestList.slice(0, Math.max(1, this.level));
        },
        cond: () => V.loveInterestList?.length > Math.max(1, this.level) && (this.level < 4 || !V.moreLoveInterest_message)
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
      text = this.core.t('deadwood-reblooms:loveInterests:attitude:quaternary');
      color = 'lustful';
    } else if (this.level > 2) {
      text = this.core.t('deadwood-reblooms:loveInterests:attitude:tertiary');
      color = 'lewd';
    } else if (this.level > 1) {
      text = this.core.t('deadwood-reblooms:loveInterests:attitude:secondary');
      color = 'pink';
    } else {
      text = this.core.t('deadwood-reblooms:loveInterests:attitude:primary');
      color = 'blue';
    }
    return `<i class='${color}'>${text}</i><br>`;
  }

  public Init(): void {
    const original = window.isLoveInterest;
    // 原版仍只认识前三个槽位，扩展列表必须参与判断，但不能替换原版其它判定。
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
    title.textContent = this.core.t('deadwood-reblooms:loveInterests:title');
    panel.append(title);

    const candidates = setup.loveInterestNpc.filter((name: string) => window.isPossibleLoveInterest(name));
    panel.append(this.group('deadwood-reblooms:loveInterests:selected', V.loveInterestList, true));
    panel.append(
      this.group(
        'deadwood-reblooms:loveInterests:available',
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
      complete.textContent = this.core.t('deadwood-reblooms:loveInterests:allSelected');
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
    // 自定义列表是唯一排序来源，前三项同步给原版三个字段，供原版事件继续读取。
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
  private readonly avatars: NPCAvatars;
  private readonly loveInterests: MoreLoveInterests;

  public constructor(readonly core: typeof maplebirch) {
    this.avatars = new NPCAvatars({
      exists: path => window.modSC2DataManager.getHtmlTagSrcHook().checkImageExist(path),
      load: async path => {
        const image = await loadImage(path);
        return typeof image === 'string' ? image : undefined;
      }
    });
    this.loveInterests = new MoreLoveInterests(core, this.avatars);
  }

  public preInit(): void {
    this.core.once(':sugarcube', () => {
      this.core.tool.macro.defineS('relationshipicon', (name: string) => this.avatars.avatar(name));
      this.core.tool.macro.defineS('mimicicon', () => this.avatars.mimic());
    });
    this.loveInterests.preInit();
  }

  public icon(name: string, premade: boolean): string {
    if (premade) return `poster_${name}`;
    const normalized = String(name ?? '')
      .trim()
      .toLowerCase();
    if (normalized.includes('vrel') && normalized.includes('puri')) return 'poster_purivrel';
    const aliases: Record<string, readonly string[]> = {
      vrel: ['vrel', 'vrelnir'],
      puri: ['puri', 'purityguy'],
      nona: ['nona', '诺娜'],
      fayne: ['fayne', '费恩'],
      seabird: ['seabird', '海鸟']
    };
    for (const [icon, names] of Object.entries(aliases)) if (names.includes(normalized)) return `poster_${icon}`;
    if (['象牙怨灵', 'ivory wraith'].some(alias => normalized.includes(alias))) return this.core.get('DeadwoodReblooms')!.rng > 96 ? 'poster_iwlife' : `poster_iw${V.wraith.state}`;
    return ['dol', 'degrees of lewdity'].some(alias => normalized.includes(alias)) ? 'poster_dol' : 'poster';
  }

  public add(name: string, profile: AvatarProfile): void {
    this.avatars.add(name, profile);
  }

  public overlay(name: string, resolve: (npc: NPCData, source: string) => AvatarOverlay | undefined): void {
    this.avatars.overlay(name, resolve);
  }

  public remove(name: string): void {
    this.loveInterests.remove(name);
  }

  public Init(): void {
    this.loveInterests.Init();
  }
}

export default MoreLoveInterestsAndNPCAvatars;

declare module '@scml-dol-maplebirch/types' {
  interface Extensions {
    readonly MoreLoveInterestsAndNPCAvatars: MoreLoveInterestsAndNPCAvatars;
  }
}
