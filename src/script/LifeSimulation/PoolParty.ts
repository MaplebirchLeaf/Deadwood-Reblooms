// ./src/script/LifeSimulation/PoolParty.ts

export default function PoolParty(maplebirch: typeof window.maplebirch): void {
  maplebirch.tool.addTo('BeforeLinkZone', {
    widget: 'deadwood-reblooms-pool-party-together',
    passage: ['School Night Pool Party Around', 'School Night Pool Party Socialise']
  });

  maplebirch.tool.inject({
    widgetPassage: {
      'Widgets Robin': [{ src: '<<robinbully>>', applybefore: '<<deadwood-reblooms-pool-party-invite>>\n\t\t', expected: 1 }]
    },
    locationPassage: {
      // 跟随原版派对交谈菜单，换衣拒绝与白天泳池分支不追加互动。
      'School Pool': [
        {
          srcmatch: /<<socialiseicon>><<link \[\[[^\]\n]+\|School Night Pool Party Socialise\]\]>>/,
          applybefore: '<<deadwood-reblooms-pool-party-company>>\n\t\t\t\t<<deadwood-reblooms-pool-party-together>>\n\t\t\t\t',
          expected: 1
        }
      ],
      'School Night Pool Party Around': [
        {
          // 六点散场的 exit 在这个锚点前执行。
          src: '<<set $phase2 to random(1,4)>>',
          applybefore: '<<deadwood-reblooms-pool-party-company>>\n',
          expected: 1
        }
      ],
      'School Night Pool Party Socialise': [
        {
          src: '<<generatey1>><<person1>>',
          applybefore: '<<deadwood-reblooms-pool-party-company>>\n',
          expected: 1
        }
      ],
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
