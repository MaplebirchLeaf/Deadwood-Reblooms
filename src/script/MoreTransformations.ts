export default function MoreTransformations(maplebirch: typeof window.maplebirch): void {
  maplebirch.tool.onInit(() => {
    setup.feats['Horse Transformation'] ??= {
      get title() {
        return maplebirch.t('deadwood-reblooms:transformations:horse:feat:title');
      },
      get desc() {
        return maplebirch.t('deadwood-reblooms:transformations:horse:feat:description');
      },
      difficulty: 1,
      series: '',
      filter: ['All', 'Transformation']
    };
    setup.feats['Fish Transformation'] ??= {
      get title() {
        return maplebirch.t('deadwood-reblooms:transformations:fish:feat:title');
      },
      get desc() {
        return maplebirch.t('deadwood-reblooms:transformations:fish:feat:description');
      },
      difficulty: 1,
      series: '',
      filter: ['All', 'Transformation']
    };
  });

  // 只扩展安全事件池，不截断追猎、危险遭遇或原版行进结算。
  maplebirch.tool.inject({
    widgetPassage: {
      'Widgets Forest': [
        {
          src: '<<addinlineevent "safeforest_easytrail" 0.33>>',
          applybefore: '<<deadwood-raven-events>>\n\t',
          expected: 1
        }
      ]
    }
  });
  maplebirch.tool.addTo('BeforeLinkZone', { widget: 'deadwood-raven-link', passage: 'Forest' });

  // 转化会衰减，成就只在首次达到完整形态时授予。
  maplebirch.dynamic.regStateEvent('append', 'horse-transformation-feat', {
    output: 'earnFeat "Horse Transformation"',
    cond: () => V.feats?.currentSave['Horse Transformation'] === undefined && (V.maplebirch?.transformation?.horse?.level ?? 0) >= 6
  });
  maplebirch.dynamic.regStateEvent('append', 'fish-transformation-feat', {
    output: 'earnFeat "Fish Transformation"',
    cond: () => V.feats?.currentSave['Fish Transformation'] === undefined && (V.maplebirch?.transformation?.fish?.level ?? 0) >= 6
  });
}
