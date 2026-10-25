// ./src/compat/DoLX.ts

import type { MaplebirchCore } from '@scml-dol-maplebirch/types';
import { npc_size_patch } from '../script/VanillaPlus/PenisSize';
import adaptFinance from './DoLX/Finance';
import adaptPassages from './DoLX/Passages';
import adaptBoot from './DoLX/Boot';
import adaptTrinity from './DoLX/Trinity';
import adaptBike from './Bike';

type Rule = [RegExp, string];
function adaptRobin(maplebirch: MaplebirchCore): void {
  const robin = maplebirch.get('Robin');
  if (!robin) return;
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
          Math.round(window.robinStandBaseIncome() * window.robinStandWeatherModifier() * (window.robinCafeStandModifier?.() ?? 1) - (V.robin.stayup >= 1 ? 50 : 0) + (V.robin.moneyModifier || 0))
        );
        const cafe = V.robinCafe;
        const cafeIncome = (cafe?.weekShifts ?? 0) > 0 ? ((cafe?.weekShifts ?? 0) + Math.min(cafe?.rainDays ?? 0, 2)) * (window.robinCafeShiftWage?.() ?? 0) : 0;
        return standIncome + cafeIncome + expansionIncome();
      }
    },
    sync: {
      configurable: true,
      value: () => {
        if (!V.RobinExpansion || C.npc.Robin?.init !== 1 || V.replayScene || V.statFreeze) return sync();
        const state = robin.state;
        const stand = window.ensureRobinStand();
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
          maplebirch.get('Orchard')?.winery.settleShop();
          state.reserve += extraIncome;
          if (!state.bailey_defeated && (state.self_rent || V.robinpaid !== 1)) {
            const owed = state.self_rent ? window.ensureRobinStand().owed : 0;
            const reserveTransfer = Math.clamp(robin.rent.due + owed - V.robinmoney, 0, state.reserve);
            state.reserve -= reserveTransfer;
            V.robinmoney += reserveTransfer;
          }
        }
        nativeWeekPassed();
        state.weekly_income = state.asylum.status === 'admitted' ? 0 : window.ensureRobinStand().lastIncome + (V.robinCafe?.lastWage ?? 0) + extraIncome;
        if (state.solidarity && state.reserve >= 10) {
          state.reserve -= 10;
          state.care_fund += 10;
        }
      }
    }
  });
  Object.defineProperties(robin.rent, {
    due: { configurable: true, get: () => (robin.state.bailey_defeated ? 0 : window.robinStandRent()) },
    debt: { configurable: true, get: () => Math.max(0, Number(V.robindebt) || 0) * robin.rent.due + window.ensureRobinStand().owed },
    acceptSelfRent: {
      configurable: true,
      value: () => {
        if (!acceptSelfRent()) return false;
        Object.assign(window.ensureRobinStand(), { selfSufficient: 1, owed: 0, missedWeeks: 0, fellBehind: 0 });
        return true;
      }
    }
  });
}

