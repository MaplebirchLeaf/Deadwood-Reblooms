import type { MaplebirchCore } from '@scml-dol-maplebirch/types';

export default function adaptPassages(maplebirch: MaplebirchCore): void {
  const zone = maplebirch.tool.zone;
  // DoLX 扩展了兴奋描述分支，仍逐项追加同一数值提示。
  for (const rule of zone.widgetPassage['Widgets State Man'] ?? []) {
    if (rule.applybefore?.includes('Math.round($enemyarousal)')) rule.expected = 17;
  }
  if (maplebirch.get('MoreTransformations')) {
    // 鸦化使用 DoLX 本次实际生效的言语特质，保留药物和道歉倍率。
    for (const rule of zone.widgetPassage['Widgets Effects Man'] ?? []) {
      if (![rule.to, rule.applyafter].some(text => text?.includes("maplebirch.get('MoreTransformations').Raven.speech"))) continue;
      if (rule.src) rule.src = rule.src.replaceAll('$englishtrait', '_speechTrait');
      if (rule.srcmatchgroup) rule.srcmatchgroup = new RegExp(rule.srcmatchgroup.source.replaceAll('\\$englishtrait', '_speechTrait'), rule.srcmatchgroup.flags);
      if (rule.to) rule.to = rule.to.replaceAll('$englishtrait', '_speechTrait');
      if (rule.applyafter) rule.applyafter = rule.applyafter.replaceAll('$englishtrait', '_speechTrait');
    }
    // DoLX 的七点耗氧公式在源码适配中处理，避免重复执行原版公式。
    if (zone.widgetPassage.Widgets) {
      zone.widgetPassage.Widgets = zone.widgetPassage.Widgets.filter(rule => rule.src !== '<<set $oxygen -= _waterActionTime * 10>>');
    }
  }
  const replace = (
    group: 'locationPassage' | 'widgetPassage',
    title: string,
    original: string,
    patch: (rule: (typeof zone.widgetPassage)[string][number]) => (typeof zone.widgetPassage)[string][number]
  ) => {
    if (zone[group][title]) zone[group][title] = zone[group][title].map(rule => (String(rule.src ?? rule.srcmatch ?? rule.srcmatchgroup) === original ? patch(rule) : rule));
  };

  // 森林地图和公寓菜单的排版不同，仍接在同一普通导航分支内。
  replace('locationPassage', 'Forest', String(/<<elseif \$eventskip gte 1>>[^<]*<br><br>/g), rule => ({ ...rule, srcmatch: /<<elseif \$eventskip gte 1>>\s*<<forest_map>>/g }));
  replace('locationPassage', 'Whitney Chat', String(/<<\/switch>>\s*(?:<br\s*\/?>\s*){2}(?=<<whitney[Oo]ptions>>\s*<<else>>)/), rule => ({
    ...rule,
    srcmatch: /<<\/if>>\s*<br><br>\s*(?=<<whitneyoptions>>\s*<<else>>)/
  }));
  // 哈珀先处理自闭症复诊，药物复核放在整个原生诊疗分支之前。
  replace('locationPassage', "Doctor Harper's Office", '<<if !$harper_appointments.hypnosis_intro>>', rule => ({
    ...rule,
    src: '<<if playerHasAutismSpectrum() and autismDiagnosed() and !$daily.autismCheckup>>'
  }));
  // 新增的迟到与停学判断必须保留，只放宽原有着装门槛。
  replace('widgetPassage', 'Widgets School', String(/(?<=<<widget "schoolperiod">>\s*<<if )\$exposed lte 0(?=>>)/), rule => ({
    ...rule,
    srcmatchgroup: /(?<=<<if )\$exposed lte 0(?= and !schoolSuspended\(\)>>)/g,
    applyafter: undefined,
    to: '($exposed lte 0 or maplebirch.get("LifeSimulation").school.allowsNudity)'
  }));
  replace('widgetPassage', 'Widgets Rent', String(/<<if \$robinpaid is 1(?=>>)/), rule => ({ ...rule, srcmatch: /<<if \$robinpaid is 1(?= and \$robinStand\?\.selfSufficient isnot 1>>)/ }));

  // DoLX 使用自己的言语特质和道歉倍率，容貌加成接在最终公式之后。
  replace('widgetPassage', 'Widgets Effects Man', String(/<<meek `(?:1 \+ \$englishtrait|\(1 \+ \$englishtrait\) \* maplebirch\.get\('MoreTransformations'\)\.Raven\.speech)`>>/), rule => ({
    ...rule,
    srcmatch: /<<meek `(?:1 \+ _speechTrait|\(1 \+ _speechTrait\) \* maplebirch\.get\('MoreTransformations'\)\.Raven\.speech)`>>/
  }));
  replace(
    'widgetPassage',
    'Widgets Effects Man',
    String(/(<<set \$enemyanger -= (?:50|100) \* \((?:1 \+ \$englishtrait|\(1 \+ \$englishtrait\) \* maplebirch\.get\('MoreTransformations'\)\.Raven\.speech)\))>>/g),
    rule => ({
      ...rule,
      srcmatch: /(<<set \$enemyanger -= (?:50|100) \* (?:\(1 \+ _speechTrait\)|\(\(1 \+ _speechTrait\) \* maplebirch\.get\('MoreTransformations'\)\.Raven\.speech\)) \* _apologyPower)>>/g
    })
  );
  // 原生双目标动作先确认承受者，再追加本模组的技能成长。
  replace('widgetPassage', 'Widgets Effects Man', '<<set $vaginatarget to _n>>', rule => ({ ...rule, src: '<<set $vaginatarget to _existingVagNpc>>' }));
  replace('widgetPassage', 'Widgets Effects Anus', String(/<<if (\$combatExtended\.reverseRapeStart is 1 or )?combatSkillCheck\("anal", \$anustarget\)>>/), rule => ({
    ...rule,
    srcmatch: /<<if (\$combatExtended\.reverseRapeStart is 1 or )?combatSkillCheck\("anal", \$anustarget\)>>/g,
    expected: 2
  }));
  replace('widgetPassage', 'Combat Demo Widgets', '<<selectmodel "combatXrayPenis" "divXrayPenis">>', rule => ({ ...rule, src: '<<selectmodel "combatXrayPenis">>' }));
  replace('widgetPassage', 'Widgets Combat Man-Combat', '<<hand_section>>', rule => ({
    ...rule,
    src: '<<hand_section _n>>',
    to: '<<if !maplebirch.get("VanillaPlus").NPCDoublePenetration.isPartner(_n)>><<hand_section _n>><</if>>'
  }));

  // 检查流程已改用原生衣物查询函数，新增分支复用相同的穿着差分。
  for (const title of ['Penis Inspection Expose', 'Penis Inspection Flaunt No Penis', 'Pussy Inspection Flaunt No Pussy', 'Pussy Inspection Forced', 'Pussy Inspection Forced Defiant']) {
    if (!zone.locationPassage[title]) continue;
    zone.locationPassage[title] = zone.locationPassage[title].map(rule => {
      if (rule.src?.includes("setup.clothes.lower[clothesIndex('lower', $worn.lower)]"))
        return { ...rule, src: rule.src.replace("setup.clothes.lower[clothesIndex('lower', $worn.lower)]", 'wornSetupClothes("lower")') };
      if (title === 'Penis Inspection Expose' && rule.expected === 4) return { ...rule, expected: 5 };
      if (title === 'Penis Inspection Flaunt No Penis' && rule.srcmatch?.source.startsWith('(?:You tug down'))
        return { ...rule, srcmatch: /You <<= wornSetupClothes\("lower"\)\.skirt\? [^\r\n]*?>> / };
      if (['Pussy Inspection Forced', 'Pussy Inspection Forced Defiant'].includes(title) && rule.srcmatch && !rule.srcmatch.global)
        return { ...rule, srcmatch: new RegExp(rule.srcmatch.source, 'g'), expected: 2 };
      return rule;
    });
  }
}
