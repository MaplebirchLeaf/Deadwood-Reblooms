// ./src/module/LongerCombat.ts

import type { MacroDefinition } from 'twine-sugarcube';

type FluidPart = Parameters<typeof maplebirch.npc.fluids.add>[1];
type FluidType = NonNullable<Parameters<typeof maplebirch.npc.fluids.add>[3]>;
type DialogueHistory = Partial<Record<'m' | 'f', { line: string; namedLine: string }>>;

class LongerCombat {
  static readonly TEXT_KEY = 'deadwood-reblooms.LongerCombat';
  static readonly NPC_KEY = `${LongerCombat.TEXT_KEY}.npc`;
  static readonly STATE_PARTS = ['lefthand', 'righthand', 'mouth', 'penis', 'vagina'] as const;
  private readonly lastLines = new Map<number, { name: string; lines: DialogueHistory }>();

  static readonly SPLASH_PARTS: Partial<Record<FluidPart, readonly FluidPart[]>> = {
    vagina: ['thigh'],
    anus: ['thigh'],
    mouth: ['face'],
    face: ['neck', 'chest'],
    tummy: ['thigh']
  };
  static readonly options = {
    seconds: 10,
    unlimited: false,
    max: 3,
    rounds: 0,
    again: 50,
    end: null as boolean | null
  };

  public constructor(readonly core: typeof maplebirch) {}

  get options() {
    return V.options.maplebirch.LongerCombat;
  }

  private npcHis(pronouns: { his: string }): string {
    return maplebirch.Language === 'CN' && !pronouns.his.endsWith('的') ? pronouns.his + '的' : pronouns.his;
  }

  private npcState(npc: { [x: string]: any }): string {
    let Text = '';
    for (const part of LongerCombat.STATE_PARTS) {
      const state = npc[part];
      if (!state) continue;
      const key = `${LongerCombat.NPC_KEY}.${part}.${state}`;
      const line = maplebirch.t(key);
      if (line && line !== `[${key}]`) Text += line;
    }
    return Text;
  }

  private get stage(): 'early' | 'middle' | 'late' {
    const round = Math.max(1, Number(this.options.rounds || 0) + 1);
    const max = this.options.unlimited ? 10 : Math.max(1, Number(this.options.max) || 1);
    const early = Math.max(1, Math.floor(max / 3));
    const middle = Math.max(early + 1, Math.floor((max * 2) / 3));
    return round <= early ? 'early' : round <= middle ? 'middle' : 'late';
  }

  private npcLine(prefix: string, previous?: string): string {
    const lines: string[] = [];
    for (let i = 0; this.core.lang.has(`${prefix}.${i}`); i++) {
      const key = `${prefix}.${i}`;
      const line = maplebirch.t(key);
      if (line && line !== `[${key}]`) lines.push(line);
    }
    if (lines.length === 0) return '';
    const choices = lines.filter(line => line !== previous);
    return this.core.utils.either(choices.length ? choices : lines) ?? lines[0];
  }

  private npcAgain(npc: { [x: string]: any; pronouns?: { his: string; he: string } }, index: number): string {
    if (!npc.pronouns || (typeof npc.age === 'number' && npc.age < 18)) return '';
    const gender = npc.gender;
    if (gender !== 'm' && gender !== 'f' && gender !== 'h') return '';
    // 原版在每次生成战斗槽时决定实际形态，不能仅凭全局拟人化设置让动物开口。
    const name = typeof npc.fullDescription === 'string' ? npc.fullDescription : '';
    if (name === 'Great Hawk' && npc.type !== 'harpy') return '';
    if (name === 'Black Wolf' && !['wolfboy', 'wolfgirl'].includes(npc.type)) return '';
    const type = V.consensual === 1 ? 'consensual' : 'forced';
    const group = npc.adult === 1 ? 'adult' : 'collegestudent';
    const stage = this.stage;
    const history = this.lastLines.get(index);
    const lines: DialogueHistory = history?.name === name ? { ...history.lines } : {};
    const state = this.npcState(npc);
    const description = state ? this.npcHis(npc.pronouns) + state : '';
    const character = name === 'Sydney' ? `Sydney.${(C.npc?.Sydney?.corruption ?? 0) >= 10 ? 'corrupt' : 'pure'}` : name;
    const space = maplebirch.Language === 'CN' ? '' : ' ';
    const genders: readonly ('m' | 'f')[] = gender === 'h' ? ['m', 'f'] : [gender];
    const speech: string[] = [];
    for (const value of genders) {
      const previous = lines[value];
      const line = this.npcLine(`${LongerCombat.NPC_KEY}.${value}.${type}.${group}.${stage}`, previous?.line);
      if (!line) continue;
      const prefix = `${LongerCombat.NPC_KEY}.named.${character}.${value}.${type}.${stage}`;
      const namedLine = this.core.lang.has(`${prefix}.0`) && Math.random() < 0.6 ? this.npcLine(prefix, previous?.namedLine) : '';
      lines[value] = { line, namedLine: namedLine || previous?.namedLine || '' };
      speech.push('"' + (namedLine ? namedLine + space + line : line) + '"');
    }
    if (speech.length === 0) return description;
    this.lastLines.set(index, { name, lines });
    if (speech.length === 1) return description + speech[0] + space + npc.pronouns.he + space + maplebirch.t(`${LongerCombat.NPC_KEY}.says`).trim();
    const pause = this.npcLine(`${LongerCombat.NPC_KEY}.pause`);
    return description + speech[0] + space + npc.pronouns.he + space + pause + space + speech[1];
  }

