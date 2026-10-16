// ./src/compat/DoLX.ts

import type { MaplebirchCore } from '@scml-dol-maplebirch/types';
import type Robin from '../module/Robin';
import { npc_size_patch } from '../script/VanillaPlus/PenisSize';

type Rule = [RegExp, string];
type DoLXWindow = typeof window & {
  ensureRobinStand(): { selfSufficient: number; fellBehind: number; owed: number; missedWeeks: number; lastIncome: number };
  robinStandRent(): number;
  robinStandBaseIncome(): number;
  robinStandWeatherModifier(): number;
  robinCafeStandModifier?(): number;
  robinCafeShiftWage?(): number;
};

function adaptRobin(core: MaplebirchCore): void {
  const robin = core.get('Robin') as Robin | undefined;
  if (!robin) return;
  const runtime = window as DoLXWindow;
  const variables = () => V as typeof V & { robinCafe?: { weekShifts: number; rainDays: number; lastWage: number } };
  const income = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(robin), 'income')!.get!.bind(robin);
  const sync = (Reflect.get(robin, 'sync') as () => void).bind(robin);
  const acceptSelfRent = robin.rent.acceptSelfRent.bind(robin.rent);
  // 复用当前模组收入，剥离原版固定底薪。DoLX 的摊位与咖啡馆收入仍由原生函数结算。
  const expansionIncome = () => (robin.state.asylum.status === 'admitted' ? 0 : income() - ((V.robin.stayup >= 1 ? 250 : 300) + (V.robin.moneyModifier || 0)));

  // 仅在 DoLX 环境遮蔽实例方法，原版 Robin 门面与其他版本的周结算保持各自流程。
  Object.defineProperties(robin, {
    income: {
      configurable: true,
      get: () => {
        if (robin.state.asylum.status === 'admitted') return 0;
        const standIncome = Math.max(
          0,
          Math.round(runtime.robinStandBaseIncome() * runtime.robinStandWeatherModifier() * (runtime.robinCafeStandModifier?.() ?? 1) - (V.robin.stayup >= 1 ? 50 : 0) + (V.robin.moneyModifier || 0))
        );
        const cafe = variables().robinCafe;
        const cafeIncome = (cafe?.weekShifts ?? 0) > 0 ? ((cafe?.weekShifts ?? 0) + Math.min(cafe?.rainDays ?? 0, 2)) * (runtime.robinCafeShiftWage?.() ?? 0) : 0;
        return standIncome + cafeIncome + expansionIncome();
      }
    },
    sync: {
      configurable: true,
      value: () => {
        if (!V.RobinExpansion || C.npc.Robin?.init !== 1 || V.replayScene || V.statFreeze) return sync();
        const state = robin.state;
        const stand = runtime.ensureRobinStand();
        if (stand.fellBehind === 1 && state.self_rent) {
          state.self_rent = false;
          state.both_rent = false;
          state.rent_separated = false;
        } else if (stand.selfSufficient === 1 && !state.self_rent) {
          state.self_rent = true;
          state.rent_separated = true;
        }
        sync();
        if (state.self_rent) stand.selfSufficient = 1;
      }
    },
    settleWeek: {
      configurable: true,
      value: (nativeWeekPassed: () => void) => {
        if (!V.RobinExpansion || C.npc.Robin?.init !== 1 || V.replayScene || V.statFreeze) return nativeWeekPassed();
        (Reflect.get(robin, 'sync') as () => void)();
        const state = robin.state;
        state.week++;
        const extraIncome = expansionIncome();
        if (state.asylum.status !== 'admitted') {
          robin.flowers.settle();
          robin.shop.settle();
          V.robinmoney += extraIncome;
          if (!state.bailey_defeated && (state.self_rent || V.robinpaid !== 1)) {
            const owed = state.self_rent ? runtime.ensureRobinStand().owed : 0;
            const reserveTransfer = Math.clamp(robin.rent.due + owed - V.robinmoney, 0, state.reserve);
            state.reserve -= reserveTransfer;
            V.robinmoney += reserveTransfer;
          }
        }
        // 原生 DoLX 负责扣租、摊位采购和咖啡工资，不能再运行原版固定 £400/£300 预结算。
        nativeWeekPassed();
        state.weekly_income = state.asylum.status === 'admitted' ? 0 : runtime.ensureRobinStand().lastIncome + (variables().robinCafe?.lastWage ?? 0) + extraIncome;
        if (state.solidarity && state.reserve >= 10) {
          state.reserve -= 10;
          state.care_fund += 10;
        }
      }
    }
  });
  Object.defineProperties(robin.rent, {
    due: { configurable: true, get: () => (robin.state.bailey_defeated ? 0 : runtime.robinStandRent()) },
    debt: { configurable: true, get: () => Math.max(0, Number(V.robindebt) || 0) * robin.rent.due + runtime.ensureRobinStand().owed },
    acceptSelfRent: {
      configurable: true,
      value: () => {
        if (!acceptSelfRent()) return false;
        Object.assign(runtime.ensureRobinStand(), { selfSufficient: 1, owed: 0, missedWeeks: 0, fellBehind: 0 });
        return true;
      }
    }
  });
}

