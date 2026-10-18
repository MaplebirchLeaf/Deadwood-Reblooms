// ./src/script/Finance/Orphanage.ts

export default function Orphanage(maplebirch: typeof window.maplebirch): void {
  maplebirch.tool.addTo('BeforeLinkZone', { widget: 'deadwood-finance-orphanage-office-link', passage: "Bailey's Office" });
  maplebirch.tool.inject({
    widgetPassage: {
      'Widgets Robin': [
        { src: '<<robinbully>>', applybefore: '<<deadwood-finance-orphanage-robin-link>>\n\t\t', expected: 1 },
        { src: '<<widget "robinpay">>\n\t<<if $robinpaid isnot 1', applyafter: ' and !maplebirch.get("Finance").orphanage.robinFree', expected: 1 }
      ]
    },
    locationPassage: {
      "Bailey's Office": [
        {
          src: '<<if $robinpaid isnot 1 and $robindebtknown is 1',
          applyafter: ' and !maplebirch.get("Finance").orphanage.pcFree and !maplebirch.get("Finance").orphanage.robinFree',
          expected: 1
        }
      ]
    }
  });
  if (!maplebirch.get('Robin')) {
    maplebirch.tool.inject({
      widgetPassage: {
        'Widgets Journal': [{ src: '<<if !_avery_pay', applyafter: ' and !maplebirch.get("Finance").orphanage.pcFree', expected: 1 }]
      }
    });
  }

  // 赎身与打倒贝利是同一结局的两条路，各自记一条特质。
  maplebirch.tool.patch.traits.add({
    title: 'Special Traits',
    name: () => maplebirch.t('deadwood-reblooms:finance:trait:buyout:name'),
    colour: 'gold',
    has: () => V.Finance?.orphanage?.pc_bought_out === true,
    text: () => maplebirch.t('deadwood-reblooms:finance:trait:buyout:text')
  });
}
