// ./src/script/VanillaPlus/Beauty.ts

export default function (maplebirch: typeof window.maplebirch) {
  maplebirch.tool.onInit(() => {
    setup.feats['Unadorned'] ??= {
      get title() {
        return maplebirch.t('deadwood-reblooms:VanillaPlus:beauty:feat:title');
      },
      get desc() {
        return maplebirch.t('deadwood-reblooms:VanillaPlus:beauty:feat:description');
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
  maplebirch.tool.inject({
    widgetPassage: {
      Cheats: [
        // 将作弊面板的美貌滑条上限改为动态上限；未锁定突破时仍使用原版 $beautymax。
        {
          srcmatch: /\$beauty "beauty" \{max: (10000)( \* \$AMCTraits\.beauty)?(, percentage: false)?\}/,
          to: '$beauty "beauty" {max: $VanillaPlus.lock.beauty ? maplebirch.VP.ceiling("beauty") : $1$2$3}'
        }
      ],
      'Widgets Clamp': [
        // 替换全局美貌钳制公式，同时应用特质保底值与突破后的 125% 上限。
        {
          srcmatch: /<<set \$beauty = Math\.clamp\(\$beauty, 0, \$beautymax( \* \$AMCTraits\.beauty)?\)>>/,
          to: '<<set $beauty = Math.clamp($beauty, maplebirch.VP.beauty.floor, $VanillaPlus.lock.beauty ? maplebirch.VP.ceiling("beauty") : $beautymax$1)>>'
        }
      ]
    }
  });
}