export default function DoLX(core: MaplebirchCore): void {
  core.once(':addon:preparePatch', () => {
    const data = core.services.addonPlugin.SC2DataManager.getSC2DataInfoAfterPatch();
    if (!data.scriptFileItems.getByNameWithOrWithoutPath('xchange.js')) return;
    const zone = core.tool.zone;
    // DoLX 在作弊按钮外又包了一层相同判断，两处都需解除，保留跳舞、战斗和起始页限制。
    if (zone.locationPassage.StoryCaption) {
      zone.locationPassage.StoryCaption = zone.locationPassage.StoryCaption.map(rule =>
        rule.src === ' and $cheatsEnabled is true' ? { srcmatchgroup: / and \$cheatsEnabled is true/g, to: '', expected: 2 } : rule
      );
    }
    if (core.get('VanillaPlus')) {
      // AMC 公式在下方单独处理，只移除对应的原版规则，其余钳制、作弊和战斗补丁照常接入。
      const attributes = ['beauty', 'physique', 'willpower'];
      const legacy: Record<string, string[]> = {
        'Widgets Clamp': attributes.map(stat => `Math\\.clamp\\(\\$${stat},`),
        Widgets: ['Math\\.clamp\\(\\$physique,'],
        Cheats: attributes.map(stat => `\\$${stat} "${stat}"`),
        'Widgets Difficulty': ['currentSkillValue\\("seductionskill"\\)']
      };
      for (const [title, patterns] of Object.entries(legacy)) {
        if (zone.widgetPassage[title]) {
          zone.widgetPassage[title] = zone.widgetPassage[title].filter(
            rule =>
              !(rule.to ?? rule.applyafter ?? rule.applybefore ?? '').includes('maplebirch.get("VanillaPlus")') ||
              !patterns.some(pattern => (rule.srcmatch?.source ?? rule.srcmatchgroup?.source ?? '').includes(pattern))
          );
        }
      }
    }
    if (core.get('Finance')) {
      // 医疗减免沿用 DoLX 的通胀显示、余额判定与两条原生治疗分支。
      const hospital = core.tool.zone.locationPassage['Hospital Parasite'] ?? [];
      core.tool.zone.locationPassage['Hospital Parasite'] = [
        ...hospital.filter(rule => !rule.to?.includes('donations.aid.fee')),
        { srcmatchgroup: /<<printprice 25000>>/g, to: '<<printprice `maplebirch.get("Finance").donations.aid.fee`>>', expected: 4 },
        { srcmatchgroup: /25000(?=, ["']hospitalParasiteRemoval["']\))/g, to: 'maplebirch.get("Finance").donations.aid.fee', expected: 2 },
        { srcmatchgroup: /<<money -25000 (?=["']hospitalParasiteRemoval["']>>)/g, to: '<<money `-maplebirch.get("Finance").donations.aid.fee` ', expected: 2 }
      ];
    }
    // DoLX 已有独立 NPC 第 5 档，仅移除本模组为原版补缺的三组规则。
    for (const title of ['Widgets Effects Man', 'Widgets Combat Man-Combat', 'Widgets Ejaculation']) {
      const rules = core.tool.zone.widgetPassage[title];
      if (rules) core.tool.zone.widgetPassage[title] = rules.filter(rule => rule.srcmatch?.source !== npc_size_patch.srcmatch.source || !rule.to?.startsWith('$1<<case 5>><<deadwood-npc-size-five-'));
    }
    if (core.get('LifeSimulation')) {
      // DoLX 已将书包分到 bag 槽，保留它的原生判断与暂存，不套用原版手持书包规则。
      const bookbags = [
        'Widgets Events Science',
        'Widgets Events English',
        'Widgets School Events',
        'History Classroom',
        'Science Classroom',
        'Gwylan Walk School Solo',
        'Gwylan Ocean Breeze',
        'School Passout Gang Rape'
      ];
      const handRule = (rule: (typeof core.tool.zone.widgetPassage)[string][number]) =>
        [rule.to, rule.applybefore, rule.applyafter].some(text => text?.includes('maplebirch.get("LifeSimulation").hands') || text?.includes('_deadwood_bookbag')) ||
        (rule.srcmatch?.source === '\\$?worn\\.handheld\\.type\\.includes\\("bookbag"\\)' && rule.to === '$worn.handheld.type.includes("bookbag")');
      for (const title of bookbags) {
        for (const group of [core.tool.zone.widgetPassage, core.tool.zone.locationPassage]) {
          if (group[title]) group[title] = group[title].filter(rule => !handRule(rule));
        }
      }
      // 雨伞能力已由手持视图统一处理，这里只修正 DoLX 额外的完整度检查与损耗。
      core.tool.zone.widgetPassage['Ambient Weather And Seasonal Event Widgets'] = [
        ...(core.tool.zone.widgetPassage['Ambient Weather And Seasonal Event Widgets'] ?? []).filter(rule => !handRule(rule)),
        { srcmatch: /\$worn\.handheld\.integrity/g, to: '(maplebirch.get("LifeSimulation").hands.item("rainproof") ?? $worn.handheld).integrity', expected: 3 }
      ];
    }
  });

  core.once(':addon:beforePatch', () => {
    const manager = core.services.addonPlugin;
    const previous = manager.SC2DataManager.getSC2DataInfoAfterPatch();
    const data = previous.cloneSC2DataInfo();
    if (!data.scriptFileItems.getByNameWithOrWithoutPath('xchange.js')) return;
    adaptRobin(core);
    const floor = (stat: string) => `maplebirch.get('VanillaPlus')?.minimum('${stat}') ?? 0`;
    const max = (stat: string, original: string) => {
      const ceiling = `(maplebirch.get('VanillaPlus') && V.VanillaPlus?.lock?.${stat} ? Math.floor(${original} * 1.25) : ${original})`;
      return stat === 'beauty' ? `(maplebirch.get('VanillaPlus')?.divineTransformations.beautyCeiling(${ceiling}) ?? ${ceiling})` : ceiling;
    };
    const baseFloor = `(() => {
      const state = V.xchange;
      const pct = typeof state.physiqueChangePercent === 'number' ? state.physiqueChangePercent / 100 : 1;
      const factor = V.physiquesize / state.baseStats.physiquesize * (V.player.gender !== V.player.sex ? pct : 1);
      return Number.isFinite(factor) && factor > 0 ? Math.ceil((${floor('physique')}) / factor) : 0;
    })()`;
    const rules: Record<string, Rule[]> = {
      'time.js': [
        [
          /if \(V\.robinpaid === 1\) \{\n\t\t\tV\.robinPayout = 0;/,
          "if (V.robinpaid === 1 || (maplebirch.get('Robin') && (V.RobinExpansion?.bailey_defeated || V.RobinExpansion?.asylum?.status === 'admitted'))) {\n\t\t\tV.robinPayout = 0;"
        ],
        [
          /if \(ensureRobinStand\(\)\.selfSufficient === 1\) \{/,
          "if (ensureRobinStand().selfSufficient === 1 && !(maplebirch.get('Robin') && (V.RobinExpansion?.bailey_defeated || V.RobinExpansion?.asylum?.status === 'admitted'))) {"
        ],
        [/V\.robinmoney <= 0 && V\.robindebt >= 0/, "(maplebirch.get('Robin') ? V.robinmoney < 0 : V.robinmoney <= 0) && V.robindebt >= 0"],
        [
          /if \(V\.robinpaid !== 1 && V\.robindebt >= V\.robindebtlimit/,
          "if (!(maplebirch.get('Robin') && (V.RobinExpansion?.bailey_defeated || V.RobinExpansion?.asylum?.status === 'admitted')) && V.robinpaid !== 1 && V.robindebt >= V.robindebtlimit"
        ],
        [/V\.robinmoney \+= robinStandWeeklyTick\(\);/, "if (!(maplebirch.get('Robin') && V.RobinExpansion?.asylum?.status === 'admitted')) V.robinmoney += robinStandWeeklyTick();"],
        [/const rentPaused = inRentPausedBadEnd\(\);/, "const rentPaused = inRentPausedBadEnd() || (maplebirch.get('Robin') && V.RobinExpansion?.bailey_defeated);"],
        [
          /V\.xchange\.baseStats\.physique -= decay;/,
          `V.xchange.baseStats.physique = (${floor('physique')}) > 0 ? Math.max(${baseFloor}, V.xchange.baseStats.physique - decay) : V.xchange.baseStats.physique - decay;`
        ]
      ],
      'stat-changes.js': [
        [
          /amcClamp\(\(V\.beauty \|\| 0\) \+ getBeautyBoost\(\), V\.beautymax \|\| 1000, V\.AMCTraits\?\.beauty \|\| 1, V\.beauty \|\| 0\)/,
          `amcClamp((V.beauty || 0) + getBeautyBoost(), ${max('beauty', 'V.beautymax')} || 1000, V.AMCTraits?.beauty || 1, V.beauty || 0)`
        ],
        [
          /V\.willpower = amcClamp\(V\.willpower \+ amount \* 2, V\.willpowermax, V\.AMCTraits\.willpower, V\.willpower\);/,
          `V.willpower = Math.max(${floor('willpower')}, amcClamp(V.willpower + amount * 2, ${max('willpower', 'V.willpowermax')}, V.AMCTraits.willpower, V.willpower));`
        ],
        [/const maxValue = \(type === "beauty" \? V\.beautymax : V\[type \+ "max"\]\) \|\| 1000;/, `const maxValue = (type === "beauty" ? ${max('beauty', 'V.beautymax')} : V[type + "max"]) || 1000;`],
        [
          /V\[type\] = amcClamp\(V\[type\] \+ amount \* \(V\.statGainMult \/ 100\), maxValue, maxMultiplier, V\[type\]\);/,
          "V[type] = Math.max(type === 'beauty' ? (maplebirch.get('VanillaPlus')?.minimum('beauty') ?? 0) : 0, amcClamp(V[type] + amount * (V.statGainMult / 100), maxValue, maxMultiplier, V[type]));"
        ]
      ],
      'xchange.js': [
        [/V\.physique = amcClamp\(/, `if ((${floor('physique')}) > 0) V.xchange.baseStats.physique = Math.max(V.xchange.baseStats.physique, ${baseFloor});\n V.physique = amcClamp(`],
        [/\n\t\tV\.physiquesize,\n\t\tNumber\(V\.AMCTraits\?\.physique\) \|\| 1/, `\n\t\t${max('physique', 'V.physiquesize')},\n\t\tNumber(V.AMCTraits?.physique) || 1`]
      ]
    };
    if (core.get('VanillaPlus')) {
      // DoLX 生成和还原身体时使用自己的绝对上限，只扩展 PC 的这一项。
      rules['koztools.js'] = [
        [/repairBounds\("penissizemin", "penissizemax", 0, 6\);/, 'repairBounds("penissizemin", "penissizemax", 0, 7);'],
        [/penis: \{ absMax: 6,/, 'penis: { absMax: 7,']
      ];
      rules['save.js'] = [
        [/(penissize(?:min|max):\s*\{\s*min: 0,\s*max:) 6/g, '$1 7'],
        [/(penissize(?:min|max):\s*\{[\s\S]*?textMap:\s*\{)/g, '$& 7: lanSwitch("Gargantuan", "骇人"),']
      ];
    }
    for (const [name, replacements] of Object.entries(rules)) {
      const file = data.scriptFileItems.getByNameWithOrWithoutPath(name);
      if (!file) continue;
      file.content = manager.replace(file.content, replacements, 'Deadwood DoLX');
    }

    // 接入 DoLX 的 AMC 公式与缓存后的诱惑评分，保留特质倍率和作弊控件回调。
    const passageRules: Record<string, Rule[]> = {
      // DoLX 的兽化称号使用块函数，保留性别感受和 Harpy 判断，只补生理标记。
      Traits: [
        [
          /name: \(\) => (\{\s*(?:if \(V\.hallucinations gte 2 \|\| !V\.settings\.bestialityEnabled\) return "Harpy";\s*)?if \(playerFeelsManlike\(\)\) return "(?:Wolf|Cat|Bird)boy";\s*if \(playerFeelsGirllike\(\)\) return "(?:Wolf|Cat|Bird)girl";\s*return "(?:Wolf|Cat|Bird)kin";\s*\}),/g,
          'name: () => (() => $1)() + (V.player.sex is "h" ? "<<lanSwitch \' (⚥)\' \'(⚥)\'>>" : ""),'
        ]
      ]
    };
    if (core.get('VanillaPlus')) {
      Object.assign(passageRules, {
        Cheats: [
          [
            /amcDisplayCap\(\$beauty, 10000, \$AMCTraits\.beauty\)/,
            'Math.max($&, maplebirch.get("VanillaPlus").divineTransformations.beautyCeiling($VanillaPlus.lock.beauty ? maplebirch.get("VanillaPlus").ceiling("beauty") : maplebirch.get("VanillaPlus").normalCeiling("beauty")))'
          ],
          [/amcDisplayCap\(\$physique, \$physiquesize, \$AMCTraits\.physique\)/, 'Math.max($&, $VanillaPlus.lock.physique ? maplebirch.get("VanillaPlus").ceiling("physique") : 0)'],
          [/amcDisplayCap\(\$willpower, 1000, \$AMCTraits\.willpower\)/, 'Math.max($&, $VanillaPlus.lock.willpower ? maplebirch.get("VanillaPlus").ceiling("willpower") : 0)']
        ],
        'Widgets Clamp': [
          [
            /amcClamp\(\$beauty, \$beautymax, \$AMCTraits\.beauty\)/,
            'Math.max(maplebirch.get("VanillaPlus").minimum("beauty"), amcClamp($beauty, maplebirch.get("VanillaPlus").divineTransformations.beautyCeiling($beautymax * ($VanillaPlus.lock.beauty ? 1.25 : 1)), $AMCTraits.beauty))'
          ],
          [
            /amcClamp\(\$physique, \$physiquesize, \$AMCTraits\.physique\)/,
            'Math.max(maplebirch.get("VanillaPlus").minimum("physique"), amcClamp($physique, $physiquesize * ($VanillaPlus.lock.physique ? 1.25 : 1), $AMCTraits.physique))'
          ],
          [
            /amcClamp\(\$willpower, \$willpowermax, \$AMCTraits\.willpower\)/,
            'Math.max(maplebirch.get("VanillaPlus").minimum("willpower"), amcClamp($willpower, $willpowermax * ($VanillaPlus.lock.willpower ? 1.25 : 1), $AMCTraits.willpower))'
          ]
        ],
        Widgets: [
          [
            /amcClamp\(\$xchange\.baseStats\.physique, \$xchange\.baseStats\.physiquesize, \$AMCTraits\.physique(, _amcPrev)?\)/g,
            'amcClamp($xchange.baseStats.physique, $xchange.baseStats.physiquesize * ($VanillaPlus.lock.physique ? 1.25 : 1), $AMCTraits.physique$1)'
          ]
        ],
        'Widgets Difficulty': [[/\$attractiveness \+ \(_seductionSkill \* 5\)/g, '$& + maplebirch.get("VanillaPlus").beauty.seductionBonus']]
      } satisfies Record<string, Rule[]>);
      passageRules['Widgets Settings'] = [
        [
          /"\$xchange\.bodyPenisSizeMin" "\$xchange\.bodyPenisSizeMax" \$xchange\.bodyPenisSizeMin \$xchange\.bodyPenisSizeMax 0 6 1/,
          '"$xchange.bodyPenisSizeMin" "$xchange.bodyPenisSizeMax" $xchange.bodyPenisSizeMin $xchange.bodyPenisSizeMax 0 7 1'
        ],
        [
          /<<rangeslider "\$xchange\.bodyPenisSizeMin" "\$xchange\.bodyPenisSizeMax" \$xchange\.bodyPenisSizeMin \$xchange\.bodyPenisSizeMax 0 7 1[\s\S]*?var name = \[[^\]\n]+\];/,
          '$&name.push(lanSwitch("Gargantuan", "骇人"));'
        ]
      ];
    }
    if (core.get('MoreTransformations')) {
      (passageRules.Widgets ??= []).push(
        [/<<set \$swimmingskill to amcClamp\(\$swimmingskill, 1000, \$AMCTraits\.swimming, _amcPrev\)>>/, '$&<<if $rng <= 30>><<transform "whale" 1>><</if>>'],
        [
          /<<set \$oxygen -= _waterActionTime \* 7>>/,
          '<<set $oxygen -= _waterActionTime * 7 * ($transformationParts.traits.deep_diver && isPartEnabled($transformationParts.traits.deep_diver) ? 0.25 : 1)>>'
        ]
      );
    }
    for (const [title, replacements] of Object.entries(passageRules)) {
      const passage = data.passageDataItems.map.get(title);
      if (passage) passage.content = manager.replace(passage.content, replacements, `Deadwood DoLX: ${title}`);
    }
    data.passageDataItems.back2Array();
    manager.modUtils.replaceFollowSC2DataInfo(data, previous);
  });
}
