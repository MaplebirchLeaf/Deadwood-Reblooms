// ./src/module/LongerCombat.ts

type FluidPart = Parameters<typeof maplebirch.npc.fluids.add>[1];
type FluidType = NonNullable<Parameters<typeof maplebirch.npc.fluids.add>[3]>;
type DialogueHistory = Record<string, { line: string; namedLine: string }>;

class LongerCombat {
  static readonly TEXT_KEY = 'deadwood-reblooms:LongerCombat';
  static readonly NPC_KEY = `${LongerCombat.TEXT_KEY}:npc`;
  static readonly STATE_PARTS = ['lefthand', 'righthand', 'mouth', 'penis', 'vagina'] as const;
  public climaxStat: 'enemyarousal' | 'enemypleasure' = 'enemyarousal';
  private continuation?: { moment: typeof maplebirch.SugarCube.State.current; variables: typeof V; nodes: ChildNode[] };
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

  private get climaxMacro(): { name: 'ejaculation' | 'beastejaculation'; short: boolean } | undefined {
    const title = maplebirch.passage.title;
    const finish = title.endsWith(' Finish') ? title : `${title} Finish`;
    const story = maplebirch.SugarCube.Story;
    if (!story.has(finish)) return undefined;
    const macro = V.enemytype === 'beast' ? 'beastejaculation' : 'ejaculation';
    // short 只缩短原版结算文本，knot 等改变流程的参数仍交给剧情处理。
    const text = story.get(finish).text;
    if (text.includes(`<<${macro}>>`)) return { name: macro, short: false };
    if (text.includes(`<<${macro} "short">>`) || text.includes(`<<${macro} 'short'>>`)) return { name: macro, short: true };
    return undefined;
  }

  private get canExtendCombat(): boolean {
    const train = V.combatTrain;
    return (
      V.combat === 1 &&
      !V.statFreeze &&
      !V.frozenValues &&
      !V.replayScene &&
      !V.possessed &&
      !V.nextPassage &&
      !V.nextPassageCheck &&
      !V.stalk &&
      V.finish !== 1 &&
      !(V.alarm === 1 && V.rescue >= 1) &&
      !(Number(train?.length) > 0 || Number(train?.total_length) > 0) &&
      !!this.climaxMacro &&
      !!this.passageTitle
    );
  }

  private get continuing(): boolean {
    const previous = this.continuation;
    return !!previous && previous.moment === this.core.SugarCube.State.current && previous.variables === V;
  }

  private reset(): void {
    this.options.rounds = 0;
    this.options.end = null;
    this.lastLines.clear();
    this.continuation = undefined;
  }

  private beastClimax(sWikifier: (text: string) => void, short: boolean): void {
    const index = V.active_enemy;
    const health = V.enemyhealth;
    const anger = V.enemyanger;
    const trust = V.enemytrust;
    sWikifier(short ? '<<beastejaculation "short">>' : '<<beastejaculation>>');
    V.active_enemy = index;
    V.enemyhealth = health;
    V.enemyanger = anger;
    V.enemytrust = trust;
  }

  private npcHis(pronouns: { his: string }): string {
    const suffix = lanSwitch('', '的');
    return suffix && !pronouns.his.endsWith(suffix) ? pronouns.his + suffix : pronouns.his;
  }

