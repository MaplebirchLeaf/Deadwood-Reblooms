// ./src/script/VanillaPlus/Physique.ts

export default function (maplebirch: typeof window.maplebirch) {
  const text = (key: string) => maplebirch.t(`deadwood-reblooms.VanillaPlus.physique.${key}`);

  maplebirch.tool.onInit(() => {
    setup.feats.Unbreakable ??= {
      get title() {
        return maplebirch.t('deadwood-reblooms.VanillaPlus.physique.feat.title');
      },
      get desc() {
        return maplebirch.t('deadwood-reblooms.VanillaPlus.physique.feat.description');
      },
      difficulty: 3,
      series: '',
      filter: ['All', 'Stats']
    };
  });

  maplebirch.dynamic.regStateEvent('gate', 'physique-unlock', {
    output: 'deadwood-reblooms-physique-unlock',
    cond: () => maplebirch.VP.physique.unlock
  });
  maplebirch.dynamic.regStateEvent('gate', 'physique-max', {
    output: 'earnFeat "Unbreakable"',
    cond: () => maplebirch.VP.physique.max && !V.feats.currentSave.Unbreakable
  });
  maplebirch.dynamic.regStateEvent('gate', 'physique-break-bindings', {
    output: 'deadwood-reblooms-physique-break-bindings',
    cond: () => maplebirch.VP.physique.outsideBreakAvailable
  });

  const available = () => V.combat === 1 && maplebirch.VP.physique.canBreakBindings;
  maplebirch.combat.CombatAction.reg(
    {
      id: 'physique-break-arms',
      actionType: 'leftaction',
      cond: () => available() && (V.leftarm === 'bound' || V.rightarm === 'bound'),
      display: () => text('action.breakArms'),
      value: () => 'VanillaPlusPhysiqueBreakArms',
      color: 'def',
      effect: '<<deadwood-reblooms-physique-combat-break "arms">>'
    },
    {
      id: 'physique-break-legs',
      actionType: 'feetaction',
      cond: () => available() && (V.feetuse === 'bound' || V.leftleg === 'bound' || V.rightleg === 'bound'),
      display: () => text('action.breakLegs'),
      value: () => 'VanillaPlusPhysiqueBreakLegs',
      color: 'def',
      effect: '<<deadwood-reblooms-physique-combat-break "legs">>'
    },
    {
      id: 'physique-break-head',
      actionType: 'mouthaction',
      cond: () => available() && V.head === 'bound',
      display: () => text('action.breakHead'),
      value: () => 'VanillaPlusPhysiqueBreakHead',
      color: 'def',
      effect: '<<deadwood-reblooms-physique-combat-break "head">>'
    }
  );

  const flag = (name: string) => `<<set $VanillaPlus.physique.${name} to true>>`;

  maplebirch.tool.zone.inject({
    locationPassage: {
      'Flats Sneak Physique': [{ src: '<<if $physiqueSuccess>>', applyafter: flag('panic') }],
      'Flats Sneak Fight Finish': [
        { src: '<<if $enemyarousal gte $enemyarousalmax>>', applyafter: flag('panic') },
        { src: '<<elseif $enemyhealth lte 0>>', applyafter: flag('panic') }
      ],
      'Flats Sneak Smash': [{ src: '<<effects>>', applyafter: flag('panic') }],
      'Farm Assault': [{ src: '<<if $farm_stage gte 12>>', applyafter: flag('heroic') }],
      'Farm Tending Group Fight': [{ src: '<<effects>>', applyafter: flag('farm') }],
      'Farm Tending Gang Rape Finish': [{ src: '<<elseif $enemyhealth lte 0>>', applyafter: flag('farm') }],
      'Farm Axe Fight Finish': [{ src: '<<elseif $enemyhealth lte 0>>', applyafter: flag('farm') }],
      'Farm Lorry Fight End': [{ src: '<<effects>>', applyafter: flag('farm') }],
      'Pound Free 4': [{ src: '<<effects>>', applyafter: flag('pound') }]
    },
    widgetPassage: {
      Cheats: [
        {
          src: '$physique "physique" {max: $physiquesize}',
          to: '$physique "physique" {max: $VanillaPlus.lock.physique ? Math.floor($physiquesize * 1.25) : $physiquesize}'
        }
      ],
      Widgets: [
        {
          src: 'Math.clamp($physique, 0, $physiquesize)',
          to: "Math.clamp($physique, maplebirch.VP.minimum('physique'), $VanillaPlus.lock.physique ? Math.floor($physiquesize * 1.25) : $physiquesize)"
        },
        {
          src: 'Math.clamp($physique, 0, $physiquesize)',
          to: "Math.clamp($physique, maplebirch.VP.minimum('physique'), $VanillaPlus.lock.physique ? Math.floor($physiquesize * 1.25) : $physiquesize)"
        }
      ],
      'Widgets Clamp': [
        {
          src: 'Math.clamp($physique, 0, $physiquesize)',
          to: "Math.clamp($physique, maplebirch.VP.minimum('physique'), $VanillaPlus.lock.physique ? Math.floor($physiquesize * 1.25) : $physiquesize)"
        }
      ]
    }
  });
}
