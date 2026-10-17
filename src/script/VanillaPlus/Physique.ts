// ./src/script/VanillaPlus/Physique.ts

export default function (maplebirch: typeof window.maplebirch) {
  const text = (key: string) => maplebirch.t(`deadwood-reblooms:VanillaPlus:physique:${key}`);

  const available = () => V.combat === 1 && maplebirch.get('VanillaPlus')!.physique.canBreakBindings;
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

  // 扩展体格上限。
  maplebirch.tool.inject({
    widgetPassage: {
      Widgets: [
        // 中英文原版分别有一处或两处该公式，批量修改实际出现的位置。
        {
          srcmatchgroup: /Math\.clamp\(\$physique, 0, \$physiquesize( \* \$AMCTraits\.physique)?\)/g,
          to: 'Math.clamp($physique, maplebirch.get("VanillaPlus").minimum(\'physique\'), $VanillaPlus.lock.physique ? maplebirch.get("VanillaPlus").ceiling(\'physique\') : $physiquesize$1)'
        }
      ],
      'Widgets Clamp': [
        // 替换全局体格钳制公式，使所有非专用变化同样遵守突破后的上下限。
        {
          srcmatch: /Math\.clamp\(\$physique, 0, \$physiquesize( \* \$AMCTraits\.physique)?\)/,
          to: 'Math.clamp($physique, maplebirch.get("VanillaPlus").minimum(\'physique\'), $VanillaPlus.lock.physique ? maplebirch.get("VanillaPlus").ceiling(\'physique\') : $physiquesize$1)',
          expected: 1
        }
      ]
    }
  });
}
