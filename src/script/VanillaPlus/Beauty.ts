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
    cond: () => V.VanillaPlus != null && maplebirch.VP.beauty.max && !V.feats.currentSave.Unadorned
  });
  maplebirch.dynamic.regStateEvent('gate', 'beauty-alluring', {
    output: 'run maplebirch.VP.beauty.rememberAllure()',
    cond: () => V.VanillaPlus != null && maplebirch.VP.beauty.alluring && !V.VanillaPlus.beauty.alluring
  });

  maplebirch.tool.addTo('BeforeLinkZone', { widget: 'deadwood-reblooms-beauty-breakthrough-link', passage: 'Photo Model 3' });

  // 放宽原版美貌上限与钳制范围。
  maplebirch.tool.zone.inject({
    widgetPassage: {
      Cheats: [
        // 将作弊面板的美貌滑条上限改为动态上限；未锁定突破时仍使用原版 $beautymax。
        {
          src: '$beauty "beauty" {max: 10000}',
          to: '$beauty "beauty" {max: $VanillaPlus.lock.beauty ? Math.floor($beautymax * 1.25) : $beautymax}'
        }
      ],
      'Widgets Clamp': [
        // 替换全局美貌钳制公式，同时应用特质保底值与突破后的 125% 上限。
        {
          src: '<<set $beauty = Math.clamp($beauty, 0, $beautymax)>>',
          to: '<<set $beauty = Math.clamp($beauty, maplebirch.VP.beauty.floor, $VanillaPlus.lock.beauty ? Math.floor($beautymax * 1.25) : $beautymax)>>'
        }
      ]
    }
  });
}
