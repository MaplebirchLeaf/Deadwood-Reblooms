import type { MaplebirchCore } from '@scml-dol-maplebirch/types';

export default function adaptPassages(maplebirch: MaplebirchCore): void {
  const zone = maplebirch.tool.zone;
  // DoLX 扩展了兴奋描述分支，仍逐项追加同一数值提示。
  for (const rule of zone.widgetPassage['Widgets State Man'] ?? []) {
    if (rule.applybefore?.includes('Math.round($enemyarousal)')) rule.expected = 17;
  }
  if (maplebirch.get('Psyche')) {
    // DoLX 在天气活动后才推进一小时，恢复移到实际睡满后，按完成时所在的游戏日计入额度。
    const recovery = zone.widgetPassage['Widgets Sleep']?.find(rule => rule.src === '<<set Weather.BodyTemperature.addActivity("sleep")>>' && rule.applyafter === '<<psyche-sleep>>');
    if (recovery && maplebirch.services.addonPlugin.SC2DataManager.getSC2DataInfoAfterPatch().passageDataItems.map.get('Widgets Sleep')?.content.includes('<<set $sleepTimePassing to false>>')) {
      recovery.src = '<<set $sleepTimePassing to false>>';
    }
  }
  if (maplebirch.get('MoreTransformations')) {
    // DoLX 在时间推进后扣除缓存恢复量，保留其原生倍率、取整和防停滞检查。
    const sleep = zone.widgetPassage['Widgets Sleep']?.find(rule => rule.to?.includes('$_undeadSleepStart'));
    if (
      sleep &&
      maplebirch.services.addonPlugin.SC2DataManager.getSC2DataInfoAfterPatch().passageDataItems.map.get('Widgets Sleep')?.content.includes('<<set $tiredness -= _sleepTirednessRecovery>>')
    ) {
      delete sleep.srcmatch;
      sleep.src = '<<set $tiredness -= _sleepTirednessRecovery>>';
      sleep.to = '<<set $tiredness -= _sleepTirednessRecovery * (maplebirch.get("MoreTransformations")?.Undead.active ? 0.5 : 1)>>';
    }

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
    // DoLX 的额外花蜜增长绕过 arousal 宏，仍只缩放实际正增量。
    (zone.widgetPassage.Widgets ??= []).push({
      src: '<<set $arousal += _cumNectar>>',
      to: '<<set $arousal += (maplebirch.get("MoreTransformations")?.Undead.arousal(_cumNectar) ?? _cumNectar)>>',
      expected: 1
    });
    // 分娩选项也直接结算状态值，保留负增量和其它状态的原生效果。
    (zone.widgetPassage['Widgets Childbirth Effects'] ??= []).push({
      src: '<<set $arousal += _playline[2][_effects[_i]]>>',
      to: '<<set $arousal += (maplebirch.get("MoreTransformations")?.Undead.arousal(_playline[2][_effects[_i]]) ?? _playline[2][_effects[_i]])>>',
      expected: 1
    });
  }
  const replace = (
    group: 'locationPassage' | 'widgetPassage',
    title: string,
    original: string,
    patch: (rule: (typeof zone.widgetPassage)[string][number]) => (typeof zone.widgetPassage)[string][number]
  ) => {
    if (zone[group][title]) zone[group][title] = zone[group][title].map(rule => (String(rule.src ?? rule.srcmatch ?? rule.srcmatchgroup) === original ? patch(rule) : rule));
  };

  // DoLX 分开保存航程总天数与剩余天数，仍只在原生开启新航程时取消金币航线。
  replace('locationPassage', 'Pirate Zephyr Island Ask', '<<set $pirate_journey to 7>>', rule => ({ ...rule, src: '<<set $pirate_journey_total to 7>>' }));
  if (maplebirch.get('MoreTransformations')) {
    // 自有航线沿用 DoLX 的出航与登陆状态，避免旧倒计时让再次远航立即抵达。
    const cache = maplebirch.modUtils.getMod('deadwood-reblooms')?.cache;
    for (const [title, from, to] of [
      [
        'Deadwood Coin Zephyr',
        '<<set $pirate_journey to 7>>',
        '<<unset $pirate_journey_done>><<set $pirate_journey_total to 7>><<set $pirate_journey_startDay to Time.days>><<set $pirate_journey to $pirate_journey_total>>'
      ],
      [
        'Deadwood Coin Voyage Arrival',
        '<<unset $pirate_journey>>',
        '<<set $pirate_journey_done to true>><<unset $pirate_journey>><<unset $pirate_journey_total>><<unset $pirate_journey_startDay>><<unset $pirate_journey_startStamp>>'
      ]
    ]) {
      const passage = cache?.passageDataItems.map.get(title);
      if (!passage || passage.content.includes(to)) continue;
      const matches = passage.content.split(from).length - 1;
      if (matches !== 1) {
        maplebirch.log(`${title}: 匹配 ${matches}，预期 1 (${from})`, 'WARN');
        continue;
      }
      passage.content = passage.content.replace(from, () => to);
    }
    // DoLX 将兴奋与快感分开，只有原生高潮终局使用快感，保留其它兴奋判定。
    if (maplebirch.services.addonPlugin.SC2DataManager.getSC2DataInfoAfterPatch().passageDataItems.map.get('Widgets Actions Man')?.content.includes('$enemypleasure gte $enemypleasuremax')) {
      for (const [title, expected] of [
        ['Deadwood Pirate Raid Widgets', 3],
        ['Deadwood Pirate Raid Fight', 1],
        ['Deadwood Coin Cave Combat Widgets', 1],
        ['Deadwood Coin Cave Fight', 1],
        ['Deadwood Coldmoon Harbour Fight Finish', 3]
      ] as const) {
        const passage = cache?.passageDataItems.map.get(title);
        if (!passage || passage.content.includes('$enemypleasure')) continue;
        const climax = /\$enemyarousal (gte|lt) \$enemyarousalmax/g;
        const matches = Array.from(passage.content.matchAll(climax)).length;
        if (matches !== expected) {
          maplebirch.log(`${title}: 匹配 ${matches}，预期 ${expected} (${climax})`, 'WARN');
          continue;
        }
        passage.content = passage.content.replace(climax, '$enemypleasure $1 $enemypleasuremax');
      }
    }
    cache?.passageDataItems.back2Array();
  }

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
  // 普通换身梦也会清除 activeNightmare，醒后余悸只接在噩梦恢复现实状态之后。
  replace('widgetPassage', 'Widgets Nightmares', '<<unset $activeNightmare>>', rule => ({
    ...rule,
    src: undefined,
    srcmatch: /<<widget "nightmareEnd">>(?:(?!<<\/widget>>)[\s\S])*?<<unset \$activeNightmare>>/
  }));
  // DoLX 在分页前统一搜索衣柜与手提包时，移除重复控件及分页后的二次过滤。
  if (maplebirch.services.addonPlugin.SC2DataManager.getSC2DataInfoAfterPatch().passageDataItems.map.get('Widgets Wardrobe')?.content.includes('<<textbox "_wardrobeSearch" _wardrobeSearch>>')) {
    zone.widgetPassage['Widgets Wardrobe'] = (zone.widgetPassage['Widgets Wardrobe'] ?? []).filter(
      rule => ![rule.applybefore, rule.applyafter].some(text => text?.includes('$DeadwoodReblooms.wardrobeSearch'))
    );
    zone.widgetPassage['Widgets Wardrobe'].push({
      src: '<label>Search: <<textbox "_wardrobeSearch" _wardrobeSearch>></label>',
      to: '<label><<lanSwitch "Search: " "搜索：">><<textbox "_wardrobeSearch" _wardrobeSearch>></label>',
      expected: 1
    });
  } else {
    // 未内置搜索的 DoLX 分别遍历衣柜和手提包，两处都在取出衣物资料后筛选。
    replace('widgetPassage', 'Widgets Wardrobe', '<<set _itemData to setup.clothes[_wardrobe_list][clothesIndex(_wardrobe_list,_item)]>>', rule => ({
      ...rule,
      src: undefined,
      srcmatchgroup: /<<set _itemData to setup\.clothes\[_wardrobe_list\]\[clothesIndex\(_wardrobe_list,_item\)\]>>/g,
      expected: 2
    }));
  }

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
  // DoLX 五级动作本身能在原版上限后继续缓慢成长，只有原生结算未增长时才累计模组补偿。
  if (maplebirch.get('VanillaPlus')) {
    const deviancy = (zone.widgetPassage['Widgets Deviancy'] ??= []);
    for (const name of ['deviancyN', 'combatdeviancyN']) {
      deviancy.push({ src: `<<widget "${name}">>`, applyafter: '<<set $_deadwoodDeviancyBefore to $deviancy>>', expected: 1 });
    }
    for (const rule of deviancy) {
      for (const field of ['applybefore', 'applyafter'] as const) {
        if (rule[field]?.includes('$VanillaPlus.deviancy.levelFive')) rule[field] = rule[field]!.replace('<<if $_n is 5 and ', '<<if $_n is 5 and $deviancy lte $_deadwoodDeviancyBefore and ');
      }
    }
    const promiscuity = zone.widgetPassage['Widgets Promiscuity'] ?? [];
    for (const rule of promiscuity) {
      if (rule.src === '<<combatpromiscuityN 5>>' && rule.applyafter?.includes('$VanillaPlus.promiscuity.levelFive')) {
        rule.applyafter = rule.applyafter.replace('<<if $VanillaPlus.lock.promiscuity', '<<if $promiscuity lte $_deadwoodPromiscuityBefore and $VanillaPlus.lock.promiscuity');
      }
    }
    promiscuity.push({ src: '<<widget "combatpromiscuity5">>', applyafter: '<<set $_deadwoodPromiscuityBefore to $promiscuity>>', expected: 1 });
    // 自有 Twee 此时尚未合并到游戏，直接适配待合并缓存，保留原版 widget。
    const cache = maplebirch.modUtils.getMod('deadwood-reblooms')?.cache;
    const title = 'Deadwood Reblooms Vanilla Plus Promiscuity Widgets';
    const widget = cache?.passageDataItems.map.get(title);
    if (cache && widget?.tags.includes('widget')) {
      const secondary = '<<set V[$_sexstatSecondary] to Math.min(V[$_sexstatSecondary] + $_sexstatGain, $_sexstatCeiling)>>';
      const replacements: Array<[string, string]> = [
        // 亚人的第二项不重复调用动作代价，仍保留阶段上限后 20 点内的缓慢成长。
        [
          secondary,
          secondary + '\n      <<elseif V[$_sexstatSecondary] - 20 lt $_sexstatLimit>>\n        <<set V[$_sexstatSecondary] to Math.min(V[$_sexstatSecondary] + $_sexstatGain / 3, $_sexstatCeiling)>>'
        ],
        // 保留 DoLX 原生的反向遭遇、发情及催眠特质成长条件，仅作用于结算入口。
        [
          '<<if !$promiscuityIgnore and !$statFreeze and ($consensual is 1 or $_sexstatLevel is 6)>>',
          '<<if !$promiscuityIgnore and !$statFreeze and ($consensual is 1 or $_sexstatLevel is 6 or $combatExtended.reverseRapeStart is 1 or ($enemytype is "beast" and (playerHeatMinArousal() or playerRutMinArousal() or hypnosisTrait("deviancy"))))>>'
        ]
      ];
      let content = widget.content;
      for (const [from, to] of replacements) {
        if (content.includes(to)) continue;
        const matches = content.split(from).length - 1;
        if (matches !== 1) {
          maplebirch.log(`${title}: 匹配 ${matches}，预期 1 (${from})`, 'WARN');
          break;
        }
        content = content.replace(from, () => to);
      }
      if (content !== widget.content && replacements.every(([, to]) => content.includes(to))) {
        widget.content = content;
        cache.passageDataItems.back2Array();
      }
    }
  }
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
