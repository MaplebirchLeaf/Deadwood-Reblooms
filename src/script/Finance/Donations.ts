// ./src/script/Finance/Donations.ts

export default function Donations(maplebirch: typeof window.maplebirch): void {
  maplebirch.tool.addTo(
    'CustomLinkZone',
    { widget: [-1, 'deadwood-finance-donations-link'], passage: 'Town Hall Wait' },
    { widget: [-1, 'deadwood-school-donation-review-link'], passage: 'Hallways' },
    { widget: [-1, 'deadwood-school-donation-visit-link'], passage: 'Hallways' },
    { widget: [-1, 'deadwood-hospital-donation-link'], passage: 'Hospital Foyer' }
  );
  // 办公室各分支共用离开图标，仅插入短 widget，实际会谈条件在 widget 内判断。
  maplebirch.tool.inject({
    locationPassage: {
      "Head's Office": [{ src: '<<getouticon>>', applybefore: '<<deadwood-school-donation-office>>', expected: 3 }],
      'Temple Jordan': [{ src: '<<getouticon>>', applybefore: '<<deadwood-temple-donation-links>>', expected: 1 }],
      'Hospital Parasite': [
        // 金额与支付判断不依赖原版的中英文标签。
        { srcmatchgroup: /£250(?!\d|\.\d)/g, to: '<<printmoney `maplebirch.get("Finance").donations.aid.fee`>>', expected: 2 },
        {
          srcmatchgroup: /<<money -25000 (?=["']hospitalParasiteRemoval["']>>)/g,
          to: '<<money `-maplebirch.get("Finance").donations.aid.fee` ',
          expected: 1
        }
      ]
    }
  });
  // 已渲染的正常图书馆场景追加项目成果，原版昏厥、对峙等导航仍有优先权。
  maplebirch.dynamic.regStateEvent('append', ':deadwood-school-donation-supplies', {
    extra: { passage: ['School Library'] },
    cond: () => !V.replayScene && !V.statFreeze && !V.combat && !V.possessed && !V.nextPassageCheck && maplebirch.get('Finance')?.donations.school.ready === true,
    output: 'deadwood-school-donation-school'
  });
  for (const [fund, passage, output] of [
    ['temple', ['Temple', 'Soup Kitchen'], 'deadwood-temple-donation-supplies'],
    ['hospital', ['Hospital Foyer'], 'deadwood-hospital-donation-supplies'],
    ['orphanage', ['Orphanage'], 'deadwood-orphanage-donation-hall']
  ] as const) {
    maplebirch.dynamic.regStateEvent('append', `:deadwood-${fund}-donation-supplies`, {
      extra: { passage: [...passage] },
      cond: () => !V.replayScene && !V.statFreeze && !V.combat && !V.possessed && !V.nextPassageCheck && maplebirch.get('Finance')?.donations.aid.ready(fund) === true,
      output
    });
  }
}