  public ejaculation(sWikifier: (Text: string) => void): void {
    // 原版宏已逐人处理声望、避孕套、受孕与玩家体液；整组只结算一次。
    sWikifier('<<ejaculation>>');

    let continued = false;
    maplebirch.lodash.times(V.enemynomax, (i: number) => {
      const npc = V.NPCList[i];
      if (!npc || npc.active !== 'active' || npc.stance === 'defeated') return;
      const Text = this.npcAgain(npc, i);
      if (!Text) return;
      if (continued) {
        const cn = maplebirch.Language === 'CN';
        const name = (cn ? npc.fullDescription_CN : npc.fullDescription) || npc.fullDescription || npc.pronouns?.he || '';
        // 先输出完整的 NPC 段落，再转向下一位；命名角色显示姓名，避免多人代词混淆。
        const transition = this.npcLine(`${LongerCombat.NPC_KEY}.transition`).replace('{name}', () => name);
        sWikifier((cn ? '' : ' ') + transition);
      }
      sWikifier(Text);
      continued = true;
    });
  }

  private addFluids(targets: Array<[string, FluidPart]>, type: FluidType): void {
    for (const [name, landing] of targets) {
      for (const part of new Set([landing, ...(LongerCombat.SPLASH_PARTS[landing] ?? [])])) {
        this.core.npc.fluids.add(name, part, 1, type);
      }
    }
  }

  public orgasm(action: () => void): void {
    const targets: Array<[string, FluidPart]> = [];
    const wetTargets: Array<[string, FluidPart]> = [];
    const condom = wearingCondom('player') ? V.player?.condom?.state : undefined;
    const parasite = V.parasite?.penis?.name;
    // 对照原版 orgasm 的实际射精分支，不把干高潮、正常避孕套或寄生虫的体液加到 NPC。
    if (
      V.combat === 1 &&
      V.player?.penisExist &&
      V.semen_volume > 0 &&
      V.semen_amount >= 0.1 &&
      !playerHasStrapon() &&
      condom !== 'normal' &&
      condom !== 'used' &&
      (!parasite || parasite === 'parasite') &&
      V.worn?.genitals?.name !== 'chastity parasite'
    ) {
      // npc 与 npcrow 是原版命名 NPC/战斗槽的对应表；不为随机遭遇者创建持久化数据。
      for (const [position, index] of (V.npcrow ?? []).entries()) {
        const name = V.npc?.[position];
        const npc = V.NPCList?.[index];
        if (typeof name !== 'string' || !npc) continue;
        let part: FluidPart | undefined;
        switch (V.penisuse) {
          case 'othervagina':
            if (index === V.penistarget && npc.vagina === 'penis') part = 'vagina';
            break;
          case 'otheranus':
            if (npc.penis === 'otheranus' || npc.vagina === 'otheranus') part = 'anus';
            break;
          case 'othermouth':
            if (npc.mouth === 'penis') part = 'mouth';
            else if (npc.mouth === 'penisentrance' || npc.mouth === 'penisimminent') part = 'face';
            break;
          case 'otherpenis':
            if (npc.penis === 'penis') part = 'penis';
            else if (npc.penis === 'penisentrance' || npc.penis === 'penisimminent') {
              part = 'penis';
              targets.push([name, 'tummy']);
            }
            break;
        }
        // 外阴与臀部的接触尚未接入此落点表，不硬套到内部阴道或肛门。
        if (part) targets.push([name, part]);
      }
    }

    if (V.combat === 1 && V.player?.vaginaExist && V.vaginause === 'othermouth') {
      for (const [position, index] of (V.npcrow ?? []).entries()) {
        const name = V.npc?.[position];
        const npc = V.NPCList?.[index];
        if (typeof name !== 'string' || !npc) continue;
        if (npc.mouth === 'vagina') wetTargets.push([name, 'mouth']);
        else if (npc.mouth === 'vaginaentrance' || npc.mouth === 'vaginaimminent') wetTargets.push([name, 'face']);
      }
    }

    // 先捕获落点，再完整运行原版宏；高潮效果可能改变接触状态或变为干/被打断的高潮。
    action();
    if (T.deniedOrgasm) return;
    if (!V.femaleclimax) this.addFluids(targets, 'semen');
    // 爱液由原版 vaginaFluidOrgasm 的本次释放量决定，不与精液或干射精状态混为一谈。
    if (T.lube_released > 0) this.addFluids(wetTargets, 'goo');
  }

