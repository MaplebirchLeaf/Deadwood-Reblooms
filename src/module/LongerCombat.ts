// ./src/module/LongerCombat.ts

const TEXT_KEY = 'deadwoodReblooms.LongerCombat';
const NPC_KEY = `${TEXT_KEY}.npc`;
const STATE_PARTS = ['lefthand', 'righthand', 'mouth', 'penis', 'vagina'] as const;
const LINE_COUNT = 10;

function npcHis(pronouns: { his: string }): string {
  return maplebirch.Language === 'CN' && !pronouns.his.endsWith('的') ? pronouns.his + '的' : pronouns.his;
}

function npcState(npc: { [x: string]: any }): string {
  let Text = '';
  for (const part of STATE_PARTS) {
    const state = npc[part];
    if (!state) continue;
    const key = `${NPC_KEY}.${part}.${state}`;
    const line = maplebirch.t(key);
    if (line && line !== `[${key}]`) Text += line;
  }
  return Text;
}

function npcAgain(npc: { [x: string]: any; teen?: any; pronouns?: { his: string; he: string }; gender?: string }): string {
  if (!npc.pronouns) return '';
  const type = V.consensual === 1 ? 'consensual' : 'forced';
  const group = npc.teen ? 'teen' : 'adult';
  const gender = npc.gender === 'm' ? 'm' : 'f';
  const lines: string[] = [];
  for (let i = 0; i < LINE_COUNT; i++) {
    const key = `${NPC_KEY}.${type}.${group}.${gender}.${i}`;
    const line = maplebirch.t(key);
    if (line && line !== `[${key}]`) lines.push(line);
  }
  const state = npcState(npc);
  if (lines.length === 0) return npcHis(npc.pronouns) + state;
  const line = lines.either();
  return npcHis(npc.pronouns) + state + '"' + line + '"' + npc.pronouns.he + maplebirch.t(`${NPC_KEY}.says`);
}

function Ejaculation(sWikifier: (Text: string) => void): void {
  const fameMacro = V.consensual === 1 ? '<<famesex 1>>' : '<<famerape 1>>';

  maplebirch.lodash.times(V.enemynomax, function (i: number) {
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
    const Text = npcAgain(npc);
    if (Text) sWikifier(Text);
  });
}

function shouldEndCombat(): boolean {
  const options = V.options.maplebirch.DeadwoodReblooms.LongerCombat;
  if (typeof options.endCombat === 'boolean') return options.endCombat;
  const chance = Math.max(0, Math.min(100, Number(options.againChance) || 0));
  options.endCombat = Number(options.rounds || 0) + 1 >= Math.max(1, Number(options.maxRounds) || 1) || Math.random() * 100 >= chance;
  return options.endCombat;
}

function passageTitle(): string {
  const current = maplebirch.passage.title;
  const found = maplebirch.lodash.findLast(maplebirch.SugarCube.State.history, function (entry: { title?: string }) {
    const title = entry?.title;
    return title && title !== current && !title.endsWith(' Finish');
  });
  const title = found?.title || current;
  return title.endsWith(' Finish') ? title.slice(0, -' Finish'.length) : title;
}

function LongerCombat(): DocumentFragment {
  const fragment = document.createDocumentFragment();
  const sWikifier = function (Text: string) {
    fragment.append(Wikifier.wikifyEval(Text));
  };

  if (V.enemyarousal < V.enemyarousalmax) return fragment;

  const options = V.options.maplebirch.DeadwoodReblooms.LongerCombat;

  if (shouldEndCombat()) {
    T.combatend = true;
    options.rounds = 0;
    options.endCombat = null;
    return fragment;
  }

  Ejaculation(sWikifier);

  options.rounds += 1;
  options.endCombat = null;
  V.enemyarousal = Math.floor(V.enemyarousalmax * (0.15 + Math.random() * 0.1));

  sWikifier(`<br><br><<lanLink 'deadwoodReblooms.LongerCombat.next' ${JSON.stringify(passageTitle())} 'capitalize'>><<set _combatend to false>><</lanLink>>`);

  return fragment;
}

maplebirch.once(
  ':sugarcube',
  function (): void {
    maplebirch.tool.macro.define('LongerCombat', function (this: any) {
      const fragment = LongerCombat();
      this.output.append(fragment);
    });

    maplebirch.dynamic.regStateEvent('gate', 'LongerCombat', {
      output: 'LongerCombat',
      cond: () => V.combat === 1 && !V.stalk,
      forceExit: () => V.enemyarousal >= V.enemyarousalmax && !shouldEndCombat()
    });

    maplebirch.dynamic.regTimeEvent('onBefore', 'LongerCombat', {
      cond: () => V.combat === 1 && !V.stalk,
      action: data => (data.passed = V.options.maplebirch.DeadwoodReblooms.LongerCombat.turnSeconds)
    });
  },
  'LongerCombat'
);
