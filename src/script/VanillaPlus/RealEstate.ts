export default function RealEstate(maplebirch: typeof window.maplebirch): void {
  maplebirch.tool.addTo('AfterLinkZone', {
    widget: 'deadwood-reblooms-property-street',
    passage: maplebirch.VP.realEstate.properties.map(property => property.street)
  });
  maplebirch.tool.inject({
    widgetPassage: {
      'Widgets Wardrobe': [
        {
          src: '<<case "Farm Wardrobe">>',
          applybefore: '<<case "Deadwood Reblooms Property Wardrobe">>\n\t\t\t<<deadwood-reblooms-property-wardrobe-exit>>\n\t\t',
          expected: 1
        }
      ]
    }
  });
}
