// ./src/script/LifeSimulation/PoolParty.ts

const PARTY_PASSAGES = ['School Pool', 'School Night Pool Party Around', 'School Night Pool Party Socialise'] as const;

export default function PoolParty(maplebirch: typeof window.maplebirch): void {
  maplebirch.tool.addTo(
    'BeforeLinkZone',
    ...PARTY_PASSAGES.flatMap(passage => [
      { widget: 'deadwood-reblooms-pool-party-company', passage },
      { widget: 'deadwood-reblooms-pool-party-together', passage }
    ])
  );

  maplebirch.tool.inject({
    widgetPassage: {
      'Widgets Robin': [{ src: '<<robinbully>>', applybefore: '<<deadwood-reblooms-pool-party-invite>>\n\t\t', expected: 1 }]
    },
    locationPassage: {
      'History Classroom': [
        {
          srcmatch: /<<getouticon>><<link \[\[[^\]\n]+\|Hallways]]>><<\/link>>/,
          applybefore: '<<if $withRobin isnot "hurt">><<deadwood-reblooms-pool-party-invite>><</if>>\n\t',
          expected: 1
        }
      ],
      Canteen: [{ src: '<<if def $milkshake and $milkshake gt 0', applybefore: '<<deadwood-reblooms-pool-party-invite>>\n\t\t', expected: 1 }],
      'School Library': [{ src: '<<projectoptions>>', applybefore: '<<deadwood-reblooms-pool-party-invite>>\n\t\t', expected: 1 }],
      'School Front Courtyard': [{ src: '<<schoolicon "courtyard">>', applybefore: '<<deadwood-reblooms-pool-party-invite>>\n\t\t\t', expected: 1 }],
      'School Rear Courtyard': [{ src: '<<schoolicon "courtyard">>', applybefore: '<<deadwood-reblooms-pool-party-invite>>\n\t\t\t', expected: 1 }],
      Temple: [{ src: '<<templeicon "pray">>', applybefore: '<<deadwood-reblooms-pool-party-invite>>', expected: 1 }]
    }
  });

  maplebirch.tool.addTo('Journal', 'deadwood-reblooms-pool-party-journal');
}
