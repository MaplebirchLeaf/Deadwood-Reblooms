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

  // 转化会衰减，成就只在首次达到完整形态时授予。
  maplebirch.dynamic.regStateEvent('gate', 'horse-transformation-feat', {
    output: 'earnFeat "Horse Transformation"',
    cond: () => (V.maplebirch?.transformation?.horse?.level ?? 0) >= 6
  });
  maplebirch.dynamic.regStateEvent('gate', 'fish-transformation-feat', {
    output: 'earnFeat "Fish Transformation"',
    cond: () => (V.maplebirch?.transformation?.fish?.level ?? 0) >= 6
  });
}
