// ./src/module/LongerCombat.ts

class LongerCombat {
  static readonly TEXT_KEY = 'deadwood-reblooms.LongerCombat';
  static readonly NPC_KEY = `${LongerCombat.TEXT_KEY}.npc`;
  static readonly STATE_PARTS = ['lefthand', 'righthand', 'mouth', 'penis', 'vagina'] as const;
  static readonly LINE_COUNT = 10;
  static readonly options = {
    seconds: 10,
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

  private npcAgain(npc: { [x: string]: any; teen?: any; pronouns?: { his: string; he: string }; gender?: string }): string {
    if (!npc.pronouns) return '';
    const type = V.consensual === 1 ? 'consensual' : 'forced';
    const group = npc.teen ? 'teen' : 'adult';
    const gender = npc.gender === 'm' ? 'm' : 'f';
    const lines: string[] = [];
    for (let i = 0; i < LongerCombat.LINE_COUNT; i++) {
      const key = `${LongerCombat.NPC_KEY}.${type}.${group}.${gender}.${i}`;
      const line = maplebirch.t(key);
      if (line && line !== `[${key}]`) lines.push(line);
    }
    const state = this.npcState(npc);
    if (lines.length === 0) return this.npcHis(npc.pronouns) + state;
    const line = lines.either();
    return this.npcHis(npc.pronouns) + state + '"' + line + '"' + npc.pronouns.he + maplebirch.t(`${LongerCombat.NPC_KEY}.says`);
  }

  public ejaculation(sWikifier: (Text: string) => void): void {
    const fameMacro = V.consensual === 1 ? '<<famesex 1>>' : '<<famerape 1>>';

    maplebirch.lodash.times(V.enemynomax, (i: number) => {
      const npc = V.NPCList[i];
      if (!npc || npc.stance === 'defeated') return;

      T.nn = i;

      sWikifier(fameMacro);
      sWikifier(`<<personselect '${i}'>>`);

      if (!wearingCondom(i) || !npc.condom) {
        T.condomResult = 'none';
      } else if (npc.condom.state === 'defective') {
        T.condomResult = 'leaked';
      } else if (npc.condom.state === 'sabotaged') {
        T.condomResult = 'burst';
      } else {
        T.condomResult = 'contained';
      }

      if (T.condomResult === 'contained') sWikifier('<<genericCondomEjaculation>>');

      sWikifier('<<ejaculation>>');
      const Text = this.npcAgain(npc);
      if (Text) sWikifier(Text);
    });
  }

  get shouldEndCombat(): boolean {
    const options = this.options;
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

    if (this.shouldEndCombat) {
      T.combatend = true;
      options.rounds = 0;
      options.end = null;
      return fragment;
    }

    this.ejaculation(sWikifier);

    options.rounds = Number(options.rounds || 0) + 1;
    options.end = null;
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
  }
}

export default LongerCombat;
