import type { MaplebirchCore } from '@scml-dol-maplebirch/types';

type Rule = [RegExp, string];

export default function DoLX(core: MaplebirchCore): void {
  core.once(':addon:beforePatch', () => {
    const manager = core.services.addonPlugin;
    const previous = manager.SC2DataManager.getSC2DataInfoAfterPatch();
    const data = previous.cloneSC2DataInfo();
    if (!data.scriptFileItems.getByNameWithOrWithoutPath('xchange.js')) return;
    const floor = (stat: string) => `maplebirch.get('VanillaPlus')?.minimum('${stat}') ?? 0`;
    const max = (stat: string, original: string) => `(maplebirch.get('VanillaPlus') && V.VanillaPlus?.lock?.${stat} ? Math.floor(${original} * 1.25) : ${original})`;
    const baseFloor = `(() => {
      const state = V.xchange;
      const pct = typeof state.physiqueChangePercent === 'number' ? state.physiqueChangePercent / 100 : 1;
      const factor = V.physiquesize / state.baseStats.physiquesize * (V.player.gender !== V.player.sex ? pct : 1);
      return Number.isFinite(factor) && factor > 0 ? Math.ceil((${floor('physique')}) / factor) : 0;
    })()`;
    const rules: Record<string, Rule[]> = {
      'time.js': [
        [/const rentPaused = inRentPausedBadEnd\(\);/, "const rentPaused = inRentPausedBadEnd() || (maplebirch.get('Robin') && V.RobinExpansion?.baileyDefeated);"],
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
    for (const [name, replacements] of Object.entries(rules)) {
      const file = data.scriptFileItems.getByNameWithOrWithoutPath(name);
      if (!file) continue;
      file.content = manager.replace(file.content, replacements, 'Deadwood DoLX');
    }
    manager.modUtils.replaceFollowSC2DataInfo(data, previous);
  });
}