  public npcOrgasm(action: () => void): void {
    const targets: Array<[string, FluidPart]> = [];
    const wetTargets: Array<[string, FluidPart]> = [];
    if (V.combat === 1) {
      for (const [position, index] of (V.npcrow ?? []).entries()) {
        const name = V.npc?.[position];
        const npc = V.NPCList?.[index];
        if (typeof name !== 'string' || !npc || index >= V.enemynomax || npc.active !== 'active' || npc.stance === 'defeated') continue;
        if (npc.penis === 'none' && npc.vagina !== undefined && npc.vagina !== 'none') wetTargets.push([name, 'vagina']);
        else if (npc.penis !== undefined && npc.penis !== 'none' && !wearingCondom(index)) targets.push([name, 'penis']);
      }
    }
    action();
    this.addFluids(targets, 'semen');
    this.addFluids(wetTargets, 'goo');
  }

  get shouldEndCombat(): boolean {
    const options = this.options;
    if (options.unlimited) return false;
    if (typeof options.end === 'boolean') return options.end;
    const chance = Math.clamp(options.again, 0, 100);
    options.end = Number(options.rounds || 0) + 1 >= Math.max(1, Number(options.max) || 1) || Math.random() * 100 >= chance;
    return options.end;
  }

  get passageTitle(): string {
    const current = maplebirch.passage.title;
    const found = maplebirch.lodash.findLast(maplebirch.SugarCube.State.history, function (entry: { title?: string }) {
      const title = entry?.title;
      return title && title !== current && !title.endsWith(' Finish');
    });
    const title = found?.title || current;
    return title.endsWith(' Finish') ? title.slice(0, -' Finish'.length) : title;
  }

  public main(): DocumentFragment {
    const fragment = document.createDocumentFragment();
    const sWikifier = function (Text: string) {
      fragment.append(Wikifier.wikifyEval(Text));
    };

    if (V.enemyarousal < V.enemyarousalmax) return fragment;

    const options = this.options;
    if (Number(options.rounds || 0) === 0) this.lastLines.clear();

    if (this.shouldEndCombat) {
      T.combatend = true;
      options.rounds = 0;
      options.end = null;
      this.lastLines.clear();
      return fragment;
    }

    this.ejaculation(sWikifier);

    const current = this.options;
    current.rounds = Number(current.rounds || 0) + 1;
    current.end = null;
    V.enemyarousal = Math.floor(V.enemyarousalmax * (0.15 + Math.random() * 0.1));

    sWikifier(`<br><br><<lanLink 'deadwood-reblooms.LongerCombat.next' ${JSON.stringify(this.passageTitle)} 'capitalize'>><<set _combatend to false>><</lanLink>>`);

    return fragment;
  }

  public preInit() {
    this.core.var.options.define('LongerCombat', LongerCombat.options);
    const main = this.main.bind(this);

    this.core.once(
      ':sugarcube',
      () => {
        maplebirch.tool.macro.define('LongerCombat', function (this: any) {
          const fragment = main();
          this.output.append(fragment);
        });

        maplebirch.dynamic.regStateEvent('gate', 'LongerCombat', {
          output: 'LongerCombat',
          cond: () => V.combat === 1 && !V.stalk,
          forceExit: () => V.enemyarousal >= V.enemyarousalmax && !this.shouldEndCombat
        });

        maplebirch.dynamic.regTimeEvent('onBefore', 'LongerCombat', {
          cond: () => V.combat === 1 && !V.stalk,
          action: data => (data.passed = this.options.seconds)
        });
      },
      'LongerCombat'
    );

    this.core.once(
      ':storyready',
      () => {
        const macros = this.core.SugarCube.Macro;
        for (const [name, action] of [
          ['orgasm', this.orgasm.bind(this)],
          ['ejaculation', this.npcOrgasm.bind(this)]
        ] as const) {
          const macro = macros.get(name) as MacroDefinition | undefined;
          if (!macro) continue;
          macros.delete(name);
          macros.add(name, {
            ...macro,
            handler(this: any) {
              action(() => macro.handler.call(this));
            }
          });
        }
      },
      'LongerCombat NPC Fluids'
    );
  }
}

export default LongerCombat;
