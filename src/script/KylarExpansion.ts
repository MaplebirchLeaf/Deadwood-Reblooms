export default function KylarExpansion(maplebirch: typeof window.maplebirch): void {
  maplebirch.tool.addTo('BeforeLinkZone', {
    widget: 'deadwood-reblooms-kylar-bedroom-links',
    passage: 'Manor Kylar Room'
  });
  maplebirch.tool.addTo('BeforeLinkZone', {
    widget: 'deadwood-reblooms-kylar-kitchen-link',
    passage: 'Manor Kitchen'
  });

  // 原版卧室只看时间决定凯拉尔是否在场，同住后要避开这个冲突。
  // 衣柜的退出链接按 Passage 选择，在同一次注入中补上新衣柜的回程。
  maplebirch.tool.inject({
    locationPassage: {
      'Manor Kylar Room': [
        {
          src: '<<if _kylar.state isnot "prison">>',
          to: "<<if _kylar.state isnot \"prison\" and (!maplebirch.get('VP') or !maplebirch.VP.realEstate.residenceOf('Kylar'))>>",
          expected: 1
        }
      ]
    },
    widgetPassage: {
      'Widgets Wardrobe': [
        {
          src: '<<case "Farm Wardrobe">>',
          applybefore: '<<case "Deadwood Reblooms Kylar Wardrobe">>\n\t\t\t<<deadwood-reblooms-kylar-wardrobe-exit>>\n\t\t',
          expected: 1
        }
      ]
    }
  });
}
