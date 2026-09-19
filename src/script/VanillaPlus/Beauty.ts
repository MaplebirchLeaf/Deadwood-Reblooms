// ./src/script/VanillaPlus/Beauty.ts

export default function (maplebirch: typeof window.maplebirch) {
  maplebirch.tool.onInit(() => {
    setup.feats['Unadorned'] ??= {
      get title() {
        return maplebirch.t('deadwood-reblooms.VanillaPlus.beauty.feat.title');
      },
      get desc() {
        return maplebirch.t('deadwood-reblooms.VanillaPlus.beauty.feat.description');
      },
      difficulty: 3,
      series: '',
      filter: ['All', 'Stats']
    };
  });

  maplebirch.dynamic.regStateEvent('gate', 'beauty-max', {
    output: 'earnFeat "Unadorned"',
    cond: () => maplebirch.VP.beauty.max && !V.feats.currentSave.Unadorned
  });
  maplebirch.dynamic.regStateEvent('gate', 'beauty-alluring', {
    output: 'run maplebirch.VP.beauty.rememberAllure()',
    cond: () => maplebirch.VP.beauty.alluring && !V.VanillaPlus.beauty.alluring
  });

  maplebirch.tool.zone.inject({
    locationPassage: {
      'Photo Model 3': [
        {
          src: '<<if hasSexStat("exhibitionism", 2)>>',
          applybefore: '<<deadwood-reblooms-beauty-breakthrough-link>>\n'
        }
      ]
    },
    widgetPassage: {
      Cheats: [
        {
          src: '$beauty "beauty" {max: 10000}',
          to: '$beauty "beauty" {max: $VanillaPlus.lock.beauty ? Math.floor($beautymax * 1.25) : $beautymax}'
        }
      ],
      'Widgets Clamp': [
        {
          src: '<<set $beauty = Math.clamp($beauty, 0, $beautymax)>>',
          to: '<<set $beauty = Math.clamp($beauty, maplebirch.VP.beauty.floor, $VanillaPlus.lock.beauty ? Math.floor($beautymax * 1.25) : $beautymax)>>'
        }
      ]
    }
  });
}
