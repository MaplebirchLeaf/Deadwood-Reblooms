// ./src/script/MoreTransformations.ts

export default function MoreTransformations(maplebirch: typeof window.maplebirch): void {
  maplebirch.tool.onInit(() => {
    maplebirch.tool.patch.traits.add({
      title: 'General Traits',
      name: () => maplebirch.t('deadwood-reblooms:Traits:foxfire:name'),
      colour: 'teal',
      has: () => maplebirch.get('MoreTransformations')!.foxfire,
      text: () => maplebirch.t('deadwood-reblooms:Traits:foxfire:text')
    });
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
      ],
      'Widgets Combat Tentacle Adv': [
        // 捕获原版放逐之前的生命与次数，按实际伤害结算，兼容原版增强模块的伤害加成。
        {
          srcmatch: /<<if \(\$leftaction is "leftbanish" and \$leftactionTarget is _tentacle\.id\)\s*or \(\$rightaction is "rightbanish" and \$rightactionTarget is _tentacle\.id\)>>/,
          applyafter: '<<set _foxfireHealth to _tentacle.tentaclehealth>><<set _foxfireUses to $angelBanish>>',
          expected: 1
        },
        {
          srcmatch: /<<tentacle_record "banish" [^>\r\n]+ \* _multi>>\s*<<tentacleadvdisable _tentacle>>/,
          applyafter: '<<if $angelBanish lt _foxfireUses>><<deadwood-foxfire _tentacle `_foxfireHealth - _tentacle.tentaclehealth`>><</if>>',
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
