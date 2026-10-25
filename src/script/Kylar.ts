// ./src/script/Kylar.ts

export default function Kylar(maplebirch: typeof window.maplebirch): void {
  maplebirch.tool.addTo(
    'BeforeLinkZone',
    { widget: 'deadwood-kylar-school-link', passage: ['Kylar Courtyard', 'Kylar Library'] },
    { widget: 'deadwood-reblooms-kylar-bedroom-links', passage: 'Manor Kylar Room' },
    { widget: 'deadwood-reblooms-kylar-kitchen-link', passage: 'Manor Kitchen' },
    { widget: 'deadwood-reblooms-kylar-bathroom-link', passage: 'Manor Hall' },
    { widget: 'deadwood-reblooms-kylar-yard-link', passage: 'Manor Garden' },
    { widget: 'deadwood-reblooms-kylar-sketch-link', passage: 'Kylar Park' },
    { widget: 'deadwood-reblooms-kylar-pregnancy-link', passage: 'Manor Kylar Room' }
  );

  maplebirch.tool.inject({
    locationPassage: {
      'Manor Kylar Room': [
        {
          src: '<<if _kylar.state isnot "prison"',
          applyafter: " and (!maplebirch.get('Finance') or !maplebirch.get(\"Finance\").realEstate.residenceOf('Kylar'))",
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