export default function DoLX(maplebirch: MaplebirchCore): void {
  const data = maplebirch.services.addonPlugin.SC2DataManager.getSC2DataInfoAfterPatch();
  if (data.scriptFileItems.getByNameWithOrWithoutPath('xchange.js')) {
    adaptBoot(maplebirch);
    adaptFinance(maplebirch);
    adaptPassages(maplebirch);
    adaptTrinity(maplebirch);
    adaptBike(maplebirch);
    const zone = maplebirch.tool.zone;
    // DoLX 在作弊按钮外又包了一层相同判断，两处都需解除，保留跳舞、战斗和起始页限制。
    if (zone.locationPassage.StoryCaption) {
      zone.locationPassage.StoryCaption = zone.locationPassage.StoryCaption.map(rule =>
        rule.src === ' and $cheatsEnabled is true' ? { srcmatchgroup: / and \$cheatsEnabled is true/g, to: '', expected: 2 } : rule
      );
    }
    if (maplebirch.get('VanillaPlus')) {
      // DoLX 按生效等级显示恶魔特质，保留原生称号、收益及副作用说明，只追加新增效果。
      if (zone.widgetPassage.Traits) {
        zone.widgetPassage.Traits = zone.widgetPassage.Traits.map(rule =>
          rule.to === '$1maplebirch.t("deadwood-reblooms:VanillaPlus:divineTransformations:trait:demon:text"),'
            ? {
                ...rule,
                srcmatch: /(has: effectiveTransformationLevel\("demon"\) gte 6,\s*text: )([^\r\n]+),/,
                to: '$1$2 + " " + maplebirch.t("deadwood-reblooms:VanillaPlus:divineTransformations:trait:demon:bonus"),'
              }
            : rule
        );
      }
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
    if (maplebirch.get('Finance')) {
      // 医疗减免沿用 DoLX 的通胀显示、余额判定与两条原生治疗分支。
      const hospital = maplebirch.tool.zone.locationPassage['Hospital Parasite'] ?? [];
      maplebirch.tool.zone.locationPassage['Hospital Parasite'] = [
        ...hospital.filter(rule => !rule.to?.includes('donations.aid.fee')),
        { srcmatchgroup: /<<printprice 25000>>/g, to: '<<printprice `maplebirch.get("Finance").donations.aid.fee`>>', expected: 4 },
        { srcmatchgroup: /25000(?=, ["']hospitalParasiteRemoval["']\))/g, to: 'maplebirch.get("Finance").donations.aid.fee', expected: 2 },
        { srcmatchgroup: /<<money -25000 (?=["']hospitalParasiteRemoval["']>>)/g, to: '<<money `-maplebirch.get("Finance").donations.aid.fee` ', expected: 2 }
      ];
    }
    // DoLX 已有独立 NPC 第 5 档，仅移除本模组为原版补缺的三组规则。
    for (const title of ['Widgets Effects Man', 'Widgets Combat Man-Combat', 'Widgets Ejaculation']) {
      const rules = maplebirch.tool.zone.widgetPassage[title];
      if (rules)
        maplebirch.tool.zone.widgetPassage[title] = rules.filter(rule => rule.srcmatch?.source !== npc_size_patch.srcmatch.source || !rule.to?.startsWith('$1<<case 5>><<deadwood-npc-size-five-'));
    }
    if (maplebirch.get('LifeSimulation')) {
      // DoLX 将换衣槽列表改名。扩展实际列表，后续穿衣与清除待穿状态仍走原生循环。
      if (data.passageDataItems.map.get('Widgets Wardrobe')?.content.includes('<<set _wardrobeEquipSlots to [')) {
        zone.widgetPassage['Widgets Wardrobe'] = zone.widgetPassage['Widgets Wardrobe'].map(rule =>
          rule.applybefore === '<<run _equip.push("handheld_left")>>\n' ? { ...rule, applybefore: '<<run _wardrobeEquipSlots.push("handheld_left")>>\n' } : rule
        );
      }
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
      const handRule = (rule: (typeof maplebirch.tool.zone.widgetPassage)[string][number]) =>
        [rule.to, rule.applybefore, rule.applyafter].some(text => text?.includes('maplebirch.get("LifeSimulation").hands') || text?.includes('_deadwood_bookbag')) ||
        (rule.srcmatch?.source === '\\$?worn\\.handheld\\.type\\.includes\\("bookbag"\\)' && rule.to === '$worn.handheld.type.includes("bookbag")');
      for (const title of bookbags) {
        for (const group of [maplebirch.tool.zone.widgetPassage, maplebirch.tool.zone.locationPassage]) {
          if (group[title]) group[title] = group[title].filter(rule => !handRule(rule));
        }
      }
      // 雨伞能力已由手持视图统一处理，这里只修正 DoLX 额外的完整度检查与损耗。
      maplebirch.tool.zone.widgetPassage['Ambient Weather And Seasonal Event Widgets'] = [
        ...(maplebirch.tool.zone.widgetPassage['Ambient Weather And Seasonal Event Widgets'] ?? []).filter(rule => !handRule(rule)),
        { srcmatch: /\$worn\.handheld\.integrity/g, to: '(maplebirch.get("LifeSimulation").hands.item("rainproof") ?? $worn.handheld).integrity', expected: 3 }
      ];
    }
  }

  maplebirch.once(':addon:beforePatch', () => {
    const manager = maplebirch.services.addonPlugin;
    const previous = manager.SC2DataManager.getSC2DataInfoAfterPatch();
    const data = previous.cloneSC2DataInfo();
    if (!data.scriptFileItems.getByNameWithOrWithoutPath('xchange.js')) return;
    adaptRobin(maplebirch);
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
        [
          /const rentPaused = inRentPausedBadEnd\(\);/,
          "const rentPaused = inRentPausedBadEnd() || (maplebirch.get('Robin') && V.RobinExpansion?.bailey_defeated) || maplebirch.get('Finance')?.orphanage.pcFree;"
        ],
        [/if \(V\.sydney_templeWork === "garden"\) \{/, 'if (V.sydney_templeWork === "garden" && (maplebirch.get(\'Sydney\')?.canMaintain ?? true)) {'],
        [/else if \(V\.sydney_templeWork === "quarters"\) \{/, 'else if (V.sydney_templeWork === "quarters" && (maplebirch.get(\'Sydney\')?.canMaintain ?? true)) {'],
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
    // 原生搜索在分页前筛选，只补目录中的中文名，共用原有控件与手提包筛选。
    if (data.scriptFileItems.getByNameWithOrWithoutPath('x_wardrobes.js')?.content.includes('function wardrobeItemMatches(item)')) {
      rules['x_wardrobes.js'] = [[/\[item\.name, item\.colour, item\.pattern\]/, '[item.name, setup.clothes[item.slot]?.[clothesIndex(item.slot, item)]?.cn_name_cap, item.colour, item.pattern]']];
    }
    if (maplebirch.get('Finance')) {
      // 来宾走普通房租结算，沿用 DoLX 的罗宾优先事件。收养停付仍保留原生判断。
      rules['time.js'].push([
        /(if \(V\.avery_mansion\.rage\.assess >= 9 \|\| V\.avery_mansion\.days_absent >= 2\) \{\s*V\.renttime--;\s*if \(V\.baileyDeposit >= V\.rentmoney \+ \(V\.babyRent \|\| 0\))\) \{/,
        '$1 && (!maplebirch.get("Finance")?.company.avery.state.mansion_guest || !robinStandSelfSufficiencyReady())) {'
      ]);
    }
    if (maplebirch.get('VanillaPlus')) {
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
      // DoLX 的称号使用块函数，统一普通返回值与旧版双性后缀，保留异装称谓。
      Traits: [
        [
          /return "((?:Wolf|Cat|Bird)(?:boy|girl|kin)|(?:Bunny|Bear) (?:boy|girl)|(?:Bunny|Bear)kin|Bull|Cow|Bovine|Foxboy|Foxkin|Vixen|Harpy|Incubus|Succubus|Demon)(?: \((?:female|male)\))?"(?: \+ \(V\.player\.sex is "h" \? "<<lanSwitch ' \(⚥\)' '\(⚥\)'>>" : ""\))?;/g,
          'return "$1<<deadwood-trait-sex>>";'
        ],
        [/return "((?:Incubus|Succubus) \(" \+ transGenderLabel \+ "\))";/g, 'return "$1<<deadwood-trait-sex>>";']
      ]
    };
    if (maplebirch.get('VanillaPlus')) {
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
    if (maplebirch.get('MoreTransformations')) {
      (passageRules.Widgets ??= []).push([
        /<<set \$oxygen -= _waterActionTime \* 7>>/,
        '<<set $oxygen -= _waterActionTime * 7 * ($transformationParts.traits.deep_diver && isPartEnabled($transformationParts.traits.deep_diver) ? 0.25 : 1)>>'
      ]);
    }
    for (const [title, replacements] of Object.entries(passageRules)) {
      const passage = data.passageDataItems.map.get(title);
      if (passage) passage.content = manager.replace(passage.content, replacements, `Deadwood DoLX: ${title}`);
    }
    data.passageDataItems.back2Array();
    manager.modUtils.replaceFollowSC2DataInfo(data, previous);
  });
}