  private npcState(npc: { [x: string]: any }): string {
    let Text = '';
    for (const part of LongerCombat.STATE_PARTS) {
      const state = npc[part];
      if (!state) continue;
      const key = `${LongerCombat.NPC_KEY}:${part}:${state}`;
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
    // 台词键以连续数字结尾，遇到缺号即停止，同一 NPC 上一句尽量不重复。
    const lines: string[] = [];
    for (let i = 0; this.core.services.translator.has(`${prefix}:${i}`); i++) {
      const key = `${prefix}:${i}`;
      const line = maplebirch.t(key);
      if (line && line !== `[${key}]`) lines.push(line);
    }
    if (lines.length === 0) return '';
    const choices = lines.filter(line => line !== previous);
    return this.core.utils.either(choices.length ? choices : lines) ?? lines[0];
  }

  private npcPairs(npc: { [x: string]: any }): string[] {
    const pairs: string[] = [];
    const add = (pair: string): void => {
      if (!pairs.includes(pair)) pairs.push(pair);
    };
    for (const field of ['penis', 'vagina'] as const) {
      const state = typeof npc[field] === 'string' ? npc[field] : '';
      if (!state) continue;
      // 入口、试探与外部摩擦仍由原版描述，不从身体结构推测已经发生的动作。
      if (state === 'otheranus') add('anus:penis');
      else if (['anus', 'anusdouble'].includes(state)) add('penis:anus');
      else if (state === 'penis') add(field === 'penis' ? 'penis:penis' : 'vagina:penis');
      else if (['vagina', 'vaginadouble'].includes(state)) add(field === 'penis' ? 'penis:vagina' : 'vagina:vagina');
    }
    return pairs.slice(0, 2);
  }

  private static pairOrgan(pair: string, npc: { [x: string]: any }): 'penis' | 'vagina' {
    const organ = pair.split(':')[0];
    if (organ === 'penis' || organ === 'vagina') return organ;
    return npc.penis !== undefined && npc.penis !== 'none' ? 'penis' : 'vagina';
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
    if (Number(V.underwater) > 0 || V.combat_silenced) return description;
    const character = name === 'Sydney' ? `Sydney:${(C.npc?.Sydney?.corruption ?? 0) >= 10 ? 'corrupt' : 'pure'}` : name;
    const space = lanSwitch(' ', '');
    const speech: string[] = [];
    for (const pair of this.npcPairs(npc)) {
      const previous = lines[pair];
      const line = this.npcLine(`${LongerCombat.NPC_KEY}:${pair}:${type}:${group}:${stage}`, previous?.line);
      if (!line) continue;
      const organ = LongerCombat.pairOrgan(pair, npc);
      const prefix = `${LongerCombat.NPC_KEY}:named:${character}:${organ}:${type}:${stage}`;
      const namedLine = this.npcLine(prefix, previous?.namedLine);
      lines[pair] = { line, namedLine: namedLine || previous?.namedLine || '' };
      // 角色台词独立成句，缺失时才回退通用台词，避免同一句中口吻与意愿相互矛盾。
      speech.push('"' + (namedLine || line) + '"');
    }
    if (speech.length === 0) return description;
    this.lastLines.set(index, { name, lines });
    if (speech.length === 1) return description + speech[0] + space + npc.pronouns.he + space + maplebirch.t(`${LongerCombat.NPC_KEY}:says`).trim();
    const pause = this.npcLine(`${LongerCombat.NPC_KEY}:pause`);
    return description + speech[0] + space + npc.pronouns.he + space + pause + space + speech[1];
  }

  public ejaculation(sWikifier: (Text: string) => void, short = false): void {
    // 原版宏已逐人处理声望、避孕套、受孕与玩家体液，整组只结算一次。
    sWikifier(short ? '<<ejaculation "short">>' : '<<ejaculation>>');

    let continued = false;
    maplebirch.lodash.times(V.enemynomax, (i: number) => {
      const npc = V.NPCList[i];
      if (!npc || npc.active !== 'active' || npc.stance === 'defeated') return;
      const Text = this.npcAgain(npc, i);
      if (!Text) return;
      if (continued) {
        const name = lanSwitch(npc.fullDescription, npc.fullDescription_CN) || npc.fullDescription || npc.pronouns?.he || '';
        // 先输出完整的 NPC 段落，再转向下一位，命名角色显示姓名，避免多人代词混淆。
        const transition = this.npcLine(`${LongerCombat.NPC_KEY}:transition`).replace('{name}', () => name);
        sWikifier(lanSwitch(' ', '') + transition);
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
      // npc 与 npcrow 是原版命名 NPC/战斗槽的对应表，不为随机遭遇者创建持久化数据。
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

    // 先捕获落点，再完整运行原版宏，高潮效果可能改变接触状态或变为干/被打断的高潮。
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

  // 原版会给每个未输出高潮文本的 NPC 仍追加两次换行，多人战时移除这些前导空行，并限制连续换行。
  private tidyEjaculation(output: ParentNode): void {
    let hasContent = false;
    let breaks = 0;
    for (const node of Array.from(output.childNodes)) {
      if (node instanceof HTMLBRElement) {
        if (!hasContent || breaks >= 2) node.remove();
        else breaks++;
        continue;
      }
      if (node.nodeType === Node.TEXT_NODE && !node.textContent?.trim()) continue;
      if (node.textContent?.trim() || node instanceof HTMLElement) {
        hasContent = true;
        breaks = 0;
      }
    }
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
    const story = maplebirch.SugarCube.Story;
    if (!current.endsWith(' Finish')) return story.has(current) && story.get(current).text.includes('<<actionsman>>') ? current : '';
    const source = maplebirch.SugarCube.State.peek(1)?.title;
    if (!source || !story.has(source)) return '';
    const text = story.get(source).text;
    return text.includes('<<actionsman>>') && text.includes(current) ? source : '';
  }

  public main(): DocumentFragment {
    const fragment = document.createDocumentFragment();
    const sWikifier = function (Text: string) {
      fragment.append(maplebirch.SugarCube.Wikifier.wikifyEval(Text));
    };

    const source = this.passageTitle;
    const climax = this.climaxMacro;
    if (!this.canExtendCombat || !source || !climax || V.enemyhealth <= 0) return fragment;

    const moment = this.core.SugarCube.State.current;
    const previous = this.continuation;
    if (this.continuing && previous) {
      fragment.append(...previous.nodes);
    } else {
      if (!this.core.combat.climax) return fragment;
      const options = this.options;
      if (Number(options.rounds || 0) === 0) this.lastLines.clear();

      if (this.shouldEndCombat) {
        T.combatend = true;
        this.reset();
        return fragment;
      }

      if (climax.name === 'beastejaculation') this.beastClimax(sWikifier, climax.short);
      else this.ejaculation(sWikifier, climax.short);

      const current = this.options;
      current.rounds = Number(current.rounds || 0) + 1;
      current.end = null;
      const stat = this.climaxStat;
      V[stat] = Math.floor(V[`${stat}max`] * (0.15 + Math.random() * 0.1));
      if (V.enemytype === 'beast') V[`${stat}${V.active_enemy + 1}`] = V[stat];
      T.combatend = false;
      this.continuation = { moment, variables: V, nodes: Array.from(fragment.childNodes) };
    }

    sWikifier(`<br><br><<lanLink ['Continue', '继续'] ${JSON.stringify(source)} 'capitalize'>><</lanLink>>`);

    return fragment;
  }

  public preInit() {
    this.core.var.options.define('LongerCombat', LongerCombat.options);
    this.core.on(
      ':variable',
      () => {
        this.lastLines.clear();
        this.continuation = undefined;
      },
      'Longer Combat'
    );
    const main = this.main.bind(this);

    this.core.tool.macro.define('LongerCombat', function (this: any) {
      const fragment = main();
      this.output.append(fragment);
    });

    this.core.dynamic.regStateEvent('gate', 'LongerCombat', {
      output: 'LongerCombat',
      priority: 100,
      cond: () => this.canExtendCombat && maplebirch.passage.title.endsWith(' Finish') && V.enemyhealth > 0 && (this.core.combat.climax || this.continuing),
      forceExit: () => this.continuing || (this.core.combat.climax && !this.shouldEndCombat)
    });

    this.core.dynamic.regTimeEvent('onBefore', 'LongerCombat', {
      priority: 100,
      cond: data => (data.passed ?? 0) > 0 && this.canExtendCombat && !maplebirch.passage.title.endsWith(' Finish'),
      action: data => {
        const seconds = Number(this.options.seconds);
        if (Number.isInteger(seconds) && seconds > 0) data.passed = seconds;
      }
    });

    const tidyEjaculation = this.tidyEjaculation.bind(this);
    const reset = (action: () => void): void => {
      action();
      this.reset();
    };
    for (const [name, action] of [
      ['combatinit', reset],
      ['endcombat', reset],
      ['orgasm', this.orgasm.bind(this)],
      ['ejaculation', this.npcOrgasm.bind(this)]
    ] as const) {
      this.core.tool.macro.wrap(name, function (next) {
        action(next);
        if (name === 'ejaculation') tidyEjaculation(this.output);
      });
    }
  }
}

declare module '@scml-dol-maplebirch/types' {
  interface Extensions {
    readonly LongerCombat: LongerCombat;
  }
}

export default LongerCombat;
