// ./src/script/VanillaPlus/Physique.ts

export default function (maplebirch: typeof window.maplebirch) {
  const text = (key: string) => maplebirch.t(`deadwood-reblooms:VanillaPlus:physique:${key}`);

  maplebirch.tool.onInit(() => {
    setup.feats.Unbreakable ??= {
      get title() {
        return maplebirch.t('deadwood-reblooms:VanillaPlus:physique:feat:title');
      },
      get desc() {
        return maplebirch.t('deadwood-reblooms:VanillaPlus:physique:feat:description');
      },
      difficulty: 3,
      series: '',
      filter: ['All', 'Stats']
    };
  });

  maplebirch.dynamic.regStateEvent('gate', 'physique-unlock', {
    output: 'deadwood-reblooms-physique-unlock',
    cond: () => V.VanillaPlus != null && maplebirch.get('VP')!.physique.unlock
  });
  maplebirch.dynamic.regStateEvent('append', 'physique-max', {
    output: 'earnFeat "Unbreakable"',
    cond: () => V.feats?.currentSave['Unbreakable'] === undefined && V.VanillaPlus != null && maplebirch.get('VP')!.physique.max
  });
  maplebirch.dynamic.regStateEvent('gate', 'physique-break-bindings', {
    output: 'deadwood-reblooms-physique-break-bindings',
    cond: () => V.VanillaPlus != null && maplebirch.get('VP')!.physique.outsideBreakAvailable
  });

  const available = () => V.combat === 1 && maplebirch.get('VP')!.physique.canBreakBindings;
  maplebirch.combat.CombatAction.reg(
    {
      id: 'physique-break-arms',
      actionType: 'leftaction',
      cond: () => available() && (V.leftarm === 'bound' || V.rightarm === 'bound'),
      display: () => text('action:breakArms'),
      value: () => 'VanillaPlusPhysiqueBreakArms',
      color: 'def',
      effect: '<<deadwood-reblooms-physique-combat-break "arms">>'
    },
    {
      id: 'physique-break-legs',
      actionType: 'feetaction',
      cond: () => available() && (V.feetuse === 'bound' || V.leftleg === 'bound' || V.rightleg === 'bound'),
      display: () => text('action:breakLegs'),
      value: () => 'VanillaPlusPhysiqueBreakLegs',
      color: 'def',
      effect: '<<deadwood-reblooms-physique-combat-break "legs">>'
    },
    {
      id: 'physique-break-head',
      actionType: 'mouthaction',
      cond: () => available() && V.head === 'bound',
      display: () => text('action:breakHead'),
      value: () => 'VanillaPlusPhysiqueBreakHead',
      color: 'def',
      effect: '<<deadwood-reblooms-physique-combat-break "head">>'
    }
  );

  const flag = (name: string) => `<<set $VanillaPlus.physique.${name} to true>>`;

  // 记录原版挣脱挑战结果，并扩展体格上限。
  maplebirch.tool.inject({
    locationPassage: {
      'Flats Sneak Physique': [
        // 在公寓潜入的体格成功判断后记录 panic 挑战结果，仅成功分支会保留该标记。
        { src: '<<if $physiqueSuccess>>', applyafter: flag('panic'), expected: 1 }
      ],
      'Flats Sneak Fight Finish': [
        // 在公寓战斗以敌人高潮结束的分支入口记录 panic 结果，覆盖该原版胜利结局。
        { src: '<<if $enemyarousal gte $enemyarousalmax>>', applyafter: flag('panic'), expected: 1 },
        // 在公寓战斗以敌人生命归零结束的分支入口记录 panic 结果，覆盖另一胜利结局。
        { src: '<<elseif $enemyhealth lte 0>>', applyafter: flag('panic'), expected: 1 }
      ],
      'Flats Sneak Smash': [
        // 在砸开公寓障碍的场景 effects 后记录 panic 结果，确认玩家已经完成该体格路线。
        { src: '<<effects>>', applyafter: flag('panic'), expected: 1 }
      ],
      'Farm Assault': [
        // 在农场达到对应剧情阶段的判断后记录 heroic 结果，避免低阶段误计突破条件。
        { src: '<<if $farm_stage gte 12>>', applyafter: flag('heroic'), expected: 1 }
      ],
      'Farm Tending Group Fight': [
        // 在农场群战开始结算 effects 后记录 farm 挑战参与结果。
        { src: '<<effects>>', applyafter: flag('farm'), expected: 1 }
      ],
      'Farm Tending Gang Rape Finish': [
        // 在农场多人战以敌人生命归零结束的分支入口记录 farm 胜利结果。
        { src: '<<elseif $enemyhealth lte 0>>', applyafter: flag('farm'), expected: 1 }
      ],
      'Farm Axe Fight Finish': [
        // 在农场斧战的击倒分支入口记录 farm 胜利结果，保留原版结束处理。
        { src: '<<elseif $enemyhealth lte 0>>', applyafter: flag('farm'), expected: 1 }
      ],
      'Farm Lorry Fight End': [
        // 在农场货车战结束 effects 后记录 farm 挑战结果。
        { src: '<<effects>>', applyafter: flag('farm'), expected: 1 }
      ],
      'Pound Free 4': [
        // 在收容所脱困场景 effects 后记录 pound 挑战结果，作为体格突破条件。
        { src: '<<effects>>', applyafter: flag('pound'), expected: 1 }
      ]
    },
    widgetPassage: {
      Cheats: [
        // 将作弊面板体格滑条上限改为动态 125%，未突破时继续使用原版 $physiquesize。
        {
          srcmatch: /\$physique "physique" \{max: (\$physiquesize)( \* \$AMCTraits\.physique)?(, percentage: false)?\}/,
          to: '$physique "physique" {max: $VanillaPlus.lock.physique ? maplebirch.get("VP").ceiling("physique") : $1$2$3}',
          expected: 1
        }
      ],
      Widgets: [
        // 通用组件有两处相同钳制公式；作为明确的两处批量替换，避免依赖补丁执行顺序。
        {
          srcmatchgroup: /Math\.clamp\(\$physique, 0, \$physiquesize( \* \$AMCTraits\.physique)?\)/g,
          to: 'Math.clamp($physique, maplebirch.get("VP").minimum(\'physique\'), $VanillaPlus.lock.physique ? maplebirch.get("VP").ceiling(\'physique\') : $physiquesize$1)',
          expected: 2
        }
      ],
      'Widgets Clamp': [
        // 替换全局体格钳制公式，使所有非专用变化同样遵守突破后的上下限。
        {
          srcmatch: /Math\.clamp\(\$physique, 0, \$physiquesize( \* \$AMCTraits\.physique)?\)/,
          to: 'Math.clamp($physique, maplebirch.get("VP").minimum(\'physique\'), $VanillaPlus.lock.physique ? maplebirch.get("VP").ceiling(\'physique\') : $physiquesize$1)',
          expected: 1
        }
      ]
    }
  });
}
